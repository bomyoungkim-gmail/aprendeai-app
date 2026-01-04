/**
 * Transfer Task DTO - For just-in-time interventions
 * AGENT SCRIPT A
 */

export type TransferIntent =
  | 'HUGGING'
  | 'BRIDGING'
  | 'ANALOGY'
  | 'TIER2'
  | 'MORPHOLOGY'
  | 'ICEBERG'
  | 'CONNECTION_CIRCLE'
  | 'PKM'
  | 'MISSION_FEEDBACK'
  | 'METACOGNITION'
  | 'HIGH_ROAD'; // AGENT SCRIPT B

export interface TransferTaskDto {
  intent: TransferIntent;
  userId: string;
  sessionId: string;
  contentId: string;
  
  // Context data
  transferMetadata?: {
    concept?: string;
    analogies_json?: any[];
    domains_json?: any[];
    [key: string]: any;
  };
  
  missionData?: {
    mission_type?: string;
    rubric?: any;
    template?: string;
    user_attempt?: string;
    [key: string]: any;
  };
  
  userProfile?: {
    schooling_level?: string;
    language_proficiency?: string;
    mastery_state_json?: any;  // AGENT SCRIPT C: Mastery scores for scaffolding
    scaffolding_state_json?: any;  // AGENT SCRIPT C: Current scaffolding preferences
    [key: string]: any;
  };
  
  // AGENT SCRIPT D: Light RAG - Pass context chunks to avoid vector search
  contextChunks?: Array<{
    id: string;
    text: string;
    page?: number;
  }>;
}

export interface TransferTaskResultDto {
  responseText: string;
  structuredOutput?: any;
  eventsToWrite?: any[];
  tokensUsed?: number;
  modelUsed?: string;
}
