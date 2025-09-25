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
  const accent =
    accentColor === "orange" ? "border-l-orange-500" : "border-l-purple-500";

  return (
    <div
      className={`p-6 rounded-lg border-l-8 ${accent} ${className} bg-gray-700 border border-gray-600 hover:bg-gray-600 transition-colors`}
    >
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};
