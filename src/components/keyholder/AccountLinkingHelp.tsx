import React from "react";
import { FaExclamationTriangle } from "../../utils/iconImport";

export const AccountLinkingHelp: React.FC = () => {
  return (
    <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
      <div className="flex items-start">
        <FaExclamationTriangle className="text-blue-400 mt-1 mr-2 flex-shrink-0" />
        <div className="text-sm text-blue-300">
          <h4 className="font-medium mb-1">About Account Linking</h4>
          <ul className="space-y-1 text-xs text-blue-200">
            <li>
              • Submissives can create invite codes for keyholders to accept
            </li>
            <li>
              • Only one active keyholder per submissive currently supported
            </li>
            <li>• Invite codes expire after 24 hours</li>
            <li>• Either party can end the relationship at any time</li>
            <li>• Submissives control what permissions keyholders have</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccountLinkingHelp;
