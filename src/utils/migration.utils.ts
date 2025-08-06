import {
  BUSINESS_FOCUS_OPTIONS,
  LICENSE_RANGES,
  MARKET_REGIONS,
  RATING_OPTIONS,
} from "../constants/form.constants";
import {
  COMMERCIAL_SERVICE_LINES,
  INDUSTRIES,
  RESIDENTIAL_SERVICE_LINES,
} from "../constants/services.constants";
import { SurveyConfig } from "../types/survey.types";

export const createDefaultSurveyConfig = (): SurveyConfig => {
  const now = new Date().toISOString();

  return {
    id: "default-service-line-survey",
    title: "Service Line Survey",
    description:
      "Survey to gather information about service line preferences and business focus",
    sections: [
      // Personal Info Section
      {
        id: "personal-info",
        title: "Personal Information",
        type: "personal_info",
        order: 1,
        fields: [
          {
            id: "fullName",
            label: "Full Name",
            type: "text",
            required: true,
            placeholder: "Enter your full name",
            validation: [
              { type: "required", message: "Full name is required" },
            ],
          },
          {
            id: "email",
            label: "Email Address",
            type: "email",
            required: true,
            placeholder: "Enter your email address",
            validation: [
              { type: "required", message: "Email is required" },
              { type: "email", message: "Please enter a valid email address" },
            ],
          },
          {
            id: "franchise",
            label: "Franchise",
            type: "text",
            required: true,
            placeholder: "Enter your franchise name",
            validation: [
              { type: "required", message: "Franchise is required" },
            ],
          },
        ],
      },

      // Business Info Section
      {
        id: "business-info",
        title: "Business Information",
        type: "business_info",
        order: 2,
        fields: [
          {
            id: "marketRegions",
            label: "Market Regions",
            type: "multiselect",
            required: true,
            options: MARKET_REGIONS.map((region) => ({
              value: region,
              label: region,
            })),
            validation: [
              {
                type: "required",
                message: "Please select at least one market region",
              },
            ],
          },
          {
            id: "otherMarket",
            label: "Other Market (if applicable)",
            type: "text",
            required: false,
            placeholder: "Enter other market if not listed above",
          },
          {
            id: "numberOfLicenses",
            label: "Number of Licenses",
            type: "radio",
            required: true,
            options: LICENSE_RANGES.map((range) => ({
              value: range.value,
              label: range.label,
            })),
            validation: [
              { type: "required", message: "Please select number of licenses" },
            ],
          },
          {
            id: "businessFocus",
            label: "Business Focus",
            type: "radio",
            required: true,
            options: BUSINESS_FOCUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
            validation: [
              { type: "required", message: "Please select business focus" },
            ],
          },
        ],
      },

      // Residential Services Section
      {
        id: "residential-services",
        title: "Residential Services",
        type: "rating_section",
        order: 3,
        description: "Rate the importance of each residential service line",
        fields: RESIDENTIAL_SERVICE_LINES.flatMap((category, categoryIndex) =>
          category.items.map((item, itemIndex) => ({
            id: `residential_${categoryIndex}_${itemIndex}`,
            label: item,
            type: "rating",
            required: true,
            options: RATING_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              color: option.color,
            })),
            metadata: {
              category: category.heading,
              categoryIndex,
              itemIndex,
              section: "residential",
            },
          }))
        ),
      },

      // Commercial Services Section
      {
        id: "commercial-services",
        title: "Commercial Services",
        type: "rating_section",
        order: 4,
        description: "Rate the importance of each commercial service line",
        fields: COMMERCIAL_SERVICE_LINES.flatMap((category, categoryIndex) =>
          category.items.map((item, itemIndex) => ({
            id: `commercial_${categoryIndex}_${itemIndex}`,
            label: item,
            type: "rating",
            required: true,
            options: RATING_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              color: option.color,
            })),
            metadata: {
              category: category.heading,
              categoryIndex,
              itemIndex,
              section: "commercial",
            },
          }))
        ),
      },

      // Industries Section
      {
        id: "industries",
        title: "Industries",
        type: "rating_section",
        order: 5,
        description: "Rate the importance of each industry focus",
        fields: INDUSTRIES.flatMap((category, categoryIndex) =>
          category.items.map((item, itemIndex) => ({
            id: `industries_${categoryIndex}_${itemIndex}`,
            label: item,
            type: "rating",
            required: true,
            options: RATING_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              color: option.color,
            })),
            metadata: {
              category: category.heading,
              categoryIndex,
              itemIndex,
              section: "industries",
            },
          }))
        ),
      },

      // Additional Notes Sections
      {
        id: "residential-notes",
        title: "Residential Services Additional Notes",
        type: "text_input",
        order: 6,
        fields: [
          {
            id: "residentialAdditionalNotes",
            label: "Additional Notes for Residential Services",
            type: "textarea",
            required: false,
            placeholder:
              "Any additional comments about residential services...",
          },
        ],
      },
      {
        id: "commercial-notes",
        title: "Commercial Services Additional Notes",
        type: "text_input",
        order: 7,
        fields: [
          {
            id: "commercialAdditionalNotes",
            label: "Additional Notes for Commercial Services",
            type: "textarea",
            required: false,
            placeholder: "Any additional comments about commercial services...",
          },
        ],
      },
      {
        id: "industries-notes",
        title: "Industries Additional Notes",
        type: "text_input",
        order: 8,
        fields: [
          {
            id: "industriesAdditionalNotes",
            label: "Additional Notes for Industries",
            type: "textarea",
            required: false,
            placeholder: "Any additional comments about industries...",
          },
        ],
      },
    ],
    metadata: {
      createdBy: "system",
      createdAt: now,
      updatedAt: now,
      version: "1.0.0",
      isActive: true,
    },
  };
};

export const migrateExistingData = async (firestoreHelpers: any) => {
  try {
    console.log("Starting migration...");

    // Get existing survey configs
    const existingConfigs = await firestoreHelpers.getSurveyConfigs();
    const defaultConfig = existingConfigs.find(
      (config) => config.id === "default-service-line-survey"
    );

    // Check if default rating scales exist
    const existingScales = await firestoreHelpers.getRatingScales();
    const defaultScale = existingScales.find(
      (scale) => scale.id === "default-rating-scale"
    );

    // Consolidated migration debug info
    console.log("Migration Debug Info:", {
      existingConfigs: existingConfigs.length,
      defaultConfigFound: !!defaultConfig,
      defaultConfigId: defaultConfig?.id,
      existingScales: existingScales.length,
      defaultScaleFound: !!defaultScale,
      defaultScaleId: defaultScale?.id,
      allScaleIds: existingScales.map((s) => s.id),
      timestamp: new Date().toISOString(),
    });

    // Note: Default rating scale creation has been removed
    // Users should create their own rating scales through the admin interface
    console.log(`Found ${existingScales.length} existing rating scales`);

    if (!defaultConfig) {
      // Create default survey config
      const config = createDefaultSurveyConfig();
      await firestoreHelpers.addSurveyConfig(config);

      // Create default survey instance
      const instance = {
        configId: config.id,
        title: config.title,
        description: config.description,
        isActive: true,
        metadata: {
          createdBy: "system",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      await firestoreHelpers.addSurveyInstance(instance);

      console.log("Migration Completed:", {
        configCreated: true,
        instanceCreated: true,
        configId: config.id,
        instanceConfigId: instance.configId,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.log("Migration Skipped:", {
        reason: "Default config already exists",
        configId: defaultConfig.id,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
};
