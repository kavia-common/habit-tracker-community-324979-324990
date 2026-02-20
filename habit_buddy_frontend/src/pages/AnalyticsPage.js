import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import { EmptyState, PageHeader, Section } from "../components/ui";

/**
 * Analytics UI notes:
 * - Frontend-only: uses demoStore habits + checkins.
 * - Heatmap is calendar-style and responsive (scrolls horizontally on small screens).
 * - Trend views show weekly/monthly summaries with minimal, dependency-free charts.
 * - Enhanced:
 *   - Habit filters: single + multi-select, plus quick chips.
 *   - Goal/target lines: computed from habits' target_value in the demo store.
 */

function isoDateKey(d) {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfWeekMonday(d) {
  // Monday as 0..6 (Mon..Sun)
  const day = (d.getDay() + 6) % 7;
  return addDays(startOfDay(d), -day);
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth() + n, 1);
  return x;
}

function monthLabel(d) {
  return d.toLocaleString(undefined, { month: "short", year: "numeric" });
}

function weekdayLabel(idx) {
  // idx is 0..6 corresponding to Mon..Sun
  const map = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return map[idx] || "";
}

function intensityClass(count) {
  if (count <= 0) return "heat-cell i0";
  if (count === 1) return "heat-cell i1";
  if (count === 2) return "heat-cell i2";
  if (count === 3) return "heat-cell i3";
  return "heat-cell i4";
}

function safePct(n) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n)}%`;
}

function computeCheckinMap(checkins) {
  const byDate = new Map();
  for (const c of checkins) {
    const k = String(c.date || "");
    if (!k) continue;
    byDate.set(k, (byDate.get(k) || 0) + 1);
  }
  return byDate;
}

function computeWeekSeries({ fromDate, weeks, habitsCount, checkinsByDate }) {
  const series = [];
  const start = startOfWeekMonday(fromDate);

  for (let i = 0; i < weeks; i += 1) {
    const weekStart = addDays(start, i * 7);
    const weekEnd = addDays(weekStart, 6);

    let total = 0;
    for (let d = 0; d < 7; d += 1) {
      const key = isoDateKey(addDays(weekStart, d));
      total += checkinsByDate.get(key) || 0;
    }

    const possible = Math.max(1, habitsCount * 7);
    const adherence = (total / possible) * 100;

    series.push({
      key: `${isoDateKey(weekStart)}`,
      label: `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })}–${weekEnd.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      })}`,
      total,
      avgPerDay: total / 7,
      adherence
    });
  }

  return series;
}

function computeMonthSeries({ fromMonthDate, months, habitsCount, checkinsByDate }) {
  const series = [];
  for (let i = 0; i < months; i += 1) {
    const mStart = addMonths(fromMonthDate, i);
    const mEnd = addMonths(fromMonthDate, i + 1);
    const daysInMonth = Math.max(1, Math.round((mEnd - mStart) / (1000 * 60 * 60 * 24)));

    let total = 0;
    for (let d = 0; d < daysInMonth; d += 1) {
      const key = isoDateKey(addDays(mStart, d));
      total += checkinsByDate.get(key) || 0;
    }

    const possible = Math.max(1, habitsCount * daysInMonth);
    const adherence = (total / possible) * 100;

    series.push({
      key: `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, "0")}`,
      label: monthLabel(mStart),
      total,
      avgPerDay: total / daysInMonth,
      adherence,
      daysInMonth
    });
  }
  return series;
}

function StatPill({ label, value, sub }) {
  return (
    <div className="analytics-stat">
      <div className="analytics-stat__label">{label}</div>
      <div className="analytics-stat__value">{value}</div>
      {sub ? <div className="analytics-stat__sub">{sub}</div> : null}
    </div>
  );
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatTargetCount(n) {
  if (!Number.isFinite(n)) return "—";
  if (n >= 100) return `${Math.round(n)}`;
  // allow a small bit of precision for odd month lengths, etc.
  return Number.isInteger(n) ? `${n}` : `${n.toFixed(1)}`;
}

function parseSelectedIds(v) {
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.map(String);
    return [];
  } catch {
    return [];
  }
}

function computeTargetPerDayFromHabits(habitsInScope) {
  // Demo interpretation:
  // - each habit has a target_value (e.g., water=8, read=20)
  // - treat "meeting goal today" as completing that target once per day
  // - in our check-in data model, we only count one check-in per habit/day,
  //   so "target" becomes the number of habits you aim to check in per day.
  // To still reflect the presence of target_value, we:
  // - define "goal day count" = number of habits with a target_value > 0
  // - (fallback) = number of habits in scope
  const eligible = habitsInScope.filter((h) => (Number(h.target_value) || 0) > 0);
  return Math.max(1, eligible.length || habitsInScope.length || 1);
}

function computeTargets({ mode, habitsInScope, weeklySeries, monthlySeries }) {
  const targetPerDay = computeTargetPerDayFromHabits(habitsInScope);

  // Weekly/monthly targets are "goal check-ins per day * number of days in period"
  const weeklyTargetTotal = targetPerDay * 7;
  const monthlyTargetsByKey = new Map();
  for (const s of monthlySeries) {
    monthlyTargetsByKey.set(s.key, targetPerDay * (s.daysInMonth || 30));
  }

  const targetForSeries = mode === "weekly" ? weeklyTargetTotal : null;
  return { targetPerDay, weeklyTargetTotal, monthlyTargetsByKey, targetForSeries };
}

function computeVsTargetMeta(total, targetTotal) {
  const t = Math.max(0, Number(targetTotal) || 0);
  if (t <= 0) return { ratioPct: 0, diff: 0, label: "No target" };
  const ratioPct = (total / t) * 100;
  const diff = total - t;
  const label = diff >= 0 ? `+${Math.round(diff)}` : `${Math.round(diff)}`;
  return { ratioPct, diff, label };
}

function HabitChip({ active, label, onClick }) {
  return (
    <button type="button" className={`analytics-chip ${active ? "active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

// PUBLIC_INTERFACE
export default function AnalyticsPage() {
  /** Analytics page: check-in calendar heatmap + weekly/monthly summary trends (demo data). */
  const [mode, setMode] = useState("weekly"); // weekly | monthly

  // New: filter mode + selection
  const [filterMode, setFilterMode] = useState("multi"); // multi | single
  const [selectedHabitIds, setSelectedHabitIds] = useState([]); // array of habit ids

  const habits = demoApi.listHabits();

  const habitsById = useMemo(() => new Map(habits.map((h) => [h.id, h])), [habits]);

  const habitsInScope = useMemo(() => {
    if (filterMode === "single") {
      const id = selectedHabitIds[0];
      if (!id) return habits;
      return habits.filter((h) => h.id === id);
    }

    // multi
    if (!selectedHabitIds.length) return habits;
    const sel = new Set(selectedHabitIds);
    return habits.filter((h) => sel.has(h.id));
  }, [habits, filterMode, selectedHabitIds]);

  // We only have per-habit listCheckins API; gather checkins based on scope.
  const checkins = useMemo(() => {
    const merged = [];
    for (const h of habitsInScope) {
      merged.push(...demoApi.listCheckins(h.id, 9999));
    }
    return merged;
  }, [habitsInScope]);

  const checkinsByDate = useMemo(() => computeCheckinMap(checkins), [checkins]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const heatmapStart = useMemo(() => startOfWeekMonday(addDays(today, -11 * 7)), [today]); // 12 weeks
  const heatmapWeeks = 12;

  const heatmapGrid = useMemo(() => {
    // 7 rows (Mon..Sun), 12 weeks columns.
    const cols = [];
    for (let w = 0; w < heatmapWeeks; w += 1) {
      const weekStart = addDays(heatmapStart, w * 7);
      const col = [];
      for (let r = 0; r < 7; r += 1) {
        const day = addDays(weekStart, r);
        const key = isoDateKey(day);
        const count = checkinsByDate.get(key) || 0;
        col.push({ key, date: day, count, isFuture: day > today });
      }
      cols.push({ weekStart, days: col });
    }
    return cols;
  }, [heatmapStart, checkinsByDate, today]);

  const stats = useMemo(() => {
    const days = heatmapWeeks * 7;
    let total = 0;
    let activeDays = 0;
    for (let i = 0; i < days; i += 1) {
      const k = isoDateKey(addDays(heatmapStart, i));
      const c = checkinsByDate.get(k) || 0;
      total += c;
      if (c > 0) activeDays += 1;
    }

    const habitsCount = Math.max(1, habitsInScope.length);
    const possible = habitsCount * days;
    const adherence = (total / possible) * 100;

    // Current streak (any check-in day streak in scope)
    let streak = 0;
    for (let i = 0; i < days; i += 1) {
      const k = isoDateKey(addDays(today, -i));
      const c = checkinsByDate.get(k) || 0;
      if (c > 0) streak += 1;
      else break;
    }

    return {
      totalCheckins: total,
      activeDays,
      adherence,
      currentAnyStreak: streak
    };
  }, [checkinsByDate, heatmapStart, heatmapWeeks, habitsInScope.length, today]);

  const weeklySeries = useMemo(() => {
    const start = startOfWeekMonday(addDays(today, -(8 * 7))); // last 8 weeks
    return computeWeekSeries({
      fromDate: start,
      weeks: 8,
      habitsCount: habitsInScope.length || 1,
      checkinsByDate
    });
  }, [today, habitsInScope.length, checkinsByDate]);

  const monthlySeries = useMemo(() => {
    const start = startOfMonth(addMonths(today, -5)); // last 6 months
    return computeMonthSeries({
      fromMonthDate: start,
      months: 6,
      habitsCount: habitsInScope.length || 1,
      checkinsByDate
    });
  }, [today, habitsInScope.length, checkinsByDate]);

  const trendSeries = mode === "weekly" ? weeklySeries : monthlySeries;

  const targets = useMemo(() => computeTargets({ mode, habitsInScope, weeklySeries, monthlySeries }), [mode, habitsInScope, weeklySeries, monthlySeries]);

  const maxTotalWithGoal = useMemo(() => {
    const totals = trendSeries.map((s) => s.total);
    const goalTotals =
      mode === "weekly"
        ? [targets.weeklyTargetTotal]
        : trendSeries.map((s) => targets.monthlyTargetsByKey.get(s.key) || 0);

    return Math.max(1, ...totals, ...goalTotals);
  }, [trendSeries, mode, targets.weeklyTargetTotal, targets.monthlyTargetsByKey]);

  const latestPeriod = useMemo(() => (trendSeries.length ? trendSeries[trendSeries.length - 1] : null), [trendSeries]);

  const latestTargetTotal = useMemo(() => {
    if (!latestPeriod) return 0;
    if (mode === "weekly") return targets.weeklyTargetTotal;
    return targets.monthlyTargetsByKey.get(latestPeriod.key) || 0;
  }, [latestPeriod, mode, targets.weeklyTargetTotal, targets.monthlyTargetsByKey]);

  const latestVsTarget = useMemo(() => {
    if (!latestPeriod) return { ratioPct: 0, diff: 0, label: "—" };
    return computeVsTargetMeta(latestPeriod.total, latestTargetTotal);
  }, [latestPeriod, latestTargetTotal]);

  const scopeLabel = useMemo(() => {
    if (filterMode === "single") {
      const id = selectedHabitIds[0];
      if (!id) return "All habits";
      const h = habitsById.get(id);
      return h ? h.title : "Habit";
    }

    // multi mode
    if (!selectedHabitIds.length || selectedHabitIds.length === habits.length) return "All habits";
    if (selectedHabitIds.length === 1) {
      const h = habitsById.get(selectedHabitIds[0]);
      return h ? h.title : "1 habit";
    }
    return `${selectedHabitIds.length} habits`;
  }, [filterMode, selectedHabitIds, habits.length, habitsById]);

  const selectedSummary = useMemo(() => {
    if (filterMode === "single") {
      const id = selectedHabitIds[0];
      if (!id) return "All habits";
      const h = habitsById.get(id);
      return h ? `${h.icon ? `${h.icon} ` : ""}${h.title}` : "Habit";
    }

    if (!selectedHabitIds.length) return "All habits";
    const titles = selectedHabitIds
      .map((id) => habitsById.get(id))
      .filter(Boolean)
      .map((h) => `${h.icon ? `${h.icon} ` : ""}${h.title}`);
    if (!titles.length) return "Selected habits";
    return titles.length <= 3 ? titles.join(", ") : `${titles.slice(0, 2).join(", ")} +${titles.length - 2} more`;
  }, [filterMode, selectedHabitIds, habitsById]);

  const multiSelectValue = useMemo(() => JSON.stringify(selectedHabitIds), [selectedHabitIds]);

  const handleToggleHabit = (habitId) => {
    const id = String(habitId);
    if (filterMode === "single") {
      setSelectedHabitIds((cur) => (cur[0] === id ? [] : [id]));
      return;
    }
    setSelectedHabitIds((cur) => {
      const set = new Set(cur);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return Array.from(set);
    });
  };

  const handleSelectAll = () => setSelectedHabitIds([]);
  const handleClear = () => setSelectedHabitIds([]);

  const goalHelp = useMemo(() => {
    // Explain the demo mapping succinctly.
    const perDay = targets.targetPerDay;
    const unit = perDay === 1 ? "habit" : "habits";
    return `Goal line: ${perDay}/${unit} checked-in per day (derived from habits’ target_value).`;
  }, [targets.targetPerDay]);

  return (
    <div className="analytics">
      <PageHeader
        title="Analytics"
        subtitle="Heatmap + trends from your check-ins (demo data)."
        actions={
          <>
            <div className="row wrap" style={{ gap: 8 }}>
              <div className="analytics-filterCard" aria-label="Habit filters">
                <div className="analytics-filterCard__top">
                  <div className="analytics-filterCard__title">Filter habits</div>
                  <div className="analytics-filterCard__mode" role="tablist" aria-label="Filter mode">
                    <button
                      type="button"
                      className={`analytics-filterCard__modeBtn ${filterMode === "single" ? "active" : ""}`}
                      onClick={() => {
                        setFilterMode("single");
                        // Keep selection: in single mode only the first matters.
                        setSelectedHabitIds((cur) => (cur.length ? [cur[0]] : []));
                      }}
                      role="tab"
                      aria-selected={filterMode === "single"}
                    >
                      Single
                    </button>
                    <button
                      type="button"
                      className={`analytics-filterCard__modeBtn ${filterMode === "multi" ? "active" : ""}`}
                      onClick={() => setFilterMode("multi")}
                      role="tab"
                      aria-selected={filterMode === "multi"}
                    >
                      Multi
                    </button>
                  </div>
                </div>

                <div className="analytics-filterCard__controls">
                  <label className="sr-only" htmlFor="analytics-habits-select">
                    Habits selection
                  </label>
                  <select
                    id="analytics-habits-select"
                    className="select"
                    style={{ width: 260, height: 40 }}
                    value={filterMode === "single" ? (selectedHabitIds[0] || "all") : multiSelectValue}
                    onChange={(e) => {
                      if (filterMode === "single") {
                        const v = e.target.value;
                        setSelectedHabitIds(v === "all" ? [] : [v]);
                      } else {
                        setSelectedHabitIds(parseSelectedIds(e.target.value));
                      }
                    }}
                  >
                    {filterMode === "single" ? (
                      <>
                        <option value="all">All habits</option>
                        {habits.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.title}
                          </option>
                        ))}
                      </>
                    ) : (
                      <>
                        <option value="[]">All habits</option>
                        {habits.map((h) => {
                          // toggle this habit in the array
                          const set = new Set(selectedHabitIds);
                          if (set.has(h.id)) set.delete(h.id);
                          else set.add(h.id);
                          const next = JSON.stringify(Array.from(set));
                          const label = `${selectedHabitIds.includes(h.id) ? "✓ " : ""}${h.title}`;
                          return (
                            <option key={h.id} value={next}>
                              {label}
                            </option>
                          );
                        })}
                      </>
                    )}
                  </select>

                  {filterMode === "multi" ? (
                    <div className="row wrap" style={{ gap: 8 }}>
                      <button type="button" className="btn btn-small" onClick={handleSelectAll} title="Show all habits">
                        All
                      </button>
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => setSelectedHabitIds([])}
                        title="Clear selection (same as All in this demo UI)"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="btn btn-small" onClick={handleClear} title="Clear selection">
                      Clear
                    </button>
                  )}
                </div>

                <div className="analytics-filterCard__chips" aria-label="Quick habit chips">
                  <HabitChip active={!selectedHabitIds.length} label="All" onClick={() => setSelectedHabitIds([])} />
                  {habits.slice(0, 8).map((h) => {
                    const active = selectedHabitIds.includes(h.id);
                    const label = `${h.icon ? `${h.icon} ` : ""}${h.title}`;
                    return <HabitChip key={h.id} active={active} label={label} onClick={() => handleToggleHabit(h.id)} />;
                  })}
                </div>

                <div className="analytics-filterCard__hint" title={selectedSummary}>
                  {selectedSummary}
                </div>
              </div>

              <div className="analytics-toggle" role="tablist" aria-label="Trend timeframe">
                <button
                  type="button"
                  className={`analytics-toggle__btn ${mode === "weekly" ? "active" : ""}`}
                  onClick={() => setMode("weekly")}
                  role="tab"
                  aria-selected={mode === "weekly"}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  className={`analytics-toggle__btn ${mode === "monthly" ? "active" : ""}`}
                  onClick={() => setMode("monthly")}
                  role="tab"
                  aria-selected={mode === "monthly"}
                >
                  Monthly
                </button>
              </div>
            </div>
          </>
        }
      />

      {habits.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <EmptyState title="No habits yet" description="Create a habit to start seeing analytics." />
          </div>
        </div>
      ) : (
        <>
          <div className="grid cols-3">
            <div className="card">
              <div className="card-body">
                <StatPill
                  label="Scope"
                  value={scopeLabel}
                  sub={`${habitsInScope.length} habit${habitsInScope.length === 1 ? "" : "s"} • Goal: ${targets.targetPerDay}/day`}
                />
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <StatPill
                  label="Check-ins (12w)"
                  value={stats.totalCheckins}
                  sub={`${stats.activeDays} active day${stats.activeDays === 1 ? "" : "s"} • ${goalHelp}`}
                />
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <StatPill
                  label="Adherence (12w)"
                  value={safePct(stats.adherence)}
                  sub={`Current streak: ${stats.currentAnyStreak} day${stats.currentAnyStreak === 1 ? "" : "s"} • Latest vs goal: ${safePct(latestVsTarget.ratioPct)}`}
                />
              </div>
            </div>
          </div>

          <div className="grid cols-2">
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Check-in heatmap</h3>
                  <p className="card-subtitle">Last 12 weeks • darker = more check-ins</p>
                </div>
                <div className="analytics-legend" aria-label="Heatmap legend">
                  <span className="legend-label">Less</span>
                  <span className="legend-dot i0" aria-hidden="true" />
                  <span className="legend-dot i1" aria-hidden="true" />
                  <span className="legend-dot i2" aria-hidden="true" />
                  <span className="legend-dot i3" aria-hidden="true" />
                  <span className="legend-dot i4" aria-hidden="true" />
                  <span className="legend-label">More</span>
                </div>
              </div>

              <div className="card-body">
                <Section
                  title={monthLabel(heatmapStart)}
                  subtitle="Scroll horizontally on small screens."
                  right={
                    <div className="pill" title="One check-in per habit per day in demo store">
                      Demo
                    </div>
                  }
                >
                  <div className="heatmap-wrap">
                    <div className="heatmap">
                      <div className="heatmap-y" aria-hidden="true">
                        {Array.from({ length: 7 }).map((_, idx) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <div key={idx} className="heatmap-y__label">
                            {idx % 2 === 0 ? weekdayLabel(idx) : ""}
                          </div>
                        ))}
                      </div>

                      <div className="heatmap-grid" role="grid" aria-label="Calendar heatmap (12 weeks)">
                        {heatmapGrid.map((col) => (
                          <div key={isoDateKey(col.weekStart)} className="heatmap-col" role="rowgroup">
                            {col.days.map((cell) => (
                              <div
                                key={cell.key}
                                role="gridcell"
                                className={`${intensityClass(cell.count)} ${cell.isFuture ? "future" : ""}`}
                                title={`${cell.key}: ${cell.count} check-in${cell.count === 1 ? "" : "s"}`}
                                aria-label={`${cell.key}: ${cell.count} check-in${cell.count === 1 ? "" : "s"}`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Section>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{mode === "weekly" ? "Weekly trend" : "Monthly trend"}</h3>
                  <p className="card-subtitle">Totals + adherence (check-ins / possible check-ins) • {scopeLabel}</p>
                </div>
              </div>

              <div className="card-body">
                <div className="trend">
                  <div className="trend-goalNote">
                    <span className="pill">Goal line</span>
                    <span className="trend-goalNote__text">{goalHelp}</span>
                  </div>

                  <div className="trend-goalLine" aria-hidden="true">
                    <div
                      className="trend-goalLine__dash"
                      style={{
                        top: `${100 - clamp((latestTargetTotal / maxTotalWithGoal) * 100, 0, 100)}%`
                      }}
                    />
                    <div className="trend-goalLine__label">
                      Latest target: {formatTargetCount(latestTargetTotal)} check-ins / {mode === "weekly" ? "week" : "month"}
                    </div>
                  </div>

                  <div role="list" aria-label="Trend list">
                    {trendSeries
                      .slice()
                      .reverse()
                      .map((s) => {
                        const targetTotal = mode === "weekly" ? targets.weeklyTargetTotal : targets.monthlyTargetsByKey.get(s.key) || 0;
                        const widthPct = Math.round((s.total / maxTotalWithGoal) * 100);
                        const goalWidthPct = Math.round((targetTotal / maxTotalWithGoal) * 100);
                        const vs = computeVsTargetMeta(s.total, targetTotal);

                        return (
                          <div key={s.key} className="trend-row" role="listitem">
                            <div className="trend-row__label">{s.label}</div>

                            <div className="trend-row__barWrap" aria-hidden="true">
                              <div className="trend-row__goal" style={{ width: `${goalWidthPct}%` }} />
                              <div className="trend-row__bar" style={{ width: `${widthPct}%` }} />
                            </div>

                            <div className="trend-row__meta">
                              <span className="trend-row__total">{s.total}</span>
                              <span className="trend-row__muted">
                                {safePct(s.adherence)} • {safePct(vs.ratioPct)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="notice" style={{ marginTop: 12 }}>
                  Tip: Use multi-select to compare a subset of habits. The goal overlay is derived from demo habit targets and displayed as a reference line.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
