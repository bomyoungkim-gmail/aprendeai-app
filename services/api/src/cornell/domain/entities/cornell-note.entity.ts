export class CornellNote {
  id: string;
  contentId: string;
  userId: string;
  notes: any[]; // JSON
  summary: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<CornellNote>) {
    Object.assign(this, partial);
  }
}
