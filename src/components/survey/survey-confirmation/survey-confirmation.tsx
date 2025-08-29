import React from "react";
import { Button } from "../../common";

interface SurveyConfirmationProps {
  surveyTitle?: string;
}

export const SurveyConfirmation: React.FC<SurveyConfirmationProps> = ({
  surveyTitle,
}) => {
  return (
    <div className="min-h-screen bg-blue-50/30 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Thank You!</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Your survey response has been submitted successfully.
          </p>
          {surveyTitle && (
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Survey: <span className="font-medium">{surveyTitle}</span>
            </p>
          )}
          <p className="text-gray-600 dark:text-gray-300">
            We appreciate your time and feedback. Your response will help us
            improve our services.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => window.close()}
            className="px-6 py-3"
          >
            Close Window
          </Button>
        </div>
      </div>
    </div>
  );
};
