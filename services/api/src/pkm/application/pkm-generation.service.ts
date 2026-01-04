import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecisionService } from '../../decision/application/decision.service';
import { IPkmNoteRepository } from '../domain/repositories/pkm-note.repository.interface';
import { PkmNote } from '../domain/entities/pkm-note.entity';
import { PkmStructureBuilder } from '../domain/value-objects/pkm-structure.vo';
import { Backlinks } from '../domain/value-objects/backlinks.vo';
import { PkmNoteDto } from './dto/pkm-note.dto';
import { PkmNoteStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PkmGenerationService {
  private readonly logger = new Logger(PkmGenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly decisionService: DecisionService,
    @Inject(IPkmNoteRepository)
    private readonly pkmNoteRepository: IPkmNoteRepository,
  ) {}

  /**
   * Generate PKM note from reading session
   * SCRIPT 09: Main orchestration method
   */
  async generateFromSession(
    userId: string,
    sessionId: string,
  ): Promise<PkmNoteDto> {
    this.logger.debug(
      `Generating PKM note for user ${userId} from session ${sessionId}`,
    );

    // Fetch reading session with content_id and mission_id
    const session = await this.prisma.reading_sessions.findUnique({
      where: { id: sessionId },
      include: {
        contents: {
          include: {
            cornell_notes: {
              where: { user_id: userId },
            },
            section_transfer_metadata: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (session.user_id !== userId) {
      throw new NotFoundException(
        `Session ${sessionId} does not belong to user ${userId}`,
      );
    }

    if (!session.contents) {
      throw new NotFoundException(
        `Session ${sessionId} has no associated content`,
      );
    }

    // Get Cornell notes
    const cornellNote = session.contents.cornell_notes[0];
    if (!cornellNote) {
      throw new NotFoundException(
        `No Cornell notes found for content ${session.content_id}`,
      );
    }

    // Get transfer metadata
    const metadata = session.contents.section_transfer_metadata;

    // Build PKM note structure
    const pkmStructure = this.buildPkmNote(cornellNote, metadata);

    // Generate markdown body
    const builder = new PkmStructureBuilder()
      .setTitle(pkmStructure.title)
      .setDefinition(pkmStructure.definition)
      .setStructure(pkmStructure.structure)
      .setNearDomain(pkmStructure.nearDomain)
      .setFarDomain(pkmStructure.farDomain);

    if (pkmStructure.analogy) {
      builder.setAnalogy(pkmStructure.analogy);
    }

    const bodyMd = builder.toMarkdown();

    // Create PKM note entity
    const pkmNote = PkmNote.create({
      id: crypto.randomUUID(),
      userId,
      contentId: session.content_id,
      sessionId: session.id,
      missionId: undefined, // SCRIPT 09: mission_id not currently on reading_sessions
      title: pkmStructure.title,
      bodyMd,
      tags: this.extractTags(metadata),
      backlinks: {
        nearDomain: pkmStructure.nearDomain,
        farDomain: pkmStructure.farDomain,
      },
      sourceMetadata: {
        cornellNoteId: cornellNote.id,
        sectionIds: metadata.map((m) => m.id),
        conceptsUsed: this.extractConcepts(metadata),
      },
      status: PkmNoteStatus.GENERATED,
    });

    // Persist to database
    const createdNote = await this.pkmNoteRepository.create(pkmNote);

    this.logger.log(`PKM note ${createdNote.id} created for user ${userId}`);

    return this.toDto(createdNote);
  }

  /**
   * Build PKM note structure from Cornell notes and transfer metadata
   * SCRIPT 09: Deterministic generation logic
   */
  buildPkmNote(
    cornellNote: any,
    metadata: any[],
  ): {
    title: string;
    definition: string;
    structure: string;
    analogy?: string;
    nearDomain: string;
    farDomain: string;
  } {
    // Extract title from first concept or summary first line
    const title = this.extractTitle(cornellNote, metadata);

    // Extract definition (1-2 lines)
    const definition = this.extractDefinition(cornellNote, metadata);

    // Extract structure/bridging
    const structure = this.extractStructure(metadata);

    // Handle analogy (priority: analogies_json → LLM → skip)
    const analogy = this.extractAnalogy(metadata);

    // Build backlinks
    const { nearDomain, farDomain } = this.extractBacklinks(metadata);

    return {
      title,
      definition,
      structure,
      analogy,
      nearDomain,
      farDomain,
    };
  }

  /**
   * Confirm save: update status from GENERATED to SAVED
   */
  async confirmSave(noteId: string, userId: string): Promise<PkmNoteDto> {
    const note = await this.pkmNoteRepository.findById(noteId);

    if (!note) {
      throw new NotFoundException(`PKM note ${noteId} not found`);
    }

    if (note.userId !== userId) {
      throw new NotFoundException(
        `PKM note ${noteId} does not belong to user ${userId}`,
      );
    }

    const updatedNote = await this.pkmNoteRepository.updateStatus(
      noteId,
      PkmNoteStatus.SAVED,
    );

    this.logger.log(`PKM note ${noteId} saved by user ${userId}`);

    return this.toDto(updatedNote);
  }

  /**
   * Check if LLM policy allows analogy generation
   */
  async checkLLMPolicyForAnalogy(userId: string): Promise<boolean> {
    try {
      const policyResult =
        await this.decisionService.evaluateExtractionPolicy(
          userId,
          'POST',
          { estimatedTokens: 200 } as any, // Cast as any because context doesn't officially support estimatedTokens in type yet but implementation might allow payload
        );

      return policyResult.allowed;
    } catch (error) {
      this.logger.warn(
        `Failed to check LLM policy for user ${userId}: ${error.message}`,
      );
      return false;
    }
  }

  // ========== Private Helper Methods ==========

  private extractTitle(cornellNote: any, metadata: any[]): string {
    // Priority 1: First concept from metadata
    if (metadata.length > 0 && metadata[0].concept_json) {
      const conceptJson =
        typeof metadata[0].concept_json === 'string'
          ? JSON.parse(metadata[0].concept_json)
          : metadata[0].concept_json;

      if (conceptJson.title) {
        return conceptJson.title;
      }
      if (conceptJson.name) {
        return conceptJson.name;
      }
    }

    // Priority 2: Cornell summary first line
    if (cornellNote.summary_text) {
      const firstLine = cornellNote.summary_text.split('\n')[0].trim();
      if (firstLine.length > 0) {
        return firstLine.substring(0, 100); // Limit to 100 chars
      }
    }

    // Fallback
    return 'Untitled PKM Note';
  }

  private extractDefinition(cornellNote: any, metadata: any[]): string {
    // Priority 1: concept_json.definition
    if (metadata.length > 0 && metadata[0].concept_json) {
      const conceptJson =
        typeof metadata[0].concept_json === 'string'
          ? JSON.parse(metadata[0].concept_json)
          : metadata[0].concept_json;

      if (conceptJson.definition) {
        return conceptJson.definition;
      }
    }

    // Priority 2: Cornell summary first paragraph
    if (cornellNote.summary_text) {
      const firstParagraph = cornellNote.summary_text
        .split('\n\n')[0]
        .trim();
      if (firstParagraph.length > 0) {
        return firstParagraph.substring(0, 300); // Limit to 300 chars
      }
    }

    // Fallback
    return 'No definition available.';
  }

  private extractStructure(metadata: any[]): string {
    // Try to extract from concept_json.structure or domains_json.structure
    for (const meta of metadata) {
      if (meta.concept_json) {
        const conceptJson =
          typeof meta.concept_json === 'string'
            ? JSON.parse(meta.concept_json)
            : meta.concept_json;

        if (conceptJson.structure) {
          return conceptJson.structure;
        }
      }

      if (meta.domains_json) {
        const domainsJson =
          typeof meta.domains_json === 'string'
            ? JSON.parse(meta.domains_json)
            : meta.domains_json;

        if (domainsJson.structure) {
          return domainsJson.structure;
        }
      }
    }

    return 'No structural information available.';
  }

  private extractAnalogy(metadata: any[]): string | undefined {
    // Priority 1: analogies_json[0]
    for (const meta of metadata) {
      if (meta.analogies_json) {
        const analogiesJson =
          typeof meta.analogies_json === 'string'
            ? JSON.parse(meta.analogies_json)
            : meta.analogies_json;

        if (Array.isArray(analogiesJson) && analogiesJson.length > 0) {
          return analogiesJson[0];
        }
      }
    }

    // Priority 2: LLM (not implemented yet - placeholder)
    // TODO: Implement LLM analogy generation via checkLLMPolicyForAnalogy

    // Fallback: skip analogy
    return undefined;
  }

  private extractBacklinks(metadata: any[]): {
    nearDomain: string;
    farDomain: string;
  } {
    let nearDomain = 'General Knowledge';
    let farDomain = 'Cross-Disciplinary';

    for (const meta of metadata) {
      if (meta.domains_json) {
        const domainsJson =
          typeof meta.domains_json === 'string'
            ? JSON.parse(meta.domains_json)
            : meta.domains_json;

        if (Array.isArray(domainsJson)) {
          if (domainsJson.length > 0) {
            nearDomain = domainsJson[0];
          }
          if (domainsJson.length > 1) {
            farDomain = domainsJson[1];
          }
        } else if (domainsJson.near) {
          nearDomain = domainsJson.near;
        }
        if (domainsJson.far) {
          farDomain = domainsJson.far;
        }
      }
    }

    return { nearDomain, farDomain };
  }

  private extractTags(metadata: any[]): string[] {
    const tags: Set<string> = new Set();

    for (const meta of metadata) {
      if (meta.tier2_json) {
        const tier2Json =
          typeof meta.tier2_json === 'string'
            ? JSON.parse(meta.tier2_json)
            : meta.tier2_json;

        if (Array.isArray(tier2Json)) {
          tier2Json.forEach((tag) => tags.add(tag));
        }
      }
    }

    return Array.from(tags);
  }

  private extractConcepts(metadata: any[]): string[] {
    const concepts: Set<string> = new Set();

    for (const meta of metadata) {
      if (meta.concept_json) {
        const conceptJson =
          typeof meta.concept_json === 'string'
            ? JSON.parse(meta.concept_json)
            : meta.concept_json;

        if (conceptJson.name) {
          concepts.add(conceptJson.name);
        }
        if (conceptJson.title) {
          concepts.add(conceptJson.title);
        }
      }
    }

    return Array.from(concepts);
  }

  private toDto(note: PkmNote): PkmNoteDto {
    return {
      id: note.id,
      userId: note.userId,
      contentId: note.contentId ?? undefined,
      sessionId: note.sessionId ?? undefined,
      missionId: note.missionId ?? undefined,
      title: note.title,
      bodyMd: note.bodyMd,
      tags: note.tags,
      backlinks: note.backlinks,
      sourceMetadata: note.sourceMetadata,
      status: note.status,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
