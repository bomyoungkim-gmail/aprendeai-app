import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import {
  UpdateProfileDto,
  UpdateSettingsDto,
  ChangePasswordDto,
} from "./dto/user.dto";
import { UserMapper } from "./infrastructure/user.mapper";
import { GetProfileUseCase } from "./application/get-profile.use-case";
import { UpdateProfileUseCase } from "./application/update-profile.use-case";

@ApiTags("users")
@Controller("users")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class UsersController {
  constructor(
    private usersService: UsersService,
    private getProfileUseCase: GetProfileUseCase,
    private updateProfileUseCase: UpdateProfileUseCase,
  ) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Returns user profile" })
  async getCurrentUser(@Request() req) {
    return this.getProfileUseCase.execute(req.user.id);
  }

  @Get("me/context")
  @ApiOperation({ summary: "Get user context for browser extension" })
  @ApiResponse({
    status: 200,
    description: "Returns user context with family/institution info",
  })
  async getUserContext(@Request() req) {
    return this.usersService.getUserContext(req.user.id);
  }

  @Put("me")
  @ApiOperation({ summary: "Update user profile" })
  @ApiResponse({ status: 200, description: "Profile updated successfully" })
  async updateProfile(@Request() req, @Body() updateDto: UpdateProfileDto) {
    return this.updateProfileUseCase.execute(req.user.id, updateDto);
  }

  @Post("me/avatar")
  @ApiOperation({ summary: "Upload user avatar" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("avatar", {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException("Only image files are allowed"),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // TODO: Upload to S3 or cloud storage
    // For now, we'll use a local path (in production, use S3)
    const avatarUrl = `/uploads/avatars/${req.user.id}-${Date.now()}.${file.mimetype.split("/")[1]}`;

    const user = await this.usersService.updateAvatar(req.user.id, avatarUrl);
    return UserMapper.toDto(user);
  }

  @Get("me/stats")
  @ApiOperation({ summary: "Get user statistics" })
  @ApiResponse({ status: 200, description: "Returns user stats" })
  async getStats(@Request() req) {
    return this.usersService.getStats(req.user.id);
  }

  @Get("me/activity")
  @ApiOperation({ summary: "Get user recent activity" })
  @ApiResponse({ status: 200, description: "Returns recent activity" })
  async getActivity(@Request() req) {
    return this.usersService.getActivity(req.user.id);
  }

  @Get("me/settings")
  @ApiOperation({ summary: "Get user settings" })
  @ApiResponse({ status: 200, description: "Returns user settings" })
  async getSettings(@Request() req) {
    return this.usersService.getSettings(req.user.id);
  }

  @Get("me/entitlements")
  @ApiOperation({ summary: "Get user entitlements" })
  @ApiResponse({ status: 200, description: "Returns user entitlements" })
  async getEntitlements(@Request() req) {
    // Import EntitlementsService if not already imported
    // For now, return a basic FREE plan entitlement
    return {
      id: "default",
      userId: req.user.id,
      source: "DIRECT",
      planType: "FREE",
      limits: {
        maxContentsPerMonth: 10,
        maxStorageMB: 100,
      },
      features: {
        aiAssistant: false,
        advancedAnalytics: false,
      },
      effectiveAt: new Date(),
      expiresAt: null,
      updatedAt: new Date(),
    };
  }

  @Patch("me/settings")
  @ApiOperation({ summary: "Update user settings" })
  @ApiResponse({ status: 200, description: "Settings updated successfully" })
  async updateSettings(@Request() req, @Body() settingsDto: UpdateSettingsDto) {
    const user = await this.usersService.updateSettings(
      req.user.id,
      settingsDto,
    );
    return UserMapper.toDto(user);
  }

  @Put("me/password")
  @ApiOperation({ summary: "Change user password" })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({ status: 401, description: "Current password is incorrect" })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Delete("me")
  @ApiOperation({ summary: "Delete user account" })
  @ApiResponse({ status: 200, description: "Account deleted successfully" })
  @ApiResponse({ status: 401, description: "Password is incorrect" })
  async deleteAccount(@Request() req, @Body() body: { password: string }) {
    return this.usersService.deleteAccount(req.user.id, body.password);
  }

  @Post("me/export")
  @ApiOperation({ summary: "Export user data (GDPR)" })
  @ApiResponse({ status: 200, description: "Data export initiated" })
  async exportData(@Request() req) {
    // TODO: Implement data export
    // This should create a JSON/ZIP with all user data
    return {
      message: "Data export will be sent to your email",
      status: "processing",
    };
  }
}
