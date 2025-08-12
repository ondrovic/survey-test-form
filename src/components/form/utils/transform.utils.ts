import { SurveyConfig, SurveyField, SurveySection } from '@/types/framework.types';

export const createDescriptiveFieldId = (section: SurveySection, field: SurveyField): string => {
  const sectionSlug = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const fieldSlug = field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `${sectionSlug}_${fieldSlug}`;
};

export const transformFormStateToDescriptiveIds = (
  formState: Record<string, any>,
  config: SurveyConfig
): Record<string, any> => {
  const transformedResponses: Record<string, any> = {};

  config.sections.forEach((section) => {
    // Section-level fields
    section.fields.forEach((field) => {
      const descriptiveId = createDescriptiveFieldId(section, field);
      if (formState[field.id] !== undefined) {
        transformedResponses[descriptiveId] = formState[field.id];
      }
    });

    // Subsection fields
    section.subsections?.forEach((subsection) => {
      subsection.fields.forEach((field) => {
        const descriptiveId = createDescriptiveFieldId(section, field);
        if (formState[field.id] !== undefined) {
          transformedResponses[descriptiveId] = formState[field.id];
        }
      });
    });
  });

  return transformedResponses;
};
