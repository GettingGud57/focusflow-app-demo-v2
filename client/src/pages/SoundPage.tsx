import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, Volume2, VolumeX, Check } from "lucide-react";
import { useSoundSettings } from "@/hooks/use-sound-settings";
import { TIME_UP_CUES, previewCue } from "@/lib/alarm";

export default function SoundPage() {
  const { settings, setEnabled, setTimeUpCue } = useSoundSettings();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Sound</h1>
        <p className="text-sm text-muted-foreground">
          What you hear when a task's time runs out. Saved locally.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Alarm</CardTitle>
            <CardDescription>Turn every cue on or off.</CardDescription>
          </div>
          <Badge variant="secondary">{settings.enabled ? "On" : "Off"}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {settings.enabled
              ? <Volume2 className="h-5 w-5 text-muted-foreground" />
              : <VolumeX className="h-5 w-5 text-muted-foreground" />}
            <Label htmlFor="sound-enabled" className="flex-1">
              Play a sound when time runs out
            </Label>
            <Switch
              id="sound-enabled"
              checked={settings.enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Off means the timer runs into overtime silently — you'll only notice by looking.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alarm sound</CardTitle>
          <CardDescription>Preview one before you commit to hearing it every 25 minutes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {TIME_UP_CUES.map((cue) => {
            const selected = cue.id === settings.timeUpCue;
            return (
              <div key={cue.id} className="flex items-center gap-2">
                <Button
                  variant={selected ? "default" : "outline"}
                  className="flex-1 justify-start gap-2"
                  onClick={() => setTimeUpCue(cue.id)}
                >
                  {selected ? <Check className="h-4 w-4" /> : <span className="w-4" />}
                  {cue.label}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Preview ${cue.label}`}
                  /* The click is the user gesture that unlocks audio, so a
                     preview works even before a timer has ever been started. */
                  onClick={() => void previewCue(cue.id)}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          <p className="text-xs text-muted-foreground pt-2">
            The overtime reminder that repeats every 2 minutes always uses the quiet
            built-in blips — a loud cue on a loop stops being a reminder.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add your own</CardTitle>
          <CardDescription>Any short audio file can become an alarm.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>
              Drop the file into <code className="text-foreground">client/public/sounds/</code> —
              for example <code className="text-foreground">airhorn.mp3</code>.
            </li>
            <li>
              Add one line to <code className="text-foreground">TIME_UP_CUES</code> in{" "}
              <code className="text-foreground">client/src/lib/alarm.ts</code>. There's a
              commented example right above it.
            </li>
            <li>Keep it under about 2 seconds, and use mp3 for the widest support.</li>
          </ol>
          <p>
            A missing or unplayable file falls back to Beeps rather than going silent, so a
            typo costs you the wrong sound — not a missed alarm.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
