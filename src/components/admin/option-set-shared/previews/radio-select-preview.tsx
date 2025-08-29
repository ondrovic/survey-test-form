import React from "react";
import {
  RADIO_OPTION_BUTTON_NAME,
  SELECT_OPTION_BUTTON_NAME,
  DEFAULT_FIELD_LABEL,
} from "@/constants/options-sets.constants";

interface RadioSelectPreviewProps {
  data: {
    name?: string;
    options: Array<{
      label?: string;
      color?: string;
      isDefault?: boolean;
    }>;
  };
  type: "radio" | "select";
}

export const RadioSelectPreview: React.FC<RadioSelectPreviewProps> = ({
  data,
  type,
}) => {
  if (data.options.length === 0) {
    return (
      <div className="space-y-3">
        <h5 className="text-sm font-medium text-gray-700">
          {type === "radio"
            ? RADIO_OPTION_BUTTON_NAME
            : SELECT_OPTION_BUTTON_NAME}{" "}
          Preview
        </h5>
        <div className="text-sm text-gray-500 italic">
          No options configured yet
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {data.options.map((option, index) => (
          <div
            key={index}
            className="p-3 border border-gray-200 rounded-lg bg-white"
          >
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                name="preview-radio"
                checked={!!option.isDefault}
                readOnly
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-700">
                {option.label || `Option ${index + 1}`}
              </span>
              {option.isDefault && (
                <span className="px-1 py-0.5 text-xs font-medium bg-blue-100 text-amber-800 rounded">
                  {DEFAULT_FIELD_LABEL}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
