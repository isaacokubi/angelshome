import { useCallback, useEffect, useRef, useState } from "react";
import { notificationApi } from "../services/api";

const POLL_MS = 15 * 1000;
const RECENT_MS = 2 * 60 * 1000;

function playLessonRingtone() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const now = context.currentTime;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.connect(context.destination);

  for (let index = 0; index < 6; index += 1) {
    const start = now + index * 0.8;
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(index % 2 ? 660 : 880, start);
    oscillator.connect(gain);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.38);
    oscillator.start(start);
    oscillator.stop(start + 0.4);
  }

  window.setTimeout(() => { void context.close(); }, 5500);
}

export default function LessonAlertMonitor({ role }) {
  const [enabled, setEnabled] = useState(() => sessionStorage.getItem("angelshome_lesson_alerts") === "enabled");
  const [latest, setLatest] = useState(null);
  const seenIds = useRef(new Set());
  const firstLoad = useRef(true);

  const enableAlerts = useCallback(async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const context = new AudioContext();
        await context.resume();
        await context.close();
      }
      if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
      sessionStorage.setItem("angelshome_lesson_alerts", "enabled");
      setEnabled(true);
    } catch {
      sessionStorage.setItem("angelshome_lesson_alerts", "enabled");
      setEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (role !== "teacher") return undefined;
    let active = true;
    const check = async () => {
      try {
        const result = await notificationApi.list();
        if (!active) return;
        const notifications = result.notifications || [];
        const now = Date.now();
        const lessonAlerts = notifications.filter((item) => item.kind === "lesson_reminder");
        const newAlerts = lessonAlerts.filter((item) => !seenIds.current.has(item._id));
        lessonAlerts.forEach((item) => seenIds.current.add(item._id));
        const recentAlerts = newAlerts.filter((item) => now - new Date(item.createdAt).getTime() <= RECENT_MS);
        if (recentAlerts.length) {
          const item = recentAlerts[0];
          setLatest(item);
          if (enabled) playLessonRingtone();
          if (enabled && "Notification" in window && Notification.permission === "granted") {
            new Notification(item.title, { body: item.message, tag: item._id });
          }
          window.setTimeout(() => { if (active) setLatest(null); }, 8000);
        } else if (firstLoad.current) {
          const recentInitial = lessonAlerts.filter((item) => now - new Date(item.createdAt).getTime() <= RECENT_MS);
          if (recentInitial.length && enabled) {
            const item = recentInitial[0];
            setLatest(item);
            playLessonRingtone();
            if ("Notification" in window && Notification.permission === "granted") new Notification(item.title, { body: item.message, tag: item._id });
            window.setTimeout(() => { if (active) setLatest(null); }, 8000);
          }
        }
        firstLoad.current = false;
      } catch {
        // The normal notifications page remains the source of truth if polling is temporarily unavailable.
      }
    };
    void check();
    const interval = window.setInterval(check, POLL_MS);
    return () => { active = false; window.clearInterval(interval); };
  }, [enabled, role]);

  if (role !== "teacher") return null;

  return <>
    {!enabled && <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-blue-200 bg-white p-4 shadow-xl">
      <p className="text-sm font-black text-blue-950">Enable lesson alerts</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Allow a short ringtone and browser alert five minutes before your scheduled lessons.</p>
      <button type="button" onClick={enableAlerts} className="mt-3 rounded-xl bg-blue-950 px-4 py-2.5 text-xs font-extrabold text-white">Enable alerts</button>
    </div>}
    {latest && <div className="fixed right-5 top-24 z-50 w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-amber-200 bg-white p-5 shadow-2xl" role="alert" aria-live="assertive">
      <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl">🔔</span><div><p className="text-xs font-black uppercase tracking-wider text-amber-700">Lesson reminder</p><h2 className="mt-1 font-black text-blue-950">{latest.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{latest.message}</p></div></div>
    </div>}
  </>;
}
