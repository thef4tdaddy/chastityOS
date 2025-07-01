// src/event_types.js

/**
 * Definitions for all event types, with metadata for filtering.
 * `userSelectable`: determines if it appears in the Log Event form.
 * `mode`: 'kinky' for events hidden in 'vanilla' mode.
 */
export const EVENT_TYPE_DEFINITIONS = [
    { name: "Orgasm (Self)", mode: 'kinky', userSelectable: true },
    { name: "Orgasm (Partner)", mode: 'kinky', userSelectable: true },
    { name: "Ruined Orgasm", mode: 'kinky', userSelectable: true },
    { name: "Edging", mode: 'kinky', userSelectable: true },
    { name: "Tease & Denial", mode: 'kinky', userSelectable: true },
    { name: "Play Session", mode: 'kinky', userSelectable: true },
    { name: "Hygiene", mode: 'vanilla', userSelectable: true },
    { name: "Medication", mode: 'vanilla', userSelectable: true },
    { name: "Mood Entry", mode: 'vanilla', userSelectable: true },
    // "Session Edit" is logged programmatically and is not a user option
    { name: "Session Edit", mode: 'vanilla', userSelectable: false }
];

// --- New categorized reasons ---
export const REMOVAL_REASON_OPTIONS = [
    'Orgasm',
    'Medical',
    'Travel',
    'Other'
];

export const PAUSE_REASON_OPTIONS = [
    'Cleaning',
    'Medical',
    'Exercise',
    'Other'
];
