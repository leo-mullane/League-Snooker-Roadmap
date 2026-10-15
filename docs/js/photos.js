/* ==========================================================================
   photos.js — photography and illustrated placeholders (design round, V2)

   The live site has very little photography of its own. The one usable
   image, the championship venue, is hotlinked from leaguesnooker.co.uk and
   applied only once it has loaded; everywhere else the placeholder shows a to-scale
   snooker table drawn by tools/gen-tables.py (src/assets/table-*.svg). Photography © UK League
   Snooker. Remove this file and theme.css to return to the greyscale pack.
   ========================================================================== */
(function () {
  'use strict';

  var BASE = 'https://www.leaguesnooker.co.uk/';
  var PHOTOS = [
    { sel: '[data-photo="landywood"]', src: BASE + 'Assets/Fireworks/Landywood.jpg', alt: 'Snooker tables at Landywood Snooker Club, Walsall' }
  ];

  function apply(el, p) {
    var img = new Image();
    img.onload = function () {
      el.classList.add('has-photo');
      el.style.backgroundImage = 'url("' + p.src + '")';
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', p.alt);
    };
    img.src = p.src;
  }

  function initials(name) {
    return String(name || '').split(/\s+/).filter(Boolean).map(function (w) { return w.charAt(0); }).slice(0, 2).join('').toUpperCase();
  }

  function run() {
    /* Labels move into a caption chip drawn by theme.css. Each placeholder gets one of
       three table layouts (from tools/gen-tables.py), and tall boxes get the table
       turned on its end so it fills them. */
    var LAYOUTS = ['break', 'frame', 'clearance'], n = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.wf-placeholder'), function (el) {
      if (!el.hasAttribute('data-label')) el.setAttribute('data-label', el.textContent.trim());
      if (el.matches('.avatar, .league-logo, .logo') || el.closest('.sponsor-slot')) return;
      el.setAttribute('data-layout', LAYOUTS[n++ % LAYOUTS.length]);
      var r = el.getBoundingClientRect();
      if (r.width && r.height > r.width * 1.05) el.setAttribute('data-orient', 'portrait');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.wf-placeholder.league-logo'), function (el) {
      var name = document.getElementById('pv-name');
      el.textContent = name && name.textContent ? initials(name.textContent.replace(/&|and|district|snooker|league/gi, ' ')) || 'C&D' : 'C&D';
    });
    var pl = document.getElementById('pl-name');
    if (pl) Array.prototype.forEach.call(document.querySelectorAll('.profile-head .avatar'), function (el) { el.textContent = initials(pl.textContent); });
    PHOTOS.forEach(function (p) { Array.prototype.forEach.call(document.querySelectorAll(p.sel), function (el) { apply(el, p); }); });
  }

  /* After league.js has filled in names */
  document.addEventListener('DOMContentLoaded', function () { window.setTimeout(run, 0); });
})();
