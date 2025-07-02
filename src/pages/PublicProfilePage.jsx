import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CurrentStatusSection from '../components/full_report/CurrentStatusSection';
import TotalsSection from '../components/full_report/TotalsSection';
import ChastityHistoryTable from '../components/full_report/ChastityHistoryTable';
import EventLogTable from '../components/log_event/EventLogTable';
import ArousalLevelChart from '../components/arousal/ArousalLevelChart';
import { FaLock, FaHistory, FaChartLine, FaBook, FaListAlt } from 'react-icons/fa';

// The component now accepts 'profileId' as a prop, just like your original version.
const PublicProfilePage = ({ profileId }) => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      // It now uses the 'profileId' prop to fetch data.
      if (!profileId) {
        setError('No user ID provided.');
        setIsLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, 'users', profileId);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.settings?.publicProfileEnabled) {
            setProfileData({
              settings: data.settings,
              session: data.session,
              events: data.sexualEventsLog || [],
              arousalLevels: data.arousalLevels || [],
            });
          } else {
            setError('This user has not enabled their public profile.');
          }
        } else {
          setError('User profile not found.');
        }
      } catch (err) {
        console.error("Error fetching public profile:", err);
        setError('An error occurred while fetching the profile.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [profileId]); // The effect now correctly depends on the 'profileId' prop.

  const visibility = profileData?.settings?.publicStatsVisibility || {};
  const name = profileData?.settings?.submissivesName || 'Anonymous';
  const keyholderName = profileData?.settings?.keyholderName;

  if (isLoading) {
    return <div className="text-center p-10 text-xl text-purple-300">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-xl text-red-400">{error}</div>;
  }

  if (!profileData) {
    return <div className="text-center p-10 text-xl text-gray-400">No profile data available.</div>;
  }

  const { session, events, arousalLevels } = profileData;
  const {
    isCageOn,
    cageOnTime,
    timeInChastity,
    timeCageOff,
    totalChastityTime,
    totalTimeCageOff,
    chastityHistory = [],
    accumulatedPauseTimeThisSession = 0,
    overallTotalPauseTime = 0,
    isPaused,
    livePauseDuration = 0,
  } = session || {};

  const effectiveCurrentSessionTime = isCageOn
    ? Math.max(0, timeInChastity - accumulatedPauseTimeThisSession - (isPaused ? livePauseDuration : 0))
    : 0;
    
  const Card = ({ title, icon, children, isVisible }) => {
    if (!isVisible) return null;
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg backdrop-blur-sm transition-all hover:border-purple-500 hover:shadow-purple-500/20 h-full">
        <div className="flex items-center p-4 border-b border-gray-700">
          <div className="text-purple-400 mr-3">{icon}</div>
          <h3 className="text-lg font-semibold text-purple-300">{title}</h3>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 lg:p-8 text-gray-200">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8 p-6 bg-gray-800 rounded-2xl border border-gray-700 shadow-xl">
          <h1 className="text-4xl font-bold text-white">{name}'s Public Profile</h1>
          {keyholderName && <p className="text-lg text-purple-400 mt-2">Keyheld by {keyholderName}</p>}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Card title="Current Status" icon={<FaLock size={20} />} isVisible={visibility.currentStatus}>
              <CurrentStatusSection
                isCageOn={isCageOn}
                isPaused={isPaused}
                cageOnTime={cageOnTime}
                effectiveCurrentSessionTime={effectiveCurrentSessionTime}
                accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession}
                livePauseDuration={livePauseDuration}
                timeCageOff={timeCageOff}
              />
            </Card>
          </div>

          {/* THIS IS THE CHANGE: These two cards will now sit side-by-side on medium screens and up */}
          <div>
            <Card title="Totals & Statistics" icon={<FaHistory size={20} />} isVisible={visibility.totals}>
              <TotalsSection
                totalChastityTime={totalChastityTime}
                totalTimeCageOff={totalTimeCageOff}
                overallTotalPauseTime={overallTotalPauseTime}
                pauseReasonTotals={{}} // Pause reasons are not public
              />
            </Card>
          </div>
          
          <div>
            <Card title="Arousal History" icon={<FaChartLine size={20} />} isVisible={visibility.arousalChart}>
              <ArousalLevelChart arousalLevels={arousalLevels} days={7} />
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card title="Chastity History" icon={<FaBook size={20} />} isVisible={visibility.chastityHistory}>
              <ChastityHistoryTable chastityHistory={chastityHistory} />
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card title="Sexual Events Log" icon={<FaListAlt size={20} />} isVisible={visibility.sexualEvents}>
              <EventLogTable
                  isLoadingEvents={isLoading}
                  sexualEventsLog={events}
                  savedSubmissivesName={name}
                  eventDisplayMode={profileData.settings.eventDisplayMode}
              />
            </Card>
          </div>
        </div>
        
        <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>Powered by ChastityOS</p>
        </footer>
      </div>
    </div>
  );
};

export default PublicProfilePage;
