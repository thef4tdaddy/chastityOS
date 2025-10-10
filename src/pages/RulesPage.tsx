import React from "react";
import {
  RuleCard,
  RuleEditor,
  RulesPageControls,
  RulesInfoBanner,
  RulesEmptyState,
} from "../components/rules";
import { useRulesPage } from "../hooks/useRulesPage";
import { useAuthState } from "../contexts";
import { Card } from "@/components/ui";

const RulesPage: React.FC = () => {
  const { user } = useAuthState();

  // For now, default to submissive role - this should come from user profile/context
  const role = "submissive" as "keyholder" | "submissive";

  const {
    rules,
    editingRule,
    showEditor,
    filter,
    filteredRules,
    isLoading,
    setFilter,
    handleEditRule,
    handleToggleRule,
    handleSaveRule,
    handleCancelEdit,
    handleCreateNew,
  } = useRulesPage(user?.uid, role);

  if (isLoading) {
    return (
      <div className="text-nightly-spring-green p-4 max-w-4xl mx-auto">
        <Card variant="glass" padding="lg" className="text-center">
          <p>Loading rules...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="text-nightly-spring-green">
      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {/* Info Banner */}
        <RulesInfoBanner />

        {/* Controls */}
        {!showEditor && (
          <RulesPageControls
            filter={filter}
            onFilterChange={setFilter}
            rules={rules}
            onCreateNew={handleCreateNew}
          />
        )}

        {/* Editor */}
        {showEditor && (
          <div className="mb-6">
            <RuleEditor
              rule={editingRule}
              onSave={handleSaveRule}
              onCancel={handleCancelEdit}
            />
          </div>
        )}

        {/* Rules List */}
        {!showEditor && (
          <div className="space-y-6">
            {filteredRules.length === 0 ? (
              <RulesEmptyState filter={filter} />
            ) : (
              filteredRules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  isEditable={true}
                  onEdit={() => handleEditRule(rule.id)}
                  onToggle={() => handleToggleRule(rule.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RulesPage;
