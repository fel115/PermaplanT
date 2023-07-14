//! Contains the database implementation of the plant layer.

use diesel::{
    debug_query,
    pg::Pg,
    sql_types::{Float, Integer},
    CombineDsl, ExpressionMethods, QueryDsl, QueryResult, QueryableByName,
};
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use log::debug;

use crate::{
    model::{
        dto::{RelationDto, RelationSearchParameters, RelationsDto},
        r#enum::relation_type::RelationType,
    },
    schema::relations,
};

/// The resolution of the generated heatmap in cm.
pub const GRANULARITY: i32 = 10;

/// A bounding box around the maps geometry.
#[derive(Debug, Clone, QueryableByName)]
struct BoundingBox {
    /// The lowest x value in the geometry.
    #[diesel(sql_type = Integer)]
    x_min: i32,
    /// The lowest y value in the geometry.
    #[diesel(sql_type = Integer)]
    y_min: i32,
    /// The highest x value in the geometry.
    #[diesel(sql_type = Integer)]
    x_max: i32,
    /// The highest y value in the geometry.
    #[diesel(sql_type = Integer)]
    y_max: i32,
}

/// Stores the score of a x,y coordinate on the heatmap.
#[derive(Debug, Clone, QueryableByName)]
struct HeatMapElement {
    /// The score on the heatmap.
    #[diesel(sql_type = Float)]
    score: f32,
    /// The x values of the score
    #[diesel(sql_type = Integer)]
    x: i32,
    /// The y values of the score.
    #[diesel(sql_type = Integer)]
    y: i32,
}

/// Generates a heatmap signaling ideal locations for planting the plant.
///
/// # Errors
/// * If the SQL query failed.
#[allow(
    clippy::cast_sign_loss,             // ok, because we will never reach number high enough where this will matter
    clippy::indexing_slicing,           // ok, because we know the size of the matrix using the maps bounding box
    clippy::cast_possible_truncation    // ok, because ceil prevents invalid truncation
)]
pub async fn heatmap(
    map_id: i32,
    layer_id: i32,
    plant_id: i32,
    conn: &mut AsyncPgConnection,
) -> QueryResult<Vec<Vec<f32>>> {
    // Fetch the bounding box x and y values of the maps coordinates
    let bounding_box_query =
        diesel::sql_query("SELECT * FROM calculate_bbox($1)").bind::<Integer, _>(map_id);
    debug!("{}", debug_query::<Pg, _>(&bounding_box_query));
    let bounding_box = bounding_box_query.get_result::<BoundingBox>(conn).await?;

    // Fetch the heatmap
    let query = diesel::sql_query("SELECT * FROM calculate_score($1, $2, $3, $4, $5, $6, $7, $8)")
        .bind::<Integer, _>(map_id)
        .bind::<Integer, _>(layer_id)
        .bind::<Integer, _>(plant_id)
        .bind::<Integer, _>(GRANULARITY)
        .bind::<Integer, _>(bounding_box.x_min)
        .bind::<Integer, _>(bounding_box.y_min)
        .bind::<Integer, _>(bounding_box.x_max)
        .bind::<Integer, _>(bounding_box.y_max);
    debug!("{}", debug_query::<Pg, _>(&query));
    let result = query.load::<HeatMapElement>(conn).await?;

    // Convert the result to a matrix.
    // Matrix will be from 0..0 to ((x_max - x_min) / granularity)..((y_max - y_min) / granularity).
    let mut heatmap =
        vec![
            vec![0.0; ((bounding_box.x_max - bounding_box.x_min) / GRANULARITY) as usize];
            ((bounding_box.y_max - bounding_box.y_min) / GRANULARITY) as usize
        ];
    for HeatMapElement { score, x, y } in result {
        heatmap[y as usize][x as usize] = score;
    }
    Ok(heatmap)
}

/// Get all relations of a certain plant.
///
/// # Errors
/// * If the SQL query failed.
pub async fn find_relations(
    search_query: RelationSearchParameters,
    conn: &mut AsyncPgConnection,
) -> QueryResult<RelationsDto> {
    let query = relations::table
        .select((relations::plant2, relations::relation))
        .filter(relations::plant1.eq(&search_query.plant_id))
        .union(
            relations::table
                .select((relations::plant1, relations::relation))
                .filter(relations::plant2.eq(&search_query.plant_id)),
        );
    debug!("{}", debug_query::<Pg, _>(&query));
    let relations = query
        .load::<(i32, RelationType)>(conn)
        .await?
        .into_iter()
        .map(|(id, relation)| RelationDto { id, relation })
        .collect();
    Ok(RelationsDto {
        id: search_query.plant_id,
        relations,
    })
}
