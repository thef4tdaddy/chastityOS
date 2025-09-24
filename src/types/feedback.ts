// src/types/feedback.ts

export type FeedbackType = 'bug' | 'feature' | 'general';

export interface SystemInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  viewportSize: string;
  timezone: string;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  serviceWorker: boolean;
  timestamp: string;
  url: string;
  referrer: string;
}

export interface FeedbackData {
  type: FeedbackType;
  title: string;
  description: string;
  steps?: string; // For bug reports
  expected?: string; // For bug reports  
  actual?: string; // For bug reports
  priority: 'low' | 'medium' | 'high';
  category?: string;
  contactEmail?: string;
  includeSystemInfo: boolean;
  screenshot?: File | null;
  systemInfo?: SystemInfo | null;
  timestamp: Date;
  userAgent: string;
  url: string;
}

export interface FeedbackModalProps {
  type: FeedbackType | null;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => Promise<void>;
}