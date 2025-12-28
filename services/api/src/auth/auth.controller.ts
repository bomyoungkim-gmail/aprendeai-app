import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  UnauthorizedException,
  Logger,
  Res,
  Query,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto/auth.dto";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { Public } from "./decorators/public.decorator";
import { URL_CONFIG } from "../config/urls.config";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User successfully registered" })
  @ApiResponse({ status: 400, description: "Bad request - validation failed" })
  @ApiBody({ type: RegisterDto })
  async register(
    @Body() registerDto: RegisterDto,
    @Query("inviteToken") inviteToken?: string,
  ) {
    this.logger.log(`New user registration attempt: ${registerDto.email}`);
    return this.authService.register(registerDto, inviteToken);
  }

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({
    status: 200,
    description: "Login successful, returns JWT token",
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt: ${loginDto.email}`);
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.authService.login(user);
  }

  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully, returns new access token",
  })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  @ApiBody({ schema: { properties: { refresh_token: { type: 'string' } } } })
  async refresh(@Body() body: { refresh_token: string }) {
    this.logger.log('Token refresh attempt');
    return this.authService.refreshAccessToken(body.refresh_token);
  }

  @Get("profile")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Returns user profile" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getProfile(@Request() req) {
    console.log("[AuthController.getProfile] Returning user:", {
      id: req.user?.id,
      email: req.user?.email,
      settings: req.user?.settings,
    });
    return req.user;
  }

  // Google OAuth
  @Public()
  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Initiate Google OAuth login" })
  googleLogin() {
    // Redirects to Google
  }

  @Public()
  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth callback" })
  async googleCallback(@Request() req, @Res() res) {
    const token = await this.authService.login(req.user);
    const frontendUrl = URL_CONFIG.frontend.base;
    res.redirect(`${frontendUrl}/auth/callback?token=${token.access_token}`);
  }

  // Microsoft OAuth
  @Public()
  @Get("microsoft")
  @UseGuards(AuthGuard("microsoft"))
  @ApiOperation({ summary: "Initiate Microsoft OAuth login" })
  microsoftLogin() {
    // Redirects to Microsoft
  }

  @Public()
  @Get("microsoft/callback")
  @UseGuards(AuthGuard("microsoft"))
  @ApiOperation({ summary: "Microsoft OAuth callback" })
  async microsoftCallback(@Request() req, @Res() res) {
    const token = await this.authService.login(req.user);
    const frontendUrl = URL_CONFIG.frontend.base;
    res.redirect(`${frontendUrl}/auth/callback?token=${token.access_token}`);
  }

  @Public()
  @Post("forgot-password")
  @ApiOperation({ summary: "Request password reset email" })
  @ApiBody({ type: LoginDto }) // Using LoginDto for email only or create specific if strictly needed, DTO has generic email field
  // Actually let's reuse defined DTOs properly
  async forgotPassword(@Body() dto: { email: string }) {
    await this.authService.forgotPassword(dto.email);
    return { message: "If the email exists, a reset link has been sent." };
  }


  @Public()
  @Post("reset-password")
  @ApiOperation({ summary: "Reset password using token" })
  async resetPassword(@Body() dto: { token: string; password: string }) {
    return this.authService.resetPassword(dto);
  }

  @Post("switch-context")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Switch active institution context" })
  @ApiResponse({
    status: 200,
    description: "Context switched successfully, returns new JWT with updated activeInstitutionId",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBody({ schema: { properties: { institutionId: { type: 'string' } } } })
  async switchContext(
    @Request() req,
    @Body() body: { institutionId: string },
  ) {
    this.logger.log(`Context switch request: user=${req.user.id}, institution=${body.institutionId}`);
    return this.authService.switchContext(req.user.id, body.institutionId);
  }
}
