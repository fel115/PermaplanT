import { AxiosError } from 'axios';
import { PlantsSummaryDto } from '@/api_types/definitions';
import { PublicNextcloudImage } from '@/features/nextcloud_integration/components/PublicNextcloudImage';
import defaultImageUrl from '@/svg/plant.svg';
import { PlantNameFromPlant } from '@/utils/plant-naming';

export type PlantListElementProps = {
  plant: PlantsSummaryDto;
  onClick: () => void;
  isHighlighted?: boolean;
  disabled?: boolean;
};

export function PlantListItem({
  plant,
  onClick,
  isHighlighted = false,
  disabled,
}: PlantListElementProps) {
  const highlightedClass = isHighlighted
    ? 'text-primary-400 stroke-primary-400 ring-4 ring-primary-300 '
    : undefined;

  return (
    <li
      className="my-1 flex"
      data-testid={`plant-list-item__${plant.common_name_en} ${plant.unique_name}`}
    >
      <button
        disabled={disabled}
        onClick={onClick}
        className={`${highlightedClass} flex flex-1 items-center gap-2 rounded-md stroke-neutral-400 px-2 py-1 hover:bg-neutral-200 hover:stroke-primary-400 hover:text-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-300 disabled:text-neutral-500 dark:hover:bg-neutral-300-dark dark:disabled:border-neutral-300-dark dark:disabled:bg-neutral-300-dark dark:disabled:text-neutral-500-dark`}
      >
        <PublicNextcloudImage
          className="max-h-[44px] shrink-0"
          defaultImageUrl={defaultImageUrl}
          path={`Icons/${plant?.unique_name}.png`}
          shareToken="2arzyJZYj2oNnHX"
          retry={shouldImageLoadingRetry}
          showErrorMessage={false}
        />
        <div className="text-left">
          <PlantNameFromPlant plant={plant} />
        </div>
      </button>
    </li>
  );
}

function shouldImageLoadingRetry(_: unknown, error: AxiosError) {
  return error.response?.status !== 404;
}
