/**
 * Component for the email input step
 *
 * First step of the login flow.
 * User enters their email, then can continue to the next step
 * where they will choose between password or passkey.
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
import { Link } from "react-router-dom";

interface EmailStepProps {
  /** Email entered by the user */
  email: string;
  /** Callback called when email changes */
  onEmailChange: (email: string) => void;
  /** Callback called when user clicks "Continue" */
  onContinue: () => void;
  /** Error message to display (empty if no error) */
  error: string;
}

/**
 * Displays the email input form
 *
 * The "Continue" button is disabled until email is filled.
 * HTML5 validation (type="email") ensures a valid email format.
 */
export function EmailStep({
  email,
  onEmailChange,
  onContinue,
  error,
}: EmailStepProps) {
  /**
   * Handles form submission
   * Prevents default behavior and calls onContinue
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onContinue();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>Entrez votre email pour continuer</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="votre@email.com"
                required
                autoFocus
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={!email}>
              Continuer
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Pas encore de compte ?{" "}
              <Link to="/register" className="text-primary hover:underline">
                S'inscrire
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
