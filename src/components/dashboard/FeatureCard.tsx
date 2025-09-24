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
    <div className={`bg-nightly-honeydew text-nightly-spring-green p-4 rounded-lg border-l-8 ${accent} ${className}`}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p>{description}</p>
    </div>
  );
};