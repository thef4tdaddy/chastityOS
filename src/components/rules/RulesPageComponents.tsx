import React from "react";
import { FaInfo, FaBook } from "../../utils/iconImport";

// Info Banner Component
export const RulesInfoBanner: React.FC = () => (
  <div className="bg-nightly-aquamarine/10 border border-nightly-aquamarine/20 rounded-lg p-4 mb-6">
    <div className="flex items-start gap-3">
      <FaInfo className="text-nightly-aquamarine mt-1" />
      <div>
        <h3 className="font-medium text-nightly-honeydew mb-1">About Rules</h3>
        <p className="text-sm text-nightly-celadon">
          Rules define the expectations and consequences for your chastity
          relationship. Both submissives and keyholders can create rules, but
          only active rules are enforced. Use markdown formatting for better
          organization.
        </p>
      </div>
    </div>
  </div>
);

// Empty State Component
export const RulesEmptyState: React.FC<{
  filter: "all" | "active" | "inactive";
}> = ({ filter }) => (
  <div className="text-center py-8">
    <FaBook className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
    <div className="text-nightly-celadon">
      No {filter === "all" ? "rules" : filter + " rules"} found
    </div>
    <div className="text-sm text-nightly-celadon/70">
      {filter === "all"
        ? "Create your first rule to get started"
        : `Switch to 'All' to see other rules`}
    </div>
  </div>
);
