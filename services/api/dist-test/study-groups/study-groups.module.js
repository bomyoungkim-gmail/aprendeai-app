"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyGroupsModule = void 0;
const common_1 = require("@nestjs/common");
const study_groups_service_1 = require("./study-groups.service");
const study_groups_controller_1 = require("./study-groups.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const email_module_1 = require("../email/email.module");
const websocket_module_1 = require("../websocket/websocket.module");
const group_sessions_service_1 = require("./group-sessions.service");
const group_chat_service_1 = require("./group-chat.service");
const study_groups_repository_interface_1 = require("./domain/study-groups.repository.interface");
const prisma_study_groups_repository_1 = require("./infrastructure/repositories/prisma-study-groups.repository");
const create_study_group_use_case_1 = require("./application/use-cases/create-study-group.use-case");
const invite_group_member_use_case_1 = require("./application/use-cases/invite-group-member.use-case");
const manage_group_content_use_case_1 = require("./application/use-cases/manage-group-content.use-case");
let StudyGroupsModule = class StudyGroupsModule {
};
exports.StudyGroupsModule = StudyGroupsModule;
exports.StudyGroupsModule = StudyGroupsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, email_module_1.EmailModule, websocket_module_1.WebSocketModule],
        controllers: [study_groups_controller_1.StudyGroupsController],
        providers: [
            study_groups_service_1.StudyGroupsService,
            group_sessions_service_1.GroupSessionsService,
            group_chat_service_1.GroupChatService,
            create_study_group_use_case_1.CreateStudyGroupUseCase,
            invite_group_member_use_case_1.InviteGroupMemberUseCase,
            manage_group_content_use_case_1.ManageGroupContentUseCase,
            {
                provide: study_groups_repository_interface_1.IStudyGroupsRepository,
                useClass: prisma_study_groups_repository_1.PrismaStudyGroupsRepository,
            },
        ],
        exports: [study_groups_service_1.StudyGroupsService, group_sessions_service_1.GroupSessionsService, group_chat_service_1.GroupChatService, create_study_group_use_case_1.CreateStudyGroupUseCase, study_groups_repository_interface_1.IStudyGroupsRepository],
    })
], StudyGroupsModule);
//# sourceMappingURL=study-groups.module.js.map