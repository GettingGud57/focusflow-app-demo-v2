import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useApiKey } from "@/hooks/use-api-key";
import { useToast } from "@/hooks/use-toast";

// Lives in its own file rather than inside SettingsDialog. It used to be
// exported from there, back when the dialog rendered it inline -- but the dialog
// now just navigates to /api-key, so ApiKeyPage was its only consumer and the
// import read as a page reaching into a dialog it never uses.
type ApiKeyFormProps = {
  onSaved?: () => void;
};

export function ApiKeyForm({ onSaved }: ApiKeyFormProps) {
  const { apiKey, hasUserKey, saveKey, clearKey } = useApiKey();
  const { toast } = useToast();
  const [value, setValue] = useState(apiKey ?? "");
  const [show, setShow] = useState(false);

  useEffect(() => {
    setValue(apiKey ?? "");
  }, [apiKey]);

  const handleSave = () => {
    if (!value.trim()) {
      toast({ title: "API key required", description: "Please paste your Groq/OpenAI/Gemini-compatible key.", variant: "destructive" });
      return;
    }
    saveKey(value.trim());
    toast({ title: "Key saved", description: "Your key is stored locally and will be used for AI calls." });
    onSaved?.();
  };

  const handleClear = () => {
    clearKey();
    setValue("");
    toast({ title: "Key cleared", description: "Reverting to the project env key." });
  };

  const statusLabel = hasUserKey ? "Using saved key" : "Using env key";
  const statusTone = hasUserKey ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <KeyRound className="h-4 w-4" />
          <span>Groq/OpenAI/Gemini-compatible key</span>
        </div>
        <Badge className={statusTone}>{statusLabel}</Badge>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-key">API Key</Label>
        <div className="flex gap-2">
          <Input
            id="api-key"
            type={show ? "text" : "password"}
            autoComplete="off"
            placeholder="sk-..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button variant="outline" type="button" onClick={() => setShow((prev) => !prev)} className="shrink-0">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Stored locally in this browser. Clear to fall back to the project key.</p>
      </div>

      {/* A plain div, not DialogFooter. That's a dialog primitive, and this form
          is never rendered in a dialog -- using it meant fighting its own
          classes with a layout override that could never be false. */}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={handleClear} className="gap-2 text-destructive">
          <Trash2 className="h-4 w-4" /> Clear
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}
