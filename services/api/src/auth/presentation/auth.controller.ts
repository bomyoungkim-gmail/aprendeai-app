import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Logger,
  Res,
  Query,
  Response,
} from "@nestjs/common";
import { LoginDto, RegisterDto, ResetPasswordDto } from "../dto/auth.dto";
import { SwitchContextDto } from "../dto/switch-context.dto";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { Public } from "./decorators/public.decorator";
import { URL_CONFIG } from "../../config/urls.config";

// Use Cases
import { LoginUseCase } from "../application/login.use-case";
import { RegisterUseCase } from "../application/register.use-case";
import { RefreshTokenUseCase } from "../application/refresh-token.use-case";
import { SwitchContextUseCase } from "../application/switch-context.use-case";
import { ForgotPasswordUseCase } from "../application/forgot-password.use-case";
import { ResetPasswordUseCase } from "../application/reset-password.use-case";
import { TokenGeneratorService } from "../infrastructure/token-generator.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly switchContextUseCase: SwitchContextUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly tokenGenerator: TokenGeneratorService,
  ) {}

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
    return this.registerUseCase.execute(registerDto, inviteToken);
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
  async login(
    @Body() loginDto: LoginDto,
    @Response({ passthrough: true }) res,
  ) {
    this.logger.log(`Login attempt: ${loginDto.email}`);
    const result = await this.loginUseCase.execute(
      loginDto.email,
      loginDto.password,
    );

    // Set refresh token as HTTP-only cookie
    res.cookie("refresh_token", result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    // Return only access token and user in response body
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully, returns new access token",
  })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  @ApiBody({
    schema: { properties: { refresh_token: { type: "string" } } },
    required: false,
  })
  async refresh(@Body() body: { refresh_token?: string }, @Request() req) {
    this.logger.log("Token refresh attempt");

    // Try to get refresh token from cookie first, fallback to body (backward compatibility)
    const refreshToken = req.cookies?.refresh_token || body.refresh_token;

    if (!refreshToken) {
      throw new Error("No refresh token provided");
    }

    const result = await this.refreshTokenUseCase.execute(refreshToken);

    // Note: Refresh token rotation not implemented yet
    // The same refresh token cookie remains valid until expiration

    // Return only access token and user
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Get("profile")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Returns user profile" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getProfile(@Request() req) {
    return req.user;
  }

  // Google OAuth
  @Public()
  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Initiate Google OAuth login" })
  googleLogin() {}

  @Public()
  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth callback" })
  async googleCallback(@Request() req, @Res() res) {
    const token = await this.tokenGenerator.generateTokenSet(req.user);
    const frontendUrl = URL_CONFIG.frontend.base;
    res.redirect(`${frontendUrl}/auth/callback?token=${token.access_token}`);
  }

  // Microsoft OAuth
  @Public()
  @Get("microsoft")
  @UseGuards(AuthGuard("microsoft"))
  @ApiOperation({ summary: "Initiate Microsoft OAuth login" })
  microsoftLogin() {}

  @Public()
  @Get("microsoft/callback")
  @UseGuards(AuthGuard("microsoft"))
  @ApiOperation({ summary: "Microsoft OAuth callback" })
  async microsoftCallback(@Request() req, @Res() res) {
    const token = await this.tokenGenerator.generateTokenSet(req.user);
    const frontendUrl = URL_CONFIG.frontend.base;
    res.redirect(`${frontendUrl}/auth/callback?token=${token.access_token}`);
  }

  @Public()
  @Post("forgot-password")
  @ApiOperation({ summary: "Request password reset email" })
  @ApiBody({ schema: { properties: { email: { type: "string" } } } })
  async forgotPassword(@Body() dto: { email: string }) {
    await this.forgotPasswordUseCase.execute(dto.email);
    return { message: "If the email exists, a reset link has been sent." };
  }

  @Public()
  @Post("reset-password")
  @ApiOperation({ summary: "Reset password using token" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }

  @Post("switch-context")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Switch active institution context" })
  @ApiResponse({
    status: 200,
    description:
      "Context switched successfully, returns new JWT with updated activeInstitutionId",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid membership",
  })
  @ApiBody({ type: SwitchContextDto })
  async switchContext(@Request() req, @Body() body: SwitchContextDto) {
    this.logger.log(
      `Context switch request: user=${req.user.id}, target=${body.activeInstitutionId}`,
    );
    const target = body.activeInstitutionId || null;
    return this.switchContextUseCase.execute(req.user.id, target);
  }
}
