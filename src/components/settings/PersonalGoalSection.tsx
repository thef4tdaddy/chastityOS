import React from "react";
import {
  usePersonalGoalQuery,
  usePersonalGoalMutations,
} from "@/hooks/api/usePersonalGoalQueries";
import { PersonalGoalCard } from "./PersonalGoalCard";
import { CreatePersonalGoalForm } from "./CreatePersonalGoalForm";
import { useToast } from "@/hooks/useToast";

interface PersonalGoalSectionProps {
  userId?: string | null;
}

export const PersonalGoalSection: React.FC<PersonalGoalSectionProps> = ({
  userId,
}) => {
  const { data: personalGoal, isLoading } = usePersonalGoalQuery(
    userId || undefined,
  );
  const { createPersonalGoal, updatePersonalGoal, deletePersonalGoal } =
    usePersonalGoalMutations();
  const { showWarning } = useToast();

  const handleCreate = (
    title: string,
    targetDuration: number,
    description?: string,
  ) => {
    if (!userId) return;
    createPersonalGoal.mutate({
      userId,
      title,
      targetDuration,
      description,
    });
  };

  const handleUpdate = (
    goalId: string,
    title: string,
    targetDuration: number,
    description?: string,
  ) => {
    if (!userId) return;
    updatePersonalGoal.mutate({
      goalId,
      userId,
      title,
      targetDuration,
      description,
    });
  };

  const handleDelete = (goalId: string) => {
    if (!userId) return;
    showWarning("Are you sure you want to delete this goal?", {
      duration: 5000,
      action: {
        label: "Delete",
        onClick: () => {
          deletePersonalGoal.mutate({ goalId, userId });
        },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <p className="text-nightly-celadon">Loading personal goal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-nightly-honeydew mb-2">
          Personal Goal
        </h2>
        <p className="text-nightly-celadon">
          Set a personal chastity duration goal and track your progress. Your
          goal progress updates automatically based on your session time.
        </p>
      </div>

      {personalGoal ? (
        <PersonalGoalCard
          goal={personalGoal}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ) : (
        <CreatePersonalGoalForm
          onCreate={handleCreate}
          isCreating={createPersonalGoal.isPending}
        />
      )}
    </div>
  );
};
