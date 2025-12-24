export interface GameMetadata {
  id: string;
  name: string;
  difficulty_range: [number, number];
  duration_min: number;
  requires_content: boolean;
  game_intent: string;
}

export interface GameCatalogResponse {
  games: GameMetadata[];
  total: number;
}
