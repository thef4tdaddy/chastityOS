import React from "react";
import { FaSpinner } from "@/utils/iconImport";

// Loading Component - memoized to prevent re-renders
export const AdminLoadingDisplay = React.memo(() => (
  <div
    className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6"
    role="status"
    aria-live="polite"
  >
    <div className="flex items-center justify-center py-8">
      <FaSpinner
        className="animate-spin text-2xl text-nightly-aquamarine"
        aria-hidden="true"
      />
      <span className="ml-3 text-nightly-celadon">
        Loading admin dashboard...
      </span>
    </div>
  </div>
));
AdminLoadingDisplay.displayName = "AdminLoadingDisplay";
