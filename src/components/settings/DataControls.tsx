import React, { useRef } from "react";
import {
  FaDatabase,
  FaDownload,
  FaUpload,
  FaSpinner,
} from "../../utils/iconImport";
import { Button } from "@/components/ui";
import { useDataManagement } from "../../hooks/useDataManagement";
import { useAuthState } from "../../contexts";

export const DataControls: React.FC = () => {
  const { user } = useAuthState();
  const { handleExport, handleImport, isExporting, isImporting } =
    useDataManagement(user?.uid, user?.email || undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onImportClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
      // Reset input so same file can be selected again
      e.target.value = "";
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaDatabase className="text-nightly-spring-green" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Data Controls
        </h3>
      </div>

      <div className="space-y-4">
        {/* Data Export */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Export My Data
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Download all your data in JSON format
            </div>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting || !user}
            className="bg-nightly-spring-green/20 hover:bg-nightly-spring-green/30 text-nightly-spring-green px-4 py-2 rounded font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaDownload />
            )}
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>

        {/* Data Import */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Import My Data
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Restore data from a JSON backup file
            </div>
          </div>
          <Button
            onClick={onImportClick}
            disabled={isImporting || !user}
            className="bg-nightly-aquamarine/20 hover:bg-nightly-aquamarine/30 text-nightly-aquamarine px-4 py-2 rounded font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaUpload />
            )}
            {isImporting ? "Importing..." : "Import"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        {/* Account Deletion */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div>
            <div className="text-sm font-medium text-red-400">
              Delete Account
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Permanently delete your account and all data
            </div>
          </div>
          <Button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded font-medium transition-colors">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
