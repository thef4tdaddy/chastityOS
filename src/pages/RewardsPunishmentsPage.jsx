import React from 'react';
import { formatTime, formatElapsedTime } from '../utils';
import { FaAward, FaExclamationTriangle, FaClock, FaStickyNote } from 'react-icons/fa';

// This helper component renders each individual log item
const LogItem = ({ item }) => {
  const isReward = item.logType === 'reward';
  const timeChange = item.timeChangeSeconds || 0;

  return (
    <div className="p-3 bg-gray-800/50 rounded-md text-left text-sm">
      <p className="font-semibold text-gray-300">{item.sourceText}</p>
      
      {item.note && (
        <p className="italic text-gray-400 mt-1 flex items-center gap-2">
          <FaStickyNote /> {item.note}
        </p>
      )}

      {timeChange !== 0 && (
        <p className={`font-mono mt-1 flex items-center gap-2 ${isReward ? 'text-green-400' : 'text-red-400'}`}>
          <FaClock /> {formatElapsedTime(Math.abs(timeChange))} {isReward ? 'removed from' : 'added to'} chastity time
        </p>
      )}

      {item.createdAt && (
        <p className="text-xs text-gray-500 text-right mt-1">
          {formatTime(safeToDate(item.createdAt), true)}
        </p>
      )}
    </div>
  );
};

const RewardsPunishmentsPage = ({ tasks = [] }) => {
  // Filter for the standardized log entries
  const rewards = tasks.filter(task => task.logType === 'reward').sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
  const punishments = tasks.filter(task => task.logType === 'punishment').sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

  return (
    <div className="p-0 md:p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rewards Box */}
        <div className="box box-yellow rewards-history-box">
          <h4><FaAward className="mr-2" />Rewards History</h4>
          {rewards.length > 0 ? (
            <div className="space-y-3">
              {rewards.map(item => <LogItem key={item.id} item={item} />)}
            </div>
          ) : (
            <p>No rewards have been given.</p>
          )}
        </div>

        {/* Punishments Box */}
        <div className="box box-red punishments-history-box">
          <h4><FaExclamationTriangle className="mr-2" />Punishments History</h4>
          {punishments.length > 0 ? (
            <div className="space-y-3">
              {punishments.map(item => <LogItem key={item.id} item={item} />)}
            </div>
          ) : (
            <p>No punishments have been given.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardsPunishmentsPage;