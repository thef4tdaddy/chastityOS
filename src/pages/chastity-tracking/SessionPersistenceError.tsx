import React from "react";

// Session Persistence Error Component
export const SessionPersistenceError: React.FC<{ error: string }> = ({
  error,
}) => (
  <div className="mx-4 mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
    <p className="text-sm text-red-200">
      <strong>Session Error:</strong> {error}
    </p>
  </div>
);
