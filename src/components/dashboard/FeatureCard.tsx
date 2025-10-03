import React from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  accentColor: "orange" | "purple";
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  accentColor,
  className,
}) => {
  const accentBarClass =
    accentColor === "orange" ? "bg-tangerine" : "bg-tekhelet";

  return (
    <div className={`glass-card glass-hover relative ${className}`}>
      {/* Accent bar at the top */}
      <div
        className={`${accentBarClass} h-3 -mx-6 -mt-6 mb-4 rounded-t-lg`}
      ></div>

      {/* Vertical accent line on the left edge */}
      <div
        className={`${accentBarClass} absolute left-0 top-0 bottom-0 w-1`}
        style={{ marginLeft: "-1.5rem" }}
      ></div>

      {/* Content - always use orange/tangerine for text and border */}
      <div className="border-l-4 pl-4" style={{ borderColor: "#e88331" }}>
        <h3 className="text-xl font-bold mb-2" style={{ color: "#e88331" }}>
          {title}
        </h3>
        <p className="text-sm" style={{ color: "rgba(232, 131, 49, 0.7)" }}>
          {description}
        </p>
      </div>
    </div>
  );
};
