import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { useValidation } from '../../../../../contexts/validation-context';
import { SurveySection } from '../../../../../types/framework.types';
import { getSectionStats } from '../../../../../utils/section-content.utils';
import { Button, SortableList } from '../../../../common';

interface SectionListProps {
    sections: SurveySection[];
    selectedSectionId: string | null;
    onAddSection: () => void;
    onSelectSection: (sectionId: string) => void;
    onDeleteSection: (sectionId: string) => void;
    onReorderSections: (oldIndex: number, newIndex: number) => void;
}

export const SectionList: React.FC<SectionListProps> = ({
    sections,
    selectedSectionId,
    onAddSection,
    onSelectSection,
    onDeleteSection,
    onReorderSections
}) => {
    const { validateSection } = useValidation();
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sections</h3>
                <Button
                    size="sm"
                    onClick={onAddSection}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
            <SortableList
                items={sections}
                onReorder={onReorderSections}
                className="space-y-2"
                itemClassName="border rounded-lg cursor-pointer transition-colors"
                disabled={false}
                droppableId="sections-list"
                renderItem={(section, _isDragging) => {
                    const validation = validateSection(section as SurveySection);
                    return (
                        <div
                            className={`p-3 ${selectedSectionId === section.id
                                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : validation.isValid
                                    ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                                    : 'border-red-200 dark:border-red-600 bg-red-50 dark:bg-red-900/20 hover:border-red-300 dark:hover:border-red-500'
                                }`}
                            onClick={() => onSelectSection(section.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelectSection(section.id);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{section.title}</span>
                                    {!validation.isValid && (
                                        <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSection(section.id);
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {(() => {
                                    const sectionData = section as SurveySection;
                                    const stats = getSectionStats(sectionData);
                                    const parts: string[] = [];

                                    if (stats.totalFields > 0) {
                                        if (stats.sectionFields > 0 && stats.subsectionFields > 0) {
                                            parts.push(`${stats.totalFields} fields (${stats.sectionFields} section, ${stats.subsectionFields} in subsections)`);
                                        } else if (stats.sectionFields > 0) {
                                            parts.push(`${stats.sectionFields} fields`);
                                        } else {
                                            parts.push(`${stats.subsectionFields} fields in subsections`);
                                        }
                                    } else {
                                        parts.push('0 fields');
                                    }

                                    if (stats.subsections > 0) {
                                        parts.push(`${stats.subsections} subsection${stats.subsections !== 1 ? 's' : ''}`);
                                    }

                                    return parts.join(' • ');
                                })()}
                                {!validation.isValid && (
                                    <span className="text-red-600 dark:text-red-400 ml-2">• {validation.errors.length} issue{validation.errors.length !== 1 ? 's' : ''}</span>
                                )}
                            </div>
                        </div>
                    );
                }}
            />
        </div>
    );
};
