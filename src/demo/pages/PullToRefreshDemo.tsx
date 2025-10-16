import React from "react";
import { PullToRefresh } from "../../components/mobile";

interface PullToRefreshDemoProps {
  refreshCount: number;
  onRefresh: () => Promise<void>;
}

export const PullToRefreshDemo: React.FC<PullToRefreshDemoProps> = ({
  refreshCount,
  onRefresh,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-fluid-lg font-semibold">Pull to Refresh</h2>
      <PullToRefresh onRefresh={onRefresh} className="h-32 overflow-auto">
        <div className="p-4 text-center">
          <p>Pull down to refresh</p>
          <p className="text-sm text-gray-400 mt-2">
            Refreshed {refreshCount} times
          </p>
        </div>
      </PullToRefresh>
    </div>
  );
};
