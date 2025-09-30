import React from "react";

interface RelationshipsHelpProps {
  needsMigration?: boolean;
}

export const RelationshipsHelp: React.FC<RelationshipsHelpProps> = ({ 
  needsMigration = false 
}) => {
  return (
    <div className="max-w-4xl mx-auto mt-12 p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          How Relationships Work
        </h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              For Submissives:
            </h3>
            <ul className="space-y-1">
              <li>• Send requests to keyholders</li>
              <li>• Share your chastity sessions and progress</li>
              <li>• Receive tasks and assignments</li>
              <li>• Get approval for session changes</li>
              <li>• Log events and milestones</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              For Keyholders:
            </h3>
            <ul className="space-y-1">
              <li>• Accept requests from submissives</li>
              <li>• Monitor their chastity progress</li>
              <li>• Create and approve tasks</li>
              <li>• Control session permissions</li>
              <li>• Set goals and requirements</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">
            Privacy & Security
          </h3>
          <p className="text-blue-800 text-sm">
            All relationship data is encrypted and only visible to the
            participants. You can end relationships at any time, and your
            data remains under your control.
          </p>
        </div>

        {needsMigration && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">
              Data Migration
            </h3>
            <p className="text-yellow-800 text-sm">
              We've detected existing chastity data. Use the migration
              feature above to convert your data to the new relationship
              system. This creates a self-managed profile that you can later
              share with a keyholder.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};