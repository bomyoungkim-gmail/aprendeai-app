/**
 * Event Schema Service
 * 
 * Phase 0: MVP-Hardening - Event Schema Registry
 * Validates SessionEvent payloadJson against JSON Schema
 */

import { Injectable, Logger } from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';

export interface ValidationResult {
  valid: boolean;
  errors?: any[];
}

@Injectable()
export class EventSchemaService {
  private readonly logger = new Logger(EventSchemaService.name);
  private readonly ajv: Ajv;
  private readonly schemas = new Map<string, any>();

  constructor() {
    // Initialize Ajv with strict mode
    this.ajv = new Ajv({
      allErrors: true,
      strict: true,
      useDefaults: true,
    });
    
    // Add format validators (uuid, date-time, etc)
    addFormats(this.ajv);
    
    // Load all schema files
    this.loadSchemas();
    
    this.logger.log(`Loaded ${this.schemas.size} event schemas`);
  }

  /**
   * Load all JSON Schema files from schemas directory
   */
  private loadSchemas(): void {
    const schemasDir = path.join(__dirname, 'schemas');
    
    // Check if directory exists
    if (!fs.existsSync(schemasDir)) {
      this.logger.warn(`Schemas directory not found: ${schemasDir}`);
      return;
    }

    const files = fs.readdirSync(schemasDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(schemasDir, file);
          const schema = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          // Store schema by $id
          if (schema.$id) {
            this.schemas.set(schema.$id, schema);
            this.ajv.addSchema(schema);
            this.logger.debug(`Loaded schema: ${schema.$id}`);
          } else {
            this.logger.warn(`Schema file ${file} missing $id field`);
          }
        } catch (error) {
          this.logger.error(`Failed to load schema ${file}:`, error);
        }
      }
    }
  }

  /**
   * Validate event payload against schema
   * 
   * @param eventType - Event type enum value
   * @param version - Schema version (default: 1)
   * @param payload - JSON payload to validate
   * @returns Validation result with errors if invalid
   */
  validate(
    eventType: string,
    version: number,
    payload: any,
  ): ValidationResult {
    const schemaId = `${eventType}.v${version}`;
    const validate = this.ajv.getSchema(schemaId);

    if (!validate) {
      this.logger.warn(`Schema not found: ${schemaId}`);
      throw new Error(`Schema not found for ${eventType} v${version}`);
    }

    const valid = validate(payload) as boolean; // Cast to boolean

    if (!valid) {
      this.logger.warn(
        `Validation failed for ${eventType}: ${this.ajv.errorsText(validate.errors)}`,
      );
    }

    return {
      valid,
      errors: validate.errors || undefined,
    };
  }

  /**
   * Get latest version number for an event type
   * 
   * @param eventType - Event type enum value
   * @returns Latest version number, or 1 if not found
   */
  getLatestVersion(eventType: string): number {
    // Find all versions for this event type
    const versions = Array.from(this.schemas.keys())
      .filter((id) => id.startsWith(eventType))
      .map((id) => {
        const match = id.match(/\.v(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((v) => v !== null);

    return versions.length > 0 ? Math.max(...versions) : 1;
  }

  /**
   * Get all available event types
   */
  getAvailableEventTypes(): string[] {
    return Array.from(this.schemas.keys())
      .map((id) => id.split('.v')[0])
      .filter((type, index, self) => self.indexOf(type) === index);
  }

  /**
   * Check if schema exists for event type
   */
  hasSchema(eventType: string, version: number = 1): boolean {
    const schemaId = `${eventType}.v${version}`;
    return this.schemas.has(schemaId);
  }
}
