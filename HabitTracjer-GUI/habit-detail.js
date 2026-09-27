import './types.js';

// ============================================================
//  Config
// ============================================================
const API_ORIGIN = 'http://localhost:8080';
const API_BASE = `${API_ORIGIN}/api/v1/habits`;

// How many weeks of history to show in the heatmap
const HEATMAP_WEEKS = 26;

// ============================================================
//  Parse habitId from URL
// ============================================================
const params = new URLSearchParams(window.location.search);
const habitId = Number(params.get('id'));

// ============================================================
//  State
// ============================================================
/** @type {import('./types.js').HabitDto | null} */
let habit = null;

// ============================================================
//  DOM
// ============================================================
const loadingEl = document.getElementById('detail-loading');
const errorEl = document.getElementById('detail-error');
const contentEl = document.getElementById('detail-content');

const editHabitBtn = document.getElementById('edit-habit-btn');
const deleteHabitBtn = document.getElementById('delete-habit-btn');

const colorDotEl = document.getElementById('detail-color-dot');
const nameEl = document.getElementById('detail-name');
const priorityEl = document.getElementById('detail-priority-badge');
const descriptionEl = document.getElementById('detail-description');
const createdDateEl = document.getElementById('detail-created-date');

const statCompletedEl = document.getElementById('stat-completed');
const statFailedEl = document.getElementById('stat-failed');
const statTotalEl = document.getElementById('stat-total');
const statRateEl = document.getElementById('stat-rate');

const heatmapMonthsEl = document.getElementById('heatmap-months');
const heatmapGridEl = document.getElementById('heatmap-grid');

// Edit modal
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editNameInput = document.getElementById('edit-name');
const editDescInput = document.getElementById('edit-description');
const editPrioritySel = document.getElementById('edit-priority');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveEditBtn = document.getElementById('save-edit-btn');
const editFormError = document.getElementById('edit-form-error');

// Delete modal
const deleteModal = document.getElementById('delete-modal');
const deleteHabitName = document.getElementById('delete-habit-name');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const deleteFormError = document.getElementById('delete-form-error');

// ============================================================
//  Helpers
// ============================================================
const COLOR_CYCLE = ['blue', 'green', 'orange', 'red'];

/** @param {number} id */
const pickColor = (id) => COLOR_CYCLE[id % COLOR_CYCLE.length];

/** @param {string} s */
const escapeHtml = (s) =>
    String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

/** @param {Date} d */
const toISODate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/** @param {string} iso */
const parseISODate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};

/** @param {string | null} isoDateTime */
const formatDate = (isoDateTime) => {
    if (!isoDateTime) return '—';
    const d = new Date(isoDateTime);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const MONTH_LABELS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ============================================================
//  Render: header / stats / description
// ============================================================
const renderDetail = () => {
    if (!habit) return;

    const color = pickColor(habit.id);

    colorDotEl.style.backgroundColor = `var(--color-${color})`;
    nameEl.textContent = habit.name;
    priorityEl.textContent = habit.priority;
    priorityEl.className = `priority-badge priority-${habit.priority.toLowerCase()}`;

    if (habit.description) {
        descriptionEl.textContent = habit.description;
        descriptionEl.hidden = false;
    } else {
        descriptionEl.textContent = 'No description provided.';
        descriptionEl.style.color = '#555';
        descriptionEl.style.fontStyle = 'italic';
    }

    createdDateEl.textContent = formatDate(habit.createdDate);

    const completedCount = habit.completedCount ?? 0;
    // Days fully elapsed since creation (today doesn't count yet)
    const created = new Date(habit.createdDate);
    created.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const elapsed = Math.max(0, Math.floor((now.getTime() - created.getTime()) / 86_400_000));

    const totalDays = elapsed;
    const failedCount = Math.max(0, totalDays - completedCount);
    const rate = totalDays === 0 ? 0 : (completedCount * 100 / totalDays);

    statCompletedEl.textContent = String(completedCount);
    statFailedEl.textContent = String(failedCount);
    statTotalEl.textContent = String(totalDays);
    statRateEl.textContent = `${rate.toFixed(1)}%`;
};

// ============================================================
//  Render: heatmap
// ============================================================
/**
 * Build a GitHub-style heatmap of completions for the last N weeks.
 * We fill all 7 rows per column; missing days stay level-0.
 */
const renderHeatmap = () => {
    if (!habit) return;

    heatmapGridEl.innerHTML = '';
    heatmapMonthsEl.innerHTML = '';

    // Build a set of completed dates for fast lookup
    const completedDates = new Set(
        (habit.entries ?? [])
            .filter((e) => e.completed)
            .map((e) => e.entryDate)
    );

    // Anchor on today, go back to the Monday of the current week,
    // then walk back (HEATMAP_WEEKS - 1) more weeks.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMonday = new Date(today);
    const dow = (currentMonday.getDay() + 6) % 7; // Mon=0, Sun=6
    currentMonday.setDate(currentMonday.getDate() - dow);

    const startMonday = new Date(currentMonday);
    startMonday.setDate(startMonday.getDate() - (HEATMAP_WEEKS - 1) * 7);

    // --- Month labels ---
    // Track the first column index where each month appears.
    const monthFirstCol = new Map(); // monthIndex -> columnIndex

    // --- Build cells ---
    for (let w = 0; w < HEATMAP_WEEKS; w++) {
        const weekStart = new Date(startMonday);
        weekStart.setDate(startMonday.getDate() + w * 7);

        for (let d = 0; d < 7; d++) {
            const cellDate = new Date(weekStart);
            cellDate.setDate(weekStart.getDate() + d);

            const iso = toISODate(cellDate);
            const isFuture = cellDate > today;

            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';

            if (isFuture) {
                cell.style.visibility = 'hidden';
            } else {
                const level = completedDates.has(iso) ? 4 : 0;
                cell.classList.add(`level-${level}`);
                cell.title = `${iso} — ${level > 0 ? 'completed' : 'not completed'}`;
            }

            heatmapGridEl.appendChild(cell);

            // Record first occurrence of each month (for the label row)
            if (d === 0 && !monthFirstCol.has(cellDate.getMonth())) {
                monthFirstCol.set(cellDate.getMonth(), w);
            }
        }
    }

    // --- Place month labels as absolutely positioned spans using CSS grid-column ---
    heatmapMonthsEl.style.gridTemplateColumns = `repeat(${HEATMAP_WEEKS}, 12px)`;
    heatmapMonthsEl.style.columnGap = '3px';

    // Sort months by column index, then place each label at that column
    const sortedMonths = [...monthFirstCol.entries()]
        .sort((a, b) => a[1] - b[1]);

    for (const [monthIdx, colIdx] of sortedMonths) {
        const span = document.createElement('span');
        span.textContent = MONTH_LABELS[monthIdx];
        span.style.gridColumn = String(colIdx + 1);
        span.style.gridRow = '1';
        heatmapMonthsEl.appendChild(span);
    }
};

// ============================================================
//  API
// ============================================================
async function fetchHabit() {
    if (!Number.isFinite(habitId) || habitId <= 0) {
        showError('Invalid habit id in URL.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/${habitId}`, {
            headers: { Accept: 'application/json' },
        });

        if (res.status === 404) {
            showError(`Habit ${habitId} was not found.`);
            return;
        }
        if (!res.ok) {
            throw new Error(`GET habit → ${res.status}`);
        }

        /** @type {import('./types.js').HabitDto} */
        habit = await res.json();

        loadingEl.hidden = true;
        contentEl.hidden = false;

        renderDetail();
        renderHeatmap();
    } catch (err) {
        showError(err instanceof Error ? err.message : String(err));
    }
}

async function updateHabit(payload) {
    const res = await fetch(`${API_BASE}/${habitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        let detail = '';
        try { detail = await res.text(); } catch { /* ignore */ }
        throw new Error(`Server ${res.status}${detail ? `: ${detail}` : ''}`);
    }

    return res.json();
}

async function deleteHabit() {
    const res = await fetch(`${API_BASE}/${habitId}`, {
        method: 'DELETE',
    });

    if (!res.ok && res.status !== 204) {
        let detail = '';
        try { detail = await res.text(); } catch { /* ignore */ }
        throw new Error(`Server ${res.status}${detail ? `: ${detail}` : ''}`);
    }
}

// ============================================================
//  UI helpers
// ============================================================
function showError(msg) {
    loadingEl.hidden = true;
    contentEl.hidden = true;
    errorEl.textContent = msg;
    errorEl.hidden = false;
}

function openEditModal() {
    if (!habit) return;

    editNameInput.value = habit.name;
    editDescInput.value = habit.description ?? '';
    editPrioritySel.value = habit.priority;

    editFormError.hidden = true;
    editFormError.textContent = '';

    editModal.hidden = false;
    editNameInput.focus();
}

function closeEditModal() {
    editModal.hidden = true;
}

function openDeleteModal() {
    if (!habit) return;

    const displayName = habit.name.length > 60
        ? habit.name.slice(0, 60).trimEnd() + '…'
        : habit.name;
    deleteHabitName.textContent = `"${displayName}"`;
    deleteHabitName.title = habit.name; // full name on hover
    deleteFormError.hidden = true;
    deleteFormError.textContent = '';

    deleteModal.hidden = false;
}

function closeDeleteModal() {
    deleteModal.hidden = true;
}

// ============================================================
//  Events
// ============================================================
editHabitBtn.addEventListener('click', openEditModal);
deleteHabitBtn.addEventListener('click', openDeleteModal);

cancelEditBtn.addEventListener('click', closeEditModal);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
});
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!editModal.hidden) closeEditModal();
    if (!deleteModal.hidden) closeDeleteModal();
});

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = editNameInput.value.trim();
    const description = editDescInput.value.trim() || null;
    const priority = editPrioritySel.value;

    if (!name) {
        editFormError.textContent = 'Please enter a habit name.';
        editFormError.hidden = false;
        return;
    }

    saveEditBtn.disabled = true;
    editFormError.hidden = true;

    try {
        const updated = await updateHabit({ name, priority, description });

        // Update local state with the fresh DTO
        habit = updated;
        renderDetail();
        closeEditModal();
    } catch (err) {
        editFormError.textContent = err instanceof Error ? err.message : String(err);
        editFormError.hidden = false;
    } finally {
        saveEditBtn.disabled = false;
    }
});

confirmDeleteBtn.addEventListener('click', async () => {
    confirmDeleteBtn.disabled = true;
    deleteFormError.hidden = true;

    try {
        await deleteHabit();
        window.location.href = './tcr.html';
    } catch (err) {
        deleteFormError.textContent = err instanceof Error ? err.message : String(err);
        deleteFormError.hidden = false;
        confirmDeleteBtn.disabled = false;
    }
});

// ============================================================
//  Boot
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    void fetchHabit();
});