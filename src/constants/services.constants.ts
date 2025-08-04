export interface ServiceLineCategoryData {
  heading: string;
  items: string[];
}

// each of theses need to map to fields residential_
export const RESIDENTIAL_SERVICE_LINES: ServiceLineCategoryData[] = [
  {
    heading: "Emergency Response",
    items: ["Emergency Response"],
  },
  {
    heading: "Water Damage",
    items: [
      "Water Extraction and Clean Up (Drying, Dehumidification)",
      "Water Damage Repair & Restoration",
      "Flood Damage Cleanup & Restoration",
      "Basement Flood Cleanup",
    ],
  },
  {
    heading: "Fire Damage",
    items: [
      "Fire Damage Cleanup & Restoration",
      "Smoke Damage & Soot Removal Services",
      "Deodorization",
      "Roof Tarp / Board Up",
      "Roofing (Birmingham & Nasvhille) - all other markets 2026",
    ],
  },
  {
    heading: "Construction",
    items: [
      "Construction, Remodeling, Restoration",
      "Home Contractor",
      "Post construction cleaning services",
    ],
  },
  {
    heading: "Mold Damage",
    items: [
      "Mold Removal & Remediation",
      "Attic Mold Removal",
      "Bathroom Mold Cleaning",
      "Air Sampling Services",
      "Crawlspace Encapsulation",
    ],
  },
  {
    heading: "Storm Damage Recovery",
    items: [
      "Emergency Roof Tarp / Board Up",
      "Demolition & Reconstruction Services",
    ],
  },
  {
    heading: "Contents",
    items: ["Pack Out Services & Storage"],
  },
  {
    heading: "Biohazard Cleaning Services",
    items: [
      "Biohazard Remediation",
      "Crime Scene, Trauma, Death Cleaning",
      "Hoarding Cleanup",
      "Rodent Infestation Cleanup",
      "Illicit Substance Cleanup & Destruction (Narcotics Remediation)",
      "Chemical & Residues (tear gas, pepper spray, fire extinguisher, fingerprint dust, etc.)",
      "Virus, pathogens & Covid 19 Cleanup",
    ],
  },
  {
    heading: "Sewage & Black Water",
    items: ["Sewage & Black Water"],
  },
  {
    heading: "Specialty Cleaning",
    items: [
      "Document Restoration",
      "Vandalism & Graffiti Cleanup",
      "Asbestos & Lead Paint Abatement",
      "Crawlspace Encapsulation",
    ],
  },
  {
    heading: "General Cleaning",
    items: [
      "Air Duct Cleaning",
      "Spring Cleaning",
      "Professional Cleaning Home for Sale",
      "Construction & Post Renovation Cleaning",
      "Upholstery & Carpet Cleaning",
      "Floors, Walls & Ceilings",
      "Drapes, Blinds & Window Treatment Cleaning",
      "Odor Removal",
      "Pet Stain / Odor Removal",
    ],
  },
];

// each of theses need to map to fields commercial_
export const COMMERCIAL_SERVICE_LINES: ServiceLineCategoryData[] = [
  {
    heading: "Emergency Response",
    items: ["Emergency Readiness Plan"],
  },
  {
    heading: "Water Damage",
    items: [
      "Water Extraction and Clean Up (Drying, Dehumidification)",
      "Water Damage Repair & Restoration",
      "Flood Damage Cleanup & Restoration",
    ],
  },
  {
    heading: "Fire Damage",
    items: [
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
      "General Contracting & Reconstruction",
      "Construction, Remodeling, Restoration",
      "Restaurants, Hotels, Motels, Retail, Manufacturing, Industrial Complexes, Government & Military Buildings",
      "Commercial Large Loss",
      "Post Construction Cleaning Services",
    ],
  },
  {
    heading: "Mold Damage",
    items: ["Mold Removal & Remediation"],
  },
  {
    heading: "Storm Damage Recovery",
    items: [
      "Roof Tarp / Board Up",
      "Perimeter Fencing",
      "Building Shrink Wrap",
      "Emergency Security Personnel",
      "Demolition & Reconstruction Services",
    ],
  },
  {
    heading: "Contents",
    items: ["Pack Out Services & Storage"],
  },
  {
    heading: "Biohazard Cleaning Services",
    items: [
      "Biohazard Remediation",
      "Crime Scene, Trauma, Death Cleaning",
      "Hoarding Cleanup",
      "Rodent Infestation Cleanup",
      "Illicit Substance Cleanup & Destruction (Narcotics Remediation)",
      "Jail Cell & Squad Car Remediation",
      "Chemical & Residues (tear gas, pepper spray, fire extinguisher, fingerprint dust, etc.)",
      "Virus, pathogens & Covid 19 Cleanup",
    ],
  },
  {
    heading: "Sewage & Black Water",
    items: ["Sewage & Black Water"],
  },
  {
    heading: "Specialty Cleaning",
    items: [
      "Document Restoration",
      "Vandalism & Graffiti Cleanup",
      "Environmental Services",
      "Asbestos & Lead Paint Abatement",
      "Corrosion Control",
      "Electronic Restoration",
      "Ultrasonic Cleaning",
      "Semiconductor Decontamination & Decommissioning",
    ],
  },
  {
    heading: "General Cleaning",
    items: [
      "Commercial Cleaning & Janitorial Services",
      "Air Duct Cleaning",
      "Odor Removal",
      "Construction & Post Renovation Cleaning",
      "Upholstery & Carpet Cleaning",
      "Floors, Walls & Ceilings",
      "Drapes, Blinds & Window Treatment Cleaning",
    ],
  },
];

// each of theses need to map to fields industries_
export const INDUSTRIES: ServiceLineCategoryData[] = [
  {
    heading: "",
    items: [
     "Commerical Large Loss",
     "Education",
     "Energy & Chemical Facilities",
     "Entertainment, Arenas",
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
