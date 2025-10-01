import React from "react";
import {
  RuleCard,
  RuleEditor,
  RulesPageControls,
  RulesInfoBanner,
  RulesEmptyState,
} from "../components/rules";
import type { ChastityRule } from "../components/rules";
import { useRulesPage } from "../hooks/useRulesPage";

// Mock rules data
const mockRules: ChastityRule[] = [
  {
    id: "1",
    title: "Daily Check-ins",
    content: `Must complete daily check-in form by 10 PM each night.

**Required information:**
- Current mood and energy level
- Any challenges or temptations faced
- Tomorrow's goals and commitments

**Consequences for missing:**
- +12 hours added to chastity time
- Extra task assigned for the following day`,
    isActive: true,
    createdBy: "keyholder",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    title: "Exercise Requirements",
    content: `Minimum 30 minutes of physical activity daily.

**Acceptable activities:**
- Cardio (running, cycling, swimming)
- Strength training
- Yoga or stretching
- Sports activities

**Tracking:**
- Log activity type and duration
- Include photo evidence when requested
- Heart rate data if available

**Rewards for consistency:**
- 7 days straight: -4 hours
- 14 days straight: -8 hours
- 30 days straight: -24 hours`,
    isActive: true,
    createdBy: "keyholder",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    title: "Communication Protocol",
    content: `Clear communication expectations between keyholder and submissive.

**Response times:**
- Urgent messages: Within 1 hour
- Regular messages: Within 4 hours
- Check-ins: Daily by agreed time

**Escalation process:**
- If no response within timeframe
- Emergency contact procedures
- Safe words and their meanings`,
    isActive: false,
    createdBy: "submissive",
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
  },
];

const RulesPage: React.FC = () => {
  const {
    rules,
    editingRule,
    showEditor,
    filter,
    filteredRules,
    setFilter,
    handleEditRule,
    handleToggleRule,
    handleSaveRule,
    handleCancelEdit,
    handleCreateNew,
  } = useRulesPage(mockRules);

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
