/**
 * Component for the passkey confirmation step
 *
 * Third step of the passkey login flow.
 * User confirms their identity using their passkey
 * (Touch ID, Face ID, security key, etc.)
 *
 * @component
 */
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Key } from "lucide-react";

interface PasskeyStepProps {
  /** User's email (displayed as read-only) */
  email: string;
  /** Callback called to start WebAuthn authentication */
  onAuthenticate: () => void;
  /** Callback called to return to previous step */
  onBack: () => void;
  /** Indicates if authentication is in progress */
  authenticating: boolean;
  /** Error message to display */
  error: string;
}

/**
 * Displays the passkey confirmation screen
 *
 * When user clicks "Confirm with my passkey":
 * 1. Browser requests confirmation (Touch ID, Face ID, etc.)
 * 2. Authenticator signs the challenge with the private key
 * 3. Signature is sent to backend for verification
 * 4. If valid, user is logged in
 */
export function PasskeyStep({
  email,
  onAuthenticate,
  onBack,
  authenticating,
  error,
}: PasskeyStepProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Authentification par passkey
          </CardTitle>
          <CardDescription>
            Confirmez votre identité avec votre passkey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email read-only */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled className="bg-muted" />
          </div>

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Instructions for user */}
          <Alert>
            <AlertDescription>
              Cliquez sur le bouton ci-dessous pour confirmer avec votre passkey
              (Touch ID, Face ID, ou clé de sécurité).
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {/* Main button: triggers WebAuthn authentication */}
          <Button
            onClick={onAuthenticate}
            disabled={authenticating}
            className="w-full"
          >
            <Key className="mr-2 h-4 w-4" />
            {authenticating
              ? "Authentification en cours..."
              : "Confirmer avec ma passkey"}
          </Button>

          {/* Back button to previous step */}
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
