import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import * as Sentry from '@sentry/react';

/**
 * Advanced reporting system with custom reports, data visualization, and export capabilities
 * @param {string} userId - The user ID for reporting
 * @param {string} relationshipId - Optional relationship ID for relationship reports
 * @param {boolean} isAuthReady - Whether authentication is ready
 * @returns {object} Reporting state and management functions
 */
export const useReporting = (userId, relationshipId, isAuthReady) => {
  // Available report templates
  const [availableReports] = useState([
    {
      id: 'chastity_summary',
      name: 'Chastity Summary Report',
      description: 'Comprehensive overview of chastity sessions and statistics',
      category: 'chastity',
      parameters: [
        { name: 'dateRange', type: 'dateRange', required: true, default: 'last30days' },
        { name: 'includeGraphs', type: 'boolean', default: true },
        { name: 'includeTrends', type: 'boolean', default: true }
      ],
      sections: ['overview', 'sessions', 'trends', 'achievements']
    },
    {
      id: 'task_performance',
      name: 'Task Performance Report',
      description: 'Analysis of task completion and performance metrics',
      category: 'tasks',
      parameters: [
        { name: 'dateRange', type: 'dateRange', required: true, default: 'last30days' },
        { name: 'taskCategory', type: 'select', options: ['all', 'daily', 'weekly', 'special'] },
        { name: 'showDetails', type: 'boolean', default: false }
      ],
      sections: ['completion_rate', 'categories', 'difficulty_analysis', 'time_analysis']
    },
    {
      id: 'goal_progress',
      name: 'Goal Progress Report',
      description: 'Detailed analysis of goal achievement and progress patterns',
      category: 'goals',
      parameters: [
        { name: 'dateRange', type: 'dateRange', required: true, default: 'all' },
        { name: 'includeCompleted', type: 'boolean', default: true },
        { name: 'includeActive', type: 'boolean', default: true },
        { name: 'groupByCategory', type: 'boolean', default: true }
      ],
      sections: ['overview', 'completion_trends', 'category_breakdown', 'success_factors']
    },
    {
      id: 'gamification_stats',
      name: 'Gamification Statistics',
      description: 'Experience, achievements, and gamification progress',
      category: 'gamification',
      parameters: [
        { name: 'dateRange', type: 'dateRange', required: true, default: 'all' },
        { name: 'includeLeaderboards', type: 'boolean', default: true },
        { name: 'includeChallenges', type: 'boolean', default: true }
      ],
      sections: ['experience', 'achievements', 'challenges', 'social']
    },
    {
      id: 'relationship_overview',
      name: 'Relationship Overview',
      description: 'Joint activities, shared goals, and relationship dynamics',
      category: 'relationship',
      parameters: [
        { name: 'dateRange', type: 'dateRange', required: true, default: 'last30days' },
        { name: 'includePrivateData', type: 'boolean', default: false },
        { name: 'showCommunication', type: 'boolean', default: true }
      ],
      sections: ['shared_activities', 'communication', 'goals', 'milestones'],
      requiresRelationship: true
    },
    {
      id: 'wellness_tracking',
      name: 'Wellness & Mood Tracking',
      description: 'Mental and physical wellness patterns and correlations',
      category: 'wellness',
      parameters: [
        { name: 'dateRange', type: 'dateRange', required: true, default: 'last30days' },
        { name: 'includeCorrelations', type: 'boolean', default: true },
        { name: 'showRecommendations', type: 'boolean', default: true }
      ],
      sections: ['mood_trends', 'wellness_metrics', 'correlations', 'recommendations']
    }
  ]);

  // Custom reports created by user
  const [customReports, setCustomReports] = useState([]);
  
  // Recently generated reports
  const [recentReports, setRecentReports] = useState([]);
  
  // Scheduled reports
  const [scheduledReports, setScheduledReports] = useState([]);
  
  // Report preferences
  const [preferences, setPreferences] = useState({
    defaultDateRange: 'last30days',
    defaultFormat: 'pdf',
    autoSchedule: false,
    includeGraphs: true,
    includeRawData: false,
    theme: 'light'
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load reporting data from Firebase
  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      return;
    }

    const loadReportingData = async () => {
      try {
        setIsLoading(true);
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().reportingData) {
          const reportingData = docSnap.data().reportingData;
          
          if (reportingData.customReports) {
            setCustomReports(reportingData.customReports);
          }
          
          if (reportingData.recentReports) {
            const recentWithDates = reportingData.recentReports.map(report => ({
              ...report,
              generatedAt: report.generatedAt?.toDate() || new Date(report.generatedAt)
            }));
            setRecentReports(recentWithDates);
          }
          
          if (reportingData.scheduledReports) {
            setScheduledReports(reportingData.scheduledReports);
          }
          
          if (reportingData.preferences) {
            setPreferences(prev => ({ ...prev, ...reportingData.preferences }));
          }
        }
        
      } catch (error) {
        console.error('Error loading reporting data:', error);
        Sentry.captureException(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReportingData();
  }, [isAuthReady, userId]);

  // Save reporting data to Firebase
  const saveReportingData = useCallback(async (data) => {
    if (!isAuthReady || !userId) return;
    
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, { reportingData: data }, { merge: true });
    } catch (error) {
      console.error('Error saving reporting data:', error);
      Sentry.captureException(error);
    }
  }, [isAuthReady, userId]);

  // Collect data for report generation
  const collectReportData = useCallback(async (templateId, parameters) => {
    try {
      const data = {};
      
      // Date range processing
      const dateRange = parameters.dateRange || 'last30days';
      let startDate, endDate;
      
      switch (dateRange) {
        case 'last7days':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          endDate = new Date();
          break;
        case 'last30days':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          endDate = new Date();
          break;
        case 'last90days':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          endDate = new Date();
          break;
        case 'thisMonth':
          startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          endDate = new Date();
          break;
        case 'lastMonth':
          startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
          endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
          break;
        case 'thisYear':
          startDate = new Date(new Date().getFullYear(), 0, 1);
          endDate = new Date();
          break;
        case 'all':
        default:
          startDate = new Date(2020, 0, 1); // Arbitrary early date
          endDate = new Date();
          break;
      }
      
      data.dateRange = { startDate, endDate };
      
      // Collect user data based on template
      if (templateId === 'chastity_summary') {
        // Get chastity session data (mock data for demo)
        data.sessions = [
          {
            id: 'session1',
            startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            duration: 7 * 24 * 60 * 60 * 1000,
            reason: 'Personal goal'
          },
          {
            id: 'session2',
            startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            duration: 10 * 24 * 60 * 60 * 1000,
            reason: 'Keyholder request'
          }
        ];
        
        data.totalTime = data.sessions.reduce((sum, session) => sum + session.duration, 0);
        data.averageSession = data.totalTime / data.sessions.length;
        data.longestSession = Math.max(...data.sessions.map(s => s.duration));
        
      } else if (templateId === 'task_performance') {
        // Get tasks data from Firebase
        try {
          const tasksRef = collection(db, 'users', userId, 'tasks');
          const tasksQuery = query(tasksRef, orderBy('createdAt', 'desc'));
          const tasksSnapshot = await getDocs(tasksQuery);
          
          data.tasks = tasksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            completedAt: doc.data().completedAt?.toDate() || null
          })).filter(task => {
            const taskDate = task.createdAt;
            return taskDate >= startDate && taskDate <= endDate;
          });
          
          data.completionRate = data.tasks.length > 0 ?
            (data.tasks.filter(t => t.status === 'completed').length / data.tasks.length) * 100 : 0;
          
          data.categories = data.tasks.reduce((acc, task) => {
            const category = task.category || 'general';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {});
          
        } catch (error) {
          console.error('Error collecting tasks data:', error);
          data.tasks = [];
          data.completionRate = 0;
          data.categories = {};
        }
        
      } else if (templateId === 'goal_progress') {
        // Get goals data from Firebase
        try {
          const goalsRef = collection(db, 'users', userId, 'goals');
          const goalsQuery = query(goalsRef, orderBy('createdAt', 'desc'));
          const goalsSnapshot = await getDocs(goalsQuery);
          
          data.goals = goalsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            completedAt: doc.data().completedAt?.toDate() || null
          })).filter(goal => {
            const goalDate = goal.createdAt;
            return goalDate >= startDate && goalDate <= endDate;
          });
          
          data.completedGoals = data.goals.filter(g => g.progress?.status === 'completed');
          data.activeGoals = data.goals.filter(g => g.progress?.status === 'active');
          data.completionRate = data.goals.length > 0 ?
            (data.completedGoals.length / data.goals.length) * 100 : 0;
          
        } catch (error) {
          console.error('Error collecting goals data:', error);
          data.goals = [];
          data.completedGoals = [];
          data.activeGoals = [];
          data.completionRate = 0;
        }
      }
      
      return data;
      
    } catch (error) {
      console.error('Error collecting report data:', error);
      Sentry.captureException(error);
      throw error;
    }
  }, [userId]);

  // Generate a report
  const generateReport = useCallback(async (templateId, parameters) => {
    if (!isAuthReady || !userId) throw new Error('User not authenticated');
    
    try {
      const template = availableReports.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Report template not found');
      }
      
      // Check if relationship is required but not provided
      if (template.requiresRelationship && !relationshipId) {
        throw new Error('This report requires an active relationship');
      }
      
      // Collect data for the report
      const reportData = await collectReportData(templateId, parameters);
      
      // Generate report content
      const report = {
        id: `report-${Date.now()}`,
        templateId,
        templateName: template.name,
        parameters,
        data: reportData,
        generatedAt: new Date(),
        generatedBy: userId,
        format: parameters.format || 'json',
        sections: template.sections,
        metadata: {
          dataPoints: Object.keys(reportData).length,
          dateRange: reportData.dateRange,
          version: '1.0'
        }
      };
      
      // Add to recent reports
      const newRecentReports = [report, ...recentReports.slice(0, 19)]; // Keep last 20
      setRecentReports(newRecentReports);
      
      // Save to Firebase
      await saveReportingData({
        customReports,
        recentReports: newRecentReports,
        scheduledReports,
        preferences
      });
      
      return report;
      
    } catch (error) {
      console.error('Error generating report:', error);
      Sentry.captureException(error);
      throw error;
    }
  }, [isAuthReady, userId, relationshipId, availableReports, recentReports, customReports, scheduledReports, preferences, collectReportData, saveReportingData]);

  // Create custom report
  const createCustomReport = useCallback(async (definition) => {
    try {
      const customReport = {
        id: `custom-${Date.now()}`,
        name: definition.name,
        description: definition.description,
        category: definition.category || 'custom',
        sections: definition.sections,
        parameters: definition.parameters || [],
        createdAt: new Date(),
        createdBy: userId,
        isCustom: true
      };
      
      const newCustomReports = [...customReports, customReport];
      setCustomReports(newCustomReports);
      
      await saveReportingData({
        customReports: newCustomReports,
        recentReports,
        scheduledReports,
        preferences
      });
      
      return customReport;
      
    } catch (error) {
      console.error('Error creating custom report:', error);
      Sentry.captureException(error);
      throw error;
    }
  }, [customReports, recentReports, scheduledReports, preferences, userId, saveReportingData]);

  // Schedule a report
  const scheduleReport = useCallback(async (reportId, schedule) => {
    try {
      const scheduledReport = {
        id: `scheduled-${Date.now()}`,
        reportId,
        schedule: {
          frequency: schedule.frequency, // 'daily', 'weekly', 'monthly'
          dayOfWeek: schedule.dayOfWeek, // For weekly
          dayOfMonth: schedule.dayOfMonth, // For monthly
          time: schedule.time || '09:00',
          timezone: schedule.timezone || 'UTC'
        },
        parameters: schedule.parameters || {},
        isActive: true,
        createdAt: new Date(),
        lastRun: null,
        nextRun: calculateNextRun(schedule)
      };
      
      const newScheduledReports = [...scheduledReports, scheduledReport];
      setScheduledReports(newScheduledReports);
      
      await saveReportingData({
        customReports,
        recentReports,
        scheduledReports: newScheduledReports,
        preferences
      });
      
      return scheduledReport;
      
    } catch (error) {
      console.error('Error scheduling report:', error);
      Sentry.captureException(error);
      throw error;
    }
  }, [customReports, recentReports, scheduledReports, preferences, saveReportingData]);

  // Calculate next run time for scheduled report
  const calculateNextRun = useCallback((schedule) => {
    const now = new Date();
    const nextRun = new Date(now);
    
    switch (schedule.frequency) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        const daysUntilNextWeek = (7 - now.getDay() + (schedule.dayOfWeek || 0)) % 7;
        nextRun.setDate(now.getDate() + (daysUntilNextWeek || 7));
        break;
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1);
        nextRun.setDate(schedule.dayOfMonth || 1);
        break;
      default:
        nextRun.setDate(now.getDate() + 1);
    }
    
    const [hours, minutes] = (schedule.time || '09:00').split(':');
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return nextRun;
  }, []);

  // Export report in different formats
  const exportReport = useCallback(async (reportId, format) => {
    try {
      const report = recentReports.find(r => r.id === reportId);
      if (!report) {
        throw new Error('Report not found');
      }
      
      let exportData;
      let filename;
      let mimeType;
      
      switch (format) {
        case 'json':
          exportData = JSON.stringify(report, null, 2);
          filename = `${report.templateName}-${report.generatedAt.toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
          
        case 'csv':
          // Convert report data to CSV format
          const csvData = convertReportToCSV(report);
          exportData = csvData;
          filename = `${report.templateName}-${report.generatedAt.toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'pdf':
          // In a real implementation, this would generate a PDF
          exportData = `PDF Report: ${report.templateName}\nGenerated: ${report.generatedAt}\n\n${JSON.stringify(report.data, null, 2)}`;
          filename = `${report.templateName}-${report.generatedAt.toISOString().split('T')[0]}.pdf`;
          mimeType = 'application/pdf';
          break;
          
        default:
          throw new Error('Unsupported export format');
      }
      
      // Create download
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return {
        filename,
        size: blob.size,
        format,
        downloadUrl: url
      };
      
    } catch (error) {
      console.error('Error exporting report:', error);
      Sentry.captureException(error);
      throw error;
    }
  }, [recentReports]);

  // Convert report data to CSV format
  const convertReportToCSV = useCallback((report) => {
    try {
      let csvContent = `Report: ${report.templateName}\n`;
      csvContent += `Generated: ${report.generatedAt}\n\n`;
      
      // Convert data based on report type
      if (report.data.sessions) {
        csvContent += 'Sessions\n';
        csvContent += 'ID,Start Date,End Date,Duration (hours)\n';
        report.data.sessions.forEach(session => {
          csvContent += `${session.id},${session.startDate.toISOString()},${session.endDate.toISOString()},${session.duration / (1000 * 60 * 60)}\n`;
        });
      }
      
      if (report.data.tasks) {
        csvContent += '\nTasks\n';
        csvContent += 'ID,Status,Created,Completed,Category\n';
        report.data.tasks.forEach(task => {
          csvContent += `${task.id},${task.status},${task.createdAt.toISOString()},${task.completedAt ? task.completedAt.toISOString() : ''},${task.category || ''}\n`;
        });
      }
      
      if (report.data.goals) {
        csvContent += '\nGoals\n';
        csvContent += 'ID,Title,Status,Created,Completed,Category\n';
        report.data.goals.forEach(goal => {
          csvContent += `${goal.id},${goal.title},${goal.progress?.status || ''},${goal.createdAt.toISOString()},${goal.completedAt ? goal.completedAt.toISOString() : ''},${goal.category || ''}\n`;
        });
      }
      
      return csvContent;
      
    } catch (error) {
      console.error('Error converting report to CSV:', error);
      return 'Error generating CSV data';
    }
  }, []);

  // Export raw data
  const exportRawData = useCallback(async (dataType, filters) => {
    try {
      let data = [];
      let filename = `${dataType}-raw-data-${new Date().toISOString().split('T')[0]}`;
      
      switch (dataType) {
        case 'tasks':
          const tasksRef = collection(db, 'users', userId, 'tasks');
          const tasksSnapshot = await getDocs(query(tasksRef, orderBy('createdAt', 'desc')));
          data = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          break;
          
        case 'goals':
          const goalsRef = collection(db, 'users', userId, 'goals');
          const goalsSnapshot = await getDocs(query(goalsRef, orderBy('createdAt', 'desc')));
          data = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          break;
          
        case 'events':
          const eventsRef = collection(db, 'users', userId, 'events');
          const eventsSnapshot = await getDocs(query(eventsRef, orderBy('timestamp', 'desc')));
          data = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          break;
          
        default:
          throw new Error('Unsupported data type');
      }
      
      // Apply filters
      if (filters && filters.length > 0) {
        data = data.filter(item => {
          return filters.every(filter => {
            switch (filter.type) {
              case 'date_range':
                const itemDate = new Date(item[filter.field]);
                return itemDate >= new Date(filter.start) && itemDate <= new Date(filter.end);
              case 'equals':
                return item[filter.field] === filter.value;
              case 'contains':
                return item[filter.field] && item[filter.field].toString().includes(filter.value);
              default:
                return true;
            }
          });
        });
      }
      
      const exportData = JSON.stringify(data, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return {
        filename: `${filename}.json`,
        recordCount: data.length,
        size: blob.size
      };
      
    } catch (error) {
      console.error('Error exporting raw data:', error);
      Sentry.captureException(error);
      throw error;
    }
  }, [userId]);

  // Helper functions
  const getLastReportDate = useCallback((reports) => {
    if (reports.length === 0) return null;
    return reports.reduce((latest, report) => {
      return report.generatedAt > latest ? report.generatedAt : latest;
    }, reports[0].generatedAt);
  }, []);

  const checkScheduledReports = useCallback(() => {
    return scheduledReports.some(report => report.isActive);
  }, [scheduledReports]);

  // Computed values
  const totalReports = recentReports.length;
  const hasScheduledReports = checkScheduledReports();
  const lastReportDate = getLastReportDate(recentReports);

  return {
    // Report management
    availableReports,
    customReports,
    recentReports,
    scheduledReports,
    preferences,
    isLoading,
    
    // Report generation
    generateReport,
    createCustomReport,
    scheduleReport,
    
    // Data export
    exportReport,
    exportRawData,
    
    // Computed values
    totalReports,
    hasScheduledReports,
    lastReportDate
  };
};