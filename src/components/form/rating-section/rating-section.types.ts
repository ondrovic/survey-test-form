import { RatingValue } from "@/types";

export interface RatingSectionProps {
  label: string;
  value: RatingValue | null;
  onChange: (value: RatingValue) => void;
  expanded?: boolean;
  onToggle: (expanded: boolean) => void;
  className?: string;
}
