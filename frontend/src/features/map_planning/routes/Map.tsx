import { BaseStage } from '../components/BaseStage';
import { Layers } from '../components/toolbar/Layers';
import { PlantSearch } from '../components/toolbar/PlantSearch';
import { Toolbar } from '../components/toolbar/Toolbar';
import PlantsLayer from '../layers/PlantsLayer';
import IconButton from '@/components/Button/IconButton';
import SimpleButton from '@/components/Button/SimpleButton';
import SimpleFormInput from '@/components/Form/SimpleFormInput';
import useMapState from '@/features/undo_redo/store/MapHistoryStore';
import { ReactComponent as ArrowIcon } from '@/icons/arrow.svg';
import { ReactComponent as MoveIcon } from '@/icons/move.svg';
import { ReactComponent as PlantIcon } from '@/icons/plant.svg';
import { ReactComponent as RedoIcon } from '@/icons/redo.svg';
import { ReactComponent as UndoIcon } from '@/icons/undo.svg';
import { Rect } from 'react-konva';

/**
 * This component is responsible for rendering the map that the user is going to draw on.
 * In order to add a new layer you can add another layer file under the "layers" folder.
 * Features such as zooming and panning are handled by the BaseStage component.
 * You only have to make sure that every shape has the property "draggable" set to true.
 * Otherwise they cannot be moved.
 */
export const Map = () => {
  const state = useMapState((state) => state.state);
  const dispatch = useMapState((s) => s.dispatch);

  return (
    <div className="flex h-full justify-between">
      <section className="min-h-full bg-neutral-100 dark:bg-neutral-200-dark">
        <Toolbar
          minWidth={160}
          contentTop={
            <div>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <ArrowIcon></ArrowIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <RedoIcon></RedoIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <UndoIcon></UndoIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <MoveIcon></MoveIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
              <IconButton className="m-2 h-8 w-8 border border-neutral-500 p-1">
                <PlantIcon></PlantIcon>
              </IconButton>
            </div>
          }
          contentBottom={
            <div className="flex flex-col gap-2 p-2">
              <h2>Edit attributes</h2>
              <SimpleFormInput
                id="input1"
                labelText="Some attribute"
                placeHolder="some input"
              ></SimpleFormInput>
              <SimpleFormInput
                id="input1"
                labelText="Some attribute"
                placeHolder="some input"
              ></SimpleFormInput>
              <SimpleFormInput
                id="input1"
                labelText="Some attribute"
                placeHolder="some input"
              ></SimpleFormInput>
              <SimpleFormInput
                id="input1"
                labelText="Some attribute"
                placeHolder="some input"
              ></SimpleFormInput>
              <SimpleFormInput
                id="input1"
                labelText="Some attribute"
                placeHolder="some input"
              ></SimpleFormInput>
              <SimpleButton>Submit data</SimpleButton>
            </div>
          }
          position="left"
        ></Toolbar>
      </section>
      <BaseStage>
        <PlantsLayer>
          {state.stage.layers['plant'].objects.map((o) => (
            <Rect
              {...o}
              key={o.id}
              fill="blue"
              draggable={true}
              shadowBlur={5}
              onDragEnd={(e) =>
                dispatch({
                  type: 'OBJECT_UPDATE',
                  payload: {
                    ...o,
                    x: e.target.x(),
                    y: e.target.y(),
                    height: e.target.height(),
                    width: e.target.width(),
                  },
                })
              }
              onTransformEnd={(e) => {
                dispatch({
                  type: 'OBJECT_UPDATE',
                  payload: {
                    ...o,
                    x: e.target.x(),
                    y: e.target.y(),
                    rotation: e.target.rotation(),
                    scaleX: e.target.scaleX(),
                    scaleY: e.target.scaleY(),
                  },
                });
              }}
            />
          ))}
        </PlantsLayer>
      </BaseStage>
      <section className="min-h-full bg-neutral-100 dark:bg-neutral-200-dark">
        <Toolbar
          contentTop={<Layers />}
          contentBottom={<PlantSearch />}
          position="right"
          minWidth={200}
        ></Toolbar>
      </section>
    </div>
  );
};
