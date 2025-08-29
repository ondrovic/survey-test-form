import { Button } from "@/components/common";
import { routes } from "@/routes";
import React from "react";
import { useParams } from "react-router-dom";
import { Analytics } from "./analytics";

export const AdminAnalyticsPage: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();

  console.log("🔍 AdminAnalyticsPage received instanceId:", instanceId);

  if (!instanceId) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50/30">
        <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
          <div className="text-center text-red-600">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p>No survey instance ID provided</p>
            <Button
              variant="outline"
              size="form"
              onClick={() =>
                (window.location.href = `${window.location.origin}/${routes.admin}`)
              }
              className="mt-4"
            >
              Back to Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50/30">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="form"
              onClick={() =>
                (window.location.href = `${window.location.origin}/${routes.admin}`)
              }
            >
              Back to Admin
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 flex-1 flex flex-col min-h-0 w-full">
          <Analytics instanceId={instanceId} />
        </div>
      </div>
    </div>
  );
};
