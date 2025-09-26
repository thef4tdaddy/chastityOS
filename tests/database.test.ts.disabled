/**
 * Unit tests for Dexie Database Services
 * Tests all CRUD operations, specialized methods, and error handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../src/services/storage/ChastityDB';
import {
  sessionDBService,
  eventDBService,
  taskDBService,
  goalDBService,
  settingsDBService,
} from '../src/services/database';
import type { DBSession, DBEvent, DBTask, DBGoal, DBSettings } from '../src/types/database';

describe('ChastityDB Database Services', () => {
  const testUserId = 'test-user-123';
  
  beforeEach(async () => {
    // Clear all tables before each test
    await db.delete();
    await db.open();
    await db.initialize();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.close();
  });

  describe('SessionDBService', () => {
    it('should start a new session', async () => {
      const sessionId = await sessionDBService.startSession(testUserId, {
        goalDuration: 3600, // 1 hour
        isHardcoreMode: false,
        notes: 'Test session'
      });

      expect(sessionId).toBeDefined();
      
      const session = await sessionDBService.findById(sessionId);
      expect(session).toBeDefined();
      expect(session!.userId).toBe(testUserId);
      expect(session!.goalDuration).toBe(3600);
      expect(session!.isHardcoreMode).toBe(false);
      expect(session!.notes).toBe('Test session');
      expect(session!.isPaused).toBe(false);
      expect(session!.accumulatedPauseTime).toBe(0);
      expect(session!.syncStatus).toBe('pending');
    });

    it('should prevent starting multiple active sessions', async () => {
      await sessionDBService.startSession(testUserId);
      
      await expect(
        sessionDBService.startSession(testUserId)
      ).rejects.toThrow('User already has an active session');
    });

    it('should get current active session', async () => {
      const sessionId = await sessionDBService.startSession(testUserId);
      
      const currentSession = await sessionDBService.getCurrentSession(testUserId);
      expect(currentSession).toBeDefined();
      expect(currentSession!.id).toBe(sessionId);
      expect(currentSession!.endTime).toBeUndefined();
    });

    it('should pause and resume session correctly', async () => {
      const sessionId = await sessionDBService.startSession(testUserId);
      const pauseTime = new Date();
      
      await sessionDBService.pauseSession(sessionId, pauseTime);
      
      let session = await sessionDBService.findById(sessionId);
      expect(session!.isPaused).toBe(true);
      expect(session!.pauseStartTime).toEqual(pauseTime);
      
      // Wait a bit before resuming
      await new Promise(resolve => setTimeout(resolve, 100));
      const resumeTime = new Date();
      
      await sessionDBService.resumeSession(sessionId, resumeTime);
      
      session = await sessionDBService.findById(sessionId);
      expect(session!.isPaused).toBe(false);
      expect(session!.pauseStartTime).toBeUndefined();
      expect(session!.accumulatedPauseTime).toBeGreaterThan(0);
    });

    it('should end session correctly', async () => {
      const sessionId = await sessionDBService.startSession(testUserId);
      const endTime = new Date();
      
      await sessionDBService.endSession(sessionId, endTime, 'Test completed');
      
      const session = await sessionDBService.findById(sessionId);
      expect(session!.endTime).toEqual(endTime);
      expect(session!.endReason).toBe('Test completed');
      expect(session!.isPaused).toBe(false);
    });

    it('should calculate effective duration correctly', () => {
      const startTime = new Date('2024-01-01 10:00:00');
      const endTime = new Date('2024-01-01 12:00:00');
      
      const session: DBSession = {
        id: 'test-session',
        userId: testUserId,
        startTime,
        endTime,
        isPaused: false,
        accumulatedPauseTime: 300, // 5 minutes
        isHardcoreMode: false,
        keyholderApprovalRequired: false,
        syncStatus: 'synced',
        lastModified: new Date()
      };
      
      const effectiveDuration = sessionDBService.calculateEffectiveDuration(session);
      expect(effectiveDuration).toBe(7200 - 300); // 2 hours - 5 minutes = 6900 seconds
    });

    it('should get session statistics', async () => {
      // Create test sessions
      const session1Id = await sessionDBService.startSession(testUserId);
      await sessionDBService.endSession(session1Id, new Date());
      
      const session2Id = await sessionDBService.startSession(testUserId);
      
      const stats = await sessionDBService.getSessionStats(testUserId);
      
      expect(stats.totalSessions).toBe(2);
      expect(stats.activeSessions).toBe(1);
      expect(stats.totalDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('EventDBService', () => {
    it('should log a new event', async () => {
      const eventId = await eventDBService.logEvent(
        testUserId,
        'orgasm',
        { intensity: 8, notes: 'Test event' },
        { isPrivate: true }
      );

      expect(eventId).toBeDefined();
      
      const event = await eventDBService.findById(eventId);
      expect(event).toBeDefined();
      expect(event!.userId).toBe(testUserId);
      expect(event!.type).toBe('orgasm');
      expect(event!.details.intensity).toBe(8);
      expect(event!.isPrivate).toBe(true);
      expect(event!.syncStatus).toBe('pending');
    });

    it('should get events by type', async () => {
      await eventDBService.logEvent(testUserId, 'orgasm', { notes: 'Event 1' });
      await eventDBService.logEvent(testUserId, 'milestone', { notes: 'Event 2' });
      await eventDBService.logEvent(testUserId, 'orgasm', { notes: 'Event 3' });

      const orgasmEvents = await eventDBService.getEventsByType(testUserId, 'orgasm');
      expect(orgasmEvents).toHaveLength(2);
      expect(orgasmEvents.every(e => e.type === 'orgasm')).toBe(true);
    });

    it('should get events in date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const outsideDate = new Date('2024-02-15');

      await eventDBService.logEvent(testUserId, 'note', { notes: 'January event' }, {
        timestamp: new Date('2024-01-15')
      });
      await eventDBService.logEvent(testUserId, 'note', { notes: 'February event' }, {
        timestamp: outsideDate
      });

      const events = await eventDBService.getEventsInDateRange(testUserId, startDate, endDate);
      expect(events).toHaveLength(1);
      expect(events[0].details.notes).toBe('January event');
    });
  });

  describe('TaskDBService', () => {
    it('should add a new task', async () => {
      const taskId = await taskDBService.addTask(testUserId, 'Test task', {
        description: 'A test task description',
        priority: 'high',
        assignedBy: 'keyholder',
        dueDate: new Date('2024-12-31')
      });

      expect(taskId).toBeDefined();

      const task = await taskDBService.findById(taskId);
      expect(task).toBeDefined();
      expect(task!.text).toBe('Test task');
      expect(task!.description).toBe('A test task description');
      expect(task!.priority).toBe('high');
      expect(task!.status).toBe('pending');
      expect(task!.assignedBy).toBe('keyholder');
    });

    it('should update task status correctly', async () => {
      const taskId = await taskDBService.addTask(testUserId, 'Test task');

      await taskDBService.updateTaskStatus(taskId, 'submitted', {
        submissiveNote: 'Task completed as requested'
      });

      const task = await taskDBService.findById(taskId);
      expect(task!.status).toBe('submitted');
      expect(task!.submittedAt).toBeDefined();
      expect(task!.submissiveNote).toBe('Task completed as requested');
    });

    it('should get tasks by status', async () => {
      await taskDBService.addTask(testUserId, 'Pending task 1');
      await taskDBService.addTask(testUserId, 'Pending task 2');
      
      const taskId = await taskDBService.addTask(testUserId, 'Completed task');
      await taskDBService.updateTaskStatus(taskId, 'completed');

      const pendingTasks = await taskDBService.getTasksByStatus(testUserId, 'pending');
      const completedTasks = await taskDBService.getTasksByStatus(testUserId, 'completed');

      expect(pendingTasks).toHaveLength(2);
      expect(completedTasks).toHaveLength(1);
    });

    it('should identify overdue tasks', async () => {
      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2030-01-01');

      const overdueTaskId = await taskDBService.addTask(testUserId, 'Overdue task', {
        dueDate: pastDate
      });
      await taskDBService.addTask(testUserId, 'Future task', {
        dueDate: futureDate
      });

      const overdueTasks = await taskDBService.getOverdueTasks(testUserId);
      expect(overdueTasks).toHaveLength(1);
      expect(overdueTasks[0].id).toBe(overdueTaskId);
    });
  });

  describe('GoalDBService', () => {
    it('should add a new goal', async () => {
      const goalId = await goalDBService.addGoal(testUserId, {
        type: 'duration',
        title: 'Complete 7 days',
        description: 'Complete a full week of chastity',
        targetValue: 604800, // 7 days in seconds
        unit: 'seconds',
        createdBy: 'submissive'
      });

      expect(goalId).toBeDefined();

      const goal = await goalDBService.findById(goalId);
      expect(goal).toBeDefined();
      expect(goal!.title).toBe('Complete 7 days');
      expect(goal!.type).toBe('duration');
      expect(goal!.targetValue).toBe(604800);
      expect(goal!.currentValue).toBe(0);
      expect(goal!.isCompleted).toBe(false);
    });

    it('should update goal progress', async () => {
      const goalId = await goalDBService.addGoal(testUserId, {
        type: 'task_completion',
        title: 'Complete 10 tasks',
        targetValue: 10,
        unit: 'tasks',
        createdBy: 'keyholder'
      });

      await goalDBService.updateProgress(goalId, 5);

      const goal = await goalDBService.findById(goalId);
      expect(goal!.currentValue).toBe(5);
      expect(goal!.isCompleted).toBe(false);

      await goalDBService.updateProgress(goalId, 10);

      const completedGoal = await goalDBService.findById(goalId);
      expect(completedGoal!.currentValue).toBe(10);
      expect(completedGoal!.isCompleted).toBe(true);
      expect(completedGoal!.completedAt).toBeDefined();
    });

    it('should get goals by type', async () => {
      await goalDBService.addGoal(testUserId, {
        type: 'duration',
        title: 'Duration goal',
        targetValue: 3600,
        unit: 'seconds',
        createdBy: 'submissive'
      });

      await goalDBService.addGoal(testUserId, {
        type: 'behavioral',
        title: 'Behavioral goal',
        targetValue: 1,
        unit: 'count',
        createdBy: 'keyholder'
      });

      const durationGoals = await goalDBService.getGoalsByType(testUserId, 'duration');
      const behavioralGoals = await goalDBService.getGoalsByType(testUserId, 'behavioral');

      expect(durationGoals).toHaveLength(1);
      expect(behavioralGoals).toHaveLength(1);
    });
  });

  describe('SettingsDBService', () => {
    it('should get default settings for new user', async () => {
      const settings = await settingsDBService.getUserSettings(testUserId);
      
      expect(settings).toBeDefined();
      expect(settings.theme).toBe('dark');
      expect(settings.notifications.enabled).toBe(true);
      expect(settings.chastity.allowEmergencyUnlock).toBe(true);
    });

    it('should update user settings', async () => {
      await settingsDBService.updateSettings(testUserId, {
        theme: 'light',
        notifications: {
          enabled: false,
          sessionReminders: false,
          taskDeadlines: true,
          keyholderMessages: true,
          goalProgress: false
        }
      });

      const settings = await settingsDBService.getUserSettings(testUserId);
      expect(settings.theme).toBe('light');
      expect(settings.notifications.enabled).toBe(false);
      expect(settings.notifications.taskDeadlines).toBe(true);
    });
  });

  describe('Base Database Operations', () => {
    it('should handle sync status correctly', async () => {
      const sessionId = await sessionDBService.startSession(testUserId);
      
      // Should start as pending
      let session = await sessionDBService.findById(sessionId);
      expect(session!.syncStatus).toBe('pending');

      // Mark as synced
      await sessionDBService.markAsSynced(sessionId);
      session = await sessionDBService.findById(sessionId);
      expect(session!.syncStatus).toBe('synced');

      // Get pending sync items
      await sessionDBService.startSession(testUserId + '2');
      const pendingItems = await sessionDBService.getPendingSync(testUserId + '2');
      expect(pendingItems).toHaveLength(1);
    });

    it('should handle pagination correctly', async () => {
      // Create multiple events for pagination testing
      for (let i = 0; i < 25; i++) {
        await eventDBService.logEvent(testUserId, 'note', { notes: `Event ${i}` });
      }

      const page1 = await eventDBService.paginate(testUserId, 0, 10);
      expect(page1.data).toHaveLength(10);
      expect(page1.total).toBe(25);
      expect(page1.hasMore).toBe(true);

      const page2 = await eventDBService.paginate(testUserId, 10, 10);
      expect(page2.data).toHaveLength(10);
      expect(page2.hasMore).toBe(true);

      const page3 = await eventDBService.paginate(testUserId, 20, 10);
      expect(page3.data).toHaveLength(5);
      expect(page3.hasMore).toBe(false);
    });

    it('should handle bulk operations correctly', async () => {
      const ids: string[] = [];
      for (let i = 0; i < 5; i++) {
        const id = await eventDBService.logEvent(testUserId, 'note', { notes: `Event ${i}` });
        ids.push(id);
      }

      await eventDBService.bulkMarkAsSynced(ids);

      for (const id of ids) {
        const event = await eventDBService.findById(id);
        expect(event!.syncStatus).toBe('synced');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent records gracefully', async () => {
      const nonExistentId = 'non-existent-id';
      
      const session = await sessionDBService.findById(nonExistentId);
      expect(session).toBeUndefined();

      const exists = await sessionDBService.exists(nonExistentId);
      expect(exists).toBe(false);
    });

    it('should handle invalid operations gracefully', async () => {
      const sessionId = await sessionDBService.startSession(testUserId);
      await sessionDBService.endSession(sessionId);

      // Try to pause an ended session
      await expect(
        sessionDBService.pauseSession(sessionId)
      ).rejects.toThrow('Cannot pause ended session');

      // Try to resume a session that's not paused
      await expect(
        sessionDBService.resumeSession('non-existent-session')
      ).rejects.toThrow('Session not found');
    });
  });
});