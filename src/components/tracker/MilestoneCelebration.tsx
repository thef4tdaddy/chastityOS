import React, { useEffect, useState } from "react";
import { FaTrophy, FaMedal, FaStar } from "../../utils/iconImport";
import { Card } from "@/components/ui";

interface MilestoneCelebrationProps {
  milestone: {
    type: "goal_complete" | "time_milestone" | "streak";
    title: string;
    description?: string;
    icon?: "trophy" | "medal" | "star";
  };
  onComplete?: () => void;
  duration?: number; // in milliseconds
}

interface ConfettiParticle {
  id: number;
  left: number;
  delay: number;
  color: string;
}

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  milestone,
  onComplete,
  duration = 3000,
}) => {
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Generate confetti particles
    const particles: ConfettiParticle[] = [];
    const colors = ["#22c55e", "#eab308", "#3b82f6", "#ec4899", "#f97316"];

    for (let i = 0; i < 30; i++) {
      const colorIndex = Math.floor(Math.random() * colors.length);
      particles.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[colorIndex] || "#22c55e",
      });
    }
    setConfetti(particles);

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 300); // Wait for fade out
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const getIcon = () => {
    const iconType = milestone.icon || "trophy";
    const iconClass = "text-6xl text-yellow-400";

    switch (iconType) {
      case "medal":
        return <FaMedal className={iconClass} />;
      case "star":
        return <FaStar className={iconClass} />;
      default:
        return <FaTrophy className={iconClass} />;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      role="alert"
      aria-live="polite"
    >
      {/* Confetti particles */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="confetti-particle absolute top-0 w-2 h-2 rounded-full"
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}

      {/* Celebration card */}
      <Card
        variant="glass"
        className={`
          pointer-events-auto
          max-w-md mx-4 p-8 text-center
          milestone-celebration
          ${isVisible ? "animate-fade-in" : "opacity-0"}
        `}
      >
        <div className="trophy-celebration mb-4">{getIcon()}</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {milestone.title}
        </h2>
        {milestone.description && (
          <p className="text-lavender_web text-lg">{milestone.description}</p>
        )}
      </Card>
    </div>
  );
};

// Hook to trigger milestone celebrations
export const useMilestoneCelebration = () => {
  const [celebration, setCelebration] = useState<
    MilestoneCelebrationProps["milestone"] | null
  >(null);

  const celebrate = (
    milestone: MilestoneCelebrationProps["milestone"],
  ): void => {
    setCelebration(milestone);
  };

  const clearCelebration = (): void => {
    setCelebration(null);
  };

  return {
    celebration,
    celebrate,
    clearCelebration,
  };
};
