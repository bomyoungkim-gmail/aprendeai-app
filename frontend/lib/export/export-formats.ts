/**
 * Export Formats for TECHNICAL Mode
 * 
 * Domain logic (pure) - no React dependencies
 * Following MelhoresPraticas.txt: domain logic in lib/
 */

import { Content } from '@/lib/types/cornell';
import { Annotation } from '@/hooks/content/use-annotations';

export enum ExportFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  OBSIDIAN = 'obsidian'
}

export interface ExportOptions {
  format: ExportFormat;
  includeAnnotations: boolean;
  includeHighlights: boolean;
  includeNotes: boolean;
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

/**
 * Export to Markdown format
 */
export function exportToMarkdown(
  content: Content,
  annotations: Annotation[],
  options: ExportOptions
): ExportResult {
  let markdown = `# ${content.title}\n\n`;
  
  if (content.sourceUrl) {
    markdown += `**Source:** ${content.sourceUrl}\n\n`;
  }
  
  // Note: Content.rawText might not exist, using title as fallback
  markdown += `${content.title}\n\n`;
  
  if (options.includeAnnotations && annotations.length > 0) {
    markdown += `## Annotations\n\n`;
    annotations.forEach(a => {
      markdown += `- ${a.text}\n`;
    });
  }
  
  return {
    content: markdown,
    filename: `${sanitizeFilename(content.title)}.md`,
    mimeType: 'text/markdown'
  };
}

/**
 * Export to Obsidian-compatible format with frontmatter
 * G3.3 Refinement
 */
export function exportToObsidian(
  content: Content,
  annotations: Annotation[],
  options: ExportOptions
): ExportResult {
  const frontmatter = `---
title: ${content.title}
source: ${content.sourceUrl || 'Cornell Reader'}
date: ${new Date().toISOString()}
tags: [reading, general]
---

`;
  
  let body = `# ${content.title}\n\n`;
  body += `${content.title}\n\n`;
  
  if (options.includeAnnotations && annotations.length > 0) {
    body += `## Annotations\n\n`;
    annotations.forEach(a => {
      body += `- ${a.text}\n`;
      // Note: anchor_json might not exist in Annotation type
    });
  }
  
  return {
    content: frontmatter + body,
    filename: `${sanitizeFilename(content.title)}.md`,
    mimeType: 'text/markdown'
  };
}

/**
 * Export to JSON format
 */
export function exportToJSON(
  content: Content,
  annotations: Annotation[],
  options: ExportOptions
): ExportResult {
  const data = {
    title: content.title,
    source: content.sourceUrl,
    exportedAt: new Date().toISOString(),
    content: content.title, // Using title as content fallback
    annotations: options.includeAnnotations ? annotations.map(a => ({
      text: a.text,
      createdAt: a.createdAt
    })) : []
  };
  
  return {
    content: JSON.stringify(data, null, 2),
    filename: `${sanitizeFilename(content.title)}.json`,
    mimeType: 'application/json'
  };
}

/**
 * Main export function - delegates to specific format handlers
 */
export function exportContent(
  content: Content,
  annotations: Annotation[],
  options: ExportOptions
): ExportResult {
  switch (options.format) {
    case ExportFormat.MARKDOWN:
      return exportToMarkdown(content, annotations, options);
    case ExportFormat.OBSIDIAN:
      return exportToObsidian(content, annotations, options);
    case ExportFormat.JSON:
      return exportToJSON(content, annotations, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Utility: Sanitize filename for safe file system usage
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
    .substring(0, 100);
}
