import { Highlight } from "../entities/highlight.entity";

export interface IHighlightsRepository {
  findAllByContent(contentId: string, userId: string): Promise<Highlight[]>;
  findById(id: string): Promise<Highlight | null>;
  create(highlight: Highlight): Promise<Highlight>;
  update(highlight: Highlight): Promise<Highlight>;
  delete(id: string): Promise<void>;
}

export const IHighlightsRepository = Symbol("IHighlightsRepository");
