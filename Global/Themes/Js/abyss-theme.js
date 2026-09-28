/* ============================================================
 *  abyss-theme.js
 *  Passive helper — mounted / unmounted by themes.js.
 *  No theme switching logic here.
 * ============================================================ */
(function () {
    'use strict';

    var ASCII_BASE = window.__ABYSS_BASE__ || '/assets/ascii/';
    var LAYER_ID   = 'abyss-ascii-layer';

    var asciiCache   = Object.create(null);
    var mouseHandler = null;
    var leaveHandler = null;

    /* ---------- Fetch + cache each ASCII file once ---------- */
    function loadAscii(name) {
        if (asciiCache[name]) return asciiCache[name];
        var p = fetch(ASCII_BASE + name + '.txt', { cache: 'force-cache' })
            .then(function (r) {
                if (!r.ok) throw new Error('ASCII fetch ' + r.status);
                return r.text();
            })
            .catch(function () { return ''; });
        asciiCache[name] = p;
        return p;
    }

    /* ---------- Mount ---------- */
    function mount() {
        if (!document.body) return;
        if (document.getElementById(LAYER_ID)) return;  // already mounted

        var layer = document.createElement('div');
        layer.id = LAYER_ID;
        layer.setAttribute('aria-hidden', 'true');
        layer.innerHTML =
            '<pre class="abyss-ascii abyss-ascii-eye"  data-ascii="abyss-eye"></pre>' +
            '<pre class="abyss-ascii abyss-ascii-hand" data-ascii="demon-hand"></pre>' +
            '<div class="abyss-eye" id="abyssEye">' +
            '  <div class="abyss-pupil" id="abyssPupil"></div>' +
            '</div>';
        document.body.appendChild(layer);

        /* Fill the <pre> blocks with the real ASCII text */
        var pres = layer.querySelectorAll('.abyss-ascii');
        for (var i = 0; i < pres.length; i++) {
            (function (pre) {
                var name = pre.dataset.ascii;
                if (!name) return;
                loadAscii(name).then(function (txt) {
                    if (txt) pre.textContent = txt;
                });
            })(pres[i]);
        }

        /* Cursor-tracking eye */
        var pupil = layer.querySelector('#abyssPupil');
        var eye   = layer.querySelector('#abyssEye');
        if (pupil && eye) {
            var maxShift = 14;
            mouseHandler = function (e) {
                var r  = eye.getBoundingClientRect();
                var cx = r.left + r.width  / 2;
                var cy = r.top  + r.height / 2;
                var dx = e.clientX - cx;
                var dy = e.clientY - cy;
                var ang  = Math.atan2(dy, dx);
                var dist = Math.min(maxShift, Math.hypot(dx, dy) / 14);
                pupil.style.transform =
                    'translate(calc(-50% + ' + (Math.cos(ang) * dist) + 'px),' +
                    ' calc(-50% + ' + (Math.sin(ang) * dist) + 'px))';
            };
            leaveHandler = function () {
                pupil.style.transform = 'translate(-50%, -50%)';
            };
            document.addEventListener('mousemove',  mouseHandler);
            document.addEventListener('mouseleave', leaveHandler);
        }
    }

    /* ---------- Unmount ---------- */
    function unmount() {
        var layer = document.getElementById(LAYER_ID);
        if (layer && layer.parentNode) layer.parentNode.removeChild(layer);

        if (mouseHandler) document.removeEventListener('mousemove',  mouseHandler);
        if (leaveHandler) document.removeEventListener('mouseleave', leaveHandler);
        mouseHandler = leaveHandler = null;
    }

    window.AbyssTheme = { mount: mount, unmount: unmount };
})();