import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { Credential } from "../entities/credential.entity";
import { User } from "../entities/user.entity";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  // WebAuthn Relying Party (RP) configuration
  private rpName = "WebAuthn Example"; // Name displayed to user
  private rpID = "localhost"; // RP domain (must match app domain)
  private origin = process.env.ORIGIN || "http://localhost:5173"; // Authorized origin

  /**
   * In-memory storage for WebAuthn challenges
   *
   * Structure:
   * - Key: "reg-{userId}" or "auth-{userId}" or "auth-email-{email}"
   * - Value: { challenge: string, timestamp: number, userId?: string }
   *
   * Why store challenges?
   * - Anti-replay: Prevents signature reuse
   * - Security: Challenge must be unique and used only once
   * - Validation: Backend verifies that signed challenge matches the generated one
   *
   * Note: In production, use Redis or a database for persistence
   */
  private challenges: Map<
    string,
    { challenge: string; timestamp: number; userId?: string }
  > = new Map();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>
  ) {
    /**
     * Automatic cleanup of expired challenges
     *
     * Challenges expire after 5 minutes for security reasons.
     * An interval automatically cleans up expired challenges.
     */
    setInterval(() => {
      const now = Date.now();
      const expirationTime = 300000; // 5 minutes in milliseconds

      for (const [key, value] of this.challenges.entries()) {
        if (now - value.timestamp > expirationTime) {
          this.challenges.delete(key);
        }
      }
    }, 300000); // Runs cleanup every 5 minutes
  }

  /**
   * Register a new user
   *
   * @param registerDto - Registration data (email, password, firstName, lastName)
   * @returns Created user (without password)
   * @throws BadRequestException if email already exists
   */
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    // Check email uniqueness
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException("User already exists");
    }

    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    await this.userRepository.save(user);

    // Return user without password
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  /**
   * Login with email and password
   *
   * @param loginDto - Email and password
   * @returns Logged in user (without password)
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Recherche de l'utilisateur par email
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  /**
   * Get user information with their passkeys
   *
   * @param userId - Unique user ID
   * @returns User with registered passkeys
   * @throws BadRequestException if ID is invalid
   * @throws UnauthorizedException if user doesn't exist
   */
  async getUser(userId: string) {
    // Validate user ID
    if (!userId || userId === "undefined" || userId.trim() === "") {
      throw new BadRequestException("Invalid user ID");
    }

    // Get user with passkeys
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["credentials"],
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Return user with passkeys (without sensitive data)
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      credentials: user.credentials.map((cred) => ({
        id: cred.id,
        deviceType: cred.deviceType,
        createdAt: cred.createdAt,
      })),
    };
  }

  /**
   * Generate registration options for a new passkey
   *
   * WebAuthn registration flow:
   * 1. Backend generates a unique challenge
   * 2. Backend returns options (challenge, RP info, user info)
   * 3. Frontend asks authenticator to create a passkey
   * 4. Authenticator generates a key pair (private/public)
   * 5. Authenticator signs challenge with private key
   * 6. Frontend sends response to backend
   * 7. Backend verifies signature and stores public key
   *
   * @param userId - ID of user registering the passkey
   * @returns WebAuthn options for registration
   * @throws UnauthorizedException if user doesn't exist
   */
  async generateRegistrationOptions(userId: string) {
    // Get user with existing passkeys
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["credentials"],
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Generate WebAuthn options
    const options = await generateRegistrationOptions({
      rpName: this.rpName, // RP name displayed to user
      rpID: this.rpID, // RP domain
      userName: user.email, // Unique user identifier
      userDisplayName: `${user.firstName} ${user.lastName}`, // Display name
      userID: Buffer.from(user.id).toString("base64url"), // Encoded user ID
      timeout: 60000, // Expiration delay (60 seconds)
      attestationType: "none", // No attestation needed (simplified)
      // Exclude already registered passkeys (prevents duplicates)
      excludeCredentials: user.credentials.map((cred) => ({
        id: Buffer.from(cred.credentialId, "base64url"),
        type: "public-key",
      })),
      authenticatorSelection: {
        userVerification: "preferred", // Preferred user verification (Touch ID, etc.)
        residentKey: "preferred", // Preferred resident key (synced passkey)
      },
    });

    /**
     * Store challenge for later verification
     *
     * The challenge is unique and can only be used once.
     * It will be verified during verifyRegistration().
     */
    this.challenges.set(`reg-${userId}`, {
      challenge: options.challenge,
      timestamp: Date.now(),
    });

    return options;
  }

  /**
   * Verify registration of a new passkey
   *
   * After the authenticator has created the passkey and signed the challenge,
   * this method:
   * 1. Gets the stored challenge
   * 2. Verifies signature with public key
   * 3. Verifies origin and RP ID
   * 4. Stores passkey in database
   *
   * @param userId - User ID
   * @param attestationResponse - Attestation response from authenticator
   * @param deviceType - Device type (iOS, Android, Desktop)
   * @returns { verified: true } if registration succeeds
   * @throws BadRequestException if verification fails
   */
  async verifyRegistration(
    userId: string,
    attestationResponse: any,
    deviceType: string
  ) {
    // Get user
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["credentials"],
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Get stored challenge (and immediate deletion)
    const expectedChallenge = this.getExpectedChallenge(userId, "reg");

    // Verify attestation response
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: attestationResponse,
        expectedChallenge: expectedChallenge, // Unique challenge to verify
        expectedOrigin: this.origin, // Authorized origin
        expectedRPID: this.rpID, // Expected RP ID
        requireUserVerification: false, // No mandatory user verification
      });
    } catch (error) {
      throw new BadRequestException(`Verification failed: ${error.message}`);
    }

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      throw new BadRequestException("Registration verification failed");
    }

    /**
     * Save passkey to database
     *
     * We store:
     * - credentialId: Unique passkey identifier
     * - publicKey: Public key to verify future signatures
     * - counter: Anti-replay counter (incremented on each use)
     * - deviceType: Device type for display
     * - backedUp: Indicates if passkey is backed up (iCloud, etc.)
     */
    const credential = this.credentialRepository.create({
      credentialId: Buffer.from(registrationInfo.credentialID).toString(
        "base64url"
      ),
      publicKey: Buffer.from(registrationInfo.credentialPublicKey).toString(
        "base64"
      ),
      counter: registrationInfo.counter,
      deviceType: deviceType || "Unknown",
      backedUp: registrationInfo.credentialBackedUp || false,
      user: user,
    });

    await this.credentialRepository.save(credential);

    return { verified: true };
  }

  /**
   * Generate authentication options to test a passkey
   * (used from dashboard)
   *
   * @param userId - User ID
   * @returns WebAuthn options for authentication
   * @throws BadRequestException if user has no passkeys
   */
  async generateAuthenticationOptions(userId: string) {
    // Get user with passkeys
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["credentials"],
    });

    if (!user || !user.credentials || user.credentials.length === 0) {
      throw new BadRequestException("No credentials found for user");
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      // List of authorized passkeys for this user
      allowCredentials: user.credentials.map((cred) => ({
        id: Buffer.from(cred.credentialId, "base64url"),
        type: "public-key",
      })),
      userVerification: "preferred",
      timeout: 60000,
    });

    // Store challenge for verification
    this.challenges.set(`auth-${userId}`, {
      challenge: options.challenge,
      timestamp: Date.now(),
    });

    return options;
  }

  /**
   * Generate authentication options for passkey login
   * (used during login)
   *
   * Difference with generateAuthenticationOptions():
   * - Uses email instead of userId
   * - Stores challenge with email as key
   * - Returns options for all user passkeys
   *
   * @param email - User email
   * @returns WebAuthn options for authentication
   * @throws UnauthorizedException if user doesn't exist
   * @throws BadRequestException if user has no passkeys
   */
  async generateAuthenticationOptionsByEmail(email: string) {
    // Recherche de l'utilisateur par email
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["credentials"],
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (!user.credentials || user.credentials.length === 0) {
      throw new BadRequestException("No passkeys found for this user");
    }

    // Generate options with all user passkeys
    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials: user.credentials.map((cred) => ({
        id: Buffer.from(cred.credentialId, "base64url"),
        type: "public-key",
      })),
      userVerification: "preferred",
      timeout: 60000,
    });

    /**
     * Store challenge with email as key
     *
     * We also store userId to use it during verification.
     */
    this.challenges.set(`auth-email-${email}`, {
      challenge: options.challenge,
      timestamp: Date.now(),
      userId: user.id,
    });

    return options;
  }

  /**
   * Verify authentication with a passkey (from dashboard)
   *
   * WebAuthn authentication flow:
   * 1. Backend generates a unique challenge
   * 2. Frontend asks authenticator to sign the challenge
   * 3. Authenticator requests confirmation (Touch ID, Face ID, etc.)
   * 4. Authenticator signs challenge with private key
   * 5. Frontend sends signature to backend
   * 6. Backend verifies signature with stored public key
   * 7. Backend updates anti-replay counter
   *
   * @param userId - User ID
   * @param assertionResponse - Assertion response signed by authenticator
   * @returns { verified: true } if authentication succeeds
   * @throws BadRequestException if verification fails
   */
  async verifyAuthentication(userId: string, assertionResponse: any) {
    // Get user with passkeys
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["credentials"],
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Extract ID of used passkey
    const credentialId = Buffer.from(
      assertionResponse.id,
      "base64url"
    ).toString("base64url");

    // Find corresponding passkey
    const credential = user.credentials.find(
      (c) => c.credentialId === credentialId
    );

    if (!credential) {
      throw new BadRequestException("Credential not found");
    }

    // Get stored challenge
    const expectedChallenge = this.getExpectedChallenge(userId, "auth");

    // Verify assertion response
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: assertionResponse,
        expectedChallenge: expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        // Authenticator information for verification
        authenticator: {
          credentialID: Buffer.from(credential.credentialId, "base64url"),
          credentialPublicKey: Buffer.from(credential.publicKey, "base64"),
          counter: credential.counter, // Compteur anti-replay
        },
        requireUserVerification: false,
      });
    } catch (error) {
      throw new BadRequestException(`Authentication failed: ${error.message}`);
    }

    const { verified, authenticationInfo } = verification;

    if (!verified) {
      throw new BadRequestException("Authentication verification failed");
    }

    /**
     * Update anti-replay counter
     *
     * Counter must always increase. If a passkey is reused
     * with an old counter, this indicates a replay attack.
     */
    credential.counter = authenticationInfo.newCounter;
    await this.credentialRepository.save(credential);

    return { verified: true };
  }

  /**
   * Verify authentication during passkey login
   *
   * Similar to verifyAuthentication(), but:
   * - Uses email instead of userId
   * - Gets stored challenge with email
   * - Also returns user information
   *
   * @param email - User email
   * @param assertionResponse - Signed assertion response
   * @returns { verified: true, user: User } if authentication succeeds
   * @throws BadRequestException if verification fails
   */
  async verifyAuthenticationByEmail(email: string, assertionResponse: any) {
    // Get user
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["credentials"],
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Extract passkey ID
    const credentialId = Buffer.from(
      assertionResponse.id,
      "base64url"
    ).toString("base64url");

    // Find passkey
    const credential = user.credentials.find(
      (c) => c.credentialId === credentialId
    );

    if (!credential) {
      throw new BadRequestException("Credential not found");
    }

    // Get stored challenge with email
    const challengeKey = `auth-email-${email}`;
    const stored = this.challenges.get(challengeKey);

    if (!stored) {
      throw new BadRequestException(
        "Challenge not found. Please request new options."
      );
    }

    const expectedChallenge = stored.challenge;
    // Immediate challenge deletion (single use)
    this.challenges.delete(challengeKey);

    // Verify response
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: assertionResponse,
        expectedChallenge: expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        authenticator: {
          credentialID: Buffer.from(credential.credentialId, "base64url"),
          credentialPublicKey: Buffer.from(credential.publicKey, "base64"),
          counter: credential.counter,
        },
        requireUserVerification: false,
      });
    } catch (error) {
      throw new BadRequestException(`Authentication failed: ${error.message}`);
    }

    const { verified, authenticationInfo } = verification;

    if (!verified) {
      throw new BadRequestException("Authentication verification failed");
    }

    // Update counter
    credential.counter = authenticationInfo.newCounter;
    await this.credentialRepository.save(credential);

    // Retourne l'utilisateur pour la connexion
    return {
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Delete a registered passkey
   *
   * @param userId - User ID
   * @param credentialId - ID of passkey to delete
   * @returns { success: true }
   * @throws BadRequestException if passkey doesn't exist
   */
  async deleteCredential(userId: string, credentialId: string) {
    // Find passkey (also verifies it belongs to the user)
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId, userId },
    });

    if (!credential) {
      throw new BadRequestException("Credential not found");
    }

    // Delete passkey
    await this.credentialRepository.remove(credential);
    return { success: true };
  }

  /**
   * Get and delete a stored challenge
   *
   * Challenges are single-use:
   * - Once retrieved, they are immediately deleted
   * - This prevents replay attacks
   *
   * @param userId - User ID or email
   * @param type - Challenge type ("reg" for registration, "auth" for authentication)
   * @returns The expected challenge
   * @throws BadRequestException if challenge doesn't exist
   *
   * @private
   */
  private getExpectedChallenge(userId: string, type: "reg" | "auth"): string {
    const key = `${type}-${userId}`;
    const stored = this.challenges.get(key);

    if (!stored) {
      throw new BadRequestException(
        "Challenge not found. Please request new options."
      );
    }

    /**
     * Immediate challenge deletion after retrieval
     *
     * A challenge can only be used once.
     * This ensures a signature cannot be reused.
     */
    this.challenges.delete(key);

    return stored.challenge;
  }
}
