/**
 * Dashboard page
 *
 * Displays user account information and allows:
 * - View personal information (first name, last name, email)
 * - Add new passkeys
 * - Test authentication with an existing passkey
 * - Delete registered passkeys
 * - Logout
 *
 * @component
 */
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types";
import { Key, LogOut, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, Credential, User } from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  // User state
  const [user, setUser] = useState<User | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  // Error state
  const [error, setError] = useState("");

  /**
   * Loads user information on component mount
   *
   * Checks that the user is logged in (userId in localStorage).
   * If not, redirects to the login page.
   */
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }
    loadUser(userId);
  }, [navigate]);

  /**
   * Loads user information from the API
   *
   * @param userId - User ID stored in localStorage
   */
  const loadUser = useCallback(
    async (userId: string) => {
      // Validate user ID
      if (!userId || userId === "undefined" || userId.trim() === "") {
        localStorage.removeItem("userId");
        navigate("/login");
        return;
      }

      try {
        const userData = await api.getUser(userId);
        setUser(userData);
      } catch (err: any) {
        setError(err.message || "Failed to load user");
        // If user no longer exists, automatic logout
        if (
          err.message.includes("not found") ||
          err.message.includes("Invalid")
        ) {
          localStorage.removeItem("userId");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  /**
   * Adds a new passkey
   *
   * WebAuthn registration flow:
   * 1. Ask backend to generate options (challenge, etc.)
   * 2. Detect device type (iOS, Android, Desktop)
   * 3. Ask authenticator to create the passkey
   * 4. Authenticator requests confirmation (Touch ID, Face ID, etc.)
   * 5. Authenticator generates a key pair and signs the challenge
   * 6. Sends response to backend for verification
   * 7. Backend stores the public key
   * 8. Reloads user information to display the new passkey
   */
  const handleAddPasskey = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    setAddingPasskey(true);
    setError("");

    try {
      // Step 1: Generate registration options
      const options = await api.generateRegistrationOptions(userId);

      // Step 2: Detect device type
      const deviceType =
        navigator.userAgent.includes("iPhone") ||
        navigator.userAgent.includes("iPad")
          ? "iOS Device"
          : navigator.userAgent.includes("Android")
          ? "Android Device"
          : "Desktop";

      // Step 3: Passkey creation by authenticator
      // Browser requests confirmation (Touch ID, Face ID, etc.)
      const attestationResponse = await startRegistration(
        options as PublicKeyCredentialCreationOptionsJSON
      );

      // Step 4: Verification and storage by backend
      await api.verifyRegistration(userId, attestationResponse, deviceType);

      // Step 5: Reload user information
      await loadUser(userId);
      alert("Passkey added successfully!");
    } catch (err: any) {
      // Handle WebAuthn-specific errors
      if (err.name === "NotAllowedError") {
        setError("Passkey addition was cancelled");
      } else {
        setError(err.message || "Failed to add passkey");
      }
    } finally {
      setAddingPasskey(false);
    }
  }, [navigate, loadUser]);

  /**
   * Tests authentication with an existing passkey
   *
   * WebAuthn authentication flow:
   * 1. Ask backend to generate options (challenge, credential IDs)
   * 2. Ask authenticator to sign the challenge
   * 3. Authenticator requests confirmation (Touch ID, Face ID, etc.)
   * 4. Authenticator signs the challenge with the private key
   * 5. Sends signature to backend for verification
   * 6. Backend verifies signature with stored public key
   * 7. If valid, authentication succeeds
   */
  const handleAuthenticateWithPasskey = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId || !user?.credentials || user.credentials.length === 0) {
      setError("No passkey available");
      return;
    }

    setAuthenticating(true);
    setError("");

    try {
      // Step 1: Generate authentication options
      const options = await api.generateAuthenticationOptions(userId);

      // Step 2: Challenge signing by authenticator
      // Browser requests confirmation (Touch ID, Face ID, etc.)
      const assertionResponse = await startAuthentication(
        options as PublicKeyCredentialRequestOptionsJSON
      );

      // Step 3: Signature verification by backend
      await api.verifyAuthentication(userId, assertionResponse);
      alert("Authentication successful with passkey!");
    } catch (err: any) {
      // Handle WebAuthn-specific errors
      if (err.name === "NotAllowedError") {
        setError("Authentication was cancelled");
      } else {
        setError(err.message || "Authentication failed");
      }
    } finally {
      setAuthenticating(false);
    }
  }, [user]);

  /**
   * Deletes a registered passkey
   *
   * @param credentialId - ID of the passkey to delete
   */
  const handleDeleteCredential = useCallback(
    async (credentialId: string) => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      // Confirmation before deletion
      if (!confirm("Are you sure you want to delete this passkey?")) {
        return;
      }

      try {
        await api.deleteCredential(userId, credentialId);
        // Reload user information
        await loadUser(userId);
      } catch (err: any) {
        setError(err.message || "Failed to delete credential");
      }
    },
    [loadUser]
  );

  /**
   * Logs out the user
   *
   * Removes user ID from localStorage and redirects to the login page.
   */
  const handleLogout = useCallback(() => {
    localStorage.removeItem("userId");
    navigate("/login");
  }, [navigate]);

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="pt-6">
            <p className="text-center">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user doesn't exist, don't render anything (redirect in progress)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-3xl font-bold">Dashboard</CardTitle>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Section: Account information */}
              <div>
                <h2 className="mb-4 text-xl font-semibold">
                  Account Information
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">{user.firstName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Name</p>
                    <p className="font-medium">{user.lastName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Section: Passkey management */}
              <div className="border-t pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Passkeys</h2>
                </div>

                {/* Error display */}
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Action buttons */}
                <div className="mb-6 flex flex-wrap gap-4">
                  {/* Button: Add passkey */}
                  <Button
                    onClick={handleAddPasskey}
                    disabled={addingPasskey}
                    className="flex items-center gap-2"
                  >
                    <Key className="h-4 w-4" />
                    {addingPasskey ? "Adding..." : "Add passkey"}
                  </Button>

                  {/* Button: Test passkey (only shown if passkeys exist) */}
                  {user.credentials && user.credentials.length > 0 && (
                    <Button
                      variant="secondary"
                      onClick={handleAuthenticateWithPasskey}
                      disabled={authenticating}
                    >
                      {authenticating ? "Authenticating..." : "Test passkey"}
                    </Button>
                  )}
                </div>

                {/* List of registered passkeys */}
                {user.credentials && user.credentials.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-medium">
                      Registered Passkeys ({user.credentials.length})
                    </h3>
                    {user.credentials.map((credential: Credential) => (
                      <Card key={credential.id}>
                        <CardContent className="flex items-center justify-between pt-6">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {credential.deviceType}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Added on{" "}
                              {new Date(
                                credential.createdAt
                              ).toLocaleDateString("en-US")}
                            </p>
                          </div>
                          {/* Button: Delete passkey */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDeleteCredential(credential.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* Message if no passkey is registered */
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        No passkey registered. Add one to login more easily!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
