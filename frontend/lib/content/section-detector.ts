/**
 * IMRaD Section Detector for SCIENTIFIC Mode
 * 
 * Domain logic (pure) - no React dependencies
 * Following MelhoresPraticas.txt: domain logic in lib/
 * 
 * G5.1 Refinement: Detects IMRaD structure in scientific papers
 */

export interface Section {
  id: string;
  title: string;
  startLine: number;
  endLine?: number;
  type: 'IMRAD' | 'HEADING' | 'PARAGRAPH';
}

export const IMRAD_PATTERNS = [
  { section: 'ABSTRACT', patterns: [/^abstract$/i, /^resumo$/i] },
  { 
    section: 'INTRODUCTION', 
    patterns: [/^introduction$/i, /^introdução$/i, /^1\.?\s*introduction/i] 
  },
  { 
    section: 'METHODS', 
    patterns: [
      /^methods?$/i, 
      /^methodology$/i, 
      /^materiais?\s+e\s+métodos/i,
      /^materials?\s+and\s+methods?/i
    ] 
  },
  { section: 'RESULTS', patterns: [/^results?$/i, /^resultados?$/i] },
  { section: 'DISCUSSION', patterns: [/^discussion$/i, /^discussão$/i] },
  { section: 'CONCLUSION', patterns: [/^conclusion$/i, /^conclusão$/i, /^conclusions?$/i] }
];

/**
 * Detect IMRaD sections in scientific text
 */
export function detectIMRaDSections(text: string): Section[] {
  const lines = text.split('\n');
  const sections: Section[] = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) return;
    
    for (const { section, patterns } of IMRAD_PATTERNS) {
      if (patterns.some(p => p.test(trimmed))) {
        sections.push({
          id: `${section.toLowerCase()}-${index}`,
          title: section,
          startLine: index,
          type: 'IMRAD'
        });
        break;
      }
    }
  });
  
  // Calculate end lines
  sections.forEach((section, index) => {
    if (index < sections.length - 1) {
      section.endLine = sections[index + 1].startLine - 1;
    } else {
      section.endLine = lines.length - 1;
    }
  });
  
  return sections;
}

/**
 * Detect general heading-based sections (fallback for non-IMRaD content)
 */
export function detectHeadingSections(text: string): Section[] {
  const lines = text.split('\n');
  const sections: Section[] = [];
  
  // Patterns for common heading formats
  const headingPatterns = [
    /^#{1,3}\s+(.+)$/,           // Markdown headings
    /^([A-Z][A-Za-z\s]+):?\s*$/, // Title case lines
    /^\d+\.?\s+([A-Z].+)$/       // Numbered headings
  ];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    for (const pattern of headingPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const title = match[1] || trimmed;
        sections.push({
          id: `heading-${index}`,
          title: title.trim(),
          startLine: index,
          type: 'HEADING'
        });
        break;
      }
    }
  });
  
  // Calculate end lines
  sections.forEach((section, index) => {
    if (index < sections.length - 1) {
      section.endLine = sections[index + 1].startLine - 1;
    } else {
      section.endLine = lines.length - 1;
    }
  });
  
  return sections;
}

/**
 * Chunk text by paragraphs (fallback for unstructured content)
 */
export function chunkByParagraphs(text: string, minLength: number = 200): Section[] {
  const paragraphs = text.split(/\n\n+/);
  const sections: Section[] = [];
  let currentLine = 0;
  
  paragraphs.forEach((para, index) => {
    const trimmed = para.trim();
    if (trimmed.length >= minLength) {
      const lineCount = para.split('\n').length;
      sections.push({
        id: `paragraph-${index}`,
        title: `Paragraph ${index + 1}`,
        startLine: currentLine,
        endLine: currentLine + lineCount - 1,
        type: 'PARAGRAPH'
      });
      currentLine += lineCount + 1; // +1 for the blank line
    } else {
      currentLine += para.split('\n').length + 1;
    }
  });
  
  return sections;
}

/**
 * Main section detection function - tries IMRaD first, then headings, then paragraphs
 */
export function detectSections(text: string, mode?: string): Section[] {
  // Try IMRaD for scientific content
  if (mode === 'SCIENTIFIC') {
    const imradSections = detectIMRaDSections(text);
    if (imradSections.length >= 3) { // At least 3 IMRaD sections found
      return imradSections;
    }
  }
  
  // Try heading-based detection
  const headingSections = detectHeadingSections(text);
  if (headingSections.length >= 2) {
    return headingSections;
  }
  
  // Fallback to paragraph chunking
  return chunkByParagraphs(text);
}
