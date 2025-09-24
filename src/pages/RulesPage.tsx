import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthState } from "../contexts";
import { RuleCard, RuleEditor } from "../components/rules";
import type { ChastityRule } from "../components/rules";
import { FaArrowLeft, FaBook, FaEdit, FaInfo } from "react-icons/fa";

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
  const { user } = useAuthState();
  const [rules, setRules] = useState<ChastityRule[]>(mockRules);
  const [editingRule, setEditingRule] = useState<ChastityRule | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredRules = rules
    .filter((rule) => {
      if (filter === "all") return true;
      if (filter === "active") return rule.isActive;
      if (filter === "inactive") return !rule.isActive;
      return true;
    })
    .sort((a, b) => {
      // Active rules first, then by last modified
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return b.lastModified.getTime() - a.lastModified.getTime();
    });

  const handleEditRule = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    setEditingRule(rule || null);
    setShowEditor(true);
  };

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId
          ? { ...rule, isActive: !rule.isActive, lastModified: new Date() }
          : rule,
      ),
    );
  };

  const handleSaveRule = (
    ruleData: Omit<ChastityRule, "id" | "createdAt" | "lastModified">,
  ) => {
    const now = new Date();

    if (editingRule) {
      // Update existing rule
      setRules((prev) =>
        prev.map((rule) =>
          rule.id === editingRule.id
            ? {
                ...rule,
                ...ruleData,
                lastModified: now,
              }
            : rule,
        ),
      );
    } else {
      // Create new rule
      const newRule: ChastityRule = {
        ...ruleData,
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        lastModified: now,
      };
      setRules((prev) => [newRule, ...prev]);
    }

    setShowEditor(false);
    setEditingRule(null);
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setEditingRule(null);
  };

  return (
    <div className="bg-gradient-to-br from-nightly-mobile-bg to-nightly-desktop-bg min-h-screen text-nightly-spring-green">
      {/* Header */}
      <header className="p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="text-nightly-aquamarine hover:text-nightly-spring-green"
          >
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Rules</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {/* Info Banner */}
        <div className="bg-nightly-aquamarine/10 border border-nightly-aquamarine/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FaInfo className="text-nightly-aquamarine mt-1" />
            <div>
              <h3 className="font-medium text-nightly-honeydew mb-1">
                About Rules
              </h3>
              <p className="text-sm text-nightly-celadon">
                Rules define the expectations and consequences for your chastity
                relationship. Both submissives and keyholders can create rules,
                but only active rules are enforced. Use markdown formatting for
                better organization.
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        {!showEditor && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <FaBook className="text-nightly-celadon" />
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as "all" | "active" | "inactive")
                }
                className="bg-white/10 border border-white/10 rounded p-2 text-nightly-honeydew"
              >
                <option value="all">All Rules ({rules.length})</option>
                <option value="active">
                  Active ({rules.filter((r) => r.isActive).length})
                </option>
                <option value="inactive">
                  Inactive ({rules.filter((r) => !r.isActive).length})
                </option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingRule(null);
                setShowEditor(true);
              }}
              className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
            >
              <FaEdit />
              Create Rule
            </button>
          </div>
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
              <div className="text-center py-8">
                <FaBook className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
                <div className="text-nightly-celadon">
                  No {filter === "all" ? "rules" : filter + " rules"} found
                </div>
                <div className="text-sm text-nightly-celadon/70">
                  {filter === "all"
                    ? "Create your first rule to get started"
                    : `Switch to 'All' to see other rules`}
                </div>
              </div>
            ) : (
              filteredRules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  isEditable={true}
                  onEdit={handleEditRule}
                  onToggle={handleToggleRule}
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
