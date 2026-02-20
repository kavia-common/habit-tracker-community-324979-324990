/**
 * Demo store for UI completeness when backend endpoints are not available yet.
 * This keeps the app functional while backend APIs are being implemented.
 *
 * NOTE: This file intentionally includes richer domain modeling than the current
 * UI pages, so we can implement new frontend-only features without backend work.
 */

const LS_KEY = "hb_demo_store_v2";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function asNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function defaultState() {
  const t = todayKey();
  const now = Date.now();

  const habit1 = uid("habit");
  const habit2 = uid("habit");

  const group1 = uid("group");
  const challenge1 = uid("challenge");

  return {
    user: {
      id: "me",
      name: "Alex",
      email: "alex@example.com",
      bio: "Building small wins every day.",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      avatar: null
    },

    /**
     * Personalization & preferences
     */
    settings: {
      theme: "light",
      reminders: true,
      quietHours: { start: "22:00", end: "07:00" },
      weeklyGoalDays: 5,
      motivationStyle: "encouraging", // encouraging | direct | playful
      dashboardLayout: "balanced", // balanced | habits-first | social-first
      reduceMotion: false
    },

    /**
     * Habit upgrades:
     * - habit_type/target/unit/reminder_time/is_public/color/icon inspired by the backend spec.
     * - checkins store daily entries.
     * - streak fields kept for quick UI display.
     */
    habits: [
      {
        id: habit1,
        title: "Drink water",
        description: "8 glasses",
        habit_type: "daily",
        target_value: 8,
        unit: "glasses",
        schedule_days: null,
        reminder_time: "10:00",
        is_public: true,
        color: "#3b82f6",
        icon: "💧",
        streak: 4,
        longestStreak: 6,
        lastCheckIn: t,
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 8).toISOString()
      },
      {
        id: habit2,
        title: "Read",
        description: "20 minutes",
        habit_type: "daily",
        target_value: 20,
        unit: "min",
        schedule_days: null,
        reminder_time: null,
        is_public: false,
        color: "#06b6d4",
        icon: "📚",
        streak: 2,
        longestStreak: 3,
        lastCheckIn: null,
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString()
      }
    ],

    checkins: [
      // habit1 checked today
      {
        id: uid("checkin"),
        habitId: habit1,
        date: t,
        value: 8,
        note: "Felt great",
        createdAt: new Date(now - 1000 * 60 * 30).toISOString()
      }
    ],

    /**
     * Social layer: groups + friends + basic activity feed
     */
    groups: [
      {
        id: group1,
        name: "Morning Momentum",
        description: "Daily check-ins and positive accountability",
        members: 18,
        isPrivate: false,
        inviteCode: "MOMENTUM",
        activeChallengeId: challenge1
      }
    ],

    friends: [
      { id: uid("friend"), name: "Jordan", status: "accepted", streak: 11, avatar: null },
      { id: uid("friend"), name: "Sam", status: "accepted", streak: 6, avatar: null },
      { id: uid("friend"), name: "Taylor", status: "incoming", streak: 3, avatar: null }
    ],

    /**
     * Challenges:
     * - allow joining
     * - allow tracking progress
     */
    challenges: [
      {
        id: challenge1,
        groupId: group1,
        title: "7-Day Consistency Sprint",
        description: "Check-in on any habit every day for 7 days",
        startDate: t,
        endDate: t,
        goal_type: "streak",
        goal_value: 7,
        participants: 42,
        isActive: true,
        createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString()
      }
    ],

    challengeMemberships: [
      {
        id: uid("chmem"),
        challengeId: challenge1,
        userId: "me",
        joinedAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
        progress: {
          daysCompleted: 1,
          lastUpdated: new Date().toISOString()
        }
      }
    ],

    /**
     * Community feed (local demo)
     */
    feed: [
      {
        id: uid("post"),
        author: "Jordan",
        createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
        content: "Day 5 of my streak — the key is making it easy to start.",
        likes: 12,
        comments: 2,
        likedByMe: false
      },
      {
        id: uid("post"),
        author: "Sam",
        createdAt: new Date(now - 1000 * 60 * 120).toISOString(),
        content: "Tiny habit: 5 pushups after brushing teeth. Works wonders.",
        likes: 8,
        comments: 1,
        likedByMe: true
      }
    ],

    /**
     * Notifications + reminders
     */
    notifications: [
      {
        id: uid("notif"),
        createdAt: new Date(now - 1000 * 60 * 10).toISOString(),
        title: "Reminder",
        body: "Don’t forget: Drink water check-in is due today.",
        read: false,
        type: "reminder",
        data: { habitId: habit1 }
      }
    ],

    reminders: [
      {
        id: uid("rem"),
        habitId: habit1,
        time: "10:00",
        days: [1, 2, 3, 4, 5, 6, 7], // 1=Mon .. 7=Sun
        enabled: true,
        message: "Quick water check-in?"
      }
    ],

    /**
     * Badges (demo)
     */
    badges: [
      { id: uid("badge"), code: "starter", name: "Starter", description: "Created your first habit" },
      { id: uid("badge"), code: "three_day", name: "3-Day Streak", description: "Maintained a 3-day streak" },
      { id: uid("badge"), code: "social", name: "Accountability", description: "Joined a group or added a friend" }
    ],
    earnedBadges: [
      { id: uid("earned"), badgeCode: "starter", earnedAt: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString() },
      { id: uid("earned"), badgeCode: "three_day", earnedAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString() }
    ],

    /**
     * Power features (demo)
     */
    power: {
      templates: [
        { id: uid("tpl"), title: "Morning routine", habits: ["Meditate 5 min", "Drink water", "Review goals"] },
        { id: uid("tpl"), title: "Evening reset", habits: ["Stretch", "Journal 3 lines", "Plan tomorrow"] }
      ],
      automationRules: [
        {
          id: uid("rule"),
          name: "If 2 days missed → send motivation",
          enabled: true,
          trigger: "missed_2_days",
          action: "notify"
        }
      ],
      export: { lastExportAt: null }
    },

    /**
     * Admin (demo-only)
     */
    admin: {
      enabled: true,
      announcements: [
        { id: uid("ann"), title: "Welcome!", body: "Thanks for trying Habit Buddy (demo).", active: true }
      ],
      moderationQueue: [
        {
          id: uid("mod"),
          type: "feed_post",
          reason: "Possible spam",
          createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
          contentPreview: "Buy followers fast..."
        }
      ],
      stats: {
        totalUsers: 1280,
        dailyActiveUsers: 312,
        totalHabits: 5420,
        totalGroups: 210
      }
    }
  };
}

function migrateIfNeeded(state) {
  // Very small migration: v1 -> v2 keys
  if (!state) return defaultState();
  if (state.__version === 2) return state;

  // If old store has the earlier structure, map minimally and keep existing data.
  const next = { ...defaultState(), ...state };
  next.__version = 2;

  // Map legacy habit keys (schedule/target) to new keys (habit_type/target_value/unit)
  if (Array.isArray(state.habits)) {
    next.habits = state.habits.map((h) => ({
      ...h,
      habit_type: h.habit_type || h.schedule || "daily",
      target_value: h.target_value ?? h.target ?? 1,
      unit: h.unit ?? null,
      reminder_time: h.reminder_time ?? null,
      is_public: h.is_public ?? false,
      color: h.color ?? null,
      icon: h.icon ?? null,
      longestStreak: h.longestStreak ?? h.streak ?? 0,
      createdAt: h.createdAt || new Date().toISOString()
    }));
  }

  // Legacy challenges name -> title
  if (Array.isArray(state.challenges)) {
    next.challenges = state.challenges.map((c) => ({
      ...c,
      title: c.title || c.name || "Challenge",
      goal_type: c.goal_type || "streak",
      goal_value: c.goal_value ?? 7,
      isActive: c.isActive ?? true,
      createdAt: c.createdAt || new Date().toISOString()
    }));
  }

  return next;
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    return migrateIfNeeded(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

function save(state) {
  localStorage.setItem(LS_KEY, JSON.stringify({ ...state, __version: 2 }));
}

/** PUBLIC_INTERFACE */
export function getState() {
  /** Get full demo state (persisted in localStorage). */
  return load();
}

/** PUBLIC_INTERFACE */
export function updateState(updater) {
  /** Update demo state with a functional updater, returning the next state. */
  const state = load();
  const next = updater(state);
  save(next);
  return next;
}

function recomputeStreaksForHabit(state, habitId) {
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) return state;

  // For demo: streak increments when checked in today; longestStreak updated to max.
  const t = todayKey();
  const checkedToday = habit.lastCheckIn === t;
  const nextLongest = Math.max(habit.longestStreak || 0, habit.streak || 0);

  return {
    ...state,
    habits: state.habits.map((h) => (h.id === habitId ? { ...h, longestStreak: nextLongest, lastCheckIn: checkedToday ? t : h.lastCheckIn } : h))
  };
}

export const demoApi = {
  // -------------------------
  // Profile / settings
  // -------------------------
  getMe() {
    return getState().user;
  },
  updateMe(patch) {
    return updateState((s) => ({ ...s, user: { ...s.user, ...patch } })).user;
  },
  getSettings() {
    return getState().settings;
  },
  updateSettings(patch) {
    return updateState((s) => ({ ...s, settings: { ...s.settings, ...patch } })).settings;
  },

  // -------------------------
  // Habits (upgraded)
  // -------------------------
  listHabits() {
    return getState().habits;
  },
  createHabit(payload) {
    const habit = {
      id: uid("habit"),
      title: payload.title?.trim() || "Untitled habit",
      description: payload.description?.trim() || "",
      habit_type: payload.habit_type || payload.schedule || "daily",
      target_value: payload.target_value ?? payload.target ?? 1,
      unit: payload.unit ?? null,
      schedule_days: payload.schedule_days ?? null,
      reminder_time: payload.reminder_time ?? null,
      is_public: Boolean(payload.is_public),
      color: payload.color ?? null,
      icon: payload.icon ?? null,
      streak: 0,
      longestStreak: 0,
      lastCheckIn: null,
      createdAt: new Date().toISOString()
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
    updateState((s) => ({
      ...s,
      habits: s.habits.filter((h) => h.id !== id),
      checkins: s.checkins.filter((c) => c.habitId !== id),
      reminders: s.reminders.filter((r) => r.habitId !== id)
    }));
    return true;
  },
  checkInHabit(id, { date = todayKey(), value, note } = {}) {
    const t = String(date);
    const val = value == null ? null : asNumber(value, null);

    return updateState((s) => {
      const habit = s.habits.find((h) => h.id === id);
      if (!habit) return s;

      const already = habit.lastCheckIn === t;
      const nextHabit = {
        ...habit,
        lastCheckIn: t,
        streak: already ? habit.streak : (habit.streak || 0) + 1
      };

      const hasCheckin = s.checkins.some((c) => c.habitId === id && c.date === t);
      const nextCheckins = hasCheckin
        ? s.checkins.map((c) => (c.habitId === id && c.date === t ? { ...c, value: val ?? c.value, note: note ?? c.note } : c))
        : [
            {
              id: uid("checkin"),
              habitId: id,
              date: t,
              value: val,
              note: note || null,
              createdAt: new Date().toISOString()
            },
            ...s.checkins
          ];

      const longestStreak = Math.max(nextHabit.longestStreak || 0, nextHabit.streak || 0);

      // Badge awarding (very lightweight demo)
      const earnedBadges = [...s.earnedBadges];
      const hasStarter = earnedBadges.some((b) => b.badgeCode === "starter");
      const hasThree = earnedBadges.some((b) => b.badgeCode === "three_day");
      if (!hasStarter) earnedBadges.push({ id: uid("earned"), badgeCode: "starter", earnedAt: new Date().toISOString() });
      if (!hasThree && (nextHabit.streak || 0) >= 3)
        earnedBadges.push({ id: uid("earned"), badgeCode: "three_day", earnedAt: new Date().toISOString() });

      return {
        ...s,
        habits: s.habits.map((h) => (h.id === id ? { ...nextHabit, longestStreak } : h)),
        checkins: nextCheckins,
        earnedBadges
      };
    }).habits.find((h) => h.id === id);
  },
  listCheckins(habitId, limit = 50) {
    return getState()
      .checkins.filter((c) => c.habitId === habitId)
      .slice(0, limit);
  },

  // -------------------------
  // Social: friends & groups
  // -------------------------
  listFriends() {
    return getState().friends;
  },
  sendFriendRequest(name) {
    const friend = { id: uid("friend"), name: name.trim() || "New friend", status: "outgoing", streak: 0, avatar: null };
    updateState((s) => ({ ...s, friends: [friend, ...s.friends] }));
    return friend;
  },
  respondToFriendRequest(friendId, action) {
    updateState((s) => ({
      ...s,
      friends: s.friends.map((f) => {
        if (f.id !== friendId) return f;
        if (action === "accept") return { ...f, status: "accepted" };
        if (action === "decline") return { ...f, status: "declined" };
        return f;
      }),
      earnedBadges: s.earnedBadges.some((b) => b.badgeCode === "social")
        ? s.earnedBadges
        : [...s.earnedBadges, { id: uid("earned"), badgeCode: "social", earnedAt: new Date().toISOString() }]
    }));
    return true;
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
      isPrivate: Boolean(payload.isPrivate),
      inviteCode: payload.inviteCode || Math.random().toString(36).slice(2, 8).toUpperCase(),
      activeChallengeId: null
    };
    updateState((s) => ({
      ...s,
      groups: [group, ...s.groups],
      earnedBadges: s.earnedBadges.some((b) => b.badgeCode === "social")
        ? s.earnedBadges
        : [...s.earnedBadges, { id: uid("earned"), badgeCode: "social", earnedAt: new Date().toISOString() }]
    }));
    return group;
  },
  joinGroupByInvite(code) {
    const invite = String(code || "").trim().toUpperCase();
    if (!invite) return { ok: false, message: "Enter an invite code." };

    // Demo: join creates a group if not found.
    const state = getState();
    const existing = state.groups.find((g) => (g.inviteCode || "").toUpperCase() === invite);
    if (existing) {
      updateState((s) => ({
        ...s,
        groups: s.groups.map((g) => (g.id === existing.id ? { ...g, members: (g.members || 0) + 1 } : g))
      }));
      return { ok: true, message: `Joined ${existing.name}` };
    }

    const created = {
      id: uid("group"),
      name: `Group ${invite}`,
      description: "Joined via invite code (demo)",
      members: 2,
      isPrivate: false,
      inviteCode: invite,
      activeChallengeId: null
    };
    updateState((s) => ({ ...s, groups: [created, ...s.groups] }));
    return { ok: true, message: `Joined ${created.name}` };
  },

  // -------------------------
  // Challenges
  // -------------------------
  listChallenges() {
    return getState().challenges;
  },
  createChallenge(payload) {
    const challenge = {
      id: uid("challenge"),
      groupId: payload.groupId ?? null,
      title: payload.title?.trim() || "New challenge",
      description: payload.description?.trim() || null,
      startDate: payload.startDate || todayKey(),
      endDate: payload.endDate || todayKey(),
      goal_type: payload.goal_type || "streak",
      goal_value: payload.goal_value ?? 7,
      participants: 1,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    updateState((s) => ({
      ...s,
      challenges: [challenge, ...s.challenges]
    }));
    return challenge;
  },
  joinChallenge(challengeId) {
    const state = getState();
    const already = state.challengeMemberships.some((m) => m.challengeId === challengeId && m.userId === "me");
    if (already) return true;

    updateState((s) => ({
      ...s,
      challengeMemberships: [
        {
          id: uid("chmem"),
          challengeId,
          userId: "me",
          joinedAt: new Date().toISOString(),
          progress: { daysCompleted: 0, lastUpdated: new Date().toISOString() }
        },
        ...s.challengeMemberships
      ],
      challenges: s.challenges.map((c) => (c.id === challengeId ? { ...c, participants: (c.participants || 0) + 1 } : c))
    }));
    return true;
  },
  getMyChallengeProgress(challengeId) {
    return getState().challengeMemberships.find((m) => m.challengeId === challengeId && m.userId === "me") || null;
  },
  updateMyChallengeProgress(challengeId, patch) {
    updateState((s) => ({
      ...s,
      challengeMemberships: s.challengeMemberships.map((m) =>
        m.challengeId === challengeId && m.userId === "me"
          ? { ...m, progress: { ...m.progress, ...patch, lastUpdated: new Date().toISOString() } }
          : m
      )
    }));
    return true;
  },

  // -------------------------
  // Feed
  // -------------------------
  listFeed() {
    return getState().feed;
  },
  createPost(content, { postType = "text" } = {}) {
    const post = {
      id: uid("post"),
      author: getState().user.name || "You",
      createdAt: new Date().toISOString(),
      content: content.trim(),
      postType,
      likes: 0,
      comments: 0,
      likedByMe: false
    };
    return updateState((s) => ({ ...s, feed: [post, ...s.feed] })).feed[0];
  },
  toggleLikePost(postId) {
    updateState((s) => ({
      ...s,
      feed: s.feed.map((p) => {
        if (p.id !== postId) return p;
        const liked = !p.likedByMe;
        return { ...p, likedByMe: liked, likes: clamp((p.likes || 0) + (liked ? 1 : -1), 0, 999999) };
      })
    }));
    return true;
  },

  // -------------------------
  // Notifications / reminders
  // -------------------------
  listNotifications() {
    return getState().notifications;
  },
  pushNotification({ title, body, type = "system", data } = {}) {
    const n = {
      id: uid("notif"),
      createdAt: new Date().toISOString(),
      title: title || "Notification",
      body: body || "",
      read: false,
      type,
      data: data || null
    };
    updateState((s) => ({ ...s, notifications: [n, ...s.notifications] }));
    return n;
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

  listReminders() {
    return getState().reminders;
  },
  upsertReminder(payload) {
    const reminder = {
      id: payload.id || uid("rem"),
      habitId: payload.habitId,
      time: payload.time || "09:00",
      days: Array.isArray(payload.days) ? payload.days : [1, 2, 3, 4, 5, 6, 7],
      enabled: payload.enabled !== false,
      message: payload.message || "Reminder"
    };
    updateState((s) => {
      const exists = s.reminders.some((r) => r.id === reminder.id);
      return {
        ...s,
        reminders: exists ? s.reminders.map((r) => (r.id === reminder.id ? reminder : r)) : [reminder, ...s.reminders]
      };
    });
    return reminder;
  },
  deleteReminder(reminderId) {
    updateState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== reminderId) }));
    return true;
  },
  simulateReminderPing(habitId) {
    const habit = getState().habits.find((h) => h.id === habitId);
    if (!habit) return false;
    this.pushNotification({
      title: "Reminder",
      body: `Time to check in: ${habit.title}`,
      type: "reminder",
      data: { habitId }
    });
    return true;
  },

  // -------------------------
  // Badges
  // -------------------------
  listBadges() {
    return getState().badges;
  },
  listMyBadges() {
    const state = getState();
    const defs = new Map(state.badges.map((b) => [b.code, b]));
    return state.earnedBadges
      .map((e) => ({ ...e, badge: defs.get(e.badgeCode) || null }))
      .sort((a, b) => String(b.earnedAt).localeCompare(String(a.earnedAt)));
  },

  // -------------------------
  // Power features
  // -------------------------
  listTemplates() {
    return getState().power.templates;
  },
  applyTemplate(templateId) {
    const state = getState();
    const tpl = state.power.templates.find((t) => t.id === templateId);
    if (!tpl) return { ok: false, message: "Template not found." };

    const createdIds = [];
    updateState((s) => {
      const newHabits = tpl.habits.map((title) => ({
        id: uid("habit"),
        title,
        description: "",
        habit_type: "daily",
        target_value: 1,
        unit: null,
        schedule_days: null,
        reminder_time: null,
        is_public: false,
        color: null,
        icon: null,
        streak: 0,
        longestStreak: 0,
        lastCheckIn: null,
        createdAt: new Date().toISOString()
      }));
      newHabits.forEach((h) => createdIds.push(h.id));
      return { ...s, habits: [...newHabits, ...s.habits] };
    });

    return { ok: true, message: `Added ${tpl.habits.length} habits`, habitIds: createdIds };
  },
  exportData() {
    const payload = getState();
    updateState((s) => ({ ...s, power: { ...s.power, export: { lastExportAt: new Date().toISOString() } } }));
    return payload;
  },

  // -------------------------
  // Admin (demo)
  // -------------------------
  isAdminEnabled() {
    return Boolean(getState().admin?.enabled);
  },
  getAdminOverview() {
    return getState().admin;
  },
  createAnnouncement(payload) {
    const ann = { id: uid("ann"), title: payload.title?.trim() || "Announcement", body: payload.body?.trim() || "", active: true };
    updateState((s) => ({ ...s, admin: { ...s.admin, announcements: [ann, ...(s.admin?.announcements || [])] } }));
    return ann;
  },
  toggleAnnouncement(announcementId) {
    updateState((s) => ({
      ...s,
      admin: {
        ...s.admin,
        announcements: (s.admin?.announcements || []).map((a) => (a.id === announcementId ? { ...a, active: !a.active } : a))
      }
    }));
    return true;
  },
  resolveModerationItem(itemId, action = "dismiss") {
    updateState((s) => ({
      ...s,
      admin: {
        ...s.admin,
        moderationQueue: (s.admin?.moderationQueue || []).filter((m) => m.id !== itemId),
        stats: { ...(s.admin?.stats || {}), moderationActions: ((s.admin?.stats || {}).moderationActions || 0) + 1 }
      }
    }));
    return action;
  }
};
