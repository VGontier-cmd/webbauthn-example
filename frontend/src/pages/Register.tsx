/**
 * Registration page
 *
 * Allows a new user to create an account with:
 * - First name and last name
 * - Email (unique)
 * - Password (minimum 6 characters)
 *
 * After successful registration, the user is automatically logged in
 * and redirected to the dashboard where they can add passkeys.
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
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, RegisterData } from "../services/api";

function Register() {
  const navigate = useNavigate();

  // Registration form state
  const [formData, setFormData] = useState<RegisterData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Handles registration form submission
   *
   * Flow:
   * 1. Validates data client-side (HTML5)
   * 2. Calls registration API
   * 3. Stores user ID in localStorage
   * 4. Redirects to dashboard
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        // Create user account
        const user = await api.register(formData);

        // Automatic login after registration
        localStorage.setItem("userId", user.id);
        navigate("/dashboard");
      } catch (err: any) {
        setError(err.message || "Registration failed");
      } finally {
        setLoading(false);
      }
    },
    [formData, navigate]
  );

  /**
   * Updates a form field
   *
   * @param field - Name of the field to update
   * @param value - New value
   */
  const updateField = useCallback(
    (field: keyof RegisterData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Register</CardTitle>
          <CardDescription>
            Create an account to start using WebAuthn
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* First name field */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                required
              />
            </div>

            {/* Last name field */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                required
              />
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                minLength={6}
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
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Registering..." : "Register"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default Register;
