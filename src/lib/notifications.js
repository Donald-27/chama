// Lightweight notification scheduler and helper
export async function requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return { granted: false, reason: 'unsupported' };
    try {
        const result = await Notification.requestPermission();
        return { granted: result === 'granted', result };
    } catch (e) {
        return { granted: false, error: e };
    }
}

export function sendNotification(title, options = {}) {
    try {
        if (typeof window === 'undefined' || !('Notification' in window)) return false;
        if (Notification.permission !== 'granted') return false;
        new Notification(title, options);
        return true;
    } catch (e) {
        console.error('sendNotification failed', e);
        return false;
    }
}

// Schedule a notification at a specific Date. Uses setTimeout while the page is open.
// Persists schedules to localStorage so they can be restored on load.
const SCHEDULE_KEY = 'chama_notification_schedules';
let timers = {};

function saveSchedules(schedules) {
    try { localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules)); } catch (e) { }
}

export function scheduleAt(id, date, title, body) {
    try {
        const now = Date.now();
        const ts = date instanceof Date ? date.getTime() : Number(date);
        const delay = Math.max(0, ts - now);
        clearSchedule(id);
        const timer = setTimeout(() => {
            sendNotification(title, { body });
            // remove one-shot schedule
            removeSchedule(id);
        }, delay);
        timers[id] = timer;
        // persist
        const raw = localStorage.getItem(SCHEDULE_KEY);
        const schedules = raw ? JSON.parse(raw) : {};
        schedules[id] = { ts, title, body };
        saveSchedules(schedules);
        return true;
    } catch (e) {
        console.error('scheduleAt failed', e);
        return false;
    }
}

export function clearSchedule(id) {
    try { if (timers[id]) { clearTimeout(timers[id]); delete timers[id]; } } catch (e) { }
}

export function removeSchedule(id) {
    try {
        clearSchedule(id);
        const raw = localStorage.getItem(SCHEDULE_KEY);
        const schedules = raw ? JSON.parse(raw) : {};
        delete schedules[id];
        saveSchedules(schedules);
    } catch (e) { }
}

export function initSchedules() {
    try {
        const raw = localStorage.getItem(SCHEDULE_KEY);
        const schedules = raw ? JSON.parse(raw) : {};
        Object.keys(schedules).forEach((id) => {
            const s = schedules[id];
            const ts = Number(s.ts);
            if (ts && ts > Date.now()) {
                scheduleAt(id, new Date(ts), s.title, s.body);
            } else {
                // stale, remove
                removeSchedule(id);
            }
        });
    } catch (e) {
        console.error('initSchedules failed', e);
    }
}

export function listSchedules() {
    try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '{}'); } catch (e) { return {}; }
}
