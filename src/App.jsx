import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import RewardsPage from './pages/RewardsPage';
import SettingsPage from './pages/SettingsPage';
import FullReportPage from './pages/FullReportPage';
import NotFoundPage from './pages/NotFoundPage';
import KeyholderDashboard from './pages/KeyholderDashboard';
import RulesPage from './pages/RulesPage';
import HowToPage from './pages/HowToPage';
import WelcomeModal from './components/WelcomeModal';
import HowToModal from './components/HowToModal';
import EulaModal from './components/EulaModal';
import { useWelcome } from './hooks/useWelcome';

function App() {
  const { hasAccepted, accept } = useWelcome();
  const [showEulaModal, setShowEulaModal] = useState(false);
  const [showHowToModal, setShowHowToModal] = useState(false);

  return (
    <Router>
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/full-report" element={<FullReportPage />} />
          <Route path="/keyholder" element={<KeyholderDashboard />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/how-to" element={<HowToPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <WelcomeModal
          isOpen={!hasAccepted}
          onAccept={accept}
          onShowLegal={() => setShowEulaModal(true)}
        />

        <HowToModal
          isOpen={showHowToModal}
          onClose={() => setShowHowToModal(false)}
        />

        <EulaModal
          isOpen={showEulaModal}
          onClose={() => setShowEulaModal(false)}
        />
      </div>
    </Router>
  );
}

export default App;