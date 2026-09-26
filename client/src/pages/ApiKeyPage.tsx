import { ApiKeyForm } from "@/components/ApiKeyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApiKeyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">API Key</h1>
        <p className="text-sm text-muted-foreground">Provide a Groq/OpenAI/Gemini-compatible key to override the project key. Stored locally.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your key</CardTitle>
        </CardHeader>
        <CardContent>
          <ApiKeyForm />
        </CardContent>
      </Card>
    </div>
  );
}
