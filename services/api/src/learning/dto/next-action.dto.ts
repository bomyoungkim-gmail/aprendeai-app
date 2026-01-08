export class NextActionDto {
  id: string;
  type: 'CHECKPOINT' | 'INTERVENTION' | 'SRS_REVIEW' | 'CONTENT_NAV';
  priority: number; // 0-100
  title: string;
  description?: string;
  reasonCode: string;
  payload: any;
  
  // Metadata for UI
  icon?: string;
  actionLabel?: string;
  isBlocking: boolean;
}

export class NextActionsResponseDto {
  actions: NextActionDto[];
  sessionId: string;
  timestamp: Date;
}
