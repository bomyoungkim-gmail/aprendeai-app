/**
 * Glossary Service - Backend
 *
 * Following MelhoresPraticas.txt (Backend):
 * - Controller fino (presentation layer)
 * - Service com lógica de aplicação
 * - Domain logic isolado
 *
 * G5.3: Scientific glossary with API priority
 */

import { Controller, Get, Query, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface Definition {
  term: string;
  definition: string;
  source: "PubMed" | "Wikipedia" | "Wiktionary";
  examples?: string[];
}

@Injectable()
export class GlossaryService {
  constructor(private prisma: PrismaService) {}

  /**
   * G5.3: Get scientific definition with API priority
   * Priority: PubMed → Wikipedia → Wiktionary
   */
  async getScientificDefinition(term: string): Promise<Definition> {
    // Check cache first
    const cached = await this.getCachedDefinition(term);
    if (cached) return cached;

    // Priority 1: PubMed/NCBI (free, authoritative)
    try {
      const pubmedDef = await this.fetchFromPubMed(term);
      await this.cacheDefinition(term, pubmedDef);
      return pubmedDef;
    } catch (error) {
      console.warn("PubMed lookup failed:", error);
    }

    // Priority 2: Wikipedia Scientific (free)
    try {
      const wikipediaDef = await this.fetchFromWikipedia(term);
      await this.cacheDefinition(term, wikipediaDef);
      return wikipediaDef;
    } catch (error) {
      console.warn("Wikipedia lookup failed:", error);
    }

    // Priority 3: Wiktionary (fallback)
    try {
      const wiktionaryDef = await this.fetchFromWiktionary(term);
      await this.cacheDefinition(term, wiktionaryDef);
      return wiktionaryDef;
    } catch (error) {
      throw new Error(`No definition found for term: ${term}`);
    }
  }

  private async fetchFromPubMed(term: string): Promise<Definition> {
    // Placeholder - would integrate with PubMed API
    // https://www.ncbi.nlm.nih.gov/books/NBK25501/
    throw new Error("PubMed integration pending");
  }

  private async fetchFromWikipedia(term: string): Promise<Definition> {
    // Placeholder - would integrate with Wikipedia API
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`,
    );

    if (!response.ok) throw new Error("Wikipedia lookup failed");

    const data = await response.json();

    return {
      term,
      definition: data.extract || "No definition available",
      source: "Wikipedia",
      examples: [],
    };
  }

  private async fetchFromWiktionary(term: string): Promise<Definition> {
    // Placeholder - would integrate with Wiktionary API
    throw new Error("Wiktionary integration pending");
  }

  private async getCachedDefinition(term: string): Promise<Definition | null> {
    // Cache in database for 30 days
    const cached = await this.prisma.glossary_cache.findUnique({
      where: { term },
    });

    if (!cached) return null;

    const age = Date.now() - cached.created_at.getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    if (age > thirtyDays) {
      await this.prisma.glossary_cache.delete({ where: { term } });
      return null;
    }

    return cached.definition as unknown as Definition;
  }

  private async cacheDefinition(
    term: string,
    definition: Definition,
  ): Promise<void> {
    await this.prisma.glossary_cache.upsert({
      where: { term },
      create: {
        term,
        definition: definition as any,
        created_at: new Date(),
      },
      update: {
        definition: definition as any,
        created_at: new Date(),
      },
    });
  }
}

@Controller("glossary")
export class GlossaryController {
  constructor(private glossaryService: GlossaryService) {}

  @Get("definition")
  async getDefinition(@Query("term") term: string): Promise<Definition> {
    return await this.glossaryService.getScientificDefinition(term);
  }
}
