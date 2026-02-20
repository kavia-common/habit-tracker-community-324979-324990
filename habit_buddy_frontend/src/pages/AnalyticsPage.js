import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import { EmptyState, PageHeader, Section } from "../components/ui";

/**
 * Analytics UI notes:
 * - Frontend-only: uses demoStore habits + checkins.
 * - Heatmap is calendar-style and responsive (scrolls horizontally on small screens).
 * - Trend views show weekly/monthly summaries with minimal, dependency-free charts.
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
      adherence
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

// PUBLIC_INTERFACE
export default function AnalyticsPage() {
  /** Analytics page: check-in calendar heatmap + weekly/monthly summary trends (demo data). */
  const [mode, setMode] = useState("weekly"); // weekly | monthly
  const [habitScope, setHabitScope] = useState("all"); // all | <habitId>

  const habits = demoApi.listHabits();

  // We only have per-habit listCheckins API; gather checkins based on scope.
  const checkins = useMemo(() => {
    if (habitScope === "all") {
      const merged = [];
      for (const h of habits) {
        merged.push(...demoApi.listCheckins(h.id, 9999));
      }
      return merged;
    }
    return demoApi.listCheckins(habitScope, 9999);
  }, [habits, habitScope]);

  const checkinsByDate = useMemo(() => computeCheckinMap(checkins), [checkins]);
  const habitsInScope = useMemo(() => (habitScope === "all" ? habits : habits.filter((h) => h.id === habitScope)), [habits, habitScope]);

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
  const maxTotal = useMemo(() => Math.max(1, ...trendSeries.map((s) => s.total)), [trendSeries]);

  const scopeLabel = useMemo(() => {
    if (habitScope === "all") return "All habits";
    const h = habits.find((x) => x.id === habitScope);
    return h ? h.title : "Habit";
  }, [habitScope, habits]);

  return (
    <div className="analytics">
      <PageHeader
        title="Analytics"
        subtitle="Heatmap + trends from your check-ins (demo data)."
        actions={
          <>
            <div className="row wrap" style={{ gap: 8 }}>
              <label className="sr-only" htmlFor="analytics-scope">
                Habit scope
              </label>
              <select
                id="analytics-scope"
                className="select"
                style={{ width: 220, height: 40 }}
                value={habitScope}
                onChange={(e) => setHabitScope(e.target.value)}
              >
                <option value="all">All habits</option>
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>

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
                <StatPill label="Scope" value={scopeLabel} sub={`${habitsInScope.length} habit${habitsInScope.length === 1 ? "" : "s"}`} />
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <StatPill label="Check-ins (12w)" value={stats.totalCheckins} sub={`${stats.activeDays} active day${stats.activeDays === 1 ? "" : "s"}`} />
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <StatPill label="Adherence (12w)" value={safePct(stats.adherence)} sub={`Current streak: ${stats.currentAnyStreak} day${stats.currentAnyStreak === 1 ? "" : "s"}`} />
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
                  <p className="card-subtitle">
                    Totals + adherence (check-ins / possible check-ins) • {scopeLabel}
                  </p>
                </div>
              </div>

              <div className="card-body">
                <div className="trend" role="list" aria-label="Trend list">
                  {trendSeries
                    .slice()
                    .reverse()
                    .map((s) => {
                      const widthPct = Math.round((s.total / maxTotal) * 100);
                      return (
                        <div key={s.key} className="trend-row" role="listitem">
                          <div className="trend-row__label">{s.label}</div>
                          <div className="trend-row__barWrap" aria-hidden="true">
                            <div className="trend-row__bar" style={{ width: `${widthPct}%` }} />
                          </div>
                          <div className="trend-row__meta">
                            <span className="trend-row__total">{s.total}</span>
                            <span className="trend-row__muted">{safePct(s.adherence)}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="notice" style={{ marginTop: 12 }}>
                  Tip: Create multiple habits and check in across days to make the heatmap and adherence trend more interesting.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
