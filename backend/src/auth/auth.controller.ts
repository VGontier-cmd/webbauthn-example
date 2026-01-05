/**
 * Authentication Controller
 *
 * Exposes REST endpoints for:
 * - Traditional registration and login (email/password)
 * - WebAuthn registration and authentication (passkeys)
 * - User and passkey management
 *
 * All endpoints are prefixed with "/auth"
 *
 * @module auth/auth.controller
 */
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   *
   * Register a new user
   *
   * @param registerDto - Registration data (email, password, firstName, lastName)
   * @returns Created user (without password)
   */
  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/login
   *
   * Login with email and password
   *
   * @param loginDto - Email and password
   * @returns Logged in user (without password)
   */
  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * GET /auth/user/:userId
   *
   * Get user information with their passkeys
   *
   * @param userId - Unique user ID
   * @returns User with registered passkeys
   */
  @Get("user/:userId")
  async getUser(@Param("userId") userId: string) {
    return this.authService.getUser(userId);
  }

  /**
   * POST /auth/webauthn/register/options/:userId
   *
   * Generate registration options for a new passkey
   *
   * Used from the dashboard to add a new passkey.
   * The backend generates a unique challenge and returns WebAuthn options.
   *
   * @param userId - ID of the user registering the passkey
   * @returns WebAuthn options for registration (challenge, RP info, etc.)
   */
  @Post("webauthn/register/options/:userId")
  async generateRegistrationOptions(@Param("userId") userId: string) {
    return this.authService.generateRegistrationOptions(userId);
  }

  /**
   * POST /auth/webauthn/register/verify/:userId
   *
   * Verify registration of a new passkey
   *
   * After the authenticator creates the passkey and signs the challenge,
   * this method verifies the signature and stores the passkey in the database.
   *
   * @param userId - User ID
   * @param body.response - Attestation response from the authenticator
   * @param body.deviceType - Device type (iOS, Android, Desktop)
   * @returns { verified: true } if registration is successful
   */
  @Post("webauthn/register/verify/:userId")
  async verifyRegistration(
    @Param("userId") userId: string,
    @Body() body: { response: any; deviceType?: string }
  ) {
    return this.authService.verifyRegistration(
      userId,
      body.response,
      body.deviceType
    );
  }

  /**
   * POST /auth/webauthn/authenticate/options/:userId
   *
   * Generate authentication options to test a passkey
   *
   * Used from the dashboard to test authentication with an existing passkey.
   *
   * @param userId - User ID
   * @returns WebAuthn options for authentication (challenge, credential IDs, etc.)
   */
  @Post("webauthn/authenticate/options/:userId")
  async generateAuthenticationOptions(@Param("userId") userId: string) {
    return this.authService.generateAuthenticationOptions(userId);
  }

  /**
   * POST /auth/webauthn/authenticate/verify/:userId
   *
   * Verify authentication with a passkey (from dashboard)
   *
   * After the authenticator signs the challenge, this method
   * verifies the signature with the stored public key.
   *
   * @param userId - User ID
   * @param body.response - Signed assertion response from the authenticator
   * @returns { verified: true } if authentication is successful
   */
  @Post("webauthn/authenticate/verify/:userId")
  async verifyAuthentication(
    @Param("userId") userId: string,
    @Body() body: { response: any }
  ) {
    return this.authService.verifyAuthentication(userId, body.response);
  }

  /**
   * POST /auth/webauthn/credential/:userId/:credentialId
   *
   * Delete a registered passkey
   *
   * @param userId - User ID
   * @param credentialId - ID of the passkey to delete
   * @returns { success: true }
   */
  @Post("webauthn/credential/:userId/:credentialId")
  async deleteCredential(
    @Param("userId") userId: string,
    @Param("credentialId") credentialId: string
  ) {
    return this.authService.deleteCredential(userId, credentialId);
  }

  /**
   * POST /auth/webauthn/login/options
   *
   * Generate authentication options for passkey login
   *
   * Used during login: the backend finds the user by email,
   * retrieves their passkeys, and generates a unique challenge.
   *
   * @param body.email - User's email
   * @returns WebAuthn options containing the challenge and allowed credential IDs
   */
  @Post("webauthn/login/options")
  async generateLoginOptions(@Body() body: { email: string }) {
    return this.authService.generateAuthenticationOptionsByEmail(body.email);
  }

  /**
   * POST /auth/webauthn/login/verify
   *
   * Verify authentication during passkey login
   *
   * After the authenticator signs the challenge, this method
   * verifies the signature with the stored public key and returns the user.
   *
   * @param body.email - User's email
   * @param body.response - Signed assertion response from the authenticator
   * @returns { verified: true, user: User } if authentication is successful
   */
  @Post("webauthn/login/verify")
  async verifyLogin(@Body() body: { email: string; response: any }) {
    return this.authService.verifyAuthenticationByEmail(
      body.email,
      body.response
    );
  }
}
