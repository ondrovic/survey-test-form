import {
  COMMERCIAL_SERVICE_LINES,
  INDUSTRIES,
  RESIDENTIAL_SERVICE_LINES,
  ServiceLineCategoryData,
} from "@/constants/services.constants";
import { ServiceLineCategory, ServiceLineItem } from "@/types";

export const initializeServiceLineItems = (
  serviceLines: readonly string[]
): ServiceLineItem[] => {
  return serviceLines.map((name) => ({
    name,
    rating: "High",
  }));
};

export const initializeServiceLineCategories = (
  categories: ServiceLineCategoryData[]
): ServiceLineCategory[] => {
  return categories.map((category) => ({
    heading: category.heading,
    items: initializeServiceLineItems(category.items),
  }));
};

export const createInitialServiceLineSection = () => ({
  residentialServices: initializeServiceLineCategories(
    RESIDENTIAL_SERVICE_LINES
  ),
  residentialAdditionalNotes: "",
  commercialServices: initializeServiceLineCategories(COMMERCIAL_SERVICE_LINES),
  commercialAdditionalNotes: "",
  industries: initializeServiceLineCategories(INDUSTRIES),
  industriesAdditionalNotes: "",
});
