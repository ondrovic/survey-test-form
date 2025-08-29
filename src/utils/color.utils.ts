export interface ColorOption {
  value: string;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  // Neutral & Default
  {
    value: "default",
    label: "Default",
    bgClass: "bg-transparent",
    textClass: "text-gray-700",
    borderClass: "border-gray-300",
  },
  {
    value: "gray",
    label: "Gray",
    bgClass: "bg-gray-50",
    textClass: "text-gray-700",
    borderClass: "border-gray-300",
  },
  {
    value: "slate",
    label: "Slate",
    bgClass: "bg-slate-50",
    textClass: "text-slate-700",
    borderClass: "border-slate-300",
  },
  {
    value: "stone",
    label: "Stone",
    bgClass: "bg-stone-50",
    textClass: "text-stone-700",
    borderClass: "border-stone-300",
  },

  // Reds
  {
    value: "error",
    label: "Red",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
    borderClass: "border-red-300",
  },
  {
    value: "red-light",
    label: "Light Red",
    bgClass: "bg-red-25",
    textClass: "text-red-600",
    borderClass: "border-red-200",
  },
  {
    value: "red-dark",
    label: "Dark Red",
    bgClass: "bg-red-100",
    textClass: "text-red-800",
    borderClass: "border-red-400",
  },
  {
    value: "rose",
    label: "Rose",
    bgClass: "bg-rose-50",
    textClass: "text-rose-700",
    borderClass: "border-rose-300",
  },
  {
    value: "pink",
    label: "Pink",
    bgClass: "bg-pink-50",
    textClass: "text-pink-700",
    borderClass: "border-pink-300",
  },
  {
    value: "fuchsia",
    label: "Fuchsia",
    bgClass: "bg-fuchsia-50",
    textClass: "text-fuchsia-700",
    borderClass: "border-fuchsia-300",
  },

  // Oranges & Yellows
  {
    value: "orange",
    label: "Orange",
    bgClass: "bg-orange-50",
    textClass: "text-orange-700",
    borderClass: "border-orange-300",
  },
  {
    value: "orange-light",
    label: "Light Orange",
    bgClass: "bg-orange-25",
    textClass: "text-orange-600",
    borderClass: "border-orange-200",
  },
  {
    value: "orange-dark",
    label: "Dark Orange",
    bgClass: "bg-orange-100",
    textClass: "text-orange-800",
    borderClass: "border-orange-400",
  },
  {
    value: "amber",
    label: "Amber",
    bgClass: "bg-blue-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-300",
  },
  {
    value: "warning",
    label: "Yellow",
    bgClass: "bg-yellow-50",
    textClass: "text-yellow-700",
    borderClass: "border-yellow-300",
  },
  {
    value: "yellow-light",
    label: "Light Yellow",
    bgClass: "bg-yellow-25",
    textClass: "text-yellow-600",
    borderClass: "border-yellow-200",
  },
  {
    value: "yellow-dark",
    label: "Dark Yellow",
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-800",
    borderClass: "border-yellow-400",
  },
  {
    value: "lime",
    label: "Lime",
    bgClass: "bg-lime-50",
    textClass: "text-lime-700",
    borderClass: "border-lime-300",
  },

  // Greens
  {
    value: "success",
    label: "Green",
    bgClass: "bg-green-50",
    textClass: "text-green-700",
    borderClass: "border-green-300",
  },
  {
    value: "green-light",
    label: "Light Green",
    bgClass: "bg-green-25",
    textClass: "text-green-600",
    borderClass: "border-green-200",
  },
  {
    value: "green-dark",
    label: "Dark Green",
    bgClass: "bg-green-100",
    textClass: "text-green-800",
    borderClass: "border-green-400",
  },
  {
    value: "emerald",
    label: "Emerald",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-300",
  },
  {
    value: "teal",
    label: "Teal",
    bgClass: "bg-teal-50",
    textClass: "text-teal-700",
    borderClass: "border-teal-300",
  },
  {
    value: "mint",
    label: "Mint",
    bgClass: "bg-emerald-25",
    textClass: "text-emerald-600",
    borderClass: "border-emerald-200",
  },

  // Cyans & Blues
  {
    value: "cyan",
    label: "Cyan",
    bgClass: "bg-cyan-50",
    textClass: "text-cyan-700",
    borderClass: "border-cyan-300",
  },
  {
    value: "sky",
    label: "Sky Blue",
    bgClass: "bg-sky-50",
    textClass: "text-sky-700",
    borderClass: "border-sky-300",
  },
  {
    value: "blue",
    label: "Blue",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
    borderClass: "border-blue-300",
  },
  {
    value: "blue-light",
    label: "Light Blue",
    bgClass: "bg-blue-25",
    textClass: "text-blue-600",
    borderClass: "border-blue-200",
  },
  {
    value: "blue-dark",
    label: "Dark Blue",
    bgClass: "bg-blue-100",
    textClass: "text-blue-800",
    borderClass: "border-blue-400",
  },
  {
    value: "indigo",
    label: "Indigo",
    bgClass: "bg-indigo-50",
    textClass: "text-indigo-700",
    borderClass: "border-indigo-300",
  },
  {
    value: "royal",
    label: "Royal Blue",
    bgClass: "bg-blue-75",
    textClass: "text-blue-800",
    borderClass: "border-blue-400",
  },

  // Purples
  {
    value: "violet",
    label: "Violet",
    bgClass: "bg-violet-50",
    textClass: "text-violet-700",
    borderClass: "border-violet-300",
  },
  {
    value: "purple",
    label: "Purple",
    bgClass: "bg-purple-50",
    textClass: "text-purple-700",
    borderClass: "border-purple-300",
  },
  {
    value: "purple-light",
    label: "Light Purple",
    bgClass: "bg-purple-25",
    textClass: "text-purple-600",
    borderClass: "border-purple-200",
  },
  {
    value: "purple-dark",
    label: "Dark Purple",
    bgClass: "bg-purple-100",
    textClass: "text-purple-800",
    borderClass: "border-purple-400",
  },
  {
    value: "lavender",
    label: "Lavender",
    bgClass: "bg-violet-25",
    textClass: "text-violet-600",
    borderClass: "border-violet-200",
  },

  // Warm Tones
  {
    value: "salmon",
    label: "Salmon",
    bgClass: "bg-rose-75",
    textClass: "text-rose-700",
    borderClass: "border-rose-300",
  },
  {
    value: "gold",
    label: "Gold",
    bgClass: "bg-yellow-75",
    textClass: "text-yellow-800",
    borderClass: "border-yellow-400",
  },
  {
    value: "bronze",
    label: "Bronze",
    bgClass: "bg-blue-75",
    textClass: "text-amber-800",
    borderClass: "border-amber-400",
  },

  // Cool Tones
  {
    value: "seafoam",
    label: "Seafoam",
    bgClass: "bg-teal-25",
    textClass: "text-teal-600",
    borderClass: "border-teal-200",
  },
  {
    value: "sage",
    label: "Sage",
    bgClass: "bg-green-75",
    textClass: "text-green-700",
    borderClass: "border-green-300",
  },
  {
    value: "steel",
    label: "Steel",
    bgClass: "bg-slate-75",
    textClass: "text-slate-700",
    borderClass: "border-slate-300",
  },

  // Earth Tones
  {
    value: "brown",
    label: "Brown",
    bgClass: "bg-blue-100",
    textClass: "text-amber-900",
    borderClass: "border-amber-400",
  },
  {
    value: "tan",
    label: "Tan",
    bgClass: "bg-stone-75",
    textClass: "text-stone-700",
    borderClass: "border-stone-300",
  },
  {
    value: "chocolate",
    label: "Chocolate",
    bgClass: "bg-stone-100",
    textClass: "text-stone-800",
    borderClass: "border-stone-400",
  },

  // Monochrome
  {
    value: "black",
    label: "Black",
    bgClass: "bg-gray-100",
    textClass: "text-gray-900",
    borderClass: "border-gray-500",
  },
  {
    value: "white",
    label: "White",
    bgClass: "bg-white",
    textClass: "text-gray-800",
    borderClass: "border-gray-300",
  },
  {
    value: "charcoal",
    label: "Charcoal",
    bgClass: "bg-gray-75",
    textClass: "text-gray-800",
    borderClass: "border-gray-400",
  },

  // High Contrast & Accessibility
  {
    value: "high-contrast",
    label: "High Contrast",
    bgClass: "bg-gray-900",
    textClass: "text-white",
    borderClass: "border-gray-700",
  },
  {
    value: "accessible-blue",
    label: "Accessible Blue",
    bgClass: "bg-blue-100",
    textClass: "text-blue-900",
    borderClass: "border-blue-500",
  },
  {
    value: "accessible-green",
    label: "Accessible Green",
    bgClass: "bg-green-100",
    textClass: "text-green-900",
    borderClass: "border-green-500",
  },
  {
    value: "accessible-red",
    label: "Accessible Red",
    bgClass: "bg-red-100",
    textClass: "text-red-900",
    borderClass: "border-red-500",
  },
];

export const getColorClasses = (colorValue: string): string => {
  const colorOption = COLOR_OPTIONS.find(
    (option) => option.value === colorValue
  );
  if (!colorOption) {
    // Default to default if color not found
    const defaultOption = COLOR_OPTIONS.find(
      (option) => option.value === "default"
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
