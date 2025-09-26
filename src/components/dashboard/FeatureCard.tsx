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
      className={`bg-lavender_web-500 border border-black rounded-lg p-6 hover:bg-lavender_web-600 transition-colors duration-200 ${className}`}
    >
      {/* Accent bar at the top */}
      <div
        className={`${accentBarClass} h-3 -mx-6 -mt-6 mb-4 rounded-t-lg`}
      ></div>

      {/* Content */}
      <div>
        <h3 className="text-white text-xl font-bold mb-2">{title}</h3>
        <p className="text-white text-sm opacity-90">{description}</p>
      </div>
    </div>
  );
};
