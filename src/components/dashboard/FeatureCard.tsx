
import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  accentColor: 'orange' | 'purple';
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, accentColor, className }) => {
  const accent = accentColor === 'orange' ? 'border-orange-500' : 'border-purple-600';

  return (
    <div className={`bg-white text-black p-4 rounded-lg border-l-8 ${accent} ${className}`}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p>{description}</p>
    </div>
  );
};
