
import React, { useState, useEffect } from 'react';
import { FeatureCard } from '../components/dashboard/FeatureCard';
import { sessionDBService } from '../services/database';
import { useAuthState } from '../contexts';
import { DBSession } from '@/types';

const Dashboard: React.FC = () => {
  const { user } = useAuthState();
  const [sessionDuration, setSessionDuration] = useState('0s';

  useEffect(() => {
    if (user) {
      const fetchSession = async () => {
        const session = await sessionDBService.getCurrentSession(user.uid);
        if (session) {
          // This is a simplified duration calculation. A more robust solution would be needed.
          const duration = Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000);
          setSessionDuration(`${duration}s`);
        }
      };
      fetchSession();
    }
  }, [user]);

  return (
    <div className="bg-nightly-honeydew min-h-screen text-nightly-spring-green p-4">
      <header className="flex justify-between items-center mb-8">
        <div className="text-2xl font-bold">ChastityOS</div>
        {/* Hamburger menu for mobile, full nav for desktop */}
        <nav className="hidden md:flex space-x-4">
          <a href="#" className="hover:text-nightly-celadon">Chastity Tracking</a>
          <a href="#" className="hover:text-nightly-celadon">Tasks</a>
          <a href="#" className="hover:text-nightly-celadon">Rewards/Punishments</a>
          <a href="#" className="hover:text-nightly-celadon">Full Report</a>
          <a href="#" className="hover:text-nightly-celadon">Settings</a>
          <a href="#" className="bg-nightly-lavender-floral px-3 py-1 rounded">KH Access</a>
        </nav>
        <div className="md:hidden">☰</div>
      </header>

      <main>
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to ChastityOS Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FeatureCard
            title="Chastity Tracker"
            description={`Current Session: ${sessionDuration}`}
            accentColor="aquamarine"
          />
          <FeatureCard
            title="Log Event"
            description="Record new events"
            accentColor="lavender-floral"
          />
          <FeatureCard
            title="Tasks"
            description="View upcoming tasks"
            accentColor="lavender-floral"
            className="hidden md:block"
          />
          <FeatureCard
            title="Full Report"
            description="Analyze your journey"
            accentColor="aquamarine"
          />
        </div>

        <div className="text-center mt-8">
            <button className="bg-nightly-lavender-floral text-white px-6 py-2 rounded-lg font-bold">View Keyholder Dashboard</button>
        </div>
      </main>

      <footer className="text-center text-gray-500 mt-8">
        <p>vX.X.X | Privacy | Terms | Support</p>
      </footer>
    </div>
  );
};

export default Dashboard;
