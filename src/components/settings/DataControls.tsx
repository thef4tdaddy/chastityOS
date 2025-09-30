import React from "react";
import { FaDatabase, FaDownload } from "../../utils/iconImport";

export const DataControls: React.FC = () => (
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
        <button className="bg-nightly-spring-green/20 hover:bg-nightly-spring-green/30 text-nightly-spring-green px-4 py-2 rounded font-medium transition-colors flex items-center gap-2">
          <FaDownload />
          Export
        </button>
      </div>

      {/* Account Deletion */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div>
          <div className="text-sm font-medium text-red-400">Delete Account</div>
          <div className="text-xs text-nightly-celadon/70">
            Permanently delete your account and all data
          </div>
        </div>
        <button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded font-medium transition-colors">
          Delete
        </button>
      </div>
    </div>
  </div>
);
