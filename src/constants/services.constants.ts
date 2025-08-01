export interface ServiceLineCategoryData {
  heading: string;
  items: string[];
}

// these are going to map to the item section headings
export const BASE_SERVICE_LINES = [
  "Emergency Response",
  "Water",
  "Fire",
  "Construction",
  "Roofing",
  "Mold",
  "Storm",
  "Contents",
  "General Cleaning",
  "Specialty Cleaning",
  "Other", // going to map to the text block of Antyhing we missed
] as const;

// each of theses need to map to fields residential_
export const RESIDENTIAL_SERVICE_LINES: ServiceLineCategoryData[] = [
  {
    heading: "Emergency Response",
    items: ["Emergency Response"],
  },
  {
    heading: "Water",
    items: [
      "Water Damage (General)",
      "Water Extraction and Clean Up (Drying, Dehumidification)",
      "Water Damage Repair & Restoration",
      "Flood Damage Cleanup & Restoration",
      "Basement Flood Cleanup",
    ],
  },
  {
    heading: "Fire",
    items: [
      "Fire Damage (General)",
      "Fire Damage Cleanup & Restoration",
      "Smoke Damage & Soot Removal Services",
      "Deodorization",
      "Roof Tarp / Board Up",
    ],
  },
  {
    heading: "Construction",
    items: [
      "Construction (General)",
      "Construction, Remodeling, Restoration",
      "Home Contractor",
      "Post construction cleaning services",
    ],
  },
  {
    heading: "Roofing",
    items: ["Roofing (General)", "Repair, Replacement"],
  },
  {
    heading: "Mold",
    items: [
      "Mold Damage (General)",
      "Mold Removal & Remediation",
      "Attic Mold Removal",
      "Bathroom Mold Cleaning",
      "Air Sampling Services",
    ],
  },
  {
    heading: "Storm",
    items: [
      "Storm Damage Recovery",
      "Flooding",
      "Wildfires",
      "Hurricane/Fire/Flood/Wind/Hail/Ice Storm Damage",
      "Emergency Roof Tarp / Board Up",
      "Demolition & Reconstruction Services",
    ],
  },
  {
    heading: "Contents",
    items: ["Contents (General)", "Pack Out Services & Storage"],
  },
  {
    heading: "General Cleaning",
    items: [
      "General Cleaning",
      "Air Duct Cleaning",
      "Spring Cleaning",
      "Professional Cleaning Home for Sale",
      "Construction & Post Renovation Cleaning",
      "Upholstery & Carpet Cleaning",
      "Floors, Walls & Ceilings",
      "Odor Removal",
      "Pet Stain / Odor Removal",
    ],
  },
  {
    heading: "Specialty Cleaning",
    items: [
      "Specialty Cleaning",
      "Biohazard Cleaning Services",
      "Crime Scene & Trauma Cleaning",
      "Suicide & Death Cleanup",
      "Hoarding Cleanup",
      "Illicit Substance Cleanup & Destruction",
      "Jail Cell & Squad Car Remediation",
      "Chemicals & Residues (tear gas, pepper spray, fire extinguisher, etc.)",
      "Virus, pathogens & Covid 19 Cleanup",
      "Sewage & Black Water",
      "Document Restoration",
      "Contents Restoration Services",
      "Document & Media Recovery",
      "Vandalism & Graffiti Cleanup",
      "Asbestos & Lead Paint Abatement",
      "Crawlspace Encapsulation",
    ],
  },
];

// each of theses need to map to fields commercial_
export const COMMERCIAL_SERVICE_LINES: ServiceLineCategoryData[] = [
  {
    heading: "Emergency Response",
    items: ["Emergency Response", "Emergency Readiness Plan"],
  },
  {
    heading: "Water",
    items: [
      "Water Damage (General)",
      "Water Extraction and Clean Up (Drying, Dehumidification)",
      "Water Damage Repair & Restoration",
      "Flood Damage Cleanup & Restoration",
    ],
  },
  {
    heading: "Fire",
    items: [
      "Fire Damage (General)",
      "Fire Damage Cleanup & Restoration",
      "Smoke Damage & Soot Removal Services",
      "Deodorization",
      "Roof Tarp / Board Up",
      "Demolition",
      "Reconstruction",
    ],
  },
  {
    heading: "Construction",
    items: [
      "Construction (General)",
      "General Contracting & Reconstruction",
      "Construction, Remodeling, Restoration",
      "Restaurants, Hotels, Motels, Retail, Manufacturing, Industrial Complexes, Government & Military Buildings",
      "Commercial Large Loss",
      "Post Construction Cleaning Services",
    ],
  },
  {
    heading: "Mold",
    items: ["Mold Damage (General)", "Mold Removal & Remediation"],
  },
  {
    heading: "Storm",
    items: [
      "Storm Damage Recovery",
      "Flooding",
      "Wildfires",
      "Hurricane/Fire/Flood/Wind/Hail/Ice Storm Damage",
      "Roof Tarp / Board Up",
      "Perimeter Fencing",
      "Building Shrink Wrap",
      "Emergency Security Personnel",
    ],
  },
  {
    heading: "Contents",
    items: ["Contents (General)", "Pack Out Services & Storage"],
  },
  {
    heading: "General Cleaning",
    items: [
      "General Cleaning",
      "Commercial Cleaning & Janitorial Services",
      "Air Duct Cleaning",
      "Odor Removal",
      "Construction & Post Renovation Cleaning",
      "Upholstery & Carpet Cleaning",
      "Floors, Walls & Ceilings",
      "Drapes, Blinds & Window Treatment Cleaning",
    ],
  },
  {
    heading: "Specialty Cleaning",
    items: [
      "Specialty Cleaning",
      "Biohazard Cleaning Services",
      "Crime Scene & Trauma Cleaning",
      "Suicide & Death Cleanup",
      "Hoarding Cleanup",
      "Illicit Substance Cleanup & Destruction",
      "Jail Cell & Squad Car Remediation",
      "Chemicals & Residues (tear gas, pepper spray, fire extinguisher, etc.)",
      "Virus, pathogens & Covid 19 Cleanup",
      "Sewage & Black Water",
      "Document Restoration",
      "Contents Restoration Services",
      "Document & Media Recovery",
      "Vandalism & Graffiti Cleanup",
      "Corrosion Control",
      "Electronic Restoration",
      "Ultrasonic Cleaning",
      "Commercial Disinfection",
      "Marine & Offshore Restoration",
      "Thermographic Inspection",
      "Contamination Level Assessment",
      "HCL Testing",
      "Machinery & Electronics Restoration",
      "Generator Cleaning",
      "Inventory of Hazardous Materials",
      "Semiconductor Decontamination & Decommissioning",
      "Parts Harvesting",
      "Reclamation & Recycling",
      "Consignment Services",
      "Deconstruction Services",
      "Environmental Services",
      "Emergency response to chemical or petroleum spills",
      "Hazardous Waste",
      "Asbestos & Lead Paint Abatement",
    ],
  },
];

// each of theses need to map to fields industries_
export const INDUSTRIES: ServiceLineCategoryData[] = [
  {
    heading: "",
    items: [
      "Commercial Large Loss",
      "Education",
      "Energy & Chemical Facilities",
      "Government & Public Entities",
      "Healthcare & Hospitals",
      "Hospitality, Hotel & Restaurant",
      "Insurance",
      "Manufacturing & Distribution",
      "Maritime",
      "Multi-Family Housing",
      "Pharmaceutical Manufacturing",
      "Religious Institutions",
      "Retail",
      "Senior Living & Assisted Living Facilities",
      "Technology & Data Centers",
    ],
  },
];
