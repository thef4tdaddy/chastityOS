import Dexie, { type Table } from "dexie";
import {
  ChastitySession,
  Task,
  SessionEvent,
  PersonalGoal,
  AppSettings,
} from "@/types/core";

export class ChastityOSDatabase extends Dexie {
  // Define all tables with proper typing
  sessions!: Table<ChastitySession>;
  tasks!: Table<Task>;
  events!: Table<SessionEvent>;
  goals!: Table<PersonalGoal>;
  settings!: Table<AppSettings>;

  constructor() {
    super("ChastityOSDatabase");
    this.version(1).stores({
      sessions: "&id, userId, status, startTime, endTime, isActive",
      tasks:
        "&id, userId, keyholderUserId, status, priority, dueDate, createdAt",
      events: "++id, sessionId, userId, type, timestamp",
      goals: "&id, userId, isCompleted, targetDuration, createdAt",
      settings: "&id",
    });
  }
}

export const db = new ChastityOSDatabase();
