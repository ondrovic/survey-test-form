import { SurveyData } from "../types/survey.types";

// Types for dashboard data processing
export interface ServiceData {
  service: string;
  originalServiceName: string;
  cleanDisplayName: string;
  category: string;
  categories: string[];
  serviceLineHeadings: string[];
  high: number;
  medium: number;
  low: number;
  notImportant: number;
  total: number;
}

export interface SubNavData {
  category: string;
  totalResponses: number;
  optionCounts: Record<string, number>;
  optionPercentages: Record<string, number>;
  otherTexts: string[];
  topOptions: string[];
}

export interface AdditionalNotesData {
  category: string;
  totalNotes: number;
  notes: string[];
  wordCount: number;
  avgWordsPerNote: number;
  commonWords: Record<string, number>;
  topWords: string[];
}

export interface NavigationData {
  layout: string;
  count: number;
  percentage: number;
  totalResponses: number;
}

// Service line mappings from the HTML dashboard
const SERVICE_LINE_MAPPINGS = {
  residential: [
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
  ],
  commercial: [
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
        "Commerical Disinfection",
        "Marine & Offshore Restoration (Thermographic Inspection, Contamination Level Assessment, HCL Testing, Corrosion Control, Machinery and Electronics Restoration, Generator Cleaning, Inventory of Hazardous Materials)",
        "Semiconductor Decontamination & Decommissioning (Parts Harvesting, Reclamation and Recycling, Consignment Services, Destruction Services)",
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
  ],
  industries: [
    {
      heading: "Commerical Large Loss",
      items: ["Commerical Large Loss"],
    },
    {
      heading: "Education",
      items: ["Education"],
    },
    {
      heading: "Energy & Chemical Facilities",
      items: ["Energy & Chemical Facilities"],
    },
    {
      heading: "Entertainment, Arenas",
      items: ["Entertainment, Arenas"],
    },
    {
      heading: "Government & Public Entities",
      items: ["Government & Public Entities"],
    },
    {
      heading: "Healthcare & Hospitals",
      items: ["Healthcare & Hospitals"],
    },
    {
      heading: "Hospitality, Hotel & Restaurant",
      items: ["Hospitality, Hotel & Restaurant"],
    },
    {
      heading: "Insurance",
      items: ["Insurance"],
    },
    {
      heading: "Manufacturing & Distribution",
      items: ["Manufacturing & Distribution"],
    },
    {
      heading: "Maritime",
      items: ["Maritime"],
    },
    {
      heading: "Multi-Family Housing",
      items: ["Multi-Family Housing"],
    },
    {
      heading: "Pharmaceutical Manufacturing",
      items: ["Pharmaceutical Manufacturing"],
    },
    {
      heading: "Religious Institutions",
      items: ["Religious Institutions"],
    },
    {
      heading: "Retail",
      items: ["Retail"],
    },
    {
      heading: "Senior Living & Assisted Living Facilities",
      items: ["Senior Living & Assisted Living Facilities"],
    },
    {
      heading: "Technology & Data Centers",
      items: ["Technology & Data Centers"],
    },
  ],
};

/**
 * Process survey data from Firebase into dashboard format
 */
export function processSurveyData(surveys: SurveyData[]): {
  serviceData: ServiceData[];
  subNavData: SubNavData[];
  additionalNotesData: AdditionalNotesData[];
  navigationData: NavigationData[];
  totalResponses: number;
} {
  const serviceMap = new Map<string, ServiceData>();
  const serviceTypes = new Set<string>();
  const subNavData: SubNavData[] = [];
  const additionalNotesData: AdditionalNotesData[] = [];
  const navigationData: NavigationData[] = [];

  // Process each survey
  surveys.forEach((survey) => {
    // Process service line ratings
    processServiceLineSection(
      survey.serviceLines.residentialServices,
      "Residential",
      serviceMap,
      serviceTypes
    );
    processServiceLineSection(
      survey.serviceLines.commercialServices,
      "Commercial",
      serviceMap,
      serviceTypes
    );
    processServiceLineSection(
      survey.serviceLines.industries,
      "Industries",
      serviceMap,
      serviceTypes
    );

    // Process sub-navigation data
    processSubNavData(survey.businessInfo.subNavQuestions, subNavData);

    // Process additional notes
    processAdditionalNotes(survey.serviceLines, additionalNotesData);

    // Process navigation layout
    if (survey.businessInfo.navigationLayout) {
      const existingLayout = navigationData.find(
        (n) => n.layout === survey.businessInfo.navigationLayout
      );
      if (existingLayout) {
        existingLayout.count++;
      } else {
        navigationData.push({
          layout: survey.businessInfo.navigationLayout,
          count: 1,
          percentage: 0,
          totalResponses: surveys.length,
        });
      }
    }
  });

  // Calculate percentages for navigation data
  navigationData.forEach((nav) => {
    nav.percentage = Math.round((nav.count / surveys.length) * 100);
  });

  // Calculate percentages for sub-nav data
  subNavData.forEach((subNav) => {
    Object.keys(subNav.optionCounts).forEach((option) => {
      subNav.optionPercentages[option] = Math.round(
        (subNav.optionCounts[option] / subNav.totalResponses) * 100
      );
    });
  });

  // Convert service map to array and sort by high priority
  const serviceData = Array.from(serviceMap.values()).sort(
    (a, b) => b.high - a.high
  );

  return {
    serviceData,
    subNavData,
    additionalNotesData,
    navigationData: navigationData.sort((a, b) => b.count - a.count),
    totalResponses: surveys.length,
  };
}

function processServiceLineSection(
  categories: any[],
  categoryType: string,
  serviceMap: Map<string, ServiceData>,
  serviceTypes: Set<string>
) {
  categories.forEach((category) => {
    category.items.forEach((item: any) => {
      const serviceName = item.name;
      const rating = item.rating;

      if (!serviceName || !rating) return;

      // Find matching service line heading
      let serviceLineHeading = "Other";
      const categoryKey =
        categoryType.toLowerCase() as keyof typeof SERVICE_LINE_MAPPINGS;

      if (SERVICE_LINE_MAPPINGS[categoryKey]) {
        for (const serviceLine of SERVICE_LINE_MAPPINGS[categoryKey]) {
          if (
            serviceLine.items.some(
              (serviceItem) =>
                serviceName.includes(serviceItem) ||
                serviceItem.includes(serviceName) ||
                serviceName.toLowerCase().includes(serviceItem.toLowerCase()) ||
                serviceItem.toLowerCase().includes(serviceName.toLowerCase())
            )
          ) {
            serviceLineHeading = serviceLine.heading;
            break;
          }
        }
      }

      // Add to service types (but not industries)
      if (serviceLineHeading !== "Other" && categoryType !== "Industries") {
        const industryNames = [
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
        ];

        if (!industryNames.includes(serviceLineHeading)) {
          serviceTypes.add(serviceLineHeading);
        }
      }

      // Create clean display name
      let cleanDisplayName = serviceName;
      if (serviceLineHeading !== "Other") {
        const headingRegex = new RegExp(`^${serviceLineHeading}\\s+`, "i");
        cleanDisplayName = serviceName.replace(headingRegex, "").trim();
        if (!cleanDisplayName || cleanDisplayName.length < 3) {
          cleanDisplayName = serviceName;
        }
      }

      // Handle duplicates across categories
      if (serviceMap.has(serviceName)) {
        const existing = serviceMap.get(serviceName)!;
        const totalCombined = existing.total + 1;

        // Update counts based on rating
        const highCount = (existing.high * existing.total) / 100;
        const mediumCount = (existing.medium * existing.total) / 100;
        const lowCount = (existing.low * existing.total) / 100;
        const notImportantCount =
          (existing.notImportant * existing.total) / 100;

        const newHighCount = rating === "High" ? highCount + 1 : highCount;
        const newMediumCount =
          rating === "Medium" ? mediumCount + 1 : mediumCount;
        const newLowCount = rating === "Low" ? lowCount + 1 : lowCount;
        const newNotImportantCount =
          rating === "Not Important"
            ? notImportantCount + 1
            : notImportantCount;

        existing.high =
          Math.round((newHighCount / totalCombined) * 100 * 100) / 100;
        existing.medium =
          Math.round((newMediumCount / totalCombined) * 100 * 100) / 100;
        existing.low =
          Math.round((newLowCount / totalCombined) * 100 * 100) / 100;
        existing.notImportant =
          Math.round((newNotImportantCount / totalCombined) * 100 * 100) / 100;
        existing.total = totalCombined;

        if (!existing.categories.includes(categoryType)) {
          existing.categories.push(categoryType);
        }
        if (!existing.serviceLineHeadings.includes(serviceLineHeading)) {
          existing.serviceLineHeadings.push(serviceLineHeading);
        }
      } else {
        // New service
        const counts = {
          high: rating === "High" ? 1 : 0,
          medium: rating === "Medium" ? 1 : 0,
          low: rating === "Low" ? 1 : 0,
          notImportant: rating === "Not Important" ? 1 : 0,
        };

        serviceMap.set(serviceName, {
          service: serviceName,
          originalServiceName: serviceName,
          cleanDisplayName,
          category: categoryType,
          categories: [categoryType],
          serviceLineHeadings: [serviceLineHeading],
          high: counts.high * 100,
          medium: counts.medium * 100,
          low: counts.low * 100,
          notImportant: counts.notImportant * 100,
          total: 1,
        });
      }
    });
  });
}

function processSubNavData(
  subNavQuestions: Record<string, string[]>,
  subNavData: SubNavData[]
) {
  Object.entries(subNavQuestions).forEach(([category, selectedOptions]) => {
    if (!selectedOptions || selectedOptions.length === 0) return;

    let categoryData = subNavData.find((s) => s.category === category);
    if (!categoryData) {
      categoryData = {
        category,
        totalResponses: 0,
        optionCounts: {},
        optionPercentages: {},
        otherTexts: [],
        topOptions: [],
      };
      subNavData.push(categoryData);
    }

    categoryData.totalResponses++;
    selectedOptions.forEach((option) => {
      if (categoryData) {
        categoryData.optionCounts[option] =
          (categoryData.optionCounts[option] || 0) + 1;
      }
    });
  });
}

function processAdditionalNotes(
  serviceLines: any,
  additionalNotesData: AdditionalNotesData[]
) {
  const notesCategories = [
    { key: "residentialAdditionalNotes", category: "Residential" },
    { key: "commercialAdditionalNotes", category: "Commercial" },
    { key: "industriesAdditionalNotes", category: "Industries" },
  ];

  notesCategories.forEach(({ key, category }) => {
    const notes = serviceLines[key];
    if (!notes || !notes.trim()) return;

    let categoryData = additionalNotesData.find((n) => n.category === category);
    if (!categoryData) {
      categoryData = {
        category,
        totalNotes: 0,
        notes: [],
        wordCount: 0,
        avgWordsPerNote: 0,
        commonWords: {},
        topWords: [],
      };
      additionalNotesData.push(categoryData);
    }

    categoryData.totalNotes++;
    categoryData.notes.push(notes);

    // Basic text analysis
    const words = notes
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          ![
            "this",
            "that",
            "with",
            "from",
            "they",
            "have",
            "been",
            "were",
            "said",
            "each",
            "which",
            "their",
            "time",
            "will",
            "about",
            "there",
            "could",
            "other",
            "after",
            "first",
            "well",
            "also",
            "where",
            "much",
            "some",
            "very",
            "when",
            "here",
            "just",
            "into",
            "your",
            "work",
            "life",
            "only",
            "over",
            "think",
            "back",
            "even",
            "before",
            "right",
            "being",
            "still",
            "those",
            "never",
            "every",
            "great",
            "might",
            "shall",
            "these",
            "under",
            "while",
            "should",
            "would",
            "could",
            "should",
            "would",
          ].includes(word)
      );

    words.forEach((word) => {
      if (categoryData) {
        categoryData.commonWords[word] =
          (categoryData.commonWords[word] || 0) + 1;
      }
    });
  });

  // Calculate final stats for each category
  additionalNotesData.forEach((categoryData) => {
    if (categoryData.totalNotes > 0) {
      const allText = categoryData.notes.join(" ").toLowerCase();
      categoryData.wordCount = allText.split(/\s+/).length;
      categoryData.avgWordsPerNote = Math.round(
        categoryData.wordCount / categoryData.totalNotes
      );

      categoryData.topWords = Object.keys(categoryData.commonWords)
        .sort(
          (a, b) => categoryData.commonWords[b] - categoryData.commonWords[a]
        )
        .slice(0, 10);
    }
  });
}

/**
 * Filter service data based on various criteria
 */
export function filterServiceData(
  serviceData: ServiceData[],
  filters: {
    searchTerm?: string;
    categoryFilter?: string;
    serviceFilter?: string;
    ratingFilter?: string;
    industryFilter?: string;
    subNavFilter?: string;
  }
): ServiceData[] {
  return serviceData.filter((service) => {
    const matchesSearch =
      !filters.searchTerm ||
      service.service
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase()) ||
      service.cleanDisplayName
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase());

    const matchesCategory =
      !filters.categoryFilter ||
      filters.categoryFilter === "All" ||
      service.categories.includes(filters.categoryFilter);

    const matchesService =
      !filters.serviceFilter ||
      filters.serviceFilter === "All" ||
      service.serviceLineHeadings.includes(filters.serviceFilter);

    let matchesRating = true;
    if (filters.ratingFilter && filters.ratingFilter !== "All") {
      if (filters.ratingFilter === "High") {
        matchesRating = service.high >= 67;
      } else if (filters.ratingFilter === "Medium") {
        matchesRating = service.high > 0 && service.high < 67;
      } else if (filters.ratingFilter === "Low") {
        matchesRating =
          service.high === 0 && service.medium === 0 && service.low > 0;
      } else if (filters.ratingFilter === "Not Important") {
        matchesRating = service.notImportant > 0;
      }
    }

    const matchesIndustry =
      !filters.industryFilter ||
      filters.industryFilter === "All" ||
      service.serviceLineHeadings.includes(filters.industryFilter);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesService &&
      matchesRating &&
      matchesIndustry
    );
  });
}

/**
 * Filter sub-nav data based on criteria
 */
export function filterSubNavData(
  subNavData: SubNavData[],
  filters: {
    searchTerm?: string;
    categoryFilter?: string;
    popularityFilter?: string;
  }
) {
  const allOptions: Array<{
    category: string;
    option: string;
    count: number;
    percentage: number;
    totalResponses: number;
  }> = [];

  subNavData.forEach((categoryData) => {
    Object.keys(categoryData.optionCounts).forEach((option) => {
      allOptions.push({
        category: categoryData.category,
        option: option,
        count: categoryData.optionCounts[option],
        percentage: categoryData.optionPercentages[option],
        totalResponses: categoryData.totalResponses,
      });
    });
  });

  return allOptions.filter((optionData) => {
    const matchesSearch =
      !filters.searchTerm ||
      optionData.option
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase()) ||
      optionData.category
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase());

    const matchesCategory =
      !filters.categoryFilter ||
      filters.categoryFilter === "All" ||
      optionData.category === filters.categoryFilter;

    let matchesPopularity = true;
    if (filters.popularityFilter && filters.popularityFilter !== "All") {
      const popularityLevel = getPopularityLevel(optionData.percentage);
      matchesPopularity = popularityLevel === filters.popularityFilter;
    }

    return matchesSearch && matchesCategory && matchesPopularity;
  });
}

export function getPopularityLevel(percentage: number): string {
  if (percentage >= 80) return "Very High";
  if (percentage >= 60) return "High";
  if (percentage >= 40) return "Medium";
  return "Low";
}

export function getPriorityLevel(highPercentage: number): string {
  if (highPercentage >= 67) return "High";
  if (highPercentage > 0) return "Medium";
  return "Low";
}
