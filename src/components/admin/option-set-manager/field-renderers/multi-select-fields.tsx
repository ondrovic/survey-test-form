import React from "react";
import { Input } from "../../../common";

interface MultiSelectFieldsProps {
  data: any;
  setField: (field: string, value: any) => void;
}

/**
 * Additional fields for Multi-Select Option Sets
 * Handles minSelections and maxSelections configuration
 */
export const MultiSelectFields: React.FC<MultiSelectFieldsProps> = ({
  data,
  setField,
}) => (
  <>
    <Input
      name="minSelections"
      label="Minimum Selections"
      type="number"
      value={String(data.minSelections ?? 1)}
      onChange={(value) =>
        setField("minSelections", parseInt(String(value)) || 1)
      }
      placeholder="1"
    />
    <Input
      name="maxSelections"
      label="Maximum Selections"
      type="number"
      value={String(data.maxSelections ?? 3)}
      onChange={(value) =>
        setField("maxSelections", parseInt(String(value)) || 3)
      }
      placeholder="3"
    />
  </>
);