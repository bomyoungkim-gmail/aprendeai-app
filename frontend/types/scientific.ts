/**
 * Scientific Mode Types
 * 
 * Types for SCIENTIFIC reading mode features:
 * - Glossary definitions
 * - IMRaD sections
 * - Scientific annotations
 */

export interface GlossaryDefinition {
  term: string;
  definition: string;
  source: string;
  examples?: string[];
}

export type IMRaDSection = 
  | 'Abstract' 
  | 'Introduction' 
  | 'Methods' 
  | 'Results' 
  | 'Discussion';

export interface ScientificAnnotation {
  id: string;
  text: string;
  section: IMRaDSection;
  position: {
    start: number;
    end: number;
  };
  createdAt: Date;
}

export interface IMRaDSectionInfo {
  name: IMRaDSection;
  label: string;
  description: string;
  color: string;
}
