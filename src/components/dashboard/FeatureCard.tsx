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
    <div
      className={`glass-card glass-hover relative overflow-visible ${className}`}
    >
      {/* Vertical accent line on the left - thicker and positioned outside padding */}
      <div
        className={`${accentBarClass} absolute -left-[1.5rem] top-0 bottom-0 w-2`}
      ></div>

      {/* Accent bar at the top */}
      <div
        className={`${accentBarClass} h-3 -mx-6 -mt-6 mb-4 rounded-t-lg`}
      ></div>

      {/* Content */}
      <div>
        <h3 className="text-xl font-bold mb-2 text-tangerine">{title}</h3>
        <p className="text-lavender_web/80 text-sm">{description}</p>
      </div>
    </div>
  );
};
