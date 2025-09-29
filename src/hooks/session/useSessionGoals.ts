import { useState, useCallback, useEffect } from 'react';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDuration: number; // in seconds
  createdAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
  progress: number; // percentage 0-100
}

interface UseSessionGoalsProps {
  userId: string | null;
  currentSessionDuration: number;
  isSessionActive: boolean;
}

export const useSessionGoals = ({
  userId,
  currentSessionDuration,
  isSessionActive
}: UseSessionGoalsProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateGoal = useCallback((title: string, description: string, targetDurationHours: number) => {
    if (!userId) {
      setMessage('User not authenticated');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      targetDuration: targetDurationHours * 3600, // Convert hours to seconds
      createdAt: new Date(),
      isCompleted: false,
      progress: 0
    };

    setGoals(prev => [...prev, newGoal]);
    
    // Set as active goal if none exists
    if (!activeGoal) {
      setActiveGoal(newGoal);
    }

    setMessage(`Goal "${title}" created successfully`);
    setTimeout(() => setMessage(''), 3000);
  }, [userId, activeGoal]);

  const handleDeleteGoal = useCallback((goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
    
    // Clear active goal if it was deleted
    if (activeGoal?.id === goalId) {
      setActiveGoal(null);
    }

    setMessage('Goal deleted');
    setTimeout(() => setMessage(''), 3000);
  }, [activeGoal?.id]);

  const handleSetActiveGoal = useCallback((goalId: string | null) => {
    if (!goalId) {
      setActiveGoal(null);
      return;
    }

    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setActiveGoal(goal);
      setMessage(`Active goal set to: ${goal.title}`);
      setTimeout(() => setMessage(''), 3000);
    }
  }, [goals]);

  const handleCompleteGoal = useCallback((goalId: string) => {
    setGoals(prev => 
      prev.map(goal => 
        goal.id === goalId
          ? { ...goal, isCompleted: true, completedAt: new Date(), progress: 100 }
          : goal
      )
    );

    if (activeGoal?.id === goalId) {
      setActiveGoal(prev => 
        prev ? { ...prev, isCompleted: true, completedAt: new Date(), progress: 100 } : null
      );
    }

    setMessage('Goal completed! 🎉');
    setTimeout(() => setMessage(''), 5000);
  }, [activeGoal?.id]);

  const getGoalProgress = useCallback((goal: Goal): number => {
    if (!isSessionActive || goal.isCompleted) return goal.progress;
    
    const progress = Math.min((currentSessionDuration / goal.targetDuration) * 100, 100);
    return Math.round(progress);
  }, [currentSessionDuration, isSessionActive]);

  const getTimeToGoal = useCallback((goal: Goal): number => {
    if (goal.isCompleted) return 0;
    return Math.max(goal.targetDuration - currentSessionDuration, 0);
  }, [currentSessionDuration]);

  const getCompletedGoals = useCallback((): Goal[] => {
    return goals.filter(goal => goal.isCompleted);
  }, [goals]);

  const getPendingGoals = useCallback((): Goal[] => {
    return goals.filter(goal => !goal.isCompleted);
  }, [goals]);

  // Update goal progress
  useEffect(() => {
    if (!isSessionActive || !activeGoal || activeGoal.isCompleted) return;

    const progress = getGoalProgress(activeGoal);
    
    setActiveGoal(prev => 
      prev ? { ...prev, progress } : null
    );

    setGoals(prev => 
      prev.map(goal => 
        goal.id === activeGoal.id
          ? { ...goal, progress }
          : goal
      )
    );

    // Auto-complete goal when reached
    if (progress >= 100 && !activeGoal.isCompleted) {
      handleCompleteGoal(activeGoal.id);
    }
  }, [currentSessionDuration, isSessionActive, activeGoal, getGoalProgress, handleCompleteGoal]);

  // Load goals from storage on mount
  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    
    // In a real implementation, this would load from Firestore
    try {
      // Simulate loading goals
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load goals:', error);
      setIsLoading(false);
    }
  }, [userId]);

  return {
    goals,
    activeGoal,
    isLoading,
    message,
    handleCreateGoal,
    handleDeleteGoal,
    handleSetActiveGoal,
    handleCompleteGoal,
    getGoalProgress,
    getTimeToGoal,
    getCompletedGoals,
    getPendingGoals
  };
};