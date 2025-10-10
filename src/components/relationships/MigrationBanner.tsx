import React from "react";
import { FaExclamationTriangle, FaSpinner } from "react-icons/fa";
import { Button } from "@/components/ui";

interface MigrationBannerProps {
  needsMigration: boolean;
  isLoading: boolean;
  onMigrate: () => void;
}

export const MigrationBanner: React.FC<MigrationBannerProps> = ({
  needsMigration,
  isLoading,
  onMigrate,
}) => {
  if (!needsMigration) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <FaExclamationTriangle className="text-yellow-600 mr-3 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-yellow-800 font-semibold mb-2">
            Data Migration Required
          </h3>
          <p className="text-yellow-700 text-sm mb-3">
            We've detected that you have data from the previous single-user
            system. Would you like to migrate this data to work with the new
            relationship system? This will set up a self-managed relationship
            where you can manage your own data or invite keyholders later.
          </p>
          <Button
            onClick={onMigrate}
            disabled={isLoading}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 inline-flex items-center"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Migrating...
              </>
            ) : (
              "Migrate My Data"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
