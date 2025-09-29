import { useState, useCallback, useEffect } from 'react';

interface HistoryEntry {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  reasonForEnd: string;
  pauseEvents?: Array<{
    startTime: Date;
    endTime: Date;
    reason: string;
    duration: number;
  }>;
  totalPauseDuration: number;
  effectiveDuration: number;
}

interface UseSessionHistoryProps {
  userId: string | null;
  isAuthReady: boolean;
}

export const useSessionHistory = ({ userId, isAuthReady }: UseSessionHistoryProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'recent' | 'longest'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleAddHistoryEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'effectiveDuration'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      effectiveDuration: entry.duration - entry.totalPauseDuration
    };

    setHistory(prev => [newEntry, ...prev]);
  }, []);

  const handleDeleteHistoryEntry = useCallback((entryId: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== entryId));
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getFilteredHistory = useCallback((): HistoryEntry[] => {
    let filtered = [...history];

    switch (filter) {
      case 'recent':
        filtered = filtered.slice(0, 10);
        break;
      case 'longest':
        filtered = filtered.sort((a, b) => b.effectiveDuration - a.effectiveDuration).slice(0, 10);
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [history, filter, sortOrder]);

  const getHistoryStats = useCallback(() => {
    if (history.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        totalEffectiveDuration: 0,
        averageDuration: 0,
        longestSession: 0,
        shortestSession: 0,
        totalPauseDuration: 0
      };
    }

    const totalDuration = history.reduce((sum, entry) => sum + entry.duration, 0);
    const totalEffectiveDuration = history.reduce((sum, entry) => sum + entry.effectiveDuration, 0);
    const totalPauseDuration = history.reduce((sum, entry) => sum + entry.totalPauseDuration, 0);
    const durations = history.map(entry => entry.effectiveDuration);

    return {
      totalSessions: history.length,
      totalDuration,
      totalEffectiveDuration,
      averageDuration: Math.round(totalEffectiveDuration / history.length),
      longestSession: Math.max(...durations),
      shortestSession: Math.min(...durations),
      totalPauseDuration
    };
  }, [history]);

  const getHistoryByPeriod = useCallback((period: 'week' | 'month' | 'year') => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return history;
    }

    return history.filter(entry => new Date(entry.startTime) >= startDate);
  }, [history]);

  const searchHistory = useCallback((searchTerm: string): HistoryEntry[] => {
    if (!searchTerm.trim()) return history;

    const term = searchTerm.toLowerCase();
    return history.filter(entry =>
      entry.reasonForEnd.toLowerCase().includes(term) ||
      entry.pauseEvents?.some(pause => pause.reason.toLowerCase().includes(term))
    );
  }, [history]);

  const exportHistory = useCallback((format: 'json' | 'csv' = 'json') => {
    if (history.length === 0) return null;

    if (format === 'json') {
      return JSON.stringify(history, null, 2);
    }

    // CSV format
    const headers = [
      'ID',
      'Start Time',
      'End Time',
      'Duration (seconds)',
      'Effective Duration (seconds)',
      'Pause Duration (seconds)',
      'Reason for End'
    ];

    const csvRows = [
      headers.join(','),
      ...history.map(entry => [
        entry.id,
        entry.startTime.toISOString(),
        entry.endTime.toISOString(),
        entry.duration,
        entry.effectiveDuration,
        entry.totalPauseDuration,
        `"${entry.reasonForEnd}"`
      ].join(','))
    ];

    return csvRows.join('\n');
  }, [history]);

  // Load history from storage
  useEffect(() => {
    if (!userId || !isAuthReady) return;

    setIsLoading(true);

    // In a real implementation, this would load from Firestore
    const loadHistory = async () => {
      try {
        // Simulate loading history
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load session history:', error);
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [userId, isAuthReady]);

  return {
    history: getFilteredHistory(),
    isLoading,
    filter,
    sortOrder,
    handleAddHistoryEntry,
    handleDeleteHistoryEntry,
    handleClearHistory,
    setFilter,
    setSortOrder,
    getHistoryStats,
    getHistoryByPeriod,
    searchHistory,
    exportHistory
  };
};