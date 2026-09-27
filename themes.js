/* ============================================================
 *  DoItLater — shared theme controller
 *  Switches between the "90's" and "Hana" themes.
 *  Persists the choice in localStorage so both apps
 *  (Task Tracker + Habit Tracker) stay in sync.
 *
 *  The toggle <button> is written directly in each HTML:
 *      <button type="button" class="theme-toggle" data-theme-toggle></button>
 *
 *  theme.js only wires it up — it does NOT create or move it.
 * ============================================================ */
(function () {
    'use strict';

    var STORAGE_KEY = 'doitlater.theme';
    var THEMES = ['90s', 'hana'];

    var root = document.documentElement;
    var scriptEl = document.currentScript;
    var DEFAULT_THEME = (scriptEl && scriptEl.dataset.defaultTheme) || '90s';
    if (THEMES.indexOf(DEFAULT_THEME) === -1) DEFAULT_THEME = '90s';

    /* ---------------------------------------------------------
     *  Storage
     * --------------------------------------------------------- */
    function readSaved() {
        try {
            var v = window.localStorage.getItem(STORAGE_KEY);
            return THEMES.indexOf(v) !== -1 ? v : null;
        } catch (e) {
            return null;
        }
    }

    function persist(theme) {
        try {
            window.localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) { /* ignore */ }
    }

    /* ---------------------------------------------------------
     *  Apply theme as early as possible (avoids FOUC)
     * --------------------------------------------------------- */
    root.setAttribute('data-theme', readSaved() || DEFAULT_THEME);

    /* ---------------------------------------------------------
     *  Public API
     * --------------------------------------------------------- */
    function currentTheme() {
        return root.getAttribute('data-theme') || DEFAULT_THEME;
    }

    function labelFor(theme) {
        return theme === '90s' ? "90's" : 'Hana';
    }

    function updateButton(theme) {
        var btns = document.querySelectorAll('[data-theme-toggle]');
        if (!btns.length) return;

        var t = theme || currentTheme();
        var next = t === '90s' ? 'Hana' : "90's";

        for (var i = 0; i < btns.length; i++) {
            var b = btns[i];
            b.textContent = 'Theme: ' + labelFor(t);
            b.title = 'Switch to ' + next + ' theme';
            b.setAttribute('aria-label', 'Switch to ' + next + ' theme');
        }
    }

    function applyTheme(theme) {
        if (THEMES.indexOf(theme) === -1) return;
        root.setAttribute('data-theme', theme);
        persist(theme);
        updateButton(theme);
        document.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: theme }
        }));
    }

    function toggleTheme() {
        applyTheme(currentTheme() === '90s' ? 'hana' : '90s');
    }

    /* ---------------------------------------------------------
     *  Wire up any existing [data-theme-toggle] buttons
     * --------------------------------------------------------- */
    function bindButtons() {
        var btns = document.querySelectorAll('[data-theme-toggle]');
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].dataset.themeBound === '1') continue;
            btns[i].dataset.themeBound = '1';
            btns[i].addEventListener('click', toggleTheme);
        }
        updateButton();
    }

    /* ---------------------------------------------------------
     *  Cross-tab sync
     * --------------------------------------------------------- */
    window.addEventListener('storage', function (e) {
        if (e.key !== STORAGE_KEY) return;
        if (THEMES.indexOf(e.newValue) === -1) return;
        root.setAttribute('data-theme', e.newValue);
        updateButton(e.newValue);
    });

    /* ---------------------------------------------------------
     *  Boot
     * --------------------------------------------------------- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindButtons);
    } else {
        bindButtons();
    }

    window.DoItLaterTheme = {
        THEMES: THEMES.slice(),
        current: currentTheme,
        apply: applyTheme,
        toggle: toggleTheme
    };
})();