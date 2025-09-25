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
  const glassCardClass =
    accentColor === "orange" ? "glass-card-accent" : "glass-card-secondary";

  const accentGradient =
    accentColor === "orange"
      ? "from-orange-500/20 to-orange-600/5"
      : "from-purple-500/20 to-purple-600/5";

  return (
    <div
      className={`${glassCardClass} glass-hover group relative overflow-hidden ${className}`}
    >
      {/* Accent gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accentGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      ></div>

      {/* Accent border */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${
          accentColor === "orange"
            ? "from-orange-400 to-orange-600"
            : "from-purple-400 to-purple-600"
        } rounded-full`}
      ></div>

      {/* Content */}
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-200 transition-all duration-300">
          {title}
        </h2>
        <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
          {description}
        </p>
      </div>

      {/* Floating animation elements */}
      <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-r from-white/5 to-white/10 group-hover:scale-110 transition-transform duration-500"></div>
      <div className="absolute -bottom-5 -left-5 w-12 h-12 rounded-full bg-gradient-to-r from-white/3 to-white/8 group-hover:scale-125 transition-transform duration-700"></div>
    </div>
  );
};
