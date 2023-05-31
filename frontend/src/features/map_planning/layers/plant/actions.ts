/**
 * @module this module contains actions for the plant layer.
 */
import { createPlanting } from '../../api/createPlanting';
import { deletePlanting } from '../../api/deletePlanting';
import { movePlanting } from '../../api/movePlanting';
import { Action, TrackedMapState } from '../../store/MapStoreTypes';
import { PlantLayerObjectDto } from '@/bindings/definitions';

export class CreatePlantAction
  implements Action<Awaited<ReturnType<typeof createPlanting>>, boolean>
{
  private readonly _id: string;

  constructor(private readonly _data: PlantLayerObjectDto) {
    this._id = _data.id;
  }

  reverse() {
    return new DeletePlantAction(this._id);
  }

  apply(state: TrackedMapState): TrackedMapState {
    return {
      ...state,
      layers: {
        ...state.layers,
        Plant: {
          ...state.layers.Plant,
          objects: [
            ...state.layers.Plant.objects,
            {
              ...this._data,
              id: this._id,
            },
          ],
        },
      },
    };
  }

  async execute(): Promise<Awaited<ReturnType<typeof createPlanting>>> {
    return createPlanting({
      ...this._data,
      // TODO - get these values from the store.
      map_id: 1,
      plant_id: this._data.plantId,
      id: this._id,
    });
  }
}

export class DeletePlantAction
  implements Action<boolean, Awaited<ReturnType<typeof createPlanting>>>
{
  constructor(private readonly _id: string) {}

  async execute(): Promise<boolean> {
    return deletePlanting(this._id);
  }

  reverse(state: TrackedMapState) {
    const plant = state.layers.Plant.objects.find((obj) => obj.id === this._id);

    if (!plant) {
      return null;
    }

    return new CreatePlantAction(plant);
  }

  apply(state: TrackedMapState): TrackedMapState {
    return {
      ...state,
      layers: {
        ...state.layers,
        Plant: {
          ...state.layers.Plant,
          objects: state.layers.Plant.objects.filter((p) => p.id !== this._id),
        },
      },
    };
  }
}

export class MovePlantAction
  implements
    Action<Awaited<ReturnType<typeof movePlanting>>[], Awaited<ReturnType<typeof movePlanting>>[]>
{
  private readonly _ids: Array<string>;

  constructor(private readonly _data: Array<Pick<PlantLayerObjectDto, 'x' | 'y' | 'id'>>) {
    this._ids = _data.map((d) => d.id);
  }

  reverse(state: TrackedMapState): MovePlantAction | null {
    const plants = state.layers.Plant.objects.filter((obj) => this._ids.includes(obj.id));

    if (!plants.length) {
      return null;
    }

    return new MovePlantAction(plants.map((p) => ({ id: p.id, x: p.x, y: p.y })));
  }

  apply(state: TrackedMapState): TrackedMapState {
    return {
      ...state,
      layers: {
        ...state.layers,
        Plant: {
          ...state.layers.Plant,
          objects: state.layers.Plant.objects.map((p) => {
            if (this._ids.includes(p.id)) {
              return {
                ...p,
                x: this._data.find((d) => d.id === p.id)?.x ?? p.x,
                y: this._data.find((d) => d.id === p.id)?.y ?? p.y,
              };
            }

            return p;
          }),
        },
      },
    };
  }

  execute(): Promise<PlantLayerObjectDto[]> {
    const tasks = this._data.map((d) =>
      movePlanting(d.id, {
        map_id: 1,
        plant_id: 1,
        x: d.x,
        y: d.y,
      }),
    );

    return Promise.all(tasks);
  }
}
