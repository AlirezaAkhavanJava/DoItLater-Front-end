// --- Types & Interfaces ---

type HabitColor = 'blue' | 'green' | 'orange' | 'red';

interface Habit {
    id: number;
    name: string;
    color: HabitColor;
    streak: number;
    weeklyTotal: number;
    history: boolean[]; 
}

// --- State Management ---

let currentStartDate = new Date();
currentStartDate.setDate(currentStartDate.getDate() - 10); 

let habits: Habit[] = [
    {
        id: 1,
        name: 'Meditation',
        color: 'blue',
        streak: 12,
        weeklyTotal: 7,
        history: [true, true, true, false, true, true, true, true, true, true, false, false, false, false]
    },
    {
        id: 2,
        name: 'Exercise',
        color: 'green',
        streak: 14,
        weeklyTotal: 5,
        history: [true, true, true, true, true, false, true, true, true, true, false, false, false, false]
    },
    {
        id: 3,
        name: 'Get 8h sleep',
        color: 'orange',
        streak: 20,
        weeklyTotal: 20,
        history: [true, true, true, true, true, true, true, true, true, true, false, false, false, false]
    },
    {
        id: 4,
        name: 'Reading 5 pages',
        color: 'red',
        streak: 11,
        weeklyTotal: 2,
        history: [true, true, false, true, true, true, true, false, true, true, false, false, false, false]
    }
];

// --- DOM Elements ---

const habitsListEl = document.getElementById('habits-list') as HTMLDivElement;
const daysHeaderRow = document.getElementById('days-header-row') as HTMLDivElement;
const dateRangeDisplay = document.getElementById('date-range-display') as HTMLSpanElement;
const prevWeekBtn = document.getElementById('prev-week') as HTMLButtonElement;
const nextWeekBtn = document.getElementById('next-week') as HTMLButtonElement;

// --- Helper Functions ---

const formatDayLabel = (date: Date): { day: string, date: string } => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
        day: days[date.getDay()],
        date: date.getDate().toString()
    };
};

const isDateToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

// --- Render Functions ---

const renderHeader = () => {
    daysHeaderRow.innerHTML = '';
    
    const endDate = new Date(currentStartDate);
    endDate.setDate(currentStartDate.getDate() + 13);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    dateRangeDisplay.textContent = `${currentStartDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${endDate.getFullYear()}`;

    for (let i = 0; i < 14; i++) {
        const currentDate = new Date(currentStartDate);
        currentDate.setDate(currentStartDate.getDate() + i);
        
        const { day, date } = formatDayLabel(currentDate);
        
        const dayEl = document.createElement('div');
        dayEl.className = 'day-label';
        
        const isToday = isDateToday(currentDate);
        dayEl.innerHTML = `
            <span style="font-weight:600; color:${isToday ? '#fff' : '#888'}">${day}</span>
            <span style="color:${isToday ? '#fff' : '#888'}">${date}</span>
        `;
        daysHeaderRow.appendChild(dayEl);
    }
};

const renderHabits = () => {
    habitsListEl.innerHTML = '';

    habits.forEach((habit) => {
        const row = document.createElement('div');
        row.className = 'habit-row';

        const infoCol = document.createElement('div');
        infoCol.className = 'habit-info';
        infoCol.innerHTML = `
            <span class="drag-handle">⣿</span>
            <div class="color-dot" style="background-color: var(--color-${habit.color})"></div>
            <span class="habit-name">${habit.name}</span>
        `;

        const statsCol = document.createElement('div');
        statsCol.className = 'habit-stats';
        statsCol.innerHTML = `
            <div class="stat-item"><span class="stat-icon">🏆</span> ${habit.streak}</div>
            <div class="stat-item" style="color: #f0ad4e"><span class="stat-icon">🔥</span> ${habit.weeklyTotal}</div>
        `;

        const daysGrid = document.createElement('div');
        daysGrid.className = 'habit-days-grid';

        habit.history.forEach((isDone, index) => {
            const currentDate = new Date(currentStartDate);
            currentDate.setDate(currentStartDate.getDate() + index);
            
            const check = document.createElement('div');
            check.className = `day-check ${isDone ? 'checked ' + habit.color : ''}`;
            
            if (isDateToday(currentDate)) {
                check.classList.add('today');
            }

            check.onclick = () => toggleHabit(habit.id, index, check, habit.color);

            daysGrid.appendChild(check);
        });

        row.appendChild(infoCol);
        row.appendChild(statsCol);
        row.appendChild(daysGrid);

        habitsListEl.appendChild(row);
    });
};

// --- Interaction Logic ---

function toggleHabit(habitId: number, dayIndex: number, element: HTMLElement, color: HabitColor) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    habit.history[dayIndex] = !habit.history[dayIndex];
    const isNowDone = habit.history[dayIndex];

    if (isNowDone) {
        element.classList.add('checked', color as string);
    } else {
        element.classList.remove('checked', color as string);
    }
}

// --- Event Listeners ---

prevWeekBtn.addEventListener('click', () => {
    currentStartDate.setDate(currentStartDate.getDate() - 7);
    renderHeader();
    renderHabits();
});

nextWeekBtn.addEventListener('click', () => {
    currentStartDate.setDate(currentStartDate.getDate() + 7);
    renderHeader();
    renderHabits();
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderHabits();
});