// ============================================================
//  Domain + API types (JSDoc only — no runtime code needed)
// ============================================================

/**
 * @typedef {'blue' | 'green' | 'orange' | 'red'} HabitColor
 */

/**
 * @typedef {'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'} HabitPriority
 */

/**
 * @typedef {Object} HabitEntryDto
 * @property {number} id
 * @property {string} entryDate
 * @property {boolean} completed
 * @property {string | null} note
 */

/**
 * @typedef {Object} HabitDto
 * @property {number} id
 * @property {string} name
 * @property {string | null} description
 * @property {HabitPriority} priority
 * @property {string} createdDate
 * @property {HabitEntryDto[]} entries
 * @property {number} completedCount
 * @property {number} totalDays
 * @property {number} completionRate
 */

/**
 * @typedef {Object} WeekGridDto
 * @property {string} weekStart
 * @property {string} weekEnd
 * @property {string} dateRangeDisplay
 * @property {string[]} days
 * @property {HabitDto[]} habits
 */

/**
 * @typedef {Object} CreateHabitRequestDto
 * @property {string} name
 * @property {HabitPriority} priority
 * @property {string | null} [description]
 */

/**
 * @typedef {Object} ToggleHabitEntryRequestDto
 * @property {string} entryDate
 * @property {boolean} completed
 * @property {string | null} [note]
 */

/**
 * @typedef {Object} Habit
 * @property {number} id
 * @property {string} name
 * @property {string | null} description
 * @property {HabitColor} color
 * @property {HabitPriority} priority
 * @property {number} streak
 * @property {number} weeklyTotal
 * @property {boolean[]} history
 */

export {};