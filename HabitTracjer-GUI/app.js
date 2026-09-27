import './types.js';

// ============================================================
//  Config
// ============================================================
const API_ORIGIN = 'http://localhost:8080';
const API_BASE = `${API_ORIGIN}/api/v1/habits`;
const CREATE_ENDPOINT = `${API_BASE}/create`;
const DAYS_IN_WEEK = 7;

// ============================================================
//  State
// ============================================================
const today = new Date();
today.setHours(0, 0, 0, 0);

let currentStartDate = new Date(today);
currentStartDate.setDate(currentStartDate.getDate() - (DAYS_IN_WEEK - 1));

/** @type {import('./types.js').Habit[]} */
let habits = [];

/** @type {string[]} */
let currentDays = [];

// ============================================================
//  DOM
// ============================================================
const habitsListEl          = document.getElementById('habits-list');
const daysHeaderRow         = document.getElementById('days-header-row');
const dateRangeDisplay      = document.getElementById('date-range-display');
const prevWeekBtn           = document.getElementById('prev-week');
const nextWeekBtn           = document.getElementById('next-week');
const addHabitBtn           = document.getElementById('add-habit-btn');

const modal                 = document.getElementById('habit-modal');
const habitForm             = document.getElementById('habit-form');
const habitNameInput        = document.getElementById('habit-name');
const habitDescriptionInput = document.getElementById('habit-description');
const habitPrioritySel      = document.getElementById('habit-priority');
const cancelHabitBtn        = document.getElementById('cancel-habit-btn');
const saveHabitBtn          = document.getElementById('save-habit-btn');
const formError             = document.getElementById('habit-form-error');

// ============================================================
//  Helpers
// ============================================================
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** @param {Date} d @returns {string} */
const toISODate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/** @param {string} iso @returns {Date} */
const parseISODate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};

/** @param {Date} date @returns {boolean} */
const isDateToday = (date) => {
    const now = new Date();
    return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    );
};

/** @param {string} s @returns {string} */
const escapeHtml = (s) =>
    String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

/** @param {string | null} s @param {number} n @returns {string} */
const truncate = (s, n) => {
    if (!s) return '';
    return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
};

const COLOR_CYCLE = ['blue', 'green', 'orange', 'red'];

/** @param {number} id @returns {import('./types.js').HabitColor} */
const pickColor = (id) => COLOR_CYCLE[id % COLOR_CYCLE.length];

/**
 * @param {string[]} days
 * @param {{ entryDate: string; completed: boolean }[]} entries
 * @returns {boolean[]}
 */
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
/** @param {string[]} days */
const renderHeader = (days) => {
    daysHeaderRow.innerHTML = '';

    for (const iso of days) {
        const d = parseISODate(iso);
        const isToday = isDateToday(d);

        const dayEl = document.createElement('div');
        dayEl.className = 'day-label';
        dayEl.innerHTML = `
            <span style="font-weight:600; color:${isToday ? '#fff' : '#888'}">${DAY_LABELS[d.getDay()]}</span>
            <span style="color:${isToday ? '#fff' : '#888'}">${d.getDate()}</span>
        `;
        daysHeaderRow.appendChild(dayEl);
    }
};

const renderHabits = () => {
    habitsListEl.innerHTML = '';

    if (habits.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'No habits yet. Click "Track My Habit" to create one.';
        habitsListEl.appendChild(empty);
        return;
    }

    habits.forEach((habit) => {
        const row = document.createElement('div');
        row.className = 'habit-row';

        // -------- Info column --------
        const infoCol = document.createElement('div');
        infoCol.className = 'habit-info';
        infoCol.innerHTML = `
            <span class="drag-handle">⣿</span>
            <div class="color-dot" style="background-color: var(--color-${habit.color})"></div>
            <div class="habit-text">
                <div class="habit-name-row">
                    <span class="habit-name">${escapeHtml(habit.name)}</span>
                    <span class="priority-badge priority-${habit.priority.toLowerCase()}">${habit.priority}</span>
                </div>
                ${habit.description
                    ? `<div class="habit-description" title="${escapeHtml(habit.description)}">${escapeHtml(truncate(habit.description, 60))}</div>`
                    : ''}
            </div>
        `;

        // -------- Stats column --------
        const statsCol = document.createElement('div');
        statsCol.className = 'habit-stats';
        statsCol.innerHTML = `
            <div class="stat-item"><span class="stat-icon">🏆</span> ${habit.streak}</div>
            <div class="stat-item" style="color: #f0ad4e"><span class="stat-icon">🔥</span> ${habit.weeklyTotal}</div>
        `;

        // -------- Days grid --------
        const daysGrid = document.createElement('div');
        daysGrid.className = 'habit-days-grid';

        habit.history.forEach((isDone, index) => {
            const iso = currentDays[index];
            if (!iso) return;
            const d = parseISODate(iso);

            const isToday = isDateToday(d);

            const check = document.createElement('div');
            check.className = `day-check ${isDone ? 'checked ' + habit.color : ''}`;

            if (isToday) {
                check.classList.add('today');
                check.addEventListener('click', () =>
                    void toggleHabit(habit.id, index, check, habit.color)
                );
            } else {
                check.classList.add('locked');
                check.setAttribute('aria-disabled', 'true');
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
/**
 * @param {number} habitId
 * @param {number} dayIndex
 * @param {HTMLElement} element
 * @param {import('./types.js').HabitColor} color
 */
async function toggleHabit(habitId, dayIndex, element, color) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const iso = currentDays[dayIndex];
    if (!iso) return;

    // Only today is editable (double-check)
    if (iso !== toISODate(new Date())) {
        console.warn('Only today can be toggled');
        return;
    }

    const next = !habit.history[dayIndex];

    // optimistic update
    habit.history[dayIndex] = next;
    element.classList.toggle('checked', next);
    element.classList.toggle(color, next);
    habit.weeklyTotal += next ? 1 : -1;

    /** @type {import('./types.js').ToggleHabitEntryRequestDto} */
    const payload = { entryDate: iso, completed: next, note: null };

    try {
        const res = await fetch(`${API_BASE}/${habitId}/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`POST entries → ${res.status}`);
    } catch (err) {
        // revert
        habit.history[dayIndex] = !next;
        element.classList.toggle('checked', !next);
        element.classList.toggle(color, !next);
        habit.weeklyTotal += next ? -1 : 1;
        console.error('Toggle failed:', err);
    } finally {
        renderHabits();
    }
}

// ============================================================
//  API
// ============================================================
/** @param {Date} startDate */
async function fetchWeek(startDate) {
    const iso = toISODate(startDate);
    const url = `${API_BASE}/week?startDate=${iso}`;

    try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);

        /** @type {import('./types.js').WeekGridDto} */
        const grid = await res.json();

        currentDays = grid.days;
        dateRangeDisplay.textContent = grid.dateRangeDisplay;

        habits = grid.habits.map((dto) => ({
            id: dto.id,
            name: dto.name,
            description: dto.description,
            priority: dto.priority,
            color: pickColor(dto.id),
            streak: 0,
            weeklyTotal: dto.completedCount,
            history: buildHistory(grid.days, dto.entries),
        }));
    } catch (err) {
        console.error('Failed to load week:', err);
    } finally {
        renderHeader(currentDays);
        renderHabits();
    }
}

/** @param {import('./types.js').CreateHabitRequestDto} payload */
async function createHabit(payload) {
    const res = await fetch(CREATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        let detail = '';
        try { detail = await res.text(); } catch { /* ignore */ }
        throw new Error(`Server ${res.status}${detail ? `: ${detail}` : ''}`);
    }
}

// ============================================================
//  Modal
// ============================================================
function openModal() {
    habitForm.reset();
    habitPrioritySel.value = 'MEDIUM';
    formError.hidden = true;
    formError.textContent = '';
    modal.hidden = false;
    habitNameInput.focus();
}

function closeModal() {
    modal.hidden = true;
}

/** @param {SubmitEvent} e */
async function onSubmitHabit(e) {
    e.preventDefault();

    const name = habitNameInput.value.trim();
    const description = habitDescriptionInput.value.trim() || null;
    const priority = habitPrioritySel.value;

    if (!name) {
        formError.textContent = 'Please enter a habit name.';
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
prevWeekBtn.addEventListener('click', () => {
    currentStartDate.setDate(currentStartDate.getDate() - DAYS_IN_WEEK);
    void fetchWeek(currentStartDate);
});

nextWeekBtn.addEventListener('click', () => {
    currentStartDate.setDate(currentStartDate.getDate() + DAYS_IN_WEEK);
    void fetchWeek(currentStartDate);
});

addHabitBtn.addEventListener('click', openModal);
cancelHabitBtn.addEventListener('click', closeModal);
habitForm.addEventListener('submit', onSubmitHabit);

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
});

// ============================================================
//  Boot
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    renderHeader([]);
    renderHabits();
    void fetchWeek(currentStartDate);
});