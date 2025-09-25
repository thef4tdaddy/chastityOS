import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FeatureCard } from "../components/dashboard/FeatureCard";
import { sessionDBService } from "../services/database";
import { useAuthState } from "../contexts";
import { useNotificationStore, useModalStore, useThemeStore } from "../stores";

const Dashboard: React.FC = () => {
  const { user } = useAuthState();
  const [sessionDuration, setSessionDuration] = useState("0s");

  // Demo stores functionality
  const { success, error, warning, info } = useNotificationStore();
  const { openModal, closeModal, isModalOpen } = useModalStore();
  const { mode, toggleMode, colorScheme, setColorScheme } = useThemeStore();

  useEffect(() => {
    if (user) {
      const fetchSession = async () => {
        const session = await sessionDBService.getCurrentSession(user.uid);
        if (session) {
          // This is a simplified duration calculation. A more robust solution would be needed.
          const duration = Math.floor(
            (new Date().getTime() - session.startTime.getTime()) / 1000,
          );
          setSessionDuration(`${duration}s`);
        }
      };
      fetchSession();
    }
  }, [user]);

  const showDemoNotifications = () => {
    success("Success! Zustand stores are working perfectly!");
    setTimeout(() => {
      info("This is an info message showing store integration");
    }, 1000);
    setTimeout(() => {
      warning("Warning: This is just a demo");
    }, 2000);
  };

  const showDemoModal = () => {
    openModal("demo-modal", {
      title: "Demo Modal",
      size: "md",
      onClose: () => console.log("Modal closed via callback"),
    });
  };

  return (
    <>
      <main>
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          Welcome to ChastityOS Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link to="/chastity-tracking">
            <FeatureCard
              title="Chastity Tracker"
              description={`Current Session: ${sessionDuration}`}
              accentColor="orange"
            />
          </Link>
          <Link to="/log-event">
            <FeatureCard
              title="Log Event"
              description="Record new events"
              accentColor="purple"
            />
          </Link>
          <Link to="/tasks">
            <FeatureCard
              title="Tasks"
              description="View upcoming tasks"
              accentColor="purple"
              className="hidden md:block"
            />
          </Link>
          <Link to="/full-report">
            <FeatureCard
              title="Full Report"
              description="Analyze your journey"
              accentColor="orange"
            />
          </Link>
        </div>

        <div className="text-center mt-8">
          <Link to="/keyholder">
            <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold transition-colors">
              View Keyholder Dashboard
            </button>
          </Link>
        </div>

        {/* Demo Section for New Zustand Stores */}
        <div className="mt-12 p-6 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
          <h2 className="text-2xl font-bold text-center mb-6 text-nightly-spring-green">
            🏪 New Zustand Store Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Notification Store Demo */}
            <div className="bg-black/10 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-nightly-aquamarine">
                📢 Notifications
              </h3>
              <p className="text-sm text-nightly-celadon mb-3">
                Toast notifications with different types and auto-dismiss
              </p>
              <button
                onClick={showDemoNotifications}
                className="w-full bg-nightly-aquamarine/20 hover:bg-nightly-aquamarine/30 text-nightly-aquamarine px-3 py-2 rounded transition-colors text-sm"
              >
                Show Demo Notifications
              </button>
            </div>

            {/* Modal Store Demo */}
            <div className="bg-black/10 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-nightly-aquamarine">
                🪟 Modals
              </h3>
              <p className="text-sm text-nightly-celadon mb-3">
                Centralized modal management with z-index handling
              </p>
              <button
                onClick={showDemoModal}
                className="w-full bg-nightly-aquamarine/20 hover:bg-nightly-aquamarine/30 text-nightly-aquamarine px-3 py-2 rounded transition-colors text-sm"
              >
                Open Demo Modal
              </button>
            </div>

            {/* Theme Store Demo */}
            <div className="bg-black/10 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-nightly-aquamarine">
                🎨 Theme
              </h3>
              <p className="text-sm text-nightly-celadon mb-3">
                Theme: {mode} | Scheme: {colorScheme}
              </p>
              <div className="space-y-2">
                <button
                  onClick={toggleMode}
                  className="w-full bg-nightly-aquamarine/20 hover:bg-nightly-aquamarine/30 text-nightly-aquamarine px-3 py-1 rounded transition-colors text-xs"
                >
                  Toggle Theme Mode
                </button>
                <button
                  onClick={() =>
                    setColorScheme(
                      colorScheme === "nightly" ? "classic" : "nightly",
                    )
                  }
                  className="w-full bg-nightly-aquamarine/20 hover:bg-nightly-aquamarine/30 text-nightly-aquamarine px-3 py-1 rounded transition-colors text-xs"
                >
                  Toggle Color Scheme
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-nightly-celadon">
            <p>✅ Mobile menu state management in header</p>
            <p>✅ Persistent theme preferences</p>
            <p>✅ Automatic page title updates</p>
          </div>
        </div>

        {/* Demo Modal */}
        {isModalOpen("demo-modal") && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-nightly-aquamarine p-6 rounded-lg max-w-md w-full">
              <h3 className="text-xl font-bold text-nightly-spring-green mb-4">
                Demo Modal from ModalStore
              </h3>
              <p className="text-nightly-celadon mb-4">
                This modal is managed by the new ModalStore! It handles:
              </p>
              <ul className="text-sm text-nightly-celadon mb-4 space-y-1">
                <li>• Z-index management</li>
                <li>• Modal stacking</li>
                <li>• Centralized state</li>
                <li>• onOpen/onClose callbacks</li>
              </ul>
              <button
                onClick={() => closeModal("demo-modal")}
                className="w-full bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-white px-4 py-2 rounded transition-colors"
              >
                Close Modal
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Dashboard;
