/**
 * Account Linking Service
 * Handles secure linking between keyholder and wearer accounts
 */
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestore } from "../firebase";
import {
  LinkCode,
  LinkCodeResponse,
  AdminRelationship,
  AdminSession,
  GenerateLinkCodeRequest,
  UseLinkCodeRequest,
  UpdateRelationshipRequest,
  LinkCodeValidation,
  AdminPermissions,
  SecuritySettings,
  PrivacySettings,
} from "../../types/account-linking";
import { ApiResponse } from "../../types";
import { serviceLogger } from "../../utils/logging";
import { generateUUID } from "../../utils/helpers/hash";

const logger = serviceLogger("AccountLinkingService");

export class AccountLinkingService {
  private static readonly APP_URL = "https://chastityos.app";
  private static readonly LINK_CODE_LENGTH = 12;
  private static readonly DEFAULT_CODE_EXPIRY_HOURS = 24;
  private static readonly DEFAULT_SESSION_TIMEOUT_MINUTES = 30;

  /**
   * Generate a secure link code for account linking
   */
  static async generateLinkCode(
    request: GenerateLinkCodeRequest = {},
  ): Promise<ApiResponse<LinkCodeResponse>> {
    try {
      const auth = await getFirebaseAuth();
      const db = await getFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return {
          success: false,
          error: "Authentication required to generate link codes",
        };
      }

      // Generate secure code
      const code = this.generateSecureCode();
      const expirationHours =
        request.expirationHours || this.DEFAULT_CODE_EXPIRY_HOURS;
      const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

      const linkCodeData: LinkCode = {
        id: code,
        wearerId: currentUser.uid,
        createdAt: serverTimestamp() as Timestamp,
        expiresAt: Timestamp.fromDate(expiresAt),
        status: "pending",
        maxUses: request.maxUses || 1,
        usedBy: null,
        shareMethod: request.shareMethod || "manual",
      };

      // Save to Firestore
      await setDoc(doc(db as any, "linkCodes", code), linkCodeData);

      const response: LinkCodeResponse = {
        code,
        expiresIn: `${expirationHours} hours`,
        shareUrl: `${this.APP_URL}/link/${code}`,
      };

      if (request.shareMethod === "qr") {
        response.qrCodeData = this.generateQRCodeData(code);
      }

      logger.info("Link code generated successfully", {
        code,
        userId: currentUser.uid,
      });

      return {
        success: true,
        data: response,
        message: "Link code generated successfully",
      };
    } catch (error) {
      logger.error("Failed to generate link code", { error: error as Error });
      return {
        success: false,
        error: "Failed to generate link code. Please try again.",
      };
    }
  }

  /**
   * Use a link code to establish admin relationship
   */
  static async redeemLinkCode(
    request: UseLinkCodeRequest,
  ): Promise<ApiResponse<AdminRelationship>> {
    try {
      const auth = await getFirebaseAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return {
          success: false,
          error: "Authentication required to use link codes",
        };
      }

      // Validate the code
      const validation = await this.validateLinkCode(request.code);
      if (!validation.isValid || !validation.code) {
        return {
          success: false,
          error: validation.error || "Invalid link code",
        };
      }

      const linkCode = validation.code;

      // Create admin relationship
      const relationship = await this.createAdminRelationship(
        currentUser.uid,
        linkCode.wearerId,
        request,
      );

      // Mark code as used
      await this.markCodeAsUsed(request.code, currentUser.uid);

      logger.info("Link code used successfully", {
        code: request.code,
        keyholderId: currentUser.uid,
        wearerId: linkCode.wearerId,
      });

      return {
        success: true,
        data: relationship,
        message: "Account linked successfully",
      };
    } catch (error) {
      logger.error("Failed to use link code", { error: error as Error });
      return {
        success: false,
        error: "Failed to use link code. Please try again.",
      };
    }
  }

  /**
   * Validate a link code
   */
  static async validateLinkCode(code: string): Promise<LinkCodeValidation> {
    try {
      const db = await getFirestore();
      const linkDoc = await getDoc(doc(db as any, "linkCodes", code));

      if (!linkDoc.exists()) {
        return {
          isValid: false,
          error: "Invalid or expired link code",
          canUse: false,
        };
      }

      const linkData = linkDoc.data() as LinkCode;

      // Check if expired
      const now = new Date();
      const expiresAt = linkData.expiresAt.toDate();
      if (expiresAt < now) {
        return {
          isValid: false,
          error: "Link code has expired",
          canUse: false,
          code: linkData,
        };
      }

      // Check if already used
      if (linkData.status !== "pending" || linkData.usedBy !== null) {
        return {
          isValid: false,
          error: "Link code has already been used",
          canUse: false,
          code: linkData,
        };
      }

      const timeRemaining = Math.floor(
        (expiresAt.getTime() - now.getTime()) / 1000,
      );

      return {
        isValid: true,
        canUse: true,
        code: linkData,
        timeRemaining,
      };
    } catch (error) {
      logger.error("Error validating link code", { error: error as Error });
      return {
        isValid: false,
        error: "Error validating link code",
        canUse: false,
      };
    }
  }

  /**
   * Get admin relationships for a user
   */
  static async getAdminRelationships(
    userId: string,
  ): Promise<AdminRelationship[]> {
    try {
      const db = await getFirestore();

      // Get relationships where user is either keyholder or wearer
      const [keyholderQuery, wearerQuery] = await Promise.all([
        getDocs(
          query(
            collection(db as any, "adminRelationships"),
            where("keyholderId", "==", userId),
            where("status", "==", "active"),
          ),
        ),
        getDocs(
          query(
            collection(db as any, "adminRelationships"),
            where("wearerId", "==", userId),
            where("status", "==", "active"),
          ),
        ),
      ]);

      const relationships: AdminRelationship[] = [];

      keyholderQuery.forEach((doc) => {
        relationships.push(doc.data() as AdminRelationship);
      });

      wearerQuery.forEach((doc) => {
        relationships.push(doc.data() as AdminRelationship);
      });

      return relationships;
    } catch (error) {
      logger.error("Failed to get admin relationships", {
        error: error as Error,
      });
      return [];
    }
  }

  /**
   * Update an existing admin relationship
   */
  static async updateRelationship(
    request: UpdateRelationshipRequest,
  ): Promise<ApiResponse<AdminRelationship>> {
    try {
      const auth = await getFirebaseAuth();
      const db = await getFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return {
          success: false,
          error: "Authentication required",
        };
      }

      // Get existing relationship
      const relationshipDoc = await getDoc(
        doc(db as any, "adminRelationships", request.relationshipId),
      );

      if (!relationshipDoc.exists()) {
        return {
          success: false,
          error: "Relationship not found",
        };
      }

      const relationship = relationshipDoc.data() as AdminRelationship;

      // Check permissions
      const canUpdate =
        currentUser.uid === relationship.wearerId ||
        currentUser.uid === relationship.keyholderId;

      if (!canUpdate) {
        return {
          success: false,
          error: "Permission denied",
        };
      }

      // Prepare update data
      const updateData: Partial<AdminRelationship> = {};

      if (request.status) {
        updateData.status = request.status;
        if (request.status === "terminated") {
          updateData.terminatedAt = serverTimestamp() as Timestamp;
          updateData.terminatedBy =
            currentUser.uid === relationship.wearerId ? "wearer" : "keyholder";
          updateData.terminationReason = request.terminationReason;
        }
      }

      // Update the relationship
      await updateDoc(
        doc(db as any, "adminRelationships", request.relationshipId),
        updateData,
      );

      // Get updated relationship
      const updatedDoc = await getDoc(
        doc(db as any, "adminRelationships", request.relationshipId),
      );
      const updatedRelationship = updatedDoc.data() as AdminRelationship;

      return {
        success: true,
        data: updatedRelationship,
        message: "Relationship updated successfully",
      };
    } catch (error) {
      logger.error("Failed to update relationship", { error: error as Error });
      return {
        success: false,
        error: "Failed to update relationship. Please try again.",
      };
    }
  }

  /**
   * Start an admin session
   */
  static async startAdminSession(
    relationshipId: string,
  ): Promise<ApiResponse<AdminSession>> {
    try {
      const auth = await getFirebaseAuth();
      const db = await getFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return {
          success: false,
          error: "Authentication required",
        };
      }

      const sessionId = generateUUID();
      const timeoutMinutes = this.DEFAULT_SESSION_TIMEOUT_MINUTES;
      const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

      const session: AdminSession = {
        id: sessionId,
        relationshipId,
        keyholderId: currentUser.uid,
        wearerId: "", // Will be filled from relationship
        startedAt: serverTimestamp() as Timestamp,
        expiresAt: Timestamp.fromDate(expiresAt),
        lastActivity: serverTimestamp() as Timestamp,
        actions: {
          sessionViews: 0,
          taskActions: 0,
          settingChanges: 0,
          emergencyActions: 0,
          dataExports: 0,
        },
        isActive: true,
      };

      await setDoc(doc(db as any, "adminSessions", sessionId), session);

      return {
        success: true,
        data: session,
        message: "Admin session started",
      };
    } catch (error) {
      logger.error("Failed to start admin session", { error: error as Error });
      return {
        success: false,
        error: "Failed to start admin session. Please try again.",
      };
    }
  }

  // Private methods
  private static async createAdminRelationship(
    keyholderId: string,
    wearerId: string,
    request: UseLinkCodeRequest,
  ): Promise<AdminRelationship> {
    const db = await getFirestore();
    const relationshipId = generateUUID();

    const defaultPermissions: AdminPermissions = {
      viewSessions: true,
      viewEvents: true,
      viewTasks: true,
      viewSettings: true,
      controlSessions: true,
      manageTasks: true,
      editSettings: false,
      setGoals: true,
      emergencyUnlock: false,
      forceEnd: false,
      viewAuditLog: true,
      exportData: false,
    };

    const defaultSecurity: SecuritySettings = {
      requireConfirmation: true,
      auditLog: true,
      sessionTimeout: this.DEFAULT_SESSION_TIMEOUT_MINUTES,
      requireReauth: false,
      ipRestrictions: [],
    };

    const defaultPrivacy: PrivacySettings = {
      wearerCanSeeAdminActions: true,
      keyholderCanSeePrivateNotes: false,
      shareStatistics: true,
      retainDataAfterDisconnect: false,
      anonymizeHistoricalData: true,
    };

    const relationship: AdminRelationship = {
      id: relationshipId,
      keyholderId,
      wearerId,
      establishedAt: serverTimestamp() as Timestamp,
      status: "active",
      permissions: { ...defaultPermissions, ...request.permissions },
      security: { ...defaultSecurity, ...request.security },
      privacy: { ...defaultPrivacy, ...request.privacy },
      linkMethod: "code",
    };

    await setDoc(
      doc(db as any, "adminRelationships", relationshipId),
      relationship,
    );
    return relationship;
  }

  private static generateSecureCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    const array = new Uint8Array(this.LINK_CODE_LENGTH);
    crypto.getRandomValues(array);
    for (let i = 0; i < this.LINK_CODE_LENGTH; i++) {
      const value = array[i];
      if (value !== undefined) {
        result += chars[value % chars.length];
      }
    }
    return result;
  }

  private static generateQRCodeData(code: string): string {
    return JSON.stringify({
      type: "chastityos_link",
      code,
      version: "1.0",
      appUrl: this.APP_URL,
    });
  }

  private static async markCodeAsUsed(
    code: string,
    keyholderId: string,
  ): Promise<void> {
    const db = await getFirestore();
    await updateDoc(doc(db as any, "linkCodes", code), {
      status: "used",
      usedBy: keyholderId,
      usedAt: serverTimestamp(),
    });
  }
}
