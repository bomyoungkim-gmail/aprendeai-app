export interface SearchResult {
  id: string;
  type: "content" | "annotation" | "note" | "transcript";
  title: string;
  snippet: string;
  relevance: number;
  metadata: any;
  created_at: Date;
}

export interface ISearchRepository {
  searchContent(query: string, filters: any): Promise<SearchResult[]>;
  searchAnnotations(userId: string, query: string): Promise<SearchResult[]>;
  searchNotes(userId: string, query: string): Promise<SearchResult[]>;
  searchTranscripts(query: string, userId?: string): Promise<SearchResult[]>;
}

export const ISearchRepository = Symbol("ISearchRepository");
