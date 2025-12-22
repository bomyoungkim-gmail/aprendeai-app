// Shared TypeScript types for browser extension

export interface Config {
  apiBaseUrl: string;
  authToken: string;
}

export interface PageContext {
  url: string;
  title: string;
  domain: string;
  selectionText: string;
}

export interface ReadabilityArticle {
  contentText: string;
  title: string;
}

// API Request/Response types (mirror backend DTOs)

export enum CaptureMode {
  SELECTION = 'SELECTION',
  READABILITY = 'READABILITY',
}

export interface CreateWebClipRequest {
  sourceUrl: string;
  title: string;
  siteDomain: string;
  captureMode: CaptureMode;
  selectionText?: string;
  contentText?: string;
  languageHint?: 'PT' | 'EN' | 'KO';
  tags?: string[];
}

export interface WebClipResponse {
  contentId: string;
  readerUrl: string;
}

export interface StartSessionRequest {
  assetLayer?: string;
  readingIntent?: 'inspectional' | 'analytical';
  timeboxMin?: number;
}

export interface StartSessionResponse {
  readingSessionId: string;
  threadId: string;
  nextPrompt: string;
}

export interface Classroom {
  classroomId: string;
  name: string;
  gradeLevel: string;
  enrollmentCount: number;
}

export interface ClassroomsResponse {
  classrooms: Classroom[];
}

// Extension message types

export type MessageType = 
  | 'GET_PAGE_CONTEXT'
  | 'EXTRACT_READABILITY'
  | 'CREATE_WEBCLIP_SELECTION'
  | 'CREATE_WEBCLIP_READABILITY'
  | 'CREATE_WEBCLIP_TEACHER';

export interface ExtensionMessage {
  type: MessageType;
  payload?: any;
}

export interface CreateWebClipPayload {
  goal?: string;
  timeboxMin: number;
  readingIntent: 'inspectional' | 'analytical';
  sendInitialPrompt: boolean;
  // Teacher mode
  isTeacherMode?: boolean;
  classroomId?: string;
}
