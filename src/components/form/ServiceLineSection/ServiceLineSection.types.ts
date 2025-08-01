import { RatingValue } from "@/types";

export interface ServiceLineItem {
  name: string;
  selected: boolean;
  rating: RatingValue | "N/A";
}

export interface ServiceLineCategory {
  heading: string;
  items: ServiceLineItem[];
}

export interface ServiceLineSectionProps {
  title: string;
  categories: ServiceLineCategory[];
  onItemChange: (
    categoryIndex: number,
    itemIndex: number,
    selected: boolean
  ) => void;
  onRatingChange: (
    categoryIndex: number,
    itemIndex: number,
    rating: RatingValue | "N/A"
  ) => void;
  className?: string;
}
