import { Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { SurveySection } from '../../../types/survey.types';
import { Button, SortableList } from '../../common';

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
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Sections</h3>
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
                itemClassName="p-3 border rounded-lg cursor-pointer transition-colors"
                renderItem={(section, _isDragging) => (
                    <div
                        className={`${selectedSectionId === section.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                        onClick={() => onSelectSection(section.id)}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{section.title}</span>
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
                        <div className="text-sm text-gray-500 mt-1">
                            {section.fields.length} fields
                        </div>
                    </div>
                )}
            />
        </div>
    );
};
