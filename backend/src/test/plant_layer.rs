//! Tests for [`crate::controller::plant_layer`].

use actix_web::{
    http::{
        header::{self},
        StatusCode,
    },
    test,
};
use diesel::ExpressionMethods;
use diesel_async::{scoped_futures::ScopedFutureExt, RunQueryDsl};

use crate::{
    model::{dto::RelationsDto, r#enum::relations_type::RelationsType},
    test::util::{init_test_app, init_test_database},
};

#[actix_rt::test]
async fn test_find_plants_relations_succeeds() {
    let pool = init_test_database(|conn| {
        async {
            diesel::insert_into(crate::schema::plants::table)
                .values(vec![
                    (
                        &crate::schema::plants::id.eq(-1),
                        &crate::schema::plants::unique_name.eq("Testia testia"),
                    ),
                    (
                        &crate::schema::plants::id.eq(-2),
                        &crate::schema::plants::unique_name.eq("Testia 2"),
                    ),
                    (
                        &crate::schema::plants::id.eq(-3),
                        &crate::schema::plants::unique_name.eq("Test"),
                    ),
                    (
                        &crate::schema::plants::id.eq(-4),
                        &crate::schema::plants::unique_name.eq("Testia testum"),
                    ),
                ])
                .execute(conn)
                .await?;
            diesel::insert_into(crate::schema::relations::table)
                .values(vec![
                    (
                        &crate::schema::relations::plant1.eq("Testia testia"),
                        &crate::schema::relations::plant2.eq("Test"),
                        &crate::schema::relations::relation.eq(RelationsType::Companion),
                    ),
                    (
                        &crate::schema::relations::plant1.eq("Testia 2"),
                        &crate::schema::relations::plant2.eq("Testia 2"),
                        &crate::schema::relations::relation.eq(RelationsType::Antagonist),
                    ),
                    (
                        &crate::schema::relations::plant1.eq("Testia testum"),
                        &crate::schema::relations::plant2.eq("Testia 2"),
                        &crate::schema::relations::relation.eq(RelationsType::Companion),
                    ),
                    (
                        &crate::schema::relations::plant1.eq("Test"),
                        &crate::schema::relations::plant2.eq("Testia 2"),
                        &crate::schema::relations::relation.eq(RelationsType::Neutral),
                    ),
                    (
                        // Same as the one above but switched (to test if return value is distinct)
                        &crate::schema::relations::plant1.eq("Testia 2"),
                        &crate::schema::relations::plant2.eq("Test"),
                        &crate::schema::relations::relation.eq(RelationsType::Neutral),
                    ),
                ])
                .execute(conn)
                .await?;
            Ok(())
        }
        .scope_boxed()
    })
    .await;
    let (token, app) = init_test_app(pool.clone()).await;

    let resp = test::TestRequest::get()
        .uri("/api/maps/-1/layers/plants/relations?plant_id=-3")
        .insert_header((header::AUTHORIZATION, token.clone()))
        .send_request(&app)
        .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let result = test::read_body(resp).await;
    let result_string = std::str::from_utf8(&result).unwrap();
    let dto: RelationsDto = serde_json::from_str(result_string).unwrap();
    assert!(dto.id == -3);
    assert!(dto.relations.len() == 2);

    let resp = test::TestRequest::get()
        .uri("/api/maps/-1/layers/plants/relations?plant_id=-2")
        .insert_header((header::AUTHORIZATION, token))
        .send_request(&app)
        .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let result = test::read_body(resp).await;
    let result_string = std::str::from_utf8(&result).unwrap();
    let dto: RelationsDto = serde_json::from_str(result_string).unwrap();
    assert!(dto.id == -2);
    assert!(dto.relations.len() == 3);
}
