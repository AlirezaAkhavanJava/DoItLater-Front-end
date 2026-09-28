/* ============================================================
 *  DoItLater — shared theme controller (v3)
 *  3-theme cycle:  90s  →  hana  →  abyss  →  90s
 *
 *  - Drop-in replacement for the old 2-theme version
 *  - Same storage key, same [data-theme-toggle] API
 *  - Loads abyss-theme.css + abyss-theme.js on demand
 *  - NO HTML or themes.css changes required
 * ============================================================ */
(function () {
    'use strict';

    var STORAGE_KEY = 'doitlater.theme';
    var THEMES = ['90s', 'hana', 'abyss'];

    var root     = document.documentElement;
    var scriptEl = document.currentScript;
    var DEFAULT_THEME = (scriptEl && scriptEl.dataset.defaultTheme) || '90s';
    if (THEMES.indexOf(DEFAULT_THEME) === -1) DEFAULT_THEME = '90s';

    /* ---------- Resolve paths relative to this script ---------- */
    var themesRoot, asciiBase;
    try {
        // .../Global/Themes/Js/themes.js  →  .../Global/Themes/
        themesRoot = new URL('../', scriptEl.src).href;
        // .../assets/ascii/   (project-root relative)
        asciiBase  = new URL('../../../assets/ascii/', scriptEl.src).href;
    } catch (e) {
        themesRoot = '/Global/Themes/';
        asciiBase  = '/assets/ascii/';
    }
    window.__ABYSS_BASE__ = asciiBase;

    /* ---------- Inject abyss-theme.css once, after themes.css ---------- */
    if (!document.getElementById('abyss-theme-css')) {
        var cssLink = document.createElement('link');
        cssLink.id   = 'abyss-theme-css';
        cssLink.rel  = 'stylesheet';
        cssLink.href = themesRoot + 'Css/abyss-theme.css';
        (document.head || document.getElementsByTagName('head')[0])
            .appendChild(cssLink);
    }

    /* ---------- Storage ---------- */
    function readSaved() {
        try {
            var v = window.localStorage.getItem(STORAGE_KEY);
            return THEMES.indexOf(v) !== -1 ? v : null;
        } catch (e) { return null; }
    }
    function persist(t) {
        try { window.localStorage.setItem(STORAGE_KEY, t); } catch (e) {}
    }

    /* ---------- Apply BEFORE paint (avoids FOUC) ---------- */
    root.setAttribute('data-theme', readSaved() || DEFAULT_THEME);

    /* ---------- Labels & order ---------- */
    function labelFor(t) {
        if (t === '90s')   return "90's";
        if (t === 'hana')  return 'Hana';
        if (t === 'abyss') return 'Abyss';
        return t;
    }
    function currentTheme() {
        return root.getAttribute('data-theme') || DEFAULT_THEME;
    }
    function nextTheme(t) {
        var i = THEMES.indexOf(t);
        return THEMES[(i + 1) % THEMES.length];
    }

    function updateButton(t) {
        var btns = document.querySelectorAll('[data-theme-toggle]');
        if (!btns.length) return;
        var cur  = t || currentTheme();
        var next = nextTheme(cur);
        for (var i = 0; i < btns.length; i++) {
            btns[i].textContent = 'Theme: ' + labelFor(cur);
            btns[i].title       = 'Switch to ' + labelFor(next) + ' theme';
            btns[i].setAttribute('aria-label', 'Switch to ' + labelFor(next) + ' theme');
        }
    }

    /* ---------- Lazy-load abyss-theme.js exactly once ---------- */
    var abyssJsLoaded  = false;
    var abyssJsLoading = false;
    var abyssQueue     = [];

    function loadAbyssJs(cb) {
        if (cb) abyssQueue.push(cb);

        if (abyssJsLoaded) {
            flushAbyssQueue();
            return;
        }
        if (abyssJsLoading) return;

        abyssJsLoading = true;
        var s = document.createElement('script');
        s.id  = 'abyss-theme-js';
        s.src = themesRoot + 'Js/abyss-theme.js';
        s.onload = s.onerror = function () {
            abyssJsLoaded  = true;
            abyssJsLoading = false;
            flushAbyssQueue();
        };
        document.head.appendChild(s);
    }

    function flushAbyssQueue() {
        var q = abyssQueue.slice();
        abyssQueue.length = 0;
        for (var i = 0; i < q.length; i++) {
            try { q[i] && q[i](); } catch (e) { /* ignore */ }
        }
    }

    /* ---------- Abyss mount / unmount ---------- */
    function mountAbyss() {
        loadAbyssJs(function () {
            if (window.AbyssTheme && window.AbyssTheme.mount) {
                window.AbyssTheme.mount();
            }
        });
    }
    function unmountAbyss() {
        if (window.AbyssTheme && window.AbyssTheme.unmount) {
            window.AbyssTheme.unmount();
        }
    }

    /* ---------- Apply ---------- */
    function applyTheme(t) {
        if (THEMES.indexOf(t) === -1) return;
        root.setAttribute('data-theme', t);
        persist(t);
        updateButton(t);

        if (t === 'abyss') mountAbyss();
        else                unmountAbyss();

        document.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: t }
        }));
    }

    function toggleTheme() {
        applyTheme(nextTheme(currentTheme()));
    }

    /* ---------- Bind every [data-theme-toggle] ---------- */
    function bindButtons() {
        var btns = document.querySelectorAll('[data-theme-toggle]');
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].dataset.themeBound === '1') continue;
            btns[i].dataset.themeBound = '1';
            btns[i].addEventListener('click', toggleTheme);
        }
        updateButton();

        // If the page opens directly on abyss, mount now
        if (currentTheme() === 'abyss') mountAbyss();
    }

    /* ---------- Cross-tab sync ---------- */
    window.addEventListener('storage', function (e) {
        if (e.key !== STORAGE_KEY) return;
        if (THEMES.indexOf(e.newValue) === -1) return;
        root.setAttribute('data-theme', e.newValue);
        updateButton(e.newValue);
        if (e.newValue === 'abyss') mountAbyss();
        else                        unmountAbyss();
    });

    /* ---------- Boot ---------- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindButtons);
    } else {
        bindButtons();
    }

    /* ---------- Public API (same shape as before) ---------- */
    window.DoItLaterTheme = {
        THEMES:  THEMES.slice(),
        current: currentTheme,
        apply:   applyTheme,
        toggle:  toggleTheme
    };
})();