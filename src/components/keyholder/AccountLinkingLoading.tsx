import React from "react";

interface AccountLinkingLoadingProps {
  className?: string;
}

export const AccountLinkingLoading: React.FC<AccountLinkingLoadingProps> = ({
  className = "",
}) => {
  return (
    <div className={`${className} animate-pulse`}>
      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="h-6 bg-gray-600 rounded mb-4"></div>
        <div className="h-4 bg-gray-600 rounded mb-2"></div>
        <div className="h-4 bg-gray-600 rounded w-2/3"></div>
      </div>
    </div>
  );
};

export default AccountLinkingLoading;
