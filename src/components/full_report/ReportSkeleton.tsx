import React from "react";
import { Card } from "@/components/ui";

// Skeleton for statistics section
export const StatsSkeleton: React.FC = () => (
  <Card variant="glass" className="mb-6 animate-fade-in">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-6 h-6 bg-white/10 rounded animate-pulse" />
      <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="report-skeleton-stat" />
      ))}
    </div>
  </Card>
);

// Skeleton for current status section
export const StatusSkeleton: React.FC = () => (
  <Card variant="glass" className="mb-6 animate-fade-in">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-6 h-6 bg-white/10 rounded animate-pulse" />
      <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="h-24 bg-white/10 rounded animate-pulse" />
        <div className="h-16 bg-white/10 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-white/10 rounded animate-pulse" />
        ))}
      </div>
    </div>
  </Card>
);

// Skeleton for session history section
export const SessionHistorySkeleton: React.FC = () => (
  <Card variant="glass" className="mb-6 animate-fade-in">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-6 h-6 bg-white/10 rounded animate-pulse" />
      <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
    </div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="report-skeleton" />
      ))}
    </div>
  </Card>
);

// Combined skeleton for full report page
export const FullReportSkeleton: React.FC = () => (
  <div className="text-nightly-spring-green">
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <StatusSkeleton />
      <StatsSkeleton />
      <SessionHistorySkeleton />
    </div>
  </div>
);
