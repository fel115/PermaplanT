import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { PlantingDto } from '@/api_types/definitions';
import SimpleButton, { ButtonVariant } from '@/components/Button/SimpleButton';
import SimpleFormInput from '@/components/Form/SimpleFormInput';
import { useFindPlantById } from '@/features/map_planning/layers/plant/hooks/plantHookApi';
import { useDebouncedSubmit } from '@/hooks/useDebouncedSubmit';
import CheckIcon from '@/svg/icons/check.svg?react';
import CircleDottedIcon from '@/svg/icons/circle-dotted.svg?react';
import { PlantNameFromAdditionalNameAndPlant, PlantNameFromPlant } from '@/utils/plant-naming';

const PlantingAttributeEditFormSchema = z
  // The 'empty' value for the API is undefined, so we need to transform the empty string to undefined
  .object({
    addDate: z.nullable(z.string()).transform((value) => value || undefined),
    removeDate: z.nullable(z.string()).transform((value) => value || undefined),
  })
  .refine((schema) => !schema.removeDate || !schema.addDate || schema.addDate < schema.removeDate, {
    path: ['dateRelation'],
  });

export type PlantingDateAttribute = Pick<PlantingDto, 'addDate' | 'removeDate'>;

export type EditPlantingAttributesProps = {
  onAddDateChange: (addDate: PlantingDateAttribute) => void;
  onRemoveDateChange: (removeDate: PlantingDateAttribute) => void;
  onDeleteClick: () => void;
  isReadOnlyMode: boolean;
};

export type EditSinglePlantingProps = EditPlantingAttributesProps & {
  planting: PlantingDto;
};

export type EditMultiplePlantingsProps = EditPlantingAttributesProps & {
  plantings: PlantingDto[];
};

export type PlantingAttributeEditFormProps = EditPlantingAttributesProps & {
  addDateDefaultValue: string;
  removeDateDefaultValue: string;
  multiplePlantings?: boolean;
};

export function SinglePlantingAttributeForm({
  planting,
  onAddDateChange,
  onRemoveDateChange,
  onDeleteClick,
  isReadOnlyMode,
}: EditSinglePlantingProps) {
  const { plantId } = planting;
  const {
    data: plant,
    isLoading: plantSummaryIsLoading,
    isError: plantSummaryIsError,
  } = useFindPlantById({ plantId });

  if (plantSummaryIsLoading) return null;
  if (plantSummaryIsError) return null;

  return (
    <div className="flex flex-col gap-2 p-2">
      <h2>
        {planting.additionalName ? (
          <PlantNameFromAdditionalNameAndPlant
            additionalName={planting.additionalName}
            plant={plant}
          />
        ) : (
          <PlantNameFromPlant plant={plant} />
        )}
      </h2>

      <PlantingAttributeEditForm
        addDateDefaultValue={planting.addDate ?? ''}
        removeDateDefaultValue={planting.removeDate ?? ''}
        onAddDateChange={onAddDateChange}
        onRemoveDateChange={onRemoveDateChange}
        onDeleteClick={onDeleteClick}
        isReadOnlyMode={isReadOnlyMode}
      />
    </div>
  );
}

export function MultiplePlantingsAttributeForm({
  plantings,
  onAddDateChange,
  onRemoveDateChange,
  onDeleteClick,
  isReadOnlyMode,
}: EditMultiplePlantingsProps) {
  const { t } = useTranslation(['plantings']);

  const getCommonAddDate = () => {
    const comparisonDate = plantings[0].addDate;
    const existsCommonDate = plantings.every((planting) => planting.addDate === comparisonDate);
    return existsCommonDate ? comparisonDate : '';
  };

  const getCommonRemoveDate = () => {
    const comparisonDate = plantings[0].removeDate;
    const existsCommonDate = plantings.every((planting) => planting.removeDate === comparisonDate);
    return existsCommonDate ? comparisonDate : '';
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      <h2>{t('plantings:heading_multiple_plantings')}</h2>

      <PlantingAttributeEditForm
        addDateDefaultValue={getCommonAddDate() ?? ''}
        removeDateDefaultValue={getCommonRemoveDate() ?? ''}
        onAddDateChange={onAddDateChange}
        onRemoveDateChange={onRemoveDateChange}
        onDeleteClick={onDeleteClick}
        isReadOnlyMode={isReadOnlyMode}
        multiplePlantings={true}
      />
    </div>
  );
}

function PlantingAttributeEditForm({
  addDateDefaultValue,
  removeDateDefaultValue,
  onAddDateChange,
  onRemoveDateChange,
  onDeleteClick,
  isReadOnlyMode,
  multiplePlantings = false,
}: PlantingAttributeEditFormProps) {
  const { t } = useTranslation(['plantings']);

  const { register, handleSubmit, watch, formState } = useForm<PlantingDateAttribute>({
    // The 'empty' value for the native date input is an empty string, not null | undefined
    defaultValues: {
      addDate: addDateDefaultValue,
      removeDate: removeDateDefaultValue,
    },
    resolver: zodResolver(PlantingAttributeEditFormSchema),
  });

  const addDateSubmitState = useDebouncedSubmit<PlantingDateAttribute>(
    watch('addDate'),
    handleSubmit,
    onAddDateChange,
  );

  const removeDateSubmitState = useDebouncedSubmit<PlantingDateAttribute>(
    watch('removeDate'),
    handleSubmit,
    onRemoveDateChange,
  );

  return (
    <>
      {/**
       * See https://github.com/orgs/react-hook-form/discussions/7111
       * @ts-expect-error this error path was added by zod refine(). hook form is unaware, which is a shortcoming.*/}
      {formState.errors.dateRelation && (
        <div className="text-sm text-red-400">{t('plantings:error_invalid_add_remove_date')}</div>
      )}
      <div className="flex gap-2">
        <SimpleFormInput
          type="date"
          id="addDate"
          disabled={isReadOnlyMode}
          aria-invalid={addDateSubmitState === 'error'}
          labelContent={t('plantings:add_date')}
          register={register}
          className="w-36"
        />
        {addDateSubmitState === 'loading' && (
          <CircleDottedIcon className="mb-3 mt-auto h-5 w-5 animate-spin text-secondary-400" />
        )}
        {addDateSubmitState === 'idle' && (
          <CheckIcon
            className="mb-3 mt-auto h-5 w-5 text-primary-400"
            data-testid="planting-attribute-edit-form__add-date-idle"
          />
        )}
      </div>
      <p className="pb-4 text-[0.8rem] text-neutral-400">
        {multiplePlantings
          ? t('plantings:add_date_description_multiple_plantings')
          : t('plantings:add_date_description')}
      </p>

      <div className="flex gap-2">
        <SimpleFormInput
          type="date"
          id="removeDate"
          disabled={isReadOnlyMode}
          aria-invalid={removeDateSubmitState === 'error'}
          labelContent={t('plantings:remove_date')}
          register={register}
          className="w-36"
        />
        {removeDateSubmitState === 'loading' && (
          <CircleDottedIcon className="mb-3 mt-auto h-5 w-5 animate-spin text-secondary-400" />
        )}
        {removeDateSubmitState === 'idle' && (
          <CheckIcon
            className="mb-3 mt-auto h-5 w-5 text-primary-400"
            data-testid="planting-attribute-edit-form__removed-on-idle"
          />
        )}
      </div>

      <p className="text-[0.8rem] text-neutral-400">
        {multiplePlantings
          ? t('plantings:remove_date_description_multiple_plantings')
          : t('plantings:remove_date_description')}
      </p>

      <hr className="my-4 border-neutral-700" />

      <SimpleButton
        disabled={isReadOnlyMode}
        variant={ButtonVariant.dangerBase}
        onClick={onDeleteClick}
        className="w-36"
        data-tourid="planting_delete"
      >
        {multiplePlantings ? t('plantings:delete_multiple_plantings') : t('plantings:delete')}
      </SimpleButton>
    </>
  );
}
