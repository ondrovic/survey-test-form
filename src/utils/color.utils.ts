export interface ColorOption {
  value: string;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  {
    value: "transparent",
    label: "Default (No Color)",
    bgClass: "bg-transparent",
    textClass: "text-gray-700",
    borderClass: "border-gray-300",
  },
  {
    value: "success",
    label: "Success (Green)",
    bgClass: "bg-green-50",
    textClass: "text-green-700",
    borderClass: "border-green-300",
  },
  {
    value: "warning",
    label: "Warning (Yellow)",
    bgClass: "bg-yellow-50",
    textClass: "text-yellow-700",
    borderClass: "border-yellow-300",
  },
  {
    value: "error",
    label: "Error (Red)",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
    borderClass: "border-red-300",
  },
  {
    value: "blue",
    label: "Blue",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
    borderClass: "border-blue-300",
  },
];

export const getColorClasses = (colorValue: string): string => {
  const colorOption = COLOR_OPTIONS.find(
    (option) => option.value === colorValue
  );
  if (!colorOption) {
    // Default to transparent if color not found
    const defaultOption = COLOR_OPTIONS.find(
      (option) => option.value === "transparent"
    )!;
    return `${defaultOption.bgClass} ${defaultOption.textClass} ${defaultOption.borderClass}`;
  }
  return `${colorOption.bgClass} ${colorOption.textClass} ${colorOption.borderClass}`;
};

export const getColorOptionByValue = (
  value: string
): ColorOption | undefined => {
  return COLOR_OPTIONS.find((option) => option.value === value);
};
