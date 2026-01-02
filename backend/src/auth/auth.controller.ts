/**
 * Contrôleur d'authentification
 *
 * Expose les endpoints REST pour :
 * - L'inscription et la connexion classique (email/password)
 * - L'enregistrement et l'authentification WebAuthn (passkeys)
 * - La gestion des utilisateurs et des passkeys
 *
 * Tous les endpoints sont préfixés par "/auth"
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
   * Inscription d'un nouvel utilisateur
   *
   * @param registerDto - Données d'inscription (email, password, firstName, lastName)
   * @returns Utilisateur créé (sans le mot de passe)
   */
  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/login
   *
   * Connexion avec email et mot de passe
   *
   * @param loginDto - Email et mot de passe
   * @returns Utilisateur connecté (sans le mot de passe)
   */
  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * GET /auth/user/:userId
   *
   * Récupère les informations d'un utilisateur avec ses passkeys
   *
   * @param userId - ID unique de l'utilisateur
   * @returns Utilisateur avec ses passkeys enregistrées
   */
  @Get("user/:userId")
  async getUser(@Param("userId") userId: string) {
    return this.authService.getUser(userId);
  }

  /**
   * POST /auth/webauthn/register/options/:userId
   *
   * Génère les options d'enregistrement d'une nouvelle passkey
   *
   * Utilisé depuis le dashboard pour ajouter une nouvelle passkey.
   * Le backend génère un challenge unique et retourne les options WebAuthn.
   *
   * @param userId - ID de l'utilisateur qui enregistre la passkey
   * @returns Options WebAuthn pour l'enregistrement (challenge, RP info, etc.)
   */
  @Post("webauthn/register/options/:userId")
  async generateRegistrationOptions(@Param("userId") userId: string) {
    return this.authService.generateRegistrationOptions(userId);
  }

  /**
   * POST /auth/webauthn/register/verify/:userId
   *
   * Vérifie l'enregistrement d'une nouvelle passkey
   *
   * Après que l'authentificateur ait créé la passkey et signé le challenge,
   * cette méthode vérifie la signature et stocke la passkey dans la base de données.
   *
   * @param userId - ID de l'utilisateur
   * @param body.response - Réponse d'attestation de l'authentificateur
   * @param body.deviceType - Type d'appareil (iOS, Android, Desktop)
   * @returns { verified: true } si l'enregistrement est réussi
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
   * Génère les options d'authentification pour tester une passkey
   *
   * Utilisé depuis le dashboard pour tester l'authentification avec une passkey existante.
   *
   * @param userId - ID de l'utilisateur
   * @returns Options WebAuthn pour l'authentification (challenge, credential IDs, etc.)
   */
  @Post("webauthn/authenticate/options/:userId")
  async generateAuthenticationOptions(@Param("userId") userId: string) {
    return this.authService.generateAuthenticationOptions(userId);
  }

  /**
   * POST /auth/webauthn/authenticate/verify/:userId
   *
   * Vérifie l'authentification avec une passkey (depuis le dashboard)
   *
   * Après que l'authentificateur ait signé le challenge, cette méthode
   * vérifie la signature avec la clé publique stockée.
   *
   * @param userId - ID de l'utilisateur
   * @param body.response - Réponse d'assertion signée par l'authentificateur
   * @returns { verified: true } si l'authentification est réussie
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
   * Supprime une passkey enregistrée
   *
   * @param userId - ID de l'utilisateur
   * @param credentialId - ID de la passkey à supprimer
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
   * Génère les options d'authentification pour la connexion par passkey
   *
   * Utilisé lors du login : le backend trouve l'utilisateur par email,
   * récupère ses passkeys, et génère un challenge unique.
   *
   * @param body.email - Email de l'utilisateur
   * @returns Options WebAuthn contenant le challenge et les credential IDs autorisés
   */
  @Post("webauthn/login/options")
  async generateLoginOptions(@Body() body: { email: string }) {
    return this.authService.generateAuthenticationOptionsByEmail(body.email);
  }

  /**
   * POST /auth/webauthn/login/verify
   *
   * Vérifie l'authentification lors de la connexion par passkey
   *
   * Après que l'authentificateur ait signé le challenge, cette méthode
   * vérifie la signature avec la clé publique stockée et retourne l'utilisateur.
   *
   * @param body.email - Email de l'utilisateur
   * @param body.response - Réponse d'assertion signée par l'authentificateur
   * @returns { verified: true, user: User } si l'authentification est réussie
   */
  @Post("webauthn/login/verify")
  async verifyLogin(@Body() body: { email: string; response: any }) {
    return this.authService.verifyAuthenticationByEmail(
      body.email,
      body.response
    );
  }
}
