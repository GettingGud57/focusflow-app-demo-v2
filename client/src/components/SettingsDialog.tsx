import { KeyRound, Moon, List, Volume2, Timer } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAppearance: () => void;
  onSelectApi: () => void;
  onSelectSoundSettings: () => void;
  onSelectTimerSettings: () => void;
};

export function SettingsDialog({ open, onOpenChange, onSelectAppearance, onSelectApi, onSelectSoundSettings, onSelectTimerSettings }: SettingsDialogProps) {
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
          onSelectSoundSettings={() => {
            onOpenChange(false);
            onSelectSoundSettings();
          }}
          onSelectTimerSettings={() => {
            onOpenChange(false);
            onSelectTimerSettings();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

type SettingsMenuProps = {
  onSelectAppearance: () => void;
  onSelectApi: () => void;
  onSelectSoundSettings: () => void;
  onSelectTimerSettings: () => void;
};

function SettingsMenu({ onSelectAppearance, onSelectApi, onSelectSoundSettings, onSelectTimerSettings }: SettingsMenuProps) {
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
      <Button variant="outline" className="w-full justify-between" onClick={onSelectTimerSettings}>
        <span className="flex items-center gap-2">
          <Timer className="h-4 w-4" /> Timer
        </span>
        <List className="h-4 w-4 text-muted-foreground" />
      </Button>
      <Button variant="outline" className="w-full justify-between" onClick={onSelectSoundSettings}>
        <span className="flex items-center gap-2">
          <Volume2 className="h-4 w-4" /> Sound
        </span>
        <List className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

// AppearanceForm removed from dialog; appearance now lives on its own page
// ApiKeyForm moved to components/ApiKeyForm.tsx; the dialog only routes to it
