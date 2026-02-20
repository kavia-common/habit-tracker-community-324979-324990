/**
 * Demo store for UI completeness when backend endpoints are not available yet.
 * This keeps the app functional while backend APIs are being implemented.
 */

const LS_KEY = "hb_demo_store_v1";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function defaultState() {
  const t = todayKey();
  return {
    user: {
      id: "me",
      name: "Alex",
      email: "alex@example.com",
      bio: "Building small wins every day.",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    habits: [
      {
        id: uid("habit"),
        title: "Drink water",
        description: "8 glasses",
        schedule: "daily",
        target: 1,
        streak: 4,
        lastCheckIn: t
      },
      {
        id: uid("habit"),
        title: "Read",
        description: "20 minutes",
        schedule: "daily",
        target: 1,
        streak: 2,
        lastCheckIn: null
      }
    ],
    groups: [
      {
        id: uid("group"),
        name: "Morning Momentum",
        description: "Daily check-ins and positive accountability",
        members: 18,
        activeChallengeId: null
      }
    ],
    challenges: [
      {
        id: uid("challenge"),
        groupId: null,
        name: "7-Day Consistency Sprint",
        description: "Check-in on any habit every day for 7 days",
        startDate: t,
        endDate: t,
        participants: 42
      }
    ],
    feed: [
      {
        id: uid("post"),
        author: "Jordan",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        content: "Day 5 of my streak — the key is making it easy to start.",
        likes: 12,
        comments: 2
      },
      {
        id: uid("post"),
        author: "Sam",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        content: "Tiny habit: 5 pushups after brushing teeth. Works wonders.",
        likes: 8,
        comments: 1
      }
    ],
    notifications: [
      {
        id: uid("notif"),
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        title: "Reminder",
        body: "Don’t forget: Drink water check-in is due today.",
        read: false
      }
    ],
    settings: {
      theme: "light",
      reminders: true
    }
  };
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    return JSON.parse(raw);
  } catch {
    return defaultState();
  }
}

function save(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export function getState() {
  return load();
}

export function updateState(updater) {
  const state = load();
  const next = updater(state);
  save(next);
  return next;
}

export const demoApi = {
  getMe() {
    return getState().user;
  },
  updateMe(patch) {
    return updateState((s) => ({ ...s, user: { ...s.user, ...patch } })).user;
  },
  listHabits() {
    return getState().habits;
  },
  createHabit(payload) {
    const habit = {
      id: uid("habit"),
      title: payload.title?.trim() || "Untitled habit",
      description: payload.description?.trim() || "",
      schedule: payload.schedule || "daily",
      target: payload.target ?? 1,
      streak: 0,
      lastCheckIn: null
    };
    return updateState((s) => ({ ...s, habits: [habit, ...s.habits] })).habits[0];
  },
  updateHabit(id, patch) {
    return updateState((s) => ({
      ...s,
      habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h))
    })).habits.find((h) => h.id === id);
  },
  deleteHabit(id) {
    updateState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));
    return true;
  },
  checkInHabit(id) {
    const t = todayKey();
    return updateState((s) => ({
      ...s,
      habits: s.habits.map((h) => {
        if (h.id !== id) return h;
        const already = h.lastCheckIn === t;
        return {
          ...h,
          lastCheckIn: t,
          streak: already ? h.streak : (h.streak || 0) + 1
        };
      })
    })).habits.find((h) => h.id === id);
  },
  listGroups() {
    return getState().groups;
  },
  createGroup(payload) {
    const group = {
      id: uid("group"),
      name: payload.name?.trim() || "New group",
      description: payload.description?.trim() || "",
      members: 1,
      activeChallengeId: null
    };
    return updateState((s) => ({ ...s, groups: [group, ...s.groups] })).groups[0];
  },
  listChallenges() {
    return getState().challenges;
  },
  createPost(content) {
    const post = {
      id: uid("post"),
      author: getState().user.name || "You",
      createdAt: new Date().toISOString(),
      content: content.trim(),
      likes: 0,
      comments: 0
    };
    return updateState((s) => ({ ...s, feed: [post, ...s.feed] })).feed[0];
  },
  listFeed() {
    return getState().feed;
  },
  listNotifications() {
    return getState().notifications;
  },
  markNotificationRead(id) {
    updateState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    }));
    return true;
  },
  markAllNotificationsRead() {
    updateState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true }))
    }));
    return true;
  },
  getSettings() {
    return getState().settings;
  },
  updateSettings(patch) {
    return updateState((s) => ({ ...s, settings: { ...s.settings, ...patch } })).settings;
  }
};
