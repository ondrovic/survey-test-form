import { SurveySection, SectionContent, SurveyField, SurveySubsection } from '../types/framework.types';

/**
 * Generates a content array from existing fields and subsections
 * Maintains current behavior: subsections first, then fields
 */
export const generateContentArray = (section: SurveySection): SectionContent[] => {
  const content: SectionContent[] = [];
  let order = 0;

  // Add subsections first (maintaining current behavior)
  if (section.subsections) {
    section.subsections
      .sort((a, b) => a.order - b.order)
      .forEach((subsection) => {
        content.push({
          id: `content-subsection-${subsection.id}`,
          type: 'subsection',
          order: order++,
          subsectionId: subsection.id
        });
      });
  }

  // Add fields after subsections
  if (section.fields) {
    section.fields.forEach((field) => {
      content.push({
        id: `content-field-${field.id}`,
        type: 'field',
        order: order++,
        fieldId: field.id
      });
    });
  }

  return content;
};

/**
 * Ensures a section has a content array, generating one if needed
 */
export const ensureContentArray = (section: SurveySection): SurveySection => {
  // Always regenerate if content array doesn't exist
  if (!section.content) {
    return {
      ...section,
      content: generateContentArray(section)
    };
  }
  
  // If content array exists but seems incomplete, regenerate it
  const expectedItems = (section.fields?.length || 0) + (section.subsections?.length || 0);
  if (section.content.length !== expectedItems) {
    return {
      ...section,
      content: generateContentArray(section)
    };
  }
  
  return section;
};

/**
 * Gets the ordered content for rendering (fields and subsections in proper order)
 */
export const getOrderedSectionContent = (section: SurveySection): Array<{
  type: 'field' | 'subsection';
  data: SurveyField | SurveySubsection;
  contentId: string;
  order: number;
}> => {
  const sectionWithContent = ensureContentArray(section);
  
  if (!sectionWithContent.content) {
    return [];
  }

  return sectionWithContent.content
    .sort((a, b) => a.order - b.order)
    .map((contentItem) => {
      if (contentItem.type === 'field' && contentItem.fieldId) {
        const field = section.fields.find(f => f.id === contentItem.fieldId);
        if (field) {
          return {
            type: 'field' as const,
            data: field,
            contentId: contentItem.id,
            order: contentItem.order
          };
        }
      } else if (contentItem.type === 'subsection' && contentItem.subsectionId) {
        const subsection = section.subsections.find(s => s.id === contentItem.subsectionId);
        if (subsection) {
          return {
            type: 'subsection' as const,
            data: subsection,
            contentId: contentItem.id,
            order: contentItem.order
          };
        }
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};

/**
 * Adds a new content item to a section
 */
export const addContentItem = (
  section: SurveySection,
  type: 'field' | 'subsection',
  id: string,
  position?: number
): SectionContent => {
  const sectionWithContent = ensureContentArray(section);
  const maxOrder = Math.max(...(sectionWithContent.content?.map(c => c.order) || [-1]));
  const order = position !== undefined ? position : maxOrder + 1;

  const contentItem: SectionContent = {
    id: `content-${type}-${id}`,
    type,
    order,
    ...(type === 'field' ? { fieldId: id } : { subsectionId: id })
  };

  return contentItem;
};

/**
 * Removes a content item from a section
 */
export const removeContentItem = (
  content: SectionContent[],
  type: 'field' | 'subsection',
  id: string
): SectionContent[] => {
  return content.filter(item => {
    if (type === 'field') {
      return item.fieldId !== id;
    } else {
      return item.subsectionId !== id;
    }
  });
};

/**
 * Reorders content items
 */
export const reorderContent = (
  content: SectionContent[],
  fromIndex: number,
  toIndex: number
): SectionContent[] => {
  const sortedContent = [...content].sort((a, b) => a.order - b.order);
  const [movedItem] = sortedContent.splice(fromIndex, 1);
  sortedContent.splice(toIndex, 0, movedItem);
  
  // Reassign order values
  return sortedContent.map((item, index) => ({
    ...item,
    order: index
  }));
};

/**
 * Gets comprehensive section statistics
 */
export const getSectionStats = (section: SurveySection): {
  sectionFields: number;
  subsections: number;
  subsectionFields: number;
  totalFields: number;
} => {
  const sectionFields = section.fields?.length || 0;
  const subsections = section.subsections?.length || 0;
  const subsectionFields = section.subsections?.reduce((sum, subsection) => 
    sum + (subsection.fields?.length || 0), 0) || 0;
  
  return {
    sectionFields,
    subsections,
    subsectionFields,
    totalFields: sectionFields + subsectionFields
  };
};

/**
 * Gets comprehensive survey statistics
 */
export const getSurveyStats = (sections: SurveySection[]): {
  sections: number;
  totalSectionFields: number;
  totalSubsections: number;
  totalSubsectionFields: number;
  totalFields: number;
} => {
  const stats = sections.reduce((acc, section) => {
    const sectionStats = getSectionStats(section);
    return {
      totalSectionFields: acc.totalSectionFields + sectionStats.sectionFields,
      totalSubsections: acc.totalSubsections + sectionStats.subsections,
      totalSubsectionFields: acc.totalSubsectionFields + sectionStats.subsectionFields,
      totalFields: acc.totalFields + sectionStats.totalFields
    };
  }, {
    totalSectionFields: 0,
    totalSubsections: 0,
    totalSubsectionFields: 0,
    totalFields: 0
  });

  return {
    sections: sections.length,
    ...stats
  };
};