const BASE_QUESTION =
  "What services should be nested in the navigation bar under";
const SELECT_ALL = "(select all that apply)";

const createSubNavQuestion = (service: string) =>
  `${BASE_QUESTION} ${service}? ${SELECT_ALL}`;

export const SUB_NAV_OPTIONS = [
  {
    service: "Water Damage",
    question: createSubNavQuestion("Water Damage"),
    options: [
      {
        value: "water-extraction-and-clean-up-drying-dehumidification",
        label: "Water Extraction and Clean up (Drying, Dehumidification)",
      },
      {
        value: "water-damage-repair-and-restoration",
        label: "Water Damage Repair & Restoration",
      },
      {
        value: "flood-damage-cleanup-and-restoration",
        label: "Flood Damage Cleanup & Restoration",
      },
      { value: "basement-flood-cleanup", label: "Basement Flood Cleanup" },
      {
        value: "sewage-black-water-cleanup",
        label: "Sewage/Black Water Cleanup",
      },
      {
        value: "contents-pack-out-services-and-storage",
        label: "Contents/Pack Out Services & Storage",
      },
    ],
    "text-area": {
      label: "Other:",
    },
  },
  {
    service: "Fire Damage",
    question: createSubNavQuestion("Fire Damage"),
    options: [
      {
        value: "fire-damage-cleanup-and-restoration",
        label: "Fire Damaage Cleanup and Restoration)",
      },
      {
        value: "smoke-damage-and-soot-removal-services",
        label: "Smoke Damage & Soot Removal Services",
      },
      {
        value: "deodorization",
        label: "Deodoriazation",
      },
      { value: "roof-tarp-board-up", label: "Roof Tarp / Board Up" },
      {
        value: "contents-pack-out-services-and-storage",
        label: "Contents/Pack Out Services & Storage",
      },
    ],
    "text-area": {
      label: "Other:",
    },
  },
  {
    service: "Construction",
    question: createSubNavQuestion("Construction"),
    options: [
      {
        value: "construction",
        label: "Construction",
      },
      {
        value: "reconstruction",
        label: "Reconstruction",
      },
      {
        value: "remodeling",
        label: "Remodeling",
      },
      { value: "post-construction-cleaning-services", label: "Post construction cleaning services" },
      {
        value: "contents-pack-out-services-and-storage",
        label: "Contents/Pack Out Services & Storage",
      },
    ],
    "text-area": {
      label: "Other:",
    },
  },
  {
    service: "Mold",
    question: createSubNavQuestion("Mold"),
    options: [
      {
        value: "mold-removal-and-remediation",
        label: "Mold Removal and Remediation",
      },
      {
        value: "attic-mold-removal",
        label: "Attic Mold Removal",
      },
      {
        value: "bathroom-mold-cleaning",
        label: "Bathroom Mold Cleaning",
      },
      { value: "air-sampling-services",
        label: "Air Sampling Services"
      },
    ],
    "text-area": {
      label: "Other:",
    },
  },
  {
    service: "Storm Damage",
    question: createSubNavQuestion("Storm Damage"),
    options: [
      {
        value: "hurrican-fire-flood-wind-hail-ice-storm-damage",
        label: "Hurricane/Fire/Flood/Wind/Hail/Ice Storm Damage",
      },
      {
        value: "emergency-roof-tarp-board-up",
        label: "Emergency Roof Tarp / Board Up",
      },
      {
        value: "roofing-birmingham-nashville-others-2026",
        label: "Roofing (Birmingham and Nashville) - all other mkts 2026",
      },
      { value: "demolition-and-reconstrcution-services",
        label: "Demolition and Reconstruction Services"
      },
      {
        value: "contents-pack-out-services-and-storage",
        label: "Contents/Pack Out Services & Storage",
      },
    ],
    "text-area": {
      label: "Other:",
    },
  },
  {
    service: "General Cleaning",
    question: createSubNavQuestion("General Cleanning"),
    options: [
      {
        value: "hvac-air-duct-air-handler",
        label: "HVAC - Air Duct Cleaning, Air Handler, etc",
      },
      {
        value: "spring-cleaning",
        label: "Spring Cleaning",
      },
      {
        value: "professional-home-cleaning",
        label: "Professional Cleaning Home for Sale",
      },
      { value: "construction-and-post-renovation-cleaning",
        label: "Construction and Post Renovation Cleaning"
      },
      {
        value: "upholsetry-and-carpet-cleaning",
        label: "Upholstery and Carpet Cleaning",
      },
      {
        value: "floors-walls-and-ceilings",
        label: "Floors, Walls and Ceilings",
      },
      {
        value: "drapes-blinds-window-treament-cleaning",
        label: "Drapes, Blinds and Window Treatment cleaning",
      },
      { value: "ordor-removal",
        label: "Odor Removal"
      },
      { value: "pet-stain-ordor-removal",
        label: "Pet Stain / Odor Removal"
      },
    ],
    "text-area": {
      label: "Other:",
    },
  },
  {
    service: "Specially Cleaning",
    question: createSubNavQuestion("Specially Cleaning"),
    options: [
      {
        value: "air-duct-hvac-cleaning",
        label: "Air Duct/HAVC Cleaning",
      },
      {
        value: "biohazard-crime-scene",
        label: "Biohazard/Crime Scene",
      },
      {
        value: "sewage-cleanup",
        label: "Sewage Cleanup",
      },
      { value: "virus-pathogen-cleaning",
        label: "Virus/Pathogen Cleaning"
      },
      {
        value: "document-restoration",
        label: "Document Restoration",
      },
      {
        value: "ordor-removal",
        label: "Ordor Removal",
      },
      {
        value: "vandalisim-graffiti",
        label: "Vandalism/Graffiti",
      },
      { value: "sewage-black-water-cleanup",
        label: "Sewage/Black Water Cleanup"
      },
    ],
    "text-area": {
      label: "Other:",
    },
  },
  {
    service: "Biohazard Cleaning",
    question: createSubNavQuestion("Biohazard Cleaning"),
    options: [
      {
        value: "biohazard-remediation",
        label: "Biohazard Remediation",
      },
      {
        value: "crime-scene-and-trauma-cleaning",
        label: "Crime Scene and Trauma Cleaning",
      },
      {
        value: "hoarding-cleanup",
        label: "Hoarding Cleanup",
      },
      { value: "rodent-infestation-cleanup",
        label: "Rodent Infestation Cleanup"
      },
      {
        value: "illicit-substance-cleanup-and-destruction",
        label: "Illicit Substance Cleanup and Destruction",
      },
      {
        value: "jail-cell-and-squad-car-remediation",
        label: "Jail Cell and Squad Car Remediation",
      },
      {
        value: "chemicals-and-residues",
        label: "Chemicals and Residues (tear gas, pepper spray, fire extinguisher, etc)",
      },
      { value: "virus-pathogens-and-covid-cleanup",
        label: "Virus, pathogens and Covid 19 cleanup"
      },
    ],
    "text-area": {
      label: "Other:",
    },
  },
] as const;
