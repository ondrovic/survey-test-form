import { RatingValue } from "@/types";

export interface ServiceLineItem {
  name: string;
  rating: RatingValue | "Not Important";
}

export interface ServiceLineCategory {
  heading: string;
  items: ServiceLineItem[];
}

export interface ServiceLineSectionProps {
  title: string;
  categories: ServiceLineCategory[];
  onRatingChange: (
    categoryIndex: number,
    itemIndex: number,
    rating: RatingValue | "Not Important"
  ) => void;
  onAdditionalNotesChange?: (notes: string) => void;
  additionalNotes?: string;
  className?: string;
  isRequired?: boolean;
  error?: string;
}
