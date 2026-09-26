import { useEffect, useRef } from "react";
import { useData } from "@/components/data/context/DataContext";

import { alarm } from "@/lib/alarm";

// ============================================================
// USE ALARM
// ============================================================
// Deliberately NOT inside TimerDisplay. That component only exists on the
// Dashboard, so an alarm living there goes silent the moment you navigate to
// /tasks or /calendar. This hook is mounted once, above the router, and watches
// the global activeTimer - so it fires from any page.
//
// TimerDisplay draws the time. This makes the noise. Both read the same source.

const REMINDER_EVERY_MS = 2 * 60 * 1000;
const MAX_REMINDERS = 5;

export function useAlarm() {
  const { activeTimer, autoAdvance } = useData();

  // Identifies one specific run. Pausing and resuming calls startTimer again
  // with a fresh startTime, which moves the deadline - so a new key means
  // re-arm, which is correct.
  const armedKeyRef = useRef<string | null>(null);
  const firedRef = useRef(false);
  const remindersRef = useRef(0);
  const lastReminderAtRef = useRef(0);

  useEffect(() => {
    if (!activeTimer) return;

    const key = `${activeTimer.taskId}:${activeTimer.startTime}`;
    const totalSeconds = activeTimer.totalDuration * 60;

    const elapsed = () => (Date.now() - activeTimer.startTime) / 1000;

    if (armedKeyRef.current !== key) {
      armedKeyRef.current = key;

      // Already past zero at the moment we arm? Then the crossing happened
      // before this hook was watching - possibly hours ago with the app closed,
      // since activeTimer is restored from localStorage. Mark it fired so we
      // don't ring for history, but let the reminders run so you still find out
      // you're sitting in overtime.
      const alreadyOver = elapsed() >= totalSeconds;
      firedRef.current = alreadyOver;
      remindersRef.current = 0;
      lastReminderAtRef.current = alreadyOver ? Date.now() : 0;
    }

    const tick = () => {
      if (elapsed() < totalSeconds) return; // still counting down

      if (!firedRef.current) {
        firedRef.current = true;
        lastReminderAtRef.current = Date.now();
        // Flow mode means the chain keeps moving, so "time's up" is the wrong
        // message - the right one is "next". TimerDisplay does the advancing;
        // this only makes the noise, and each side has its own latch so they
        // can't double up.
        if (autoAdvance) alarm.stepAdvance();
        else alarm.timeUp();
        return;
      }

      // In flow mode there is no overtime to be reminded about - the step either
      // advanced or the workflow ended.
      if (autoAdvance) return;

      // Overtime runs forever by design, which is exactly why silence is risky:
      // miss the alarm and you could sit in overtime for an hour none the wiser.
      // Capped, so it nudges rather than nags.
      if (
        remindersRef.current < MAX_REMINDERS &&
        Date.now() - lastReminderAtRef.current >= REMINDER_EVERY_MS
      ) {
        remindersRef.current += 1;
        lastReminderAtRef.current = Date.now();
        alarm.reminder();
      }
    };

    const interval = setInterval(tick, 1000);

    // Background tabs get their intervals throttled hard, so a due reminder can
    // be late. Checking on return makes it prompt instead.
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [activeTimer, autoAdvance]);



  useEffect(() => {

  }, []);
}
