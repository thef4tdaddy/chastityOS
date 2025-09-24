
/**
 * Firebase Sync Service
 * Handles bidirectional data sync between Dexie and Firebase
 */
import { serviceLogger } from "@/utils/logging";
import { db, sessionDBService, eventDBService, taskDBService, goalDBService, settingsDBService } from "../database";
import { getFirestore, getFirebaseAuth } from "../firebase";
import { collection, doc, setDoc, writeBatch, query, where, getDocs, Timestamp } from "firebase/firestore";
import type { DBEvent, DBGoal, DBSession, DBSettings, DBTask } from "@/types/database";
import { conflictResolver } from "./ConflictResolver";

const logger = serviceLogger("FirebaseSync");

export class FirebaseSync {
