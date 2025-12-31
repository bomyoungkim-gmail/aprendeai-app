"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CornellModule = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const prisma_module_1 = require("../prisma/prisma.module");
const cornell_controller_1 = require("./cornell.controller");
const files_controller_1 = require("../common/files.controller");
const cornell_service_1 = require("./cornell.service");
const content_service_1 = require("./services/content.service");
const storage_service_1 = require("./services/storage.service");
const content_access_service_1 = require("./services/content-access.service");
const video_module_1 = require("../video/video.module");
const transcription_module_1 = require("../transcription/transcription.module");
const family_module_1 = require("../family/family.module");
const queue_module_1 = require("../queue/queue.module");
const activity_module_1 = require("../activity/activity.module");
const topic_mastery_module_1 = require("../analytics/topic-mastery.module");
const notifications_module_1 = require("../notifications/notifications.module");
const cache_config_1 = require("../config/cache.config");
const content_pedagogical_controller_1 = require("./controllers/content-pedagogical.controller");
const content_pedagogical_service_1 = require("./services/content-pedagogical.service");
const cornell_highlights_controller_1 = require("./controllers/cornell-highlights.controller");
const cornell_highlights_service_1 = require("./services/cornell-highlights.service");
const content_repository_interface_1 = require("./domain/content.repository.interface");
const prisma_content_repository_1 = require("./infrastructure/repositories/prisma-content.repository");
const create_content_use_case_1 = require("./application/use-cases/create-content.use-case");
const get_content_use_case_1 = require("./application/use-cases/get-content.use-case");
const list_content_use_case_1 = require("./application/use-cases/list-content.use-case");
const update_content_use_case_1 = require("./application/use-cases/update-content.use-case");
const delete_content_use_case_1 = require("./application/use-cases/delete-content.use-case");
const cornell_repository_interface_1 = require("./domain/interfaces/cornell.repository.interface");
const highlights_repository_interface_1 = require("./domain/interfaces/highlights.repository.interface");
const prisma_cornell_repository_1 = require("./infrastructure/repositories/prisma-cornell.repository");
const prisma_highlights_repository_1 = require("./infrastructure/repositories/prisma-highlights.repository");
const get_or_create_cornell_note_use_case_1 = require("./application/use-cases/get-or-create-cornell-note.use-case");
const update_cornell_note_use_case_1 = require("./application/use-cases/update-cornell-note.use-case");
const create_highlight_use_case_1 = require("./application/use-cases/create-highlight.use-case");
const update_highlight_use_case_1 = require("./application/use-cases/update-highlight.use-case");
const delete_highlight_use_case_1 = require("./application/use-cases/delete-highlight.use-case");
const get_highlights_use_case_1 = require("./application/use-cases/get-highlights.use-case");
let CornellModule = class CornellModule {
};
exports.CornellModule = CornellModule;
exports.CornellModule = CornellModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            cache_manager_1.CacheModule.register(cache_config_1.cacheConfig),
            video_module_1.VideoModule,
            transcription_module_1.TranscriptionModule,
            family_module_1.FamilyModule,
            queue_module_1.QueueModule,
            activity_module_1.ActivityModule,
            topic_mastery_module_1.TopicMasteryModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [
            cornell_controller_1.CornellController,
            cornell_controller_1.HighlightsController,
            files_controller_1.FilesController,
            content_pedagogical_controller_1.ContentPedagogicalController,
            cornell_highlights_controller_1.CornellHighlightsController,
        ],
        providers: [
            cornell_service_1.CornellService,
            content_service_1.ContentService,
            storage_service_1.StorageService,
            content_access_service_1.ContentAccessService,
            content_pedagogical_service_1.ContentPedagogicalService,
            cornell_highlights_service_1.CornellHighlightsService,
            {
                provide: content_repository_interface_1.IContentRepository,
                useClass: prisma_content_repository_1.PrismaContentRepository,
            },
            create_content_use_case_1.CreateContentUseCase,
            get_content_use_case_1.GetContentUseCase,
            list_content_use_case_1.ListContentUseCase,
            update_content_use_case_1.UpdateContentUseCase,
            delete_content_use_case_1.DeleteContentUseCase,
            prisma_content_repository_1.PrismaContentRepository,
            {
                provide: cornell_repository_interface_1.ICornellRepository,
                useClass: prisma_cornell_repository_1.PrismaCornellRepository,
            },
            {
                provide: highlights_repository_interface_1.IHighlightsRepository,
                useClass: prisma_highlights_repository_1.PrismaHighlightsRepository,
            },
            get_or_create_cornell_note_use_case_1.GetOrCreateCornellNoteUseCase,
            update_cornell_note_use_case_1.UpdateCornellNoteUseCase,
            create_highlight_use_case_1.CreateHighlightUseCase,
            update_highlight_use_case_1.UpdateHighlightUseCase,
            delete_highlight_use_case_1.DeleteHighlightUseCase,
            get_highlights_use_case_1.GetHighlightsUseCase,
        ],
        exports: [
            cornell_service_1.CornellService,
            content_service_1.ContentService,
            storage_service_1.StorageService,
            content_access_service_1.ContentAccessService,
            content_repository_interface_1.IContentRepository,
            create_content_use_case_1.CreateContentUseCase,
            get_content_use_case_1.GetContentUseCase,
            list_content_use_case_1.ListContentUseCase,
            update_content_use_case_1.UpdateContentUseCase,
            delete_content_use_case_1.DeleteContentUseCase,
            get_or_create_cornell_note_use_case_1.GetOrCreateCornellNoteUseCase,
            cornell_repository_interface_1.ICornellRepository,
            highlights_repository_interface_1.IHighlightsRepository,
        ],
    })
], CornellModule);
//# sourceMappingURL=cornell.module.js.map