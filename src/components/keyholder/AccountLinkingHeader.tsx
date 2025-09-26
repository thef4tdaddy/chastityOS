import React from "react";
import { FaLink } from "react-icons/fa";

export const AccountLinkingHeader: React.FC = () => {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-purple-300 mb-2">
        <FaLink className="inline mr-2" />
        Account Linking
      </h2>
      <p className="text-purple-400 text-sm">
        Connect with keyholders or submissives for enhanced control and
        oversight
      </p>
    </div>
  );
};

export default AccountLinkingHeader;
