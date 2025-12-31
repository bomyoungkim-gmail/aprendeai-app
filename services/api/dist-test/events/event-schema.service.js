"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventSchemaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSchemaService = void 0;
const common_1 = require("@nestjs/common");
const ajv_1 = require("ajv");
const ajv_formats_1 = require("ajv-formats");
const fs = require("fs");
const path = require("path");
let EventSchemaService = EventSchemaService_1 = class EventSchemaService {
    constructor() {
        this.logger = new common_1.Logger(EventSchemaService_1.name);
        this.schemas = new Map();
        this.ajv = new ajv_1.default({
            allErrors: true,
            strict: true,
            useDefaults: true,
        });
        (0, ajv_formats_1.default)(this.ajv);
        this.loadSchemas();
        this.logger.log(`Loaded ${this.schemas.size} event schemas`);
    }
    loadSchemas() {
        const schemasDir = path.join(__dirname, "schemas");
        if (!fs.existsSync(schemasDir)) {
            this.logger.warn(`Schemas directory not found: ${schemasDir}`);
            return;
        }
        const files = fs.readdirSync(schemasDir);
        for (const file of files) {
            if (file.endsWith(".json")) {
                try {
                    const filePath = path.join(schemasDir, file);
                    const schema = JSON.parse(fs.readFileSync(filePath, "utf-8"));
                    if (schema.$id) {
                        this.schemas.set(schema.$id, schema);
                        this.ajv.addSchema(schema);
                        this.logger.debug(`Loaded schema: ${schema.$id}`);
                    }
                    else {
                        this.logger.warn(`Schema file ${file} missing $id field`);
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to load schema ${file}:`, error);
                }
            }
        }
    }
    validate(eventType, version, payload) {
        const schemaId = `${eventType}.v${version}`;
        const validate = this.ajv.getSchema(schemaId);
        if (!validate) {
            this.logger.warn(`Schema not found: ${schemaId}`);
            throw new Error(`Schema not found for ${eventType} v${version}`);
        }
        const valid = validate(payload);
        if (!valid) {
            this.logger.warn(`Validation failed for ${eventType}: ${this.ajv.errorsText(validate.errors)}`);
        }
        return {
            valid,
            errors: validate.errors || undefined,
        };
    }
    getLatestVersion(eventType) {
        const versions = Array.from(this.schemas.keys())
            .filter((id) => id.startsWith(eventType))
            .map((id) => {
            const match = id.match(/\.v(\d+)$/);
            return match ? parseInt(match[1], 10) : null;
        })
            .filter((v) => v !== null);
        return versions.length > 0 ? Math.max(...versions) : 1;
    }
    getAvailableEventTypes() {
        return Array.from(this.schemas.keys())
            .map((id) => id.split(".v")[0])
            .filter((type, index, self) => self.indexOf(type) === index);
    }
    hasSchema(eventType, version = 1) {
        const schemaId = `${eventType}.v${version}`;
        return this.schemas.has(schemaId);
    }
};
exports.EventSchemaService = EventSchemaService;
exports.EventSchemaService = EventSchemaService = EventSchemaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EventSchemaService);
//# sourceMappingURL=event-schema.service.js.map