import './types.js';

// ============================================================
//  Config
// ============================================================
const API_ORIGIN = 'http://localhost:8080';
const API_BASE = `${API_ORIGIN}/api/v1/habits`;

const HEATMAP_WEEKS = 52;   // a full year, like GitHub

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
const loadingEl        = document.getElementById('detail-loading');
const errorEl          = document.getElementById('detail-error');
const contentEl        = document.getElementById('detail-content');

const editHabitBtn     = document.getElementById('edit-habit-btn');
const deleteHabitBtn   = document.getElementById('delete-habit-btn');

const colorDotEl       = document.getElementById('detail-color-dot');
const nameEl           = document.getElementById('detail-name');
const priorityEl       = document.getElementById('detail-priority-badge');
const descriptionEl    = document.getElementById('detail-description');
const createdDateEl    = document.getElementById('detail-created-date');

const statCompletedEl  = document.getElementById('stat-completed');
const statFailedEl     = document.getElementById('stat-failed');
const statTotalEl      = document.getElementById('stat-total');
const statRateEl       = document.getElementById('stat-rate');

const heatmapMonthsEl  = document.getElementById('heatmap-months');
const heatmapGridEl    = document.getElementById('heatmap-grid');

const editModal        = document.getElementById('edit-modal');
const editForm         = document.getElementById('edit-form');
const editNameInput    = document.getElementById('edit-name');
const editDescInput    = document.getElementById('edit-description');
const editPrioritySel  = document.getElementById('edit-priority');
const cancelEditBtn    = document.getElementById('cancel-edit-btn');
const saveEditBtn      = document.getElementById('save-edit-btn');
const editFormError    = document.getElementById('edit-form-error');

const deleteModal      = document.getElementById('delete-modal');
const deleteHabitName  = document.getElementById('delete-habit-name');
const cancelDeleteBtn  = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const deleteFormError  = document.getElementById('delete-form-error');

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
//  Render: header / stats
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

    // ---- Trust the backend for totalDays / completedCount ----
    const completedCount = habit.completedCount ?? 0;
    const totalDays      = habit.totalDays ?? 0;
    const failedCount    = Math.max(0, totalDays - completedCount);
    const rate           = totalDays === 0 ? 0 : (completedCount * 100 / totalDays);

    statCompletedEl.textContent = String(completedCount);
    statFailedEl.textContent    = String(failedCount);
    statTotalEl.textContent     = String(totalDays);
    statRateEl.textContent      = `${rate.toFixed(1)}%`;
};

// ============================================================
//  Render: heatmap
// ============================================================
const renderHeatmap = () => {
    if (!habit) return;

    heatmapGridEl.innerHTML = '';
    heatmapMonthsEl.innerHTML = '';

    const completedDates = new Set(
        (habit.entries ?? [])
            .filter((e) => e.completed)
            .map((e) => e.entryDate)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMonday = new Date(today);
    const dow = (currentMonday.getDay() + 6) % 7; // Mon = 0
    currentMonday.setDate(currentMonday.getDate() - dow);

    const startMonday = new Date(currentMonday);
    startMonday.setDate(startMonday.getDate() - (HEATMAP_WEEKS - 1) * 7);

    // For each column, remember which month it belongs to
    const monthPerCol = [];

    // ---- Build cells ----
    for (let w = 0; w < HEATMAP_WEEKS; w++) {
        const weekStart = new Date(startMonday);
        weekStart.setDate(startMonday.getDate() + w * 7);

        // The "month of this column" = month of the Monday of that week
        monthPerCol.push(weekStart.getMonth());

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
                cell.dataset.tooltip = `${iso} — ${level > 0 ? 'completed' : 'not completed'}`;
            }

            heatmapGridEl.appendChild(cell);
        }
    }

    // ---- Build month labels with minimum spacing ----
    heatmapMonthsEl.style.gridTemplateColumns = `repeat(${HEATMAP_WEEKS}, 13px)`;
    heatmapMonthsEl.style.columnGap = '3px';

    const MIN_COL_GAP = 3;   // a month label needs ~3 columns of width
    let lastLabelCol = -Infinity;

    for (let w = 0; w < HEATMAP_WEEKS; w++) {
        const month = monthPerCol[w];
        const prevMonth = w > 0 ? monthPerCol[w - 1] : null;

        // Only emit a label on the first column of a new month
        if (month === prevMonth) continue;

        // Skip if it would overlap the previous label
        if (w - lastLabelCol < MIN_COL_GAP) continue;

        const span = document.createElement('span');
        span.textContent = MONTH_LABELS[month];
        span.style.gridColumn = String(w + 1);
        span.style.gridRow = '1';
        heatmapMonthsEl.appendChild(span);

        lastLabelCol = w;
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
    deleteHabitName.title = habit.name;

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