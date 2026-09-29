/* ============================================================
   DoItLater — Landing page interactions
   - Logo click ripple
   - Mouse parallax on logo (desktop only)
   - Keyboard shortcuts: 1 → Tasks, 2 → Habits, T → Theme
   ============================================================ */

(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;

    const logoWrap = document.getElementById('logoWrap');

    /* ---------------------------------------------------------
     * Logo: click ripple + keyboard activation
     * --------------------------------------------------------- */
    if (logoWrap) {
        const triggerPulse = () => {
            logoWrap.classList.remove('pulse');
            void logoWrap.offsetWidth; // force reflow to restart animation
            logoWrap.classList.add('pulse');
        };

        logoWrap.addEventListener('click', triggerPulse);
        logoWrap.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerPulse();
            }
        });
    }

    /* ---------------------------------------------------------
     * Mouse parallax (desktop, no reduced motion)
     * Applied to .logo-wrap so it doesn't fight the float
     * animation on the inner SVG.
     * --------------------------------------------------------- */
    if (logoWrap && !prefersReducedMotion && !isTouch) {
        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;

        document.addEventListener('mousemove', (e) => {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            targetX = (e.clientX - cx) / cx; // -1 .. 1
            targetY = (e.clientY - cy) / cy;
        });

        document.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;
        });

        const tick = () => {
            currentX += (targetX - currentX) * 0.08;
            currentY += (targetY - currentY) * 0.08;

            const rotY = currentX * 16;
            const rotX = -currentY * 16;
            const tx = currentX * 6;
            const ty = currentY * 6;

            logoWrap.style.transform =
                `translate3d(${tx}px, ${ty}px, 0) ` +
                `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;

            requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    }

    /* ---------------------------------------------------------
     * Keyboard shortcuts
     *   1  → Task Tracker
     *   2  → Habit Tracker
     *   T  → Toggle theme
     * --------------------------------------------------------- */
    document.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const key = e.key.toLowerCase();

        if (key === '1') {
            e.preventDefault();
            window.location.href = '../Feature/Task_Tracking_Feature/task-tracker.html';
        } else if (key === '2') {
            e.preventDefault();
            window.location.href = '../Feature/Habit_Tracking_Feature/Dashboard/Habit_Dash.html';
        } else if (key === 't') {
            e.preventDefault();
            const toggle = document.querySelector('[data-theme-toggle]');
            if (toggle) toggle.click();
        }
    });

})();