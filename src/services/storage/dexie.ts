import Dexie, { type Table } from "dexie";
import { ChastitySession, Task, SessionEvent } from "@/types/core";

// Define a dummy interface for settings until it's formally typed
export interface AppSettings {
  id?: number; // Should be 1
  theme: "light" | "dark";
  notifications: boolean;
}

export class ChastityOSDatabase extends Dexie {
  // 'sessions', 'tasks', etc. are table names.
  sessions!: Table<ChastitySession>;
  tasks!: Table<Task>;
  events!: Table<SessionEvent>;
  settings!: Table<AppSettings>;

  constructor() {
    super("ChastityOSDatabase");
    this.version(1).stores({
      sessions: "&id, userId, status", // Primary key 'id', index on 'userId' and 'status'
      tasks: "&id, userId, status, dueDate",
      events: "++id, sessionId, type, timestamp", // Auto-incrementing primary key
      settings: "&id",
    });
  }
}

export const db = new ChastityOSDatabase();
