import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// ============================================================
// NATIVE ALARM
// ============================================================
// The web alarm (lib/alarm.ts + use-alarm.ts) only fires while the page is
// alive. Android freezes a backgrounded WebView's timers, so with the screen off
// the in-page interval stops and nothing rings.
//
// This hands the deadline to Android's own alarm system instead. The app can be
// fully closed - or the phone rebooted, since the plugin registers boot
// receivers - and the OS still wakes it at the right moment.
//
// Every export is a no-op on web, so callers never need to branch.
//
// NOTE: when the app IS open, you get both this notification and the in-page
// cue. You can't know at schedule time whether the app will be foregrounded at
// fire time, so the notification stays as the safety net.

// A single fixed id. Scheduling again replaces the pending one, which is exactly
// what starting a new timer should do, and cancelling needs no bookkeeping.
// Android requires a 32-bit int.
const TIMER_DONE_ID = 1;

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Asks for notification permission. Android 13+ shows a prompt; on 12 and older
 * the plugin returns 'granted' without prompting.
 *
 * Returns true if we may post notifications.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === "granted") return true;
    const asked = await LocalNotifications.requestPermissions();
    return asked.display === "granted";
  } catch (err) {
    console.warn("[nativeAlarm] permission check failed", err);
    return false;
  }
}

/**
 * Warn if the user has turned exact alarms off. Per the plugin docs, when that
 * setting is disabled "the app will restart and any notification scheduled with
 * an exact alarm will be deleted" - so a silent timer is expected behaviour
 * rather than a bug, and it's worth being able to see that in the log.
 *
 * The USE_EXACT_ALARM permission in AndroidManifest.xml should make this
 * non-revocable on Android 14+, so this is mostly a check for older versions.
 */
export async function reportExactAlarmSetting(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const setting = await LocalNotifications.checkExactNotificationSetting();
    if (setting.exact_alarm !== "granted") {
      console.warn(
        `[nativeAlarm] exact alarms are "${setting.exact_alarm}". Scheduled ` +
        `alarms may be batched or dropped entirely.`
      );
    }
  } catch {
    // Older plugin/platform without the setting. Not fatal.
  }
}

/**
 * Schedule the "time's up" notification for a run.
 *
 * @param taskTitle shown in the notification body
 * @param fireAt    absolute moment the planned duration ends
 */
export async function scheduleTimerDone(taskTitle: string, fireAt: Date): Promise<void> {
  if (!isNativeApp()) return;

  // A deadline already in the past would fire immediately, which is worse than
  // not firing - it looks like a phantom alarm.
  if (fireAt.getTime() <= Date.now()) return;

  const granted = await ensureNotificationPermission();
  if (!granted) {
    console.warn("[nativeAlarm] no notification permission; nothing scheduled");
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: TIMER_DONE_ID,
          title: "Time's up",
          body: taskTitle,
          schedule: {
            at: fireAt,
            // Required to fire while the device is dozing. Note the documented
            // constraint: allowWhileIdle notifications can only fire once per
            // 9 minutes per app, so back-to-back short steps cannot all ring
            // reliably if the phone is actually in Doze.
            allowWhileIdle: true,
          },
        },
      ],
    });
  } catch (err) {
    console.warn("[nativeAlarm] schedule failed", err);
  }
}

/** Drop the pending notification - the timer was stopped, reset or completed. */
export async function cancelTimerDone(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: TIMER_DONE_ID }] });
  } catch (err) {
    console.warn("[nativeAlarm] cancel failed", err);
  }
}
