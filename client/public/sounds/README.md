# Alarm sounds

Drop audio files here to use them as alarm cues.

Anything under `client/public/` is served from the site root untouched, so a file
saved as `client/public/sounds/airhorn.mp3` is reachable at `/sounds/airhorn.mp3`.
Vite copies the folder into the build as-is — no import, no bundler step.

## Adding one

1. Save the file here, e.g. `airhorn.mp3`
2. Add a line to `TIME_UP_CUES` in `client/src/lib/alarm.ts`:

   ```ts
   { id: "airhorn", label: "Airhorn", kind: "file", url: "/sounds/airhorn.mp3", volume: 0.5 },
   ```

3. Pick it in Settings → Sound, and hit preview.

## Notes

- **Keep it short**, under about 2 seconds. This fires every time a task ends.
- **Use mp3** for the widest support. Android Chrome also handles ogg and m4a.
- **`volume` is 0..1** and applied at playback, so you can tame a loud clip
  without re-encoding it.
- A missing or unplayable file **falls back to the Beeps cue** rather than going
  silent — a typo costs you the wrong sound, not a missed alarm.
- Files here are public. Don't put anything in this folder you wouldn't ship.
