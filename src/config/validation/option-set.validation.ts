// Validation functions for option sets
export const validateName = (name: string): string | null => {
  if (!name || !name.trim()) {
    return "Name is required";
  }
  return null;
};

export const validateOptions = (options: any[]): string | null => {
  if (!options || options.length === 0) {
    return "At least one option is required";
  }

  // Validate each option has required fields
  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    if (!option.label || !option.label.trim()) {
      return `Option ${i + 1}: Label is required`;
    }

    if (!option.value || !option.value.trim()) {
      return `Option ${i + 1}: Value is required`;
    }
  }

  return null;
};

// Multi-select specific validation
export const validateMultiSelectFields = (data: any): string | null => {
  const { options, minSelections, maxSelections } = data;

  if (!options) return null;

  const validOptions = options.filter(
    (option: any) =>
      option.label && option.label.trim() && option.value && option.value.trim()
  );

  if (minSelections && maxSelections) {
    if (minSelections > maxSelections) {
      return "Minimum selections cannot be greater than maximum selections";
    }
    if (minSelections > validOptions.length) {
      return "Minimum selections cannot be greater than the number of valid options";
    }
    if (maxSelections > validOptions.length) {
      return "Maximum selections cannot be greater than the number of valid options";
    }
  }

  return null;
};