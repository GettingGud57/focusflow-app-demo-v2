import { useState, type FormEvent, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setAccessToken, useAccessToken } from "@/lib/accessToken";

// Renders nothing of the app, and so fires no API calls, until a token is
// stored. Mounted above DataProvider for that reason.
export function AccessGate({ children }: { children: ReactNode }) {
  const token = useAccessToken();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (token) return <>{children}</>;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const candidate = draft.trim();
    if (!candidate) return;

    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/check", {
        headers: { Authorization: `Bearer ${candidate}` },
      });
      if (res.ok) setAccessToken(candidate);
      else if (res.status === 401) setError("That token isn't right.");
      else setError(`Server said ${res.status}. Is ACCESS_TOKEN set on the server?`);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">FocusFlow</h1>
            <p className="text-sm text-muted-foreground">
              Enter your access token. You only need to do this once on this device.
            </p>
            <Input
              type="password"
              autoComplete="current-password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Access token"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={checking || !draft.trim()}>
              {checking ? "Checking…" : "Unlock"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
