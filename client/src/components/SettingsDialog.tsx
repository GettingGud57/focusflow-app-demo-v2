import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Moon, Sun, Trash2, List } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useApiKey } from "@/hooks/use-api-key";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";

export type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAppearance: () => void;
  onSelectApi: () => void;
};

export function SettingsDialog({ open, onOpenChange, onSelectAppearance, onSelectApi }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Choose what you want to adjust.</DialogDescription>
        </DialogHeader>
        <SettingsMenu 
          onSelectAppearance={() => {
            onOpenChange(false);
            onSelectAppearance();
          }}
          onSelectApi={() => {
            onOpenChange(false);
            onSelectApi();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

type SettingsMenuProps = {
  onSelectAppearance: () => void;
  onSelectApi: () => void;
};

function SettingsMenu({ onSelectAppearance, onSelectApi }: SettingsMenuProps) {
  return (
    <div className="space-y-3">
      <Button variant="outline" className="w-full justify-between" onClick={onSelectAppearance}>
        <span className="flex items-center gap-2">
          <Moon className="h-4 w-4" /> Appearance
        </span>
        <List className="h-4 w-4 text-muted-foreground" />
      </Button>
      <Button variant="outline" className="w-full justify-between" onClick={onSelectApi}>
        <span className="flex items-center gap-2">
          <KeyRound className="h-4 w-4" /> API Key
        </span>
        <List className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

// AppearanceForm removed from dialog; appearance now lives on its own page

type ApiKeyFormProps = {
  layout?: "dialog" | "page";
  onSaved?: () => void;
};

export function ApiKeyForm({ layout = "page", onSaved }: ApiKeyFormProps) {
  const { apiKey, hasUserKey, saveKey, clearKey } = useApiKey();
  const { toast } = useToast();
  const [value, setValue] = useState(apiKey ?? "");
  const [show, setShow] = useState(false);

  useEffect(() => {
    setValue(apiKey ?? "");
  }, [apiKey]);

  const handleSave = () => {
    if (!value.trim()) {
      toast({ title: "API key required", description: "Please paste your Groq/OpenAI-compatible key.", variant: "destructive" });
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
          <span>Groq/OpenAI-compatible key</span>
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

      <DialogFooter className={layout === "page" ? "justify-end gap-2" : undefined}>
        <Button variant="ghost" type="button" onClick={handleClear} className="gap-2 text-destructive">
          <Trash2 className="h-4 w-4" /> Clear
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogFooter>
    </div>
  );
}
