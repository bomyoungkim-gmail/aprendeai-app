// Study Groups Types
export interface StudyGroup {
  id: string;
  ownerUserId: string;
  scopeType?: 'USER' | 'INSTITUTION';
  scopeId?: string;
  name: string;
  createdAt: string;
  members?: StudyGroupMember[];
  contents?: GroupContent[];
  _count?: {
    members: number;
    contents: number;
    sessions: number;
  };
}

export interface StudyGroupMember {
  groupId: string;
  userId: string;
  role: 'OWNER' | 'MOD' | 'MEMBER';
  status: 'ACTIVE' | 'INVITED' | 'REMOVED';
  joinedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface GroupContent {
  groupId: string;
  contentId: string;
  addedByUserId: string;
  createdAt: string;
  content?: {
    id: string;
    title: string;
    type: string;
  };
}

export interface GroupSession {
  id: string;
  groupId: string;
  contentId: string;
  mode: 'PI_SPRINT' | 'JIGSAW_MICRO' | 'TBL_LITE';
  layer: string;
  status: 'CREATED' | 'RUNNING' | 'POST' | 'FINISHED';
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  group?: StudyGroup;
  content?: {
    id: string;
    title: string;
    type: string;
  };
  members?: GroupSessionMember[];
  rounds?: GroupRound[];
}

export interface GroupSessionMember {
  sessionId: string;
  userId: string;
  assignedRole: 'FACILITATOR' | 'TIMEKEEPER' | 'CLARIFIER' | 'CONNECTOR' | 'SCRIBE';
  attendanceStatus: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface GroupRound {
  id: string;
  sessionId: string;
  roundIndex: number;
  roundType: string;
  promptJson: {
    prompt_text: string;
    options: string[] | null;
    linked_highlight_ids?: string[];
  };
  timingJson: {
    voteSec: number;
    discussSec: number;
    revoteSec: number;
    explainSec: number;
  };
  status: 'CREATED' | 'VOTING' | 'DISCUSSING' | 'REVOTING' | 'EXPLAINING' | 'DONE';
  createdAt: string;
}

export interface GroupEvent {
  id: string;
  sessionId: string;
  roundId?: string;
  userId?: string;
  eventType: string;
  payloadJson: any;
  createdAt: string;
  round?: {
    roundIndex: number;
  };
}

export interface SharedCard {
  id: string;
  sessionId: string;
  roundId: string;
  createdByUserId: string;
  cardJson: {
    prompt: string;
    groupAnswer: string;
    explanation: string;
    linkedHighlightIds: string[];
    keyTerms: string[];
  };
  createdAt: string;
  round?: {
    roundIndex: number;
    status: string;
  };
}

// DTOs
export interface CreateGroupDto {
  name: string;
  scopeType?: 'USER' | 'INSTITUTION';
  scopeId?: string;
}

export interface InviteStudyMemberDto {
  userId: string;
  role: 'OWNER' | 'MOD' | 'MEMBER';
}

export interface CreateSessionDto {
  contentId: string;
  mode?: 'PI_SPRINT' | 'JIGSAW_MICRO' | 'TBL_LITE';
  layer?: string;
  roundsCount: number;
}

export interface SubmitEventDto {
  roundIndex: number;
  eventType: string;
  payload: any;
}
