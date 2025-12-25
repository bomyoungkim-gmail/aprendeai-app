import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { ConfigService } from "./services/config.service";
import { AdminService } from "./admin.service";
import {
  ConfigFilterDto,
  CreateConfigDto,
  UpdateConfigDto,
  ValidateProviderDto,
} from "./dto/config.dto";

@ApiTags("admin-config")
@Controller("admin/config")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class ConfigController {
  constructor(
    private configService: ConfigService,
    private adminService: AdminService,
  ) {}

  // ========================================
  // Config CRUD
  // ========================================

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all configs (SECRET_REF values masked)" })
  async getConfigs(@Query() filters: ConfigFilterDto) {
    return this.configService.getConfigs(filters);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get config by ID (optionally resolve secrets)" })
  async getConfig(
    @Param("id") id: string,
    @Query("resolveSecrets") resolveSecrets?: string,
  ) {
    const resolve = resolveSecrets === "true";
    return this.configService.getConfig(id, resolve);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new config" })
  async createConfig(@Body() dto: CreateConfigDto, @Request() req) {
    const config = await this.configService.createConfig(dto, req.user.userId);

    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "CONFIG_CREATED",
      resourceType: "CONFIG",
      resourceId: config.id,
      afterJson: {
        key: config.key,
        category: config.category,
        environment: config.environment,
      },
    });

    return config;
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update config" })
  async updateConfig(
    @Param("id") id: string,
    @Body() dto: UpdateConfigDto,
    @Request() req,
  ) {
    const before = await this.configService.getConfig(id);
    const config = await this.configService.updateConfig(
      id,
      dto,
      req.user.userId,
    );

    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "CONFIG_UPDATED",
      resourceType: "CONFIG",
      resourceId: config.id,
      beforeJson: { value: before.value },
      afterJson: { value: config.value },
    });

    return config;
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete config" })
  async deleteConfig(@Param("id") id: string, @Request() req) {
    const config = await this.configService.getConfig(id);
    await this.configService.deleteConfig(id);

    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "CONFIG_DELETED",
      resourceType: "CONFIG",
      resourceId: id,
      beforeJson: {
        key: config.key,
        category: config.category,
      },
    });

    return { success: true, message: "Config deleted" };
  }

  // ========================================
  // Provider Validation
  // ========================================

  @Post("validate/:provider")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Validate provider configuration" })
  async validateProvider(
    @Param("provider") provider: string,
    @Body() dto: ValidateProviderDto,
  ) {
    return this.configService.validateProvider(provider, dto.config);
  }

  // ========================================
  // Query Helpers
  // ========================================

  @Get("category/:category")
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get configs by category" })
  async getConfigsByCategory(
    @Param("category") category: string,
    @Query("environment") environment?: string,
  ) {
    return this.configService.getConfigsByCategory(
      category,
      environment as any,
    );
  }

  // ========================================
  // LLM Cache Management
  // ========================================

  @Post("llm/cache/clear")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Clear LLM config cache for immediate config refresh" })
  async clearLLMCache(@Query("provider") provider?: string) {
    // Access LLMConfigService through ConfigService
    const cleared = await this.configService.clearLLMCache(provider);
    
    return {
      success: true,
      message: provider 
        ? `Cache cleared for ${provider}` 
        : 'All LLM cache cleared',
      provider: provider || 'all',
    };
  }
}
