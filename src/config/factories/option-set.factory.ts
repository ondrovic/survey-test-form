import { databaseHelpers } from "../database";
import { createMetadataSync } from "../../utils/metadata.utils";
import {
  RatingScale,
  RadioOptionSet,
  MultiSelectOptionSet,
  SelectOptionSet,
  RatingScaleOption,
  OptionSetOption,
} from "../../types/framework.types";

// Common default option structure
const createDefaultOption = (overrides: Partial<OptionSetOption> = {}): OptionSetOption => ({
  value: "",
  label: "",
  color: "transparent",
  isDefault: false,
  order: 0,
  ...overrides,
});

// Common base structure for all option sets
const createBaseOptionSet = <T>(overrides: Partial<T> = {}): Omit<T, "id"> => ({
  name: "",
  description: "",
  isActive: true,
  metadata: createMetadataSync(),
  ...overrides,
} as Omit<T, "id">);

// Factory functions for default items
export const createDefaultRatingScale = (): Omit<RatingScale, "id"> =>
  createBaseOptionSet<RatingScale>({
    options: [createDefaultOption()] as RatingScaleOption[],
  });

export const createDefaultRadioOptionSet = (): Omit<RadioOptionSet, "id"> =>
  createBaseOptionSet<RadioOptionSet>({
    options: [createDefaultOption()],
  });

export const createDefaultMultiSelectOptionSet = (): Omit<MultiSelectOptionSet, "id"> =>
  createBaseOptionSet<MultiSelectOptionSet>({
    options: [createDefaultOption()],
    minSelections: 1,
    maxSelections: 3,
  });

export const createDefaultSelectOptionSet = (): Omit<SelectOptionSet, "id"> =>
  createBaseOptionSet<SelectOptionSet>({
    options: [createDefaultOption()],
    allowMultiple: false,
  });

// Database helper factories for each type
export const createRatingScaleDatabaseHelpers = () => ({
  get: () => databaseHelpers.getRatingScales(),
  create: (data: Omit<RatingScale, "id">) => databaseHelpers.addRatingScale(data as RatingScale),
  update: (id: string, data: Partial<RatingScale>) => databaseHelpers.updateRatingScale(id, data),
  delete: (id: string) => databaseHelpers.deleteRatingScale(id),
});

export const createRadioOptionSetDatabaseHelpers = () => ({
  get: () => databaseHelpers.getRadioOptionSets(),
  create: (data: Omit<RadioOptionSet, "id">) => databaseHelpers.addRadioOptionSet(data as RadioOptionSet),
  update: (id: string, data: Partial<RadioOptionSet>) => databaseHelpers.updateRadioOptionSet(id, data),
  delete: (id: string) => databaseHelpers.deleteRadioOptionSet(id),
});

export const createMultiSelectOptionSetDatabaseHelpers = () => ({
  get: () => databaseHelpers.getMultiSelectOptionSets(),
  create: (data: Omit<MultiSelectOptionSet, "id">) => databaseHelpers.addMultiSelectOptionSet(data as MultiSelectOptionSet),
  update: (id: string, data: Partial<MultiSelectOptionSet>) => databaseHelpers.updateMultiSelectOptionSet(id, data),
  delete: (id: string) => databaseHelpers.deleteMultiSelectOptionSet(id),
});

export const createSelectOptionSetDatabaseHelpers = () => ({
  get: () => databaseHelpers.getSelectOptionSets(),
  create: (data: Omit<SelectOptionSet, "id">) => databaseHelpers.addSelectOptionSet(data as SelectOptionSet),
  update: (id: string, data: Partial<SelectOptionSet>) => databaseHelpers.updateSelectOptionSet(id, data),
  delete: (id: string) => databaseHelpers.deleteSelectOptionSet(id),
});