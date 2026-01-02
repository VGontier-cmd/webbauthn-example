/**
 * Main login component
 *
 * Manages the login flow in 3 steps:
 * 1. EmailStep: Email input
 * 2. PasswordStep: Choice between password or passkey
 * 3. PasskeyStep: Confirmation with passkey
 *
 * @component
 */
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { EmailStep } from "./login/EmailStep";
import { PasskeyStep } from "./login/PasskeyStep";
import { PasswordStep } from "./login/PasswordStep";

type LoginStep = "email" | "password" | "passkey";

function Login() {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [step, setStep] = useState<LoginStep>("email");

  // Loading states
  const [loading, setLoading] = useState(false);
  const [generatingOptions, setGeneratingOptions] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  // WebAuthn options for passkey authentication
  const [passkeyOptions, setPasskeyOptions] =
    useState<PublicKeyCredentialRequestOptionsJSON | null>(null);

  /**
   * Handles login with email and password
   *
   * Flow:
   * 1. Calls the login API
   * 2. Stores user ID in localStorage
   * 3. Redirects to dashboard
   */
  const handlePasswordLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const user = await api.login({ email, password });
        localStorage.setItem("userId", user.id);
        navigate("/dashboard");
      } catch (err: any) {
        setError(err.message || "Login failed");
      } finally {
        setLoading(false);
      }
    },
    [email, password, navigate]
  );

  /**
   * Generates WebAuthn authentication options
   *
   * This function:
   * 1. Asks the backend to generate options (challenge, credential IDs, etc.)
   * 2. Stores the options for the next step
   * 3. Moves to the "passkey" step for confirmation
   *
   * The options contain the unique challenge that will be signed by the authenticator
   */
  const handleStartPasskeyLogin = useCallback(async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setGeneratingOptions(true);
    setError("");

    try {
      // Backend generates a unique challenge and returns the options
      const options = await api.generateLoginOptions(email);
      setPasskeyOptions(options);
      setStep("passkey");
    } catch (err: any) {
      setError(err.message || "Unable to generate authentication options");
    } finally {
      setGeneratingOptions(false);
    }
  }, [email]);

  /**
   * Authenticates the user with their passkey
   *
   * WebAuthn flow:
   * 1. startAuthentication(): Asks the authenticator to sign the challenge
   * 2. Authenticator requests confirmation (Touch ID, Face ID, etc.)
   * 3. Authenticator signs the challenge with the private key
   * 4. verifyLogin(): Backend verifies the signature with the public key
   * 5. If valid, the user is logged in
   */
  const handleAuthenticateWithPasskey = useCallback(async () => {
    if (!passkeyOptions) {
      setError("Missing authentication options");
      return;
    }

    setAuthenticating(true);
    setError("");

    try {
      // Step 1: Authenticator signs the challenge
      // Browser requests confirmation (Touch ID, Face ID, etc.)
      const assertionResponse = await startAuthentication(passkeyOptions);

      // Step 2: Backend verifies the signature
      const user = await api.verifyLogin(email, assertionResponse);

      // Step 3: Login successful
      localStorage.setItem("userId", user.id);
      navigate("/dashboard");
    } catch (err: any) {
      // Handle WebAuthn-specific errors
      if (err.name === "NotAllowedError") {
        setError("Authentication was cancelled");
      } else {
        setError(err.message || "Passkey authentication failed");
      }
    } finally {
      setAuthenticating(false);
    }
  }, [passkeyOptions, email, navigate]);

  /**
   * Returns to the email step and resets the state
   */
  const handleBackToEmail = useCallback(() => {
    setStep("email");
    setPasskeyOptions(null);
    setPassword("");
    setError("");
  }, []);

  /**
   * Moves to the choice step (password or passkey)
   * Validates that email is filled before continuing
   */
  const handleEmailContinue = useCallback(() => {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setStep("password");
    setError("");
  }, [email]);

  // Conditional rendering based on current step
  switch (step) {
    case "email":
      return (
        <EmailStep
          email={email}
          onEmailChange={setEmail}
          onContinue={handleEmailContinue}
          error={error}
        />
      );

    case "password":
      return (
        <PasswordStep
          email={email}
          password={password}
          onPasswordChange={setPassword}
          onPasswordLogin={handlePasswordLogin}
          onStartPasskeyLogin={handleStartPasskeyLogin}
          onBack={handleBackToEmail}
          loading={loading}
          generatingOptions={generatingOptions}
          error={error}
        />
      );

    case "passkey":
      return (
        <PasskeyStep
          email={email}
          onAuthenticate={handleAuthenticateWithPasskey}
          onBack={handleBackToEmail}
          authenticating={authenticating}
          error={error}
        />
      );

    default:
      return null;
  }
}

export default Login;
