export interface PkmStructure {
  title: string;
  definition: string;
  structure: string;
  analogy?: string;
  nearDomain: string;
  farDomain: string;
}

export class PkmStructureBuilder {
  private structure: Partial<PkmStructure> = {};

  setTitle(title: string): this {
    this.structure.title = title;
    return this;
  }

  setDefinition(definition: string): this {
    this.structure.definition = definition;
    return this;
  }

  setStructure(structure: string): this {
    this.structure.structure = structure;
    return this;
  }

  setAnalogy(analogy: string): this {
    this.structure.analogy = analogy;
    return this;
  }

  setNearDomain(nearDomain: string): this {
    this.structure.nearDomain = nearDomain;
    return this;
  }

  setFarDomain(farDomain: string): this {
    this.structure.farDomain = farDomain;
    return this;
  }

  build(): PkmStructure {
    if (!this.structure.title) {
      throw new Error('Title is required');
    }
    if (!this.structure.definition) {
      throw new Error('Definition is required');
    }
    if (!this.structure.structure) {
      throw new Error('Structure is required');
    }
    if (!this.structure.nearDomain) {
      throw new Error('Near domain is required');
    }
    if (!this.structure.farDomain) {
      throw new Error('Far domain is required');
    }

    return this.structure as PkmStructure;
  }

  toMarkdown(): string {
    const struct = this.build();
    let md = `# ${struct.title}\n\n`;
    md += `## Definition\n${struct.definition}\n\n`;
    md += `## Deep Structure (Bridging)\n${struct.structure}\n\n`;
    
    if (struct.analogy) {
      md += `## Analogy\n${struct.analogy}\n\n`;
    }
    
    md += `## Connections\n`;
    md += `- **Near Domain**: ${struct.nearDomain}\n`;
    md += `- **Far Domain**: ${struct.farDomain}\n`;
    
    return md;
  }
}
