/**
 * Demo page for Keyholder Account Linking
 * Shows the UI components without requiring authentication
 */
import React, { useState } from "react";
import { AccountLinkingDemo } from "../demo/components/AccountLinkingDemo";

type Scenario =
  | "submissive-with-keyholder"
  | "submissive-no-keyholder"
  | "keyholder-mode";

const KeyholderDemo: React.FC = () => {
  const [scenario, setScenario] = useState<Scenario>("submissive-no-keyholder");

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-300 mb-2">
            🔐 Keyholder Account Linking - Demo
          </h1>
          <p className="text-purple-400 mb-4">
            Phase 1 Implementation: Secure account linking foundation for
            keyholder-submissive relationships
          </p>

          {/* Scenario Selector */}
          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => setScenario("submissive-no-keyholder")}
              className={`px-3 py-2 rounded text-sm ${
                scenario === "submissive-no-keyholder"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Submissive (No Keyholder)
            </Button>
            <Button
              onClick={() => setScenario("submissive-with-keyholder")}
              className={`px-3 py-2 rounded text-sm ${
                scenario === "submissive-with-keyholder"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Submissive (With Keyholder)
            </Button>
            <Button
              onClick={() => setScenario("keyholder-mode")}
              className={`px-3 py-2 rounded text-sm ${
                scenario === "keyholder-mode"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Keyholder Mode
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <AccountLinkingDemo scenario={scenario} />
        </div>

        <div className="mt-12 bg-blue-900/30 border border-blue-500/50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-300 mb-4">
            ✨ Features Implemented
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-blue-200 mb-2">
                🔗 Account Linking
              </h3>
              <ul className="space-y-1 text-blue-100">
                <li>• 6-character invite code generation</li>
                <li>• 24-hour code expiration</li>
                <li>• Secure code validation</li>
                <li>• Multi-invite support (max 3 active)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-200 mb-2">
                🛡️ Security & Management
              </h3>
              <ul className="space-y-1 text-blue-100">
                <li>• Permission-based access control</li>
                <li>• Relationship status management</li>
                <li>• Code revocation capabilities</li>
                <li>• Database versioning (v3)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-200 mb-2">
                💾 Database Layer
              </h3>
              <ul className="space-y-1 text-blue-100">
                <li>• KeyholderRelationshipDBService</li>
                <li>• InviteCode table with indexes</li>
                <li>• Relationship tracking</li>
                <li>• Transaction-safe operations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-200 mb-2">
                ⚛️ React Integration
              </h3>
              <ul className="space-y-1 text-blue-100">
                <li>• useKeyholderRelationships hook</li>
                <li>• AccountLinking component</li>
                <li>• Real-time UI updates</li>
                <li>• Form validation & UX</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 border border-gray-600 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-300 mb-4">
            🚀 Next Phase: Session Integration
          </h2>
          <div className="text-sm text-gray-400">
            <p className="mb-2">
              Phase 2 will build on this foundation to add real-time session
              control capabilities:
            </p>
            <ul className="space-y-1 text-gray-300">
              <li>• Remote session start/stop/pause controls</li>
              <li>• Real-time session monitoring for keyholders</li>
              <li>• Goal modification by keyholders</li>
              <li>• Emergency unlock approval system</li>
              <li>• Session event logging and notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyholderDemo;
