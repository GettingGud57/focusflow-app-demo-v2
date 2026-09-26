import { useCallback, useState } from "react";
import {
  loadSoundSettings,
  saveSoundSettings,
  DEFAULT_SOUND_SETTINGS,
  type SoundSettings,
} from "@/lib/alarm";

// Same shape as use-api-key: localStorage is the store, this hook is just the
// React-facing view of it. The alarm reads localStorage directly at play time,
// so a change here takes effect on the very next cue with nothing to wire up.
export function useSoundSettings() {
  const [settings, setSettings] = useState<SoundSettings>(() => loadSoundSettings());

  const update = useCallback((patch: Partial<SoundSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSoundSettings(next);
      return next;
    });
  }, []);

  const setEnabled = useCallback((enabled: boolean) => update({ enabled }), [update]);
  const setTimeUpCue = useCallback((timeUpCue: string) => update({ timeUpCue }), [update]);

  const reset = useCallback(() => {
    saveSoundSettings(DEFAULT_SOUND_SETTINGS);
    setSettings(DEFAULT_SOUND_SETTINGS);
  }, []);

  return { settings, setEnabled, setTimeUpCue, reset };
}
