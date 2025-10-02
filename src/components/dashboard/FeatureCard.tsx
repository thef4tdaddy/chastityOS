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
    accentColor === "orange" ? "bg-tangerine" : "bg-nightly-deep_rose";

  return (
    <div
      className={`bg-lavender_web dark:bg-dark_purple border-2 border-rose_quartz/30 rounded-lg p-6 hover:border-nightly-deep_rose/50 hover:shadow-lg hover:shadow-nightly-deep_rose/20 transition-all duration-200 ${className}`}
    >
      {/* Accent bar at the top */}
      <div
        className={`${accentBarClass} h-3 -mx-6 -mt-6 mb-4 rounded-t-lg`}
      ></div>

      {/* Content */}
      <div>
        <h3 className="text-dark_purple dark:text-lavender_web text-xl font-bold mb-2">
          {title}
        </h3>
        <p className="text-rose_quartz dark:text-rose_quartz text-sm">
          {description}
        </p>
      </div>
    </div>
  );
};
