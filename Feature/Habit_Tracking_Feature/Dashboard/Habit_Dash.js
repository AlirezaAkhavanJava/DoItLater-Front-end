import "../types.js";

// ============================================================
//  Config
// ============================================================
const API_ORIGIN = "http://localhost:8080";
const API_BASE = `${API_ORIGIN}/api/v1/habits`;
const CREATE_ENDPOINT = `${API_BASE}/create`;
const DAYS_IN_WEEK = 7;

// ============================================================
//  State
// ============================================================
const today = new Date();
today.setHours(0, 0, 0, 0);

// Monday of the current week. The API snaps any date to the
// Mon–Sun week that contains it, so we must hand it a Monday —
// otherwise "today − 6" lands in the previous week on every
// day of the week except Sunday.
let currentStartDate = new Date(today);
const dow = (currentStartDate.getDay() + 6) % 7; // Mon = 0 … Sun = 6
currentStartDate.setDate(currentStartDate.getDate() - dow);

/** @type {import('../types.js').Habit[]} */
let habits = [];

/** @type {string[]} */
let currentDays = [];

// ============================================================
//  DOM
// ============================================================
const habitsListEl = document.getElementById("habits-list");
const daysHeaderRow = document.getElementById("days-header-row");
const dateRangeDisplay = document.getElementById("date-range-display");
const prevWeekBtn = document.getElementById("prev-week");
const nextWeekBtn = document.getElementById("next-week");
const addHabitBtn = document.getElementById("add-habit-btn");

const modal = document.getElementById("habit-modal");
const habitForm = document.getElementById("habit-form");
const habitNameInput = document.getElementById("habit-name");
const habitDescriptionInput = document.getElementById("habit-description");
const habitPrioritySel = document.getElementById("habit-priority");
const cancelHabitBtn = document.getElementById("cancel-habit-btn");
const saveHabitBtn = document.getElementById("save-habit-btn");
const formError = document.getElementById("habit-form-error");

// ============================================================
//  Helpers
// ============================================================
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseISODate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const isDateToday = (date) => {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};

const escapeHtml = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const truncate = (s, n) => {
  if (!s) return "";
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
};

const COLOR_CYCLE = ["blue", "green", "orange", "red"];

const pickColor = (id) => COLOR_CYCLE[id % COLOR_CYCLE.length];

const buildHistory = (days, entries) => {
  const history = new Array(days.length).fill(false);
  for (const e of entries) {
    const idx = days.indexOf(e.entryDate);
    if (idx >= 0) history[idx] = e.completed;
  }
  return history;
};

// ============================================================
//  Render
// ============================================================
const renderHeader = (days) => {
  daysHeaderRow.innerHTML = "";

  for (const iso of days) {
    const d = parseISODate(iso);
    const isToday = isDateToday(d);

    const dayEl = document.createElement("div");
    dayEl.className = "day-label";
    dayEl.innerHTML = `
            <span style="font-weight:600; color:${isToday ? "#fff" : "#888"}">${DAY_LABELS[d.getDay()]}</span>
            <span style="color:${isToday ? "#fff" : "#888"}">${d.getDate()}</span>
        `;
    daysHeaderRow.appendChild(dayEl);
  }
};

const renderHabits = () => {
  habitsListEl.innerHTML = "";

  if (habits.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = 'No habits yet. Click "Track My Habit" to create one.';
    habitsListEl.appendChild(empty);
    return;
  }

  habits.forEach((habit) => {
    const row = document.createElement("div");
    row.className = "habit-row";

    const infoCol = document.createElement("div");
    infoCol.className = "habit-info";
    infoCol.innerHTML = `
            <span class="drag-handle">⣿</span>
            <div class="color-dot" style="background-color: var(--color-${habit.color})"></div>
            <div class="habit-text">
                <div class="habit-name-row">
                    <a class="habit-name habit-name-link"
                        href="../Panel/habit-detail.html?id=${habit.id}"
                        title="${escapeHtml(habit.name)}">
                        ${escapeHtml(habit.name)}
                    </a>
                    <span class="priority-badge priority-${habit.priority.toLowerCase()}">${habit.priority}</span>
                </div>
                ${
                  habit.description
                    ? `<div class="habit-description" title="${escapeHtml(habit.description)}">${escapeHtml(truncate(habit.description, 60))}</div>`
                    : ""
                }
            </div>
        `;

    const statsCol = document.createElement("div");
    statsCol.className = "habit-stats";
    statsCol.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Completed</span>
                <span class="stat-value">${habit.completedCount}</span>
            </div>
            <div class="stat-item stat-item-failed">
                <span class="stat-label">Failed</span>
                <span class="stat-value">${habit.failedCount}</span>
            </div>
        `;

    const daysGrid = document.createElement("div");
    daysGrid.className = "habit-days-grid";

    habit.history.forEach((isDone, index) => {
      const iso = currentDays[index];
      if (!iso) return;
      const d = parseISODate(iso);

      const isToday = isDateToday(d);

      const check = document.createElement("div");
      check.className = `day-check ${isDone ? "checked " + habit.color : ""}`;

      if (isToday) {
        check.classList.add("today");
        check.addEventListener(
          "click",
          () => void toggleHabit(habit.id, index, check, habit.color),
        );
      } else {
        check.classList.add("locked");
        check.setAttribute("aria-disabled", "true");
      }

      daysGrid.appendChild(check);
    });

    row.appendChild(infoCol);
    row.appendChild(statsCol);
    row.appendChild(daysGrid);

    habitsListEl.appendChild(row);
  });
};

// ============================================================
//  Interaction
// ============================================================
async function toggleHabit(habitId, dayIndex, element, color) {
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return;

  const iso = currentDays[dayIndex];
  if (!iso) return;

  if (iso !== toISODate(new Date())) {
    console.warn("Only today can be toggled");
    return;
  }

  const next = !habit.history[dayIndex];

  habit.history[dayIndex] = next;
  element.classList.toggle("checked", next);
  element.classList.toggle(color, next);

  const payload = { entryDate: iso, completed: next, note: null };

  try {
    const res = await fetch(`${API_BASE}/${habitId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`POST entries → ${res.status}`);

    // Refresh from the server so counts and totals stay in sync
    await fetchWeek(currentStartDate);
  } catch (err) {
    habit.history[dayIndex] = !next;
    element.classList.toggle("checked", !next);
    element.classList.toggle(color, !next);
    console.error("Toggle failed:", err);
    renderHabits();
  }
}

// ============================================================
//  API
// ============================================================
async function fetchWeek(startDate) {
  const iso = toISODate(startDate);
  const url = `${API_BASE}/week?startDate=${iso}`;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);

    const grid = await res.json();

    currentDays = grid.days;
    dateRangeDisplay.textContent = grid.dateRangeDisplay;

    habits = grid.habits.map((dto) => {
      const completedCount = dto.completedCount ?? 0;
      const totalDays = dto.totalDays ?? 0;
      const failedCount = Math.max(0, totalDays - completedCount);

      return {
        id: dto.id,
        name: dto.name,
        description: dto.description,
        priority: dto.priority,
        color: pickColor(dto.id),
        completedCount,
        failedCount,
        history: buildHistory(grid.days, dto.entries),
      };
    });
  } catch (err) {
    console.error("Failed to load week:", err);
  } finally {
    renderHeader(currentDays);
    renderHabits();
  }
}

async function createHabit(payload) {
  const res = await fetch(CREATE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(`Server ${res.status}${detail ? `: ${detail}` : ""}`);
  }
}

// ============================================================
//  Modal
// ============================================================
function openModal() {
  habitForm.reset();
  habitPrioritySel.value = "MEDIUM";
  formError.hidden = true;
  formError.textContent = "";
  modal.hidden = false;
  habitNameInput.focus();
}

function closeModal() {
  modal.hidden = true;
}

async function onSubmitHabit(e) {
  e.preventDefault();

  const name = habitNameInput.value.trim();
  const description = habitDescriptionInput.value.trim() || null;
  const priority = habitPrioritySel.value;

  if (!name) {
    formError.textContent = "Please enter a habit name.";
    formError.hidden = false;
    return;
  }

  saveHabitBtn.disabled = true;
  formError.hidden = true;

  try {
    await createHabit({ name, priority, description });
    closeModal();
    await fetchWeek(currentStartDate);
  } catch (err) {
    formError.textContent = err instanceof Error ? err.message : String(err);
    formError.hidden = false;
  } finally {
    saveHabitBtn.disabled = false;
  }
}

// ============================================================
//  Events
// ============================================================
prevWeekBtn.addEventListener("click", () => {
  currentStartDate.setDate(currentStartDate.getDate() - DAYS_IN_WEEK);
  void fetchWeek(currentStartDate);
});

nextWeekBtn.addEventListener("click", () => {
  currentStartDate.setDate(currentStartDate.getDate() + DAYS_IN_WEEK);
  void fetchWeek(currentStartDate);
});

addHabitBtn.addEventListener("click", openModal);
cancelHabitBtn.addEventListener("click", closeModal);
habitForm.addEventListener("submit", onSubmitHabit);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) closeModal();
});

// ============================================================
//  Boot
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  renderHeader([]);
  renderHabits();
  void fetchWeek(currentStartDate);
});
