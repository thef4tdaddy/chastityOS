/**
 * Data Management Hook
 * Provides export/import functionality for user data
 */
import { useState, useCallback } from "react";
import {
  exportUserData,
  downloadDataAsJSON,
  importUserData,
} from "@/services/dataManagement";
import { useToast } from "@/contexts";
import { serviceLogger } from "@/utils/logging";
import { useQueryClient } from "@tanstack/react-query";

const logger = serviceLogger("useDataManagement");

export function useDataManagement(userId?: string, userEmail?: string) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();
  const queryClient = useQueryClient();

  const handleExport = useCallback(async () => {
    if (!userId) {
      showError("User not authenticated");
      return;
    }

    setIsExporting(true);
    try {
      const jsonData = await exportUserData(userId, userEmail);
      downloadDataAsJSON(jsonData, userId);
      showSuccess("Data exported successfully!");
      logger.info("Data export completed", { userId });
    } catch (error) {
      logger.error("Export failed", { error, userId });
      showError("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [userId, userEmail, showSuccess, showError]);

  const handleImport = useCallback(
    async (file: File) => {
      if (!userId) {
        showError("User not authenticated");
        return;
      }

      if (!file) {
        showError("No file selected");
        return;
      }

      setIsImporting(true);
      try {
        await importUserData(file, userId);
        showSuccess("Data imported successfully! Reloading...");
        logger.info("Data import completed", { userId });

        // Invalidate all queries to refetch fresh data
        queryClient.invalidateQueries();

        // Reload page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        logger.error("Import failed", { error, userId });
        showError(
          `Failed to import data: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsExporting(false);
      }
    },
    [userId, showSuccess, showError, showInfo, queryClient],
  );

  return {
    handleExport,
    handleImport,
    isExporting,
    isImporting,
  };
}
