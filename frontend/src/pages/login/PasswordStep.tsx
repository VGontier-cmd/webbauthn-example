/**
 * Component for the authentication method choice step
 *
 * Second step of the login flow.
 * User can choose between:
 * - Login with password (classic form)
 * - Login with passkey (generates options then moves to PasskeyStep)
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

interface PasswordStepProps {
  /** User's email (displayed as read-only) */
  email: string;
  /** Password entered */
  password: string;
  /** Callback called when password changes */
  onPasswordChange: (password: string) => void;
  /** Callback called on password form submission */
  onPasswordLogin: (e: React.FormEvent) => void;
  /** Callback called to start passkey authentication */
  onStartPasskeyLogin: () => void;
  /** Callback called to return to email step */
  onBack: () => void;
  /** Indicates if password login is in progress */
  loading: boolean;
  /** Indicates if passkey options generation is in progress */
  generatingOptions: boolean;
  /** Error message to display */
  error: string;
}

/**
 * Displays the form with two options:
 * 1. Login with password (classic form)
 * 2. Login with passkey (button that generates options)
 *
 * Email is displayed as read-only as it was entered in the previous step.
 */
export function PasswordStep({
  email,
  password,
  onPasswordChange,
  onPasswordLogin,
  onStartPasskeyLogin,
  onBack,
  loading,
  generatingOptions,
  error,
}: PasswordStepProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Login with your password or passkey</CardDescription>
        </CardHeader>
        <form onSubmit={onPasswordLogin}>
          <CardContent className="space-y-4">
            {/* Email read-only (entered in previous step) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Enter your password"
                required
                autoFocus
              />
            </div>

            {/* Error display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {/* Password login button */}
            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full"
            >
              {loading ? "Logging in..." : "Login with password"}
            </Button>

            {/* Visual separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Button to start passkey authentication */}
            <Button
              type="button"
              variant="outline"
              onClick={onStartPasskeyLogin}
              disabled={generatingOptions}
              className="w-full"
            >
              <Key className="mr-2 h-4 w-4" />
              {generatingOptions
                ? "Generating options..."
                : "Login with passkey"}
            </Button>

            {/* Back button to email step */}
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
