
import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  accentColor: 'aquamarine' | 'lavender-floral';
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, accentColor, className }) => {
  const accent = accentColor === 'aquamarine' ? 'border-nightly-aquamarine' : 'border-nightly-lavender-floral';

  return (
    <div className={`p-4 rounded-lg border-l-8 ${accent} ${className} bg-white/10 backdrop-blur-xs border-white/20`}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p>{description}</p>
    </div>
  );
};
