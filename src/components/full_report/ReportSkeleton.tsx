import React from "react";
import { Card } from "@/components/ui";

// Skeleton for statistics section
export const StatsSkeleton: React.FC = () => (
  <Card variant="glass" className="mb-4 sm:mb-6 animate-fade-in">
    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/10 rounded animate-pulse" />
      <div className="h-5 sm:h-6 w-24 sm:w-32 bg-white/10 rounded animate-pulse" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="report-skeleton-stat" />
      ))}
    </div>
  </Card>
);

// Skeleton for current status section
export const StatusSkeleton: React.FC = () => (
  <Card variant="glass" className="mb-4 sm:mb-6 animate-fade-in">
    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/10 rounded animate-pulse" />
      <div className="h-5 sm:h-6 w-32 sm:w-40 bg-white/10 rounded animate-pulse" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <div className="space-y-3 sm:space-y-4">
        <div className="h-20 sm:h-24 bg-white/10 rounded animate-pulse" />
        <div className="h-12 sm:h-16 bg-white/10 rounded animate-pulse" />
      </div>
      <div className="space-y-2 sm:space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-7 sm:h-8 bg-white/10 rounded animate-pulse" />
        ))}
      </div>
    </div>
  </Card>
);

// Skeleton for session history section
export const SessionHistorySkeleton: React.FC = () => (
  <Card variant="glass" className="mb-4 sm:mb-6 animate-fade-in">
    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/10 rounded animate-pulse" />
      <div className="h-5 sm:h-6 w-32 sm:w-40 bg-white/10 rounded animate-pulse" />
    </div>
    <div className="space-y-2 sm:space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="report-skeleton" />
      ))}
    </div>
  </Card>
);

// Combined skeleton for full report page
export const FullReportSkeleton: React.FC = () => (
  <div className="text-nightly-spring-green">
    <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <StatusSkeleton />
      <StatsSkeleton />
      <SessionHistorySkeleton />
    </div>
  </div>
);
