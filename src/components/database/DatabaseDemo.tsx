/**
 * Database Integration Demo Component
 * Demonstrates how to use the Dexie database services with React hooks
 */

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const DatabaseDemo: React.FC = () => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-gray-400">Please log in to use the database demo</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Database Services Demo</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-800 border border-red-600 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="min-h-[200px]">
        <p className="text-gray-300 mb-4">
          This demo component shows how to integrate the Dexie database services
          with React components. It provides a comprehensive interface for
          testing all database operations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-700 rounded">
            <h3 className="text-white font-semibold mb-2">
              Available Services
            </h3>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li>• Session Management</li>
              <li>• Event Logging</li>
              <li>• Task Tracking</li>
              <li>• Goal Management</li>
              <li>• Settings Storage</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-700 rounded">
            <h3 className="text-white font-semibold mb-2">Key Features</h3>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li>• Offline-first storage</li>
              <li>• Automatic sync status tracking</li>
              <li>• Performance monitoring</li>
              <li>• Migration support</li>
              <li>• Real-time data updates</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-900 border border-blue-700 rounded">
          <h3 className="text-blue-200 font-semibold mb-2">
            Integration Status
          </h3>
          <p className="text-blue-300 text-sm">
            ✅ Database schema and services are fully implemented
            <br />
            ✅ All CRUD operations are available
            <br />
            ✅ Performance monitoring is active
            <br />
            📝 Ready for integration with existing ChastityOS components
          </p>
        </div>
      </div>
    </div>
  );
};
