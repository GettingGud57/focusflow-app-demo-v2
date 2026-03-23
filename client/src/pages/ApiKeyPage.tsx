import { ApiKeyForm } from "@/components/SettingsDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApiKeyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">API Key</h1>
        <p className="text-sm text-muted-foreground">Provide a Groq/OpenAI/Gemini-compatible key to override the project key. Stored locally.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
          <CardDescription>Keys stay in your browser. Clear to fall back to the project key.</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeyForm layout="page" />
        </CardContent>
      </Card>
    </div>
  );
}
