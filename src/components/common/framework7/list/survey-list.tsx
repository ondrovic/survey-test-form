import React from 'react';

interface SurveyListProps {
  title: string;
  emptyMessage: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export const SurveyList: React.FC<SurveyListProps> = ({
  title,
  emptyMessage,
  children,
  headerActions
}) => {
  const hasItems = React.Children.count(children) > 0;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          {headerActions && (
            <div>{headerActions}</div>
          )}
        </div>
      </div>
      <div className="p-6">
        {!hasItems ? (
          <p className="text-gray-500 text-center py-8">{emptyMessage}</p>
        ) : (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};