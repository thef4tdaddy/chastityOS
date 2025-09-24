import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from '../contexts';
import { taskDBService } from '../services/database';
import type { DBTask } from '../types/database';
import {
  FaArrowLeft,
  FaAward,
  FaGavel,
  FaClock,
  FaStickyNote,
  FaPlus,
  FaFilter,
  FaSpinner,
  FaTrophy,
  FaExclamationTriangle,
} from 'react-icons/fa';

// Mock reward/punishment log item interface
interface RewardPunishmentLog {
  id: string;
  type: 'reward' | 'punishment';
  title: string;
  description: string;
  timeChangeSeconds: number; // Positive for added time, negative for removed time
  source: 'task_completion' | 'keyholder_action' | 'rule_violation' | 'milestone';
  sourceId?: string; // Reference to task, rule, etc.
  createdAt: Date;
  notes?: string;
}

// Mock data for demonstration
const mockRewardsAndPunishments: RewardPunishmentLog[] = [
  {
    id: '1',
    type: 'reward',
    title: 'Task Completed Early',
    description: 'Completed daily exercise routine ahead of schedule',
    timeChangeSeconds: -7200, // 2 hours removed
    source: 'task_completion',
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    notes: 'Excellent dedication to fitness goals',
  },
  {
    id: '2',
    type: 'punishment',
    title: 'Late Task Submission',
    description: 'Failed to submit daily report on time',
    timeChangeSeconds: 14400, // 4 hours added
    source: 'rule_violation',
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
  },
  {
    id: '3',
    type: 'reward',
    title: 'Weekly Milestone',
    description: 'Successfully completed one week of consistent tracking',
    timeChangeSeconds: -10800, // 3 hours removed
    source: 'milestone',
    createdAt: new Date(Date.now() - 604800000), // 1 week ago
    notes: 'Keep up the great progress!',
  },
];

// Log Item Component
const LogItem: React.FC<{ item: RewardPunishmentLog }> = ({ item }) => {
  const isReward = item.type === 'reward';
  const timeChange = Math.abs(item.timeChangeSeconds);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getSourceIcon = () => {
    switch (item.source) {
      case 'task_completion':
        return <FaTrophy className="text-nightly-aquamarine" />;
      case 'keyholder_action':
        return <FaGavel className="text-nightly-lavender-floral" />;
      case 'rule_violation':
        return <FaExclamationTriangle className="text-red-400" />;
      case 'milestone':
        return <FaAward className="text-nightly-spring-green" />;
      default:
        return <FaClock />;
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {isReward ? (
            <FaAward className="text-green-400 text-xl" />
          ) : (
            <FaGavel className="text-red-400 text-xl" />
          )}
          <div>
            <h3 className="font-medium text-nightly-honeydew">{item.title}</h3>
            <p className="text-sm text-nightly-celadon">{item.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getSourceIcon()}
          <span className={`px-2 py-1 text-xs rounded ${
            isReward ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {isReward ? 'REWARD' : 'PUNISHMENT'}
          </span>
        </div>
      </div>

      {/* Time Impact */}
      {item.timeChangeSeconds !== 0 && (
        <div className={`flex items-center gap-2 mb-3 ${
          isReward ? 'text-green-400' : 'text-red-400'
        }`}>
          <FaClock />
          <span className="font-mono">
            {formatDuration(timeChange)} {isReward ? 'removed from' : 'added to'} chastity time
          </span>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div className="bg-white/5 rounded p-2 mb-3">
          <div className="flex items-center gap-2 text-nightly-celadon">
            <FaStickyNote />
            <span className="text-sm">{item.notes}</span>
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-nightly-celadon text-right">
        {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString()}
      </div>
    </div>
  );
};

// Statistics Component
const RewardPunishmentStats: React.FC<{ logs: RewardPunishmentLog[] }> = ({ logs }) => {
  const stats = {
    totalRewards: logs.filter(l => l.type === 'reward').length,
    totalPunishments: logs.filter(l => l.type === 'punishment').length,
    timeReduced: logs
      .filter(l => l.type === 'reward')
      .reduce((acc, l) => acc + Math.abs(l.timeChangeSeconds), 0),
    timeAdded: logs
      .filter(l => l.type === 'punishment')
      .reduce((acc, l) => acc + Math.abs(l.timeChangeSeconds), 0),
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaTrophy className="text-nightly-aquamarine" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">Summary</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {stats.totalRewards}
          </div>
          <div className="text-sm text-nightly-celadon">Rewards</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">
            {stats.totalPunishments}
          </div>
          <div className="text-sm text-nightly-celadon">Punishments</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            -{formatDuration(stats.timeReduced)}
          </div>
          <div className="text-sm text-nightly-celadon">Time Reduced</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">
            +{formatDuration(stats.timeAdded)}
          </div>
          <div className="text-sm text-nightly-celadon">Time Added</div>
        </div>
      </div>
    </div>
  );
};

// Manual Entry Form Component
const ManualEntryForm: React.FC<{
  onSubmit: (entry: Omit<RewardPunishmentLog, 'id' | 'createdAt'>) => void;
}> = ({ onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'reward' as 'reward' | 'punishment',
    title: '',
    description: '',
    timeChangeSeconds: 3600, // Default 1 hour
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      ...formData,
      timeChangeSeconds: formData.type === 'reward' ? -Math.abs(formData.timeChangeSeconds) : Math.abs(formData.timeChangeSeconds),
      source: 'keyholder_action',
    });

    // Reset form
    setFormData({
      type: 'reward',
      title: '',
      description: '',
      timeChangeSeconds: 3600,
      notes: '',
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
      >
        <FaPlus />
        Add Manual Entry
      </button>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">Manual Reward/Punishment</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="reward"
                checked={formData.type === 'reward'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'reward' | 'punishment' }))}
                className="mr-2"
              />
              <span className="text-green-400">Reward</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="punishment"
                checked={formData.type === 'punishment'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'reward' | 'punishment' }))}
                className="mr-2"
              />
              <span className="text-red-400">Punishment</span>
            </label>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Brief title for this entry"
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detailed description of the reason"
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
            rows={3}
            required
          />
        </div>

        {/* Time Change */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Time Impact (hours)
          </label>
          <input
            type="number"
            min="0"
            max="168"
            step="0.5"
            value={formData.timeChangeSeconds / 3600}
            onChange={(e) => setFormData(prev => ({ ...prev, timeChangeSeconds: parseFloat(e.target.value) * 3600 }))}
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew"
          />
          <div className="text-xs text-nightly-celadon mt-1">
            This will {formData.type === 'reward' ? 'reduce' : 'add'} chastity time
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Notes (optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes or comments"
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-2 rounded font-medium transition-colors"
          >
            Add Entry
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-6 py-2 rounded font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const RewardsPunishmentsPage: React.FC = () => {
  const { user } = useAuthState();
  const [logs, setLogs] = useState<RewardPunishmentLog[]>(mockRewardsAndPunishments);
  const [filter, setFilter] = useState<'all' | 'rewards' | 'punishments'>('all');
  const [loading, setLoading] = useState(false);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'rewards') return log.type === 'reward';
    if (filter === 'punishments') return log.type === 'punishment';
    return true;
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleManualEntry = (entry: Omit<RewardPunishmentLog, 'id' | 'createdAt'>) => {
    const newEntry: RewardPunishmentLog = {
      ...entry,
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    setLogs(prev => [newEntry, ...prev]);
  };

  return (
    <div className="bg-gradient-to-br from-nightly-mobile-bg to-nightly-desktop-bg min-h-screen text-nightly-spring-green">
      {/* Header */}
      <header className="p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-nightly-aquamarine hover:text-nightly-spring-green">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Rewards & Punishments</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        <RewardPunishmentStats logs={logs} />

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <FaFilter className="text-nightly-celadon" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'rewards' | 'punishments')}
              className="bg-white/10 border border-white/10 rounded p-2 text-nightly-honeydew"
            >
              <option value="all">All ({logs.length})</option>
              <option value="rewards">Rewards ({logs.filter(l => l.type === 'reward').length})</option>
              <option value="punishments">Punishments ({logs.filter(l => l.type === 'punishment').length})</option>
            </select>
          </div>

          <ManualEntryForm onSubmit={handleManualEntry} />
        </div>

        {/* Logs */}
        {loading ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
            <div className="text-nightly-celadon">Loading rewards and punishments...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <FaTrophy className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
            <div className="text-nightly-celadon">No {filter === 'all' ? 'entries' : filter} found</div>
            <div className="text-sm text-nightly-celadon/70">
              {filter === 'all' ? 'Complete tasks or have your keyholder add entries' : `Switch to 'All' to see other entries`}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <LogItem key={log.id} item={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPunishmentsPage;