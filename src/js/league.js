/* ==========================================================================
   league.js — League Snooker prototype behaviour (V1)

   Every page is driven by ids and data attributes; a page only runs the parts
   whose hosts it contains. Data comes from data.js (sample data, see its
   header). Context is carried between pages with ?query parameters, with a
   sessionStorage fallback for hosts that strip query strings.
   ========================================================================== */
(function () {
  'use strict';

  var LS = window.LS || {};
  var P = LS.players || {};
  var TODAY = new Date((LS.today || '2026-10-15') + 'T12:00:00');
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var NIGHTS = { Mon: 'Mondays', Tue: 'Tuesdays', Wed: 'Wednesdays', Thu: 'Thursdays', Fri: 'Fridays', Sat: 'Saturdays', Sun: 'Sundays' };

  /* --- Helpers ----------------------------------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function d(iso) { return new Date(iso + 'T12:00:00'); }
  function shortDate(iso) { var x = d(iso); return DAYS[x.getDay()] + ' ' + x.getDate() + ' ' + MONTHS[x.getMonth()]; }
  function longDate(iso) { var x = d(iso); return DAYS_LONG[x.getDay()] + ' ' + x.getDate() + ' ' + MONTHS_LONG[x.getMonth()]; }
  function fullDate(iso) { var x = d(iso); return x.getDate() + ' ' + MONTHS_LONG[x.getMonth()] + ' ' + x.getFullYear(); }
  function pct(a, b) { return b ? Math.round(100 * a / b) + '%' : '–'; }
  function store(k, v) { try { if (v === undefined) return JSON.parse(window.sessionStorage.getItem(k) || 'null'); window.sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } return v; }
  function page() { return (window.location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index'; }
  function rel(path) { return (page() === 'index' ? 'pages/' : '') + path; }

  function param(name) {
    var v = null;
    try { v = new URLSearchParams(window.location.search).get(name); } catch (e) { v = null; }
    if (v) return v;
    var saved = store('ls-q');
    if (saved && saved.file === page() + '.html') { try { return new URLSearchParams(saved.q).get(name); } catch (e) { return null; } }
    return null;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href.indexOf('?') !== -1) store('ls-q', { file: href.split('?')[0].split('/').pop(), q: href.split('?')[1].split('#')[0] });
    else if (href.charAt(0) !== '#') store('ls-q', null);
  }, true);

  var toastTimer = null;
  function toast(msg) {
    var t = $('#ls-toast');
    if (!t) { t = document.createElement('div'); t.id = 'ls-toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { t.hidden = true; }, 2800);
  }

  /* Modals created or opened from rendered content */
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
    var p = m.querySelector('.wf-modal-panel');
    if (p) { p.setAttribute('tabindex', '-1'); p.focus(); }
  }
  function closeModal(m) { m.classList.remove('open'); document.body.style.overflow = ''; }
  document.addEventListener('click', function (e) {
    var o = e.target.closest && e.target.closest('[data-open-modal]');
    if (o) { e.preventDefault(); openModal(o.getAttribute('data-open-modal')); return; }
    var m = e.target.classList && e.target.classList.contains('wf-modal') ? e.target : null;
    if (m || (e.target.classList && e.target.classList.contains('wf-modal-close'))) closeModal(m || e.target.closest('.wf-modal'));
  });
  function modal(id, title, body) {
    var m = document.getElementById(id);
    if (!m) { m = document.createElement('div'); m.className = 'wf-modal'; m.id = id; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); document.body.appendChild(m); }
    m.setAttribute('aria-label', title);
    m.innerHTML = '<div class="wf-modal-panel"><button type="button" class="wf-modal-close" aria-label="Close">×</button><h2>' + esc(title) + '</h2>' + body + '</div>';
    return m;
  }

  function copyText(text, btn) {
    function done(msg) { if (btn) { var o = btn.textContent; btn.textContent = msg; window.setTimeout(function () { btn.textContent = o; }, 1800); } }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done('Copied'); }, function () { done('Select and copy'); });
    else done('Select and copy');
  }

  /* --- Data access ------------------------------------------------------- */
  var FIX = LS.fixtures || [];
  function fixture(id) { for (var i = 0; i < FIX.length; i++) if (FIX[i].id === id) return FIX[i]; return null; }
  function divOf(team) { return (LS.div['1'] || []).indexOf(team) !== -1 ? 1 : 2; }
  function league(id) { var l = LS.leagues || []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function club(id) { var c = LS.clubs || []; for (var i = 0; i < c.length; i++) if (c[i].id === id) return c[i]; return null; }
  function clubOfTeam(team) { var c = LS.clubs || []; for (var i = 0; i < c.length; i++) if (c[i].teams.indexOf(team) !== -1) return c[i]; return null; }
  function results() { return FIX.filter(function (f) { return f.status === 'result'; }); }
  function lastWeek(div) { var w = 0; FIX.forEach(function (f) { if (f.status === 'result' && (!div || f.div === div)) w = Math.max(w, f.week); }); return w; }
  function thisWeek() { var w = 99; FIX.forEach(function (f) { if (d(f.date) >= TODAY) w = Math.min(w, f.week); }); return w; }
  function weekDate(w) { for (var i = 0; i < FIX.length; i++) if (FIX[i].week === w) return FIX[i].date; return null; }
  function playerLink(id, opts) {
    var p = P[id]; if (!p) return esc(id);
    var name = p.name;
    if (privacy() === 'initials') name = p.name.split(' ')[0].charAt(0) + '. ' + p.name.split(' ').slice(1).join(' ');
    return '<a href="' + rel('player.html?p=' + encodeURIComponent(id)) + '">' + esc(name) + '</a>' + (opts && opts.hcp && p.hcp !== null && p.hcp !== undefined ? ' <span class="hcp">Hcp ' + (p.hcp > 0 ? '+' : p.hcp < 0 ? '−' : '') + Math.abs(p.hcp) + '</span>' : '');
  }
  function teamLink(t) { return '<a href="' + rel('tables.html?team=' + encodeURIComponent(t) + '&div=' + divOf(t)) + '">' + esc(t) + '</a>'; }
  function brk(b) { return '<span class="brk' + (b >= 147 ? ' max' : b >= 100 ? ' century' : '') + '">' + b + '</span>'; }
  function hb(v) { return v ? brk(v) : '<span class="dash" aria-label="No break recorded">–</span>'; }

  /* Follows (teams and players), shared across pages for the session */
  function follows() { return store('ls-follow') || { teams: [], players: [] }; }
  function setFollows(f) { store('ls-follow', f); syncFollow(); }
  function myTeam() { var f = follows(); return f.teams[0] || null; }
  function privacy() { return (store('ls-privacy') || 'full'); }
  function toggleFollow(kind, id) {
    var f = follows(); var list = kind === 'team' ? f.teams : f.players; var i = list.indexOf(id);
    if (i === -1) list.push(id); else list.splice(i, 1);
    setFollows(f);
    toast(i === -1 ? 'Following ' + (kind === 'team' ? id : (P[id] ? P[id].name : id)) + '. We will let you know when results are in.' : 'Unfollowed');
  }
  function syncFollow() {
    var f = follows();
    $all('[data-follow]').forEach(function (b) {
      var kind = b.getAttribute('data-follow'), id = b.getAttribute('data-follow-id');
      var on = (kind === 'team' ? f.teams : f.players).indexOf(id) !== -1;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? 'Following' : (b.getAttribute('data-label') || 'Follow');
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-follow]');
    if (b) { toggleFollow(b.getAttribute('data-follow'), b.getAttribute('data-follow-id')); return; }
    var o = e.target.closest && e.target.closest('[data-follow-open]');
    if (o) {
      var opts = (LS.div['1'].concat(LS.div['2'])).map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('');
      modal('follow-modal', 'Follow a team', '<p>We will show your team first across the league pages and tell you when its results are in. You can change this in <a href="' + rel('account.html') + '">your alerts</a>.</p><div class="field"><label for="follow-team">Team</label><select id="follow-team">' + opts + '</select></div><button type="button" class="btn" id="follow-go">Follow team</button>');
      openModal('follow-modal');
      $('#follow-go').addEventListener('click', function () {
        var t = $('#follow-team').value; var f = follows();
        if (f.teams.indexOf(t) === -1) f.teams.unshift(t);
        setFollows(f); closeModal($('#follow-modal')); toast('Following ' + t); refreshAll();
      });
    }
  });

  /* Pages register a render function here so following a team refreshes them */
  var renderers = [];
  function onRender(fn) { renderers.push(fn); fn(); }
  function refreshAll() { renderers.forEach(function (fn) { fn(); }); syncFollow(); }

  /* Division switch (R21), remembered for the session */
  function divSwitch(host, cb, prefer) {
    if (!host) return;
    var cur = parseInt(param('div') || prefer || store('ls-div') || (myTeam() ? divOf(myTeam()) : 1), 10);
    host.innerHTML = '<div class="seg" role="group" aria-label="Division"><button type="button" data-div="1">Division 1</button><button type="button" data-div="2">Division 2</button></div>';
    function set(n) {
      cur = n; store('ls-div', n);
      $all('button', host).forEach(function (b) { b.setAttribute('aria-pressed', String(parseInt(b.getAttribute('data-div'), 10) === n)); });
      cb(n);
    }
    host.addEventListener('click', function (e) { var b = e.target.closest('button[data-div]'); if (b) set(parseInt(b.getAttribute('data-div'), 10)); });
    set(cur);
    return function () { return cur; };
  }

  /* --- Hub tabs: mark the current one ------------------------------------ */
  function initHubTabs() {
    $all('.hub-tabs a[data-hub]').forEach(function (a) {
      if (a.getAttribute('data-hub').split(' ').indexOf(page()) !== -1) a.setAttribute('aria-current', 'page');
    });
  }

  /* ======================================================================
     1. Community home
     ====================================================================== */
  function initConsent() {
    var c = $('#consent'); if (!c) return;
    if (store('ls-consent')) return;
    c.hidden = false;
    c.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-consent]'); if (!b) return;
      var v = b.getAttribute('data-consent');
      if (v === 'choose') { $('#consent-choices').hidden = false; b.hidden = true; return; }
      store('ls-consent', v); c.hidden = true;
      toast(v === 'all' ? 'Thanks. Analytics cookies are on.' : 'Only essential cookies will be used.');
    });
  }

  function searchIndex() {
    var out = [];
    (LS.leagues || []).forEach(function (l) {
      out.push({ g: 'Leagues', t: l.name, s: l.sport + ' · ' + NIGHTS[l.night], h: l.id === 'cambridge' ? rel('league.html') : rel('leagues.html?focus=' + l.id) });
    });
    (LS.clubs || []).forEach(function (c) { out.push({ g: 'Clubs', t: c.name, s: c.postcode, h: rel('club.html?club=' + c.id) }); });
    LS.div['1'].concat(LS.div['2']).forEach(function (t) { out.push({ g: 'Teams', t: t, s: 'Cambridge & District · Div ' + divOf(t), h: rel('tables.html?team=' + encodeURIComponent(t) + '&div=' + divOf(t)) }); });
    Object.keys(P).forEach(function (k) { out.push({ g: 'Players', t: P[k].name, s: P[k].team, h: rel('player.html?p=' + k) }); });
    return out;
  }

  function initOmni() {
    var idx = null;
    $all('.omni').forEach(function (box0) {
      var input = $('input[type="search"]', box0); if (!input) return;
      var box = $('.omni-results', box0), active = -1, form = $('form', box0);
      function close() { box.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; }
      function render() {
        idx = idx || searchIndex();
        var q = input.value.trim().toLowerCase();
        if (q.length < 2) { close(); return; }
        var pc = q.toUpperCase().match(/^([A-Z]{1,2})\d/);
        var html = '';
        if (pc) html += '<div class="omni-group">Postcode</div><a href="' + rel('leagues.html?near=' + encodeURIComponent(input.value.trim().toUpperCase())) + '"><span>Leagues and clubs near ' + esc(input.value.trim().toUpperCase()) + '</span><small>Map</small></a>';
        ['Leagues', 'Clubs', 'Teams', 'Players'].forEach(function (g) {
          var hits = idx.filter(function (i) { return i.g === g && i.t.toLowerCase().indexOf(q) !== -1; }).slice(0, g === 'Players' ? 4 : 5);
          if (!hits.length) return;
          html += '<div class="omni-group">' + g + '</div>' + hits.map(function (i) { return '<a href="' + i.h + '"><span>' + esc(i.t) + '</span><small>' + esc(i.s) + '</small></a>'; }).join('');
        });
        box.innerHTML = html || '<p class="omni-empty">Nothing matches "' + esc(input.value) + '". Try a town, a club or a postcode such as CB1.</p>';
        box.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
      }
      input.addEventListener('input', render);
      input.addEventListener('focus', render);
      input.addEventListener('keydown', function (e) {
        var links = $all('a', box);
        if (e.key === 'Escape') { close(); return; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault(); if (!links.length) return;
          active = (active + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
          links.forEach(function (l, i) { l.classList.toggle('active', i === active); });
          links[active].scrollIntoView({ block: 'nearest' });
        }
        if (e.key === 'Enter' && active >= 0 && links[active]) { e.preventDefault(); links[active].click(); }
      });
      document.addEventListener('click', function (e) { if (!box0.contains(e.target)) close(); });
      if (form) form.addEventListener('submit', function (e) { e.preventDefault(); var first = $('a', box); if (first) first.click(); else render(); });
      $all('[data-omni-try]').forEach(function (b) { if (input.id !== 'omni-q') return; b.addEventListener('click', function () { input.value = b.getAttribute('data-omni-try'); input.focus(); render(); }); });
    });
  }

  /* --- Site header: current section, section sub-navigation, menu, search --- */
  function initSiteNav() {
    var nav = $('#site-nav'); if (!nav) return;
    var cur = page(), section = null;
    $all('.nav-item[data-pages]', nav).forEach(function (li) {
      if (li.getAttribute('data-pages').split(' ').indexOf(cur) !== -1) { section = li.getAttribute('data-section'); $('.nav-link', li).setAttribute('aria-current', 'true'); }
    });
    var sub = $('.section-nav');
    if (sub && section && !$('.league-head')) {
      var list = $('ul[data-section="' + section + '"]', sub);
      if (list) {
        sub.hidden = false;
        $all('ul', sub).forEach(function (u) { u.hidden = u !== list; });
        $all('a', list).forEach(function (a) { var h = a.getAttribute('href'); if (h.indexOf('#') === -1 && h.split('/').pop().split('?')[0] === cur + '.html') a.setAttribute('aria-current', 'page'); });
      }
    }
    var tog = $('.nav-toggle');
    if (tog) tog.addEventListener('click', function () { var open = nav.classList.toggle('open'); tog.setAttribute('aria-expanded', String(open)); tog.textContent = open ? 'Close' : 'Menu'; });
    var st = $('[data-search-toggle]'), panel = $('#site-search');
    if (st && panel) {
      st.addEventListener('click', function () {
        panel.hidden = !panel.hidden; st.setAttribute('aria-expanded', String(!panel.hidden));
        if (!panel.hidden) $('input', panel).focus();
        var h = $('header.sticky'); if (h) document.documentElement.style.setProperty('--header-h', h.offsetHeight + 'px');
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; st.setAttribute('aria-expanded', 'false'); st.focus(); } });
    }
  }

  function initHomeStats() {
    var host = $('#week-stats'); if (!host) return;
    var wk = lastWeek();
    var res = results().filter(function (f) { return f.week === wk; });
    var frames = res.reduce(function (a, f) { return a + f.hf + f.af; }, 0);
    var season = (LS.hall || []).filter(function (h) { return h.season === '2026/27'; });
    var top = (LS.hall || []).filter(function (h) { return h.season === '2026/27'; }).sort(function (a, b) { return b.b - a.b; })[0];
    host.innerHTML =
      '<div><b>87</b><span>leagues on the site</span></div>' +
      '<div><b>' + frames + '</b><span>frames entered in Cambridge &amp; District last week (sample: one league shown)</span></div>' +
      '<div><b>' + season.length + '</b><span>centuries so far this season, all leagues</span></div>' +
      '<div><b>' + (top ? top.b : '–') + '</b><span>highest break this season' + (top ? ', ' + esc(top.player) : '') + '</span></div>';
    var list = $('#latest-centuries');
    if (list) list.innerHTML = season.slice(0, 6).map(function (h) {
      return '<li class="result-item row between"><span>' + (h.pid ? playerLink(h.pid) : esc(h.player)) + '<br><small>' + esc(h.league) + '</small></span>' + brk(h.b) + '</li>';
    }).join('');
  }

  /* --- League finder (R12, R13) ------------------------------------------ */
  function initFinder() {
    var host = $('#finder'); if (!host) return;
    var listEl = $('#league-list'), map = $('#map-pins'), count = $('#finder-count'), pc = $('#near-q'), pcErr = $('#near-error');
    var origin = null, originLabel = '';
    var focus = param('focus');
    function setOrigin(code) {
      var c = String(code || '').toUpperCase().replace(/\s+/g, ' ').trim();
      var m = c.match(/^([A-Z]{1,2})\d/);
      var pos = m && LS.postcodes[m[1]];
      if (!pos) { origin = null; pcErr.hidden = !c; if (c) pcErr.textContent = 'We could not find "' + c + '". Try the first half of a postcode, such as CB1 or L18, or a town name below.'; return false; }
      pcErr.hidden = true; origin = pos; originLabel = c; return true;
    }
    function miles(l) { if (!origin) return null; var dx = l.x - origin[0], dy = l.y - origin[1]; return Math.round(Math.sqrt(dx * dx + dy * dy) * 6.5); }
    function checked(name) { return $all('input[name="' + name + '"]:checked', host).map(function (i) { return i.value; }); }
    function render() {
      var sports = checked('sport'), nights = checked('night'), fmt = checked('format'), extra = checked('extra');
      var radius = parseInt(($('#radius') || {}).value || '0', 10);
      var rows = (LS.leagues || []).filter(function (l) {
        if (sports.length && sports.indexOf(l.sport) === -1) return false;
        if (nights.length && nights.indexOf(l.night) === -1) return false;
        if (fmt.length && fmt.indexOf(l.format) === -1) return false;
        for (var i = 0; i < extra.length; i++) if (!l[extra[i]]) return false;
        if (origin && radius && miles(l) > radius) return false;
        return true;
      });
      if (origin) rows.sort(function (a, b) { return miles(a) - miles(b); }); else rows.sort(function (a, b) { return a.name.localeCompare(b.name); });
      count.textContent = rows.length + ' of ' + LS.leagues.length + ' sample leagues' + (origin ? ' near ' + originLabel : '') + ' (the live site lists 87)';
      listEl.innerHTML = rows.length ? rows.map(function (l) {
        var href = l.id === 'cambridge' ? rel('league.html') : '#';
        return '<article class="league-item' + (l.id === focus ? ' active' : '') + '" id="li-' + l.id + '" data-lid="' + l.id + '"><h3><a href="' + href + '">' + esc(l.name) + '</a></h3>' +
          '<div class="tags"><span class="tag">' + l.sport + '</span><span class="tag">' + NIGHTS[l.night] + '</span><span class="tag">' + l.format + '</span>' +
          (l.handicap ? '<span class="tag">Handicap</span>' : '') + (l.veterans ? '<span class="tag">Veterans</span>' : '') + (l.summer ? '<span class="tag">Summer</span>' : '') + '</div>' +
          '<small>' + esc(l.town) + ' · ' + l.region + (origin ? ' · about ' + miles(l) + ' miles' : '') + ' · ' + l.teams + ' teams, ' + l.divisions + ' division' + (l.divisions > 1 ? 's' : '') + '</small></article>';
      }).join('') : '<div class="empty-state"><p>No leagues match these filters. Try fewer filters or a bigger distance.</p></div>';
      map.innerHTML = (origin ? '<span class="pin you" style="left:' + origin[0] + '%;top:' + origin[1] + '%" title="' + esc(originLabel) + '"></span>' : '') +
        rows.map(function (l) { return '<button type="button" class="pin" style="left:' + l.x + '%;top:' + l.y + '%" data-lid="' + l.id + '" aria-label="' + esc(l.name) + '" aria-pressed="' + (l.id === focus) + '"></button>'; }).join('');
    }
    function select(id, scroll) {
      focus = id;
      $all('.league-item', listEl).forEach(function (el) { el.classList.toggle('active', el.getAttribute('data-lid') === id); });
      $all('.pin', map).forEach(function (p) { p.setAttribute('aria-pressed', String(p.getAttribute('data-lid') === id)); });
      var el = $('#li-' + id); if (el && scroll) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    host.addEventListener('change', render);
    map.addEventListener('click', function (e) { var p = e.target.closest('.pin[data-lid]'); if (p) select(p.getAttribute('data-lid'), true); });
    listEl.addEventListener('mouseover', function (e) { var it = e.target.closest('.league-item'); if (it) select(it.getAttribute('data-lid'), false); });
    listEl.addEventListener('click', function (e) { var a = e.target.closest('a[href="#"]'); if (a) { e.preventDefault(); toast('Only Cambridge & District is built out in this prototype.'); } });
    $('#near-form').addEventListener('submit', function (e) { e.preventDefault(); setOrigin(pc.value); render(); });
    $('#near-me').addEventListener('click', function () { pc.value = 'CB1 3EW'; setOrigin('CB1'); render(); toast('Sample location: Cambridge. The real site would ask your browser for permission first.'); });
    $('#clear-filters').addEventListener('click', function () { $all('input[type=checkbox]', host).forEach(function (i) { i.checked = false; }); render(); });
    var ft = $('#filters-toggle');
    if (ft) ft.addEventListener('click', function () { var f = $('.finder-filters'); var open = f.classList.toggle('open'); ft.setAttribute('aria-expanded', String(open)); });
    var near = param('near'); if (near) { pc.value = near; setOrigin(near); }
    render();
    if (focus) select(focus, true);
  }

  /* ======================================================================
     2. League hub
     ====================================================================== */
  function scoreCard(f) {
    var due = f.status === 'due';
    var best = 0;
    if (!due) f.games.forEach(function (g) { g.hb.concat(g.ab).forEach(function (b) { best = Math.max(best, b); }); });
    return '<article class="score-card' + (due ? ' due' : '') + '"><div class="meta"><span>Div ' + f.div + ' · Week ' + f.week + '</span><span>' + shortDate(f.date) + '</span></div>' +
      '<div class="teams"><div class="team">' + esc(f.home) + '</div><div class="score">' + (due ? 'v' : f.hf + ' – ' + f.af) + '</div><div class="team away">' + esc(f.away) + '</div></div>' +
      '<div class="foot">' + (due ? '<span class="status pending">Result due</span><a href="' + rel('submit-result.html?m=' + f.id) + '">Submit result</a>' :
        '<span>High break: ' + (best ? brk(best) : '<span class="dash">–</span>') + '</span><a href="' + rel('match.html?m=' + f.id) + '">Match card</a>') + '</div></article>';
  }
  function fxRow(f) {
    var mine = myTeam() && (f.home === myTeam() || f.away === myTeam());
    var mid = f.status === 'result' ? f.hf + ' – ' + f.af : 'v';
    var act = f.status === 'result' ? '<a href="' + rel('match.html?m=' + f.id) + '">Match card</a>' : f.status === 'due' ? '<span class="status pending">Result due</span> <a href="' + rel('submit-result.html?m=' + f.id) + '">Submit</a>' : '<span class="wf-meta">7.30pm</span>';
    var c = club(f.venue);
    return '<div class="fx' + (mine ? ' mine' : '') + '"><div class="home">' + teamLink(f.home) + '<span class="venue">' + (c ? '<a href="' + rel('club.html?club=' + c.id) + '">' + esc(c.name) + '</a>' : '') + '</span></div><div class="mid">' + mid + '</div><div class="away">' + teamLink(f.away) + '</div><div class="act">' + act + '</div></div>';
  }

  function tableHTML(div, opts) {
    opts = opts || {};
    var rows = LS.tables[String(div)] || [];
    if (opts.limit) rows = rows.slice(0, opts.limit);
    var hl = opts.team || myTeam();
    var wk = lastWeek(div);
    return '<div class="lt-wrap"><table class="lt"><caption>Division ' + div + ' · after week ' + wk + ' (' + shortDate(weekDate(wk)) + ') · ranked on frames won, as in this league\'s rules</caption>' +
      '<thead><tr><th scope="col">#</th><th scope="col">Team</th><th scope="col" class="n">P</th>' + (opts.limit ? '' : '<th scope="col" class="n hide-sm">W</th><th scope="col" class="n hide-sm">D</th><th scope="col" class="n hide-sm">L</th>') + '<th scope="col" class="n">F</th>' + (opts.limit ? '' : '<th scope="col" class="n hide-sm">A</th><th scope="col">Form</th>') + '</tr></thead><tbody>' +
      rows.map(function (r) {
        var mv = r.move > 0 ? '<span class="mv up" title="Up ' + r.move + ' since last week">▲' + r.move + '</span>' : r.move < 0 ? '<span class="mv down" title="Down ' + (-r.move) + ' since last week">▼' + (-r.move) + '</span>' : '';
        return '<tr' + (r.team === hl ? ' class="mine"' : '') + '><td class="n">' + r.pos + '</td><th scope="row" class="team-cell">' + teamLink(r.team) + mv + '</th><td class="n">' + r.p + '</td>' + (opts.limit ? '' : '<td class="n hide-sm">' + r.w + '</td><td class="n hide-sm">' + r.d + '</td><td class="n hide-sm">' + r.l + '</td>') + '<td class="n"><b>' + r.f + '</b></td>' + (opts.limit ? '' : '<td class="n hide-sm">' + r.a + '</td>') +
          (opts.limit ? '' : '<td><span class="form" aria-label="Last ' + r.form.length + ': ' + r.form.join(', ') + '">' + r.form.map(function (x) { return '<span class="' + x + '">' + x + '</span>'; }).join('') + '</span></td>') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function initOverview() {
    if (!$('#ov-results')) return;
    onRender(function () {
      var tw = thisWeek(), lw = lastWeek(1);
      $('#ov-week-label').textContent = 'Week ' + tw + ' · ' + longDate(weekDate(tw));
      var fx = FIX.filter(function (f) { return f.week === tw; });
      var mine = myTeam();
      fx.sort(function (a, b) { var am = (a.home === mine || a.away === mine) ? 0 : 1, bm = (b.home === mine || b.away === mine) ? 0 : 1; return am - bm || a.div - b.div; });
      $('#ov-week').innerHTML = fx.map(fxRow).join('');
      var due = FIX.filter(function (f) { return f.status === 'due'; });
      $('#ov-due').innerHTML = due.length ? '<div class="wf-note" data-note="!" style="display:block"><span class="wf-note-label">Result due</span>' + due.map(function (f) { return esc(f.home) + ' v ' + esc(f.away) + ', ' + longDate(f.date) + '. <a href="' + rel('submit-result.html?m=' + f.id) + '">Captains: submit the result</a>'; }).join('<br>') + '</div>' : '';
      var res = FIX.filter(function (f) { return f.week === lw && f.div === 1; });
      $('#ov-results').innerHTML = res.map(scoreCard).join('');
      $('#ov-results-label').textContent = 'Division 1 · week ' + lw + ' · ' + longDate(weekDate(lw));
      $('#ov-table').innerHTML = tableHTML(mine ? divOf(mine) : 1, { limit: 5 });
      var all = [];
      Object.keys(P).forEach(function (k) { P[k].breaks.forEach(function (b) { all.push({ p: k, b: b.b, m: b.match }); }); });
      all.sort(function (a, b) { return b.b - a.b; });
      $('#ov-breaks').innerHTML = all.slice(0, 6).map(function (x) { return '<li class="row between">' + '<span>' + playerLink(x.p) + ' <small>' + esc(P[x.p].team) + '</small></span><a href="' + rel('match.html?m=' + x.m) + '" aria-label="Match card">' + brk(x.b) + '</a></li>'; }).join('');
    });
  }

  function initTables() {
    var host = $('#tables-host'); if (!host) return;
    var team = param('team');
    var get = divSwitch($('#div-switch'), function (n) { host.innerHTML = tableHTML(n, { team: team }); });
    var note = $('#team-note');
    if (team && note) { note.hidden = false; note.innerHTML = 'Showing <b>' + esc(team) + '</b>. <button type="button" class="btn btn-secondary btn-sm" data-follow="team" data-follow-id="' + esc(team) + '" data-label="Follow ' + esc(team) + '">Follow</button> <a href="' + rel('fixtures.html?team=' + encodeURIComponent(team)) + '">Fixtures for this team</a>'; syncFollow(); }
    renderers.push(function () { host.innerHTML = tableHTML(get(), { team: team }); });
  }

  function initFixtures() {
    var host = $('#fixtures-host'); if (!host) return;
    var sel = $('#fx-team'), cur = 1;
    var teamParam = param('team');
    function fillTeams() {
      var keep = sel.value || teamParam || myTeam() || '';
      sel.innerHTML = '<option value="">All teams in Division ' + cur + '</option>' + LS.div[String(cur)].map(function (t) { return '<option' + (t === keep ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('');
      if (LS.div[String(cur)].indexOf(keep) === -1) sel.value = '';
    }
    function render() {
      var t = sel.value;
      var tw = thisWeek();
      var fx = FIX.filter(function (f) { return f.div === cur && (!t || f.home === t || f.away === t); });
      var weeks = {};
      fx.forEach(function (f) { (weeks[f.week] = weeks[f.week] || []).push(f); });
      var cupw = {}; (LS.cupWeeks || []).forEach(function (c) { cupw[c.week] = c; });
      var keys = Object.keys(weeks).map(Number).concat(Object.keys(cupw).map(Number)).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
      host.innerHTML = keys.map(function (w) {
        if (cupw[w] && !weeks[w]) return '<section class="week" id="week-' + w + '"><header><h3>Week ' + w + ' · ' + longDate(cupw[w].date) + '</h3><span class="wf-meta">Cup week: ' + esc(cupw[w].label) + ' · <a href="' + rel('cups.html') + '">Cups</a></span></header></section>';
        var date = weeks[w][0].date;
        var played = weeks[w].filter(function (f) { return f.status === 'result'; }).length;
        return '<section class="week' + (w === tw ? ' this-week' : '') + '" id="week-' + w + '"><header><h3>Week ' + w + ' · ' + longDate(date) + (w === tw ? ' · this week' : '') + '</h3><span class="wf-meta">' + (played ? played + ' of ' + weeks[w].length + ' results in' : weeks[w].length + ' fixture' + (weeks[w].length > 1 ? 's' : '')) + '</span></header>' + weeks[w].map(fxRow).join('') + '</section>';
      }).join('');
      $('#fx-count').textContent = fx.length + ' fixtures' + (t ? ' for ' + t : '') + ' · Division ' + cur;
    }
    var pref = teamParam ? divOf(teamParam) : myTeam() ? divOf(myTeam()) : null;
    divSwitch($('#fx-div'), function (n) { cur = n; fillTeams(); render(); }, pref);
    sel.addEventListener('change', render);
    $('#jump-week').addEventListener('click', function () { var el = $('#week-' + thisWeek()); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('#cal-open').addEventListener('click', function () {
      var t = sel.value || myTeam() || 'Sawston 3';
      var url = 'https://leaguesnooker.co.uk/leagues/cambridge-district-snooker/teams/' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '') + '/fixtures.ics';
      modal('cal-modal', 'Add ' + t + ' fixtures to your calendar', '<p>Subscribe once and your calendar stays up to date when fixtures move. Each entry includes the venue and its postcode.</p><div class="field"><label for="cal-url">Calendar address</label><input type="text" id="cal-url" readonly value="' + esc(url) + '"></div><div class="row"><button type="button" class="btn" id="cal-copy">Copy address</button><a class="btn btn-secondary" href="#" id="cal-google">Google Calendar</a><a class="btn btn-secondary" href="#" id="cal-apple">Apple or Outlook</a></div><p class="wf-meta" style="margin-top:1rem">' + FIX.filter(function (f) { return (f.home === t || f.away === t) && f.status === 'fixture'; }).length + ' upcoming fixtures. Sample address; the real feed is generated per team.</p>');
      openModal('cal-modal');
      $('#cal-copy').addEventListener('click', function (e) { $('#cal-url').select(); copyText(url, e.currentTarget); });
    });
    renderers.push(function () { fillTeams(); render(); });
    fillTeams(); render();
    if (param('week') === 'this') { var el = $('#week-' + thisWeek()); if (el) el.scrollIntoView(); }
  }

  function initCups() {
    var host = $('#bracket-mitchell'); if (!host) return;
    function bracket(entrants, rounds, isTeam) {
      var html = '';
      var size = entrants.length;
      rounds.forEach(function (r, ri) {
        var ties = size / Math.pow(2, ri + 1);
        html += '<div class="bracket-round"><h3>' + r + '</h3><ol>';
        for (var i = 0; i < ties; i++) {
          if (ri === 0) {
            var a = entrants[2 * i], b = entrants[2 * i + 1];
            var la = isTeam ? esc(a) : playerLink(a), lb = isTeam ? esc(b) : playerLink(b);
            html += '<li class="tie"><div><span>' + la + '</span><span class="wf-meta">' + (isTeam ? '' : (P[a] ? esc(P[a].team) : '')) + '</span></div><div><span>' + lb + '</span><span class="wf-meta">' + (isTeam ? '' : (P[b] ? esc(P[b].team) : '')) + '</span></div></li>';
          } else {
            html += '<li class="tie"><div class="tbc">Winner of tie ' + (2 * i + 1) + '</div><div class="tbc">Winner of tie ' + (2 * i + 2) + '</div></li>';
          }
        }
        html += '</ol></div>';
      });
      return html;
    }
    host.innerHTML = bracket(LS.cups.mitchell.entrants, LS.cups.mitchell.rounds, false);
    $('#bracket-nci').innerHTML = bracket(LS.cups.nci.entrants, LS.cups.nci.rounds, true);
  }

  function initClubs() {
    var host = $('#club-list');
    if (host) {
      var q = $('#club-q');
      var render = function () {
        var v = (q.value || '').toLowerCase();
        host.innerHTML = LS.clubs.filter(function (c) { return !v || (c.name + ' ' + c.postcode).toLowerCase().indexOf(v) !== -1; }).map(function (c) {
          return '<article class="card"><h3 class="card-title"><a href="' + rel('club.html?club=' + c.id) + '">' + esc(c.name) + '</a></h3><p class="card-text">' + esc(c.postcode) + ' · ' + c.tables + ' table' + (c.tables > 1 ? 's' : '') + (c.teams.length ? ' · home to ' + c.teams.map(esc).join(', ') : '') + '</p><p class="card-text">Phone <a href="tel:' + c.phone.replace(/\s/g, '') + '">' + esc(c.phone) + '</a></p></article>';
        }).join('');
      };
      q.addEventListener('input', render); render();
    }
    var detail = $('#club-detail');
    if (detail) {
      var c = club(param('club') || 'whittlesford') || LS.clubs[0];
      document.title = c.name + ' · Clubs · Cambridge & District Snooker League (prototype)';
      $('#club-name').textContent = c.name;
      $('#club-pc').textContent = c.postcode;
      $('#club-phone').innerHTML = '<a href="tel:' + c.phone.replace(/\s/g, '') + '">' + esc(c.phone) + '</a>';
      $('#club-tables').textContent = c.tables;
      $('#club-dir').setAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(c.postcode));
      $('#club-teams').innerHTML = c.teams.length ? c.teams.map(function (t) { return '<li>' + teamLink(t) + ' <small>Division ' + divOf(t) + '</small></li>'; }).join('') : '<li class="muted">No league teams based here this season.</li>';
      var fx = FIX.filter(function (f) { return f.venue === c.id && f.status === 'fixture'; }).slice(0, 4);
      $('#club-fx').innerHTML = fx.length ? fx.map(function (f) { return '<li class="result-item"><b>' + shortDate(f.date) + '</b> · ' + esc(f.home) + ' v ' + esc(f.away) + ' <small>Div ' + f.div + '</small></li>'; }).join('') : '<li class="muted">No home fixtures coming up.</li>';
    }
  }

  function initArchive() {
    var host = $('#archive-list'); if (!host) return;
    var q = $('#archive-q');
    function render() {
      var v = (q.value || '').toLowerCase();
      host.innerHTML = LS.archive.filter(function (a) { return !v || (a.season + a.div1 + a.div2).toLowerCase().indexOf(v) !== -1; }).map(function (a) {
        return '<article class="card"><p class="eyebrow">Season ' + a.season + '</p><h3 class="card-title">Division 1: ' + esc(a.div1) + '</h3><p class="card-text">Division 2: ' + esc(a.div2) + ' · ' + a.teams + ' teams · highest break ' + a.hb + '</p><a class="card-link" href="#" data-dead>Tables, results and breaks</a></article>';
      }).join('') || '<div class="empty-state"><p>No season matches that.</p></div>';
    }
    q.addEventListener('input', render); render();
    host.addEventListener('click', function (e) { if (e.target.closest('[data-dead]')) { e.preventDefault(); toast('Past seasons open the same tables, results and breaks pages, set to that season.'); } });
  }

  function initLeagueInfo() {
    var form = $('#contact-form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      form.hidden = true; $('#contact-done').hidden = false;
    });
    var w = $('#embed-type');
    if (w) {
      var render = function () {
        var t = w.value;
        var code = '<iframe src="https://leaguesnooker.co.uk/embed/cambridge-district-snooker/' + t + '?division=' + $('#embed-div').value + '" title="Cambridge & District Snooker League ' + t + '" width="100%" height="420" loading="lazy"></iframe>';
        $('#embed-code').textContent = code;
        $('#embed-preview').innerHTML = t === 'table' ? tableHTML(parseInt($('#embed-div').value, 10), { limit: 5 }) : t === 'results' ? '<div class="score-cards">' + FIX.filter(function (f) { return f.week === lastWeek(1) && f.div === parseInt($('#embed-div').value, 10); }).slice(0, 2).map(scoreCard).join('') + '</div>' : '<div>' + FIX.filter(function (f) { return f.week === thisWeek() && f.div === parseInt($('#embed-div').value, 10); }).map(fxRow).join('') + '</div>';
      };
      w.addEventListener('change', render); $('#embed-div').addEventListener('change', render); render();
      $('#embed-copy').addEventListener('click', function (e) { copyText($('#embed-code').textContent, e.currentTarget); });
    }
  }

  /* ======================================================================
     3. Match centre
     ====================================================================== */
  function initMatch() {
    var host = $('#match-host'); if (!host) return;
    var f = fixture(param('m') || LS.featuredMatch);
    if (!f || f.status !== 'result') f = fixture(LS.featuredMatch);
    document.title = f.home + ' ' + f.hf + '–' + f.af + ' ' + f.away + ' · Match card · Cambridge & District Snooker League (prototype)';
    var c = club(f.venue);
    $('#m-meta').textContent = 'Division ' + f.div + ' · Week ' + f.week + ' · ' + longDate(f.date) + (c ? ' · ' + c.name + ', ' + c.postcode : '');
    $('#m-hero').innerHTML = '<div><div class="t">' + teamLink(f.home) + '</div><small>Home</small></div><div class="s">' + f.hf + ' – ' + f.af + '</div><div><div class="t">' + teamLink(f.away) + '</div><small>Away</small></div>';
    $('#m-frames').innerHTML = f.games.map(function (g, i) {
      return '<tr><td class="hp">' + playerLink(g.h, { hcp: true }) + '<div class="bk home">' + g.hb.map(brk).join('') + '</div></td><td class="r">' + g.hf + ' – ' + g.af + '</td><td>' + playerLink(g.a, { hcp: true }) + '<div class="bk">' + g.ab.map(brk).join('') + '</div></td></tr>';
    }).join('');
    var allB = []; f.games.forEach(function (g) { g.hb.forEach(function (b) { allB.push([g.h, b]); }); g.ab.forEach(function (b) { allB.push([g.a, b]); }); });
    allB.sort(function (a, b) { return b[1] - a[1]; });
    $('#m-breaks').innerHTML = allB.length ? allB.map(function (x) { return '<li class="row between"><span>' + playerLink(x[0]) + '</span>' + brk(x[1]) + '</li>'; }).join('') : '<li class="muted">No breaks of 20 or more recorded.</li>';
    var same = FIX.filter(function (x) { return x.status === 'result' && x.div === f.div; });
    var i = same.indexOf(f);
    $('#m-prev').innerHTML = i > 0 ? '<a href="' + rel('match.html?m=' + same[i - 1].id) + '">‹ ' + esc(same[i - 1].home) + ' v ' + esc(same[i - 1].away) + '</a>' : '';
    $('#m-next').innerHTML = i < same.length - 1 ? '<a href="' + rel('match.html?m=' + same[i + 1].id) + '">' + esc(same[i + 1].home) + ' v ' + esc(same[i + 1].away) + ' ›</a>' : '';
    var other = FIX.filter(function (x) { return x.week === f.week && x.div === f.div && x !== f; });
    $('#m-other').innerHTML = other.map(scoreCard).join('');
  }

  function validate(form) {
    var ok = true;
    $all('[required]', form).forEach(function (el) {
      var field = el.closest('.field') || el.closest('fieldset') || el.parentNode;
      var bad = el.type === 'checkbox' ? !el.checked
        : el.type === 'radio' ? !$all('input[name="' + el.name + '"]', form).some(function (r) { return r.checked; })
        : !String(el.value).trim();
      if (!bad && el.type === 'email') bad = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value);
      if (!bad && el.getAttribute('data-min')) bad = String(el.value).length < parseInt(el.getAttribute('data-min'), 10);
      var err = field.querySelector('.field-error[data-auto]');
      if (bad) {
        ok = false; field.classList.add('has-error'); el.setAttribute('aria-invalid', 'true');
        if (!err) { err = document.createElement('p'); err.className = 'field-error'; err.setAttribute('data-auto', ''); field.appendChild(err); }
        err.textContent = el.getAttribute('data-error') || 'Please fill this in.';
      } else { field.classList.remove('has-error'); el.removeAttribute('aria-invalid'); if (err) err.remove(); }
    });
    var first = $('[aria-invalid="true"]', form); if (first) first.focus();
    return ok;
  }

  /* Step flows share one controller: .step sections, a .stepper list, and
     buttons with data-next / data-back. A step can refuse to advance. */
  function stepper(root, checks, onShow) {
    var steps = $all('.step', root), marks = $all('.stepper li', root), cur = 0;
    function show(n) {
      cur = n;
      steps.forEach(function (s, i) { s.hidden = i !== n; });
      marks.forEach(function (m, i) { m.classList.toggle('current', i === n); m.classList.toggle('done', i < n); if (i === n) m.setAttribute('aria-current', 'step'); else m.removeAttribute('aria-current'); });
      if (onShow) onShow(n);
      var h = steps[n].querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
    }
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-next]')) { e.preventDefault(); if (checks[cur] && !checks[cur]()) return; show(cur + 1); }
      if (e.target.closest('[data-back]')) { e.preventDefault(); show(cur - 1); }
    });
    show(0);
    return show;
  }

  function initSubmit() {
    var root = $('#submit-flow'); if (!root) return;
    var due = FIX.filter(function (f) { return f.status === 'due'; });
    var upcoming = FIX.filter(function (f) { return f.week === thisWeek(); });
    var f = fixture(param('m')) || due[0];
    var pick = $('#s-fixture');
    pick.innerHTML = due.concat(upcoming).map(function (x) { return '<option value="' + x.id + '"' + (x === f ? ' selected' : '') + '>' + esc(x.home) + ' v ' + esc(x.away) + ' · ' + shortDate(x.date) + (x.status === 'due' ? ' · result due' : '') + '</option>'; }).join('');
    function current() { return fixture(pick.value); }
    /* Player names are typed as written on the match card. Each player has a box for
       their highest break; captains leave it blank when there wasn't one. */
    function buildGames() {
      var x = current();
      var fr = function (id) { return '<select id="' + id + '" class="fr"><option>0</option><option selected>1</option><option>2</option></select>'; };
      $('#s-games').innerHTML = '<div class="frame-head" aria-hidden="true"><span>Home player</span><span>Break</span><span>Frames</span><span>Frames</span><span>Break</span><span>Away player</span></div>' +
        [0, 1, 2, 3, 4].map(function (i) {
          return '<fieldset class="frame-entry" data-game="' + i + '"><legend class="sr-only">Game ' + (i + 1) + '</legend>' +
            '<div class="fe fe-hn"><label class="lbl" for="h' + i + '">Home player ' + (i + 1) + '</label><input type="text" id="h' + i + '" autocomplete="off" placeholder="Name as on the card"></div>' +
            '<div class="fe fe-hb"><label class="lbl" for="hb' + i + '">Break</label><input type="text" id="hb' + i + '" inputmode="numeric" maxlength="3" placeholder="–"></div>' +
            '<div class="fe fe-hf"><label class="lbl" for="hf' + i + '">Frames</label>' + fr('hf' + i) + '</div>' +
            '<div class="fe fe-af"><label class="lbl" for="af' + i + '">Frames</label>' + fr('af' + i) + '</div>' +
            '<div class="fe fe-ab"><label class="lbl" for="ab' + i + '">Break</label><input type="text" id="ab' + i + '" inputmode="numeric" maxlength="3" placeholder="–"></div>' +
            '<div class="fe fe-an"><label class="lbl" for="a' + i + '">Away player ' + (i + 1) + '</label><input type="text" id="a' + i + '" autocomplete="off" placeholder="Name as on the card"></div>' +
            '</fieldset>';
        }).join('');
      $('#s-home-name').textContent = x.home; $('#s-away-name').textContent = x.away;
      tally(false);
    }
    function tally(strict) {
      var h = 0, a = 0, msgs = [], badFrames = [], badNames = 0, badBreaks = 0;
      $all('#s-games input').forEach(function (el) { el.removeAttribute('aria-invalid'); });
      for (var i = 0; i < 5; i++) {
        var hf = parseInt($('#hf' + i).value, 10), af = parseInt($('#af' + i).value, 10);
        h += hf; a += af; if (hf + af !== 2) badFrames.push(i + 1);
        ['h', 'a'].forEach(function (side) {
          var n = $('#' + side + i), b = $('#' + side + 'b' + i), v = b.value.trim();
          if (strict && !n.value.trim()) { n.setAttribute('aria-invalid', 'true'); badNames++; }
          if (v && !(/^\d+$/.test(v) && +v >= 20 && +v <= 147)) { b.setAttribute('aria-invalid', 'true'); badBreaks++; }
        });
      }
      $('#s-total').textContent = h + ' – ' + a;
      if (badFrames.length) msgs.push('Each game is best of two frames, so its frames should add up to 2. Check game' + (badFrames.length > 1 ? 's ' : ' ') + badFrames.join(', ') + '.');
      if (badNames) msgs.push('Type the name of every player, as written on the match card.');
      if (badBreaks) msgs.push('Breaks should be a number between 20 and 147. Leave the box empty if there was no break.');
      var e = $('#s-games-error');
      e.hidden = !msgs.length; e.innerHTML = msgs.map(esc).join('<br>');
      if (strict && msgs.length) { var first = $('#s-games [aria-invalid="true"]'); if (first) first.focus(); }
      return !msgs.length;
    }
    function brkOf(id) { var v = $('#' + id).value.trim(); return v ? brk(parseInt(v, 10)) : ''; }
    $('#s-games').addEventListener('change', function () { tally(false); });
    $('#s-games').addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid')) tally(false); });
    pick.addEventListener('change', buildGames);
    $('#s-photo').addEventListener('change', function (e) { var f2 = e.target.files[0]; $('#s-photo-name').textContent = f2 ? 'Attached: ' + f2.name : 'No photo attached yet.'; });
    buildGames();
    stepper(root, [
      function () { return true; },
      function () { return tally(true); },
      function () { return true; },
      function () {
        var x = current(), ok = $('#s-confirm').checked;
        var err = $('#s-confirm-error'); err.hidden = ok;
        if (!ok) return false;
        $('#s-done-text').innerHTML = 'We have sent ' + esc(x.home) + ' ' + $('#s-total').textContent + ' ' + esc(x.away) + ' to the ' + esc(x.away) + ' captain to confirm. It goes on the site as soon as they confirm, or automatically after 48 hours if nobody queries it. The league secretary can see it in their <a href="' + rel('admin.html') + '">results queue</a>.';
        return true;
      }
    ], function (n) {
      if (n === 3) {
        var x = current(), rows = '';
        for (var i = 0; i < 5; i++) rows += '<tr><td class="hp">' + esc($('#h' + i).value) + ' ' + brkOf('hb' + i) + '</td><td class="r">' + $('#hf' + i).value + ' – ' + $('#af' + i).value + '</td><td>' + esc($('#a' + i).value) + ' ' + brkOf('ab' + i) + '</td></tr>';
        $('#s-summary').innerHTML = '<p class="eyebrow">' + esc(x.home) + ' v ' + esc(x.away) + ' · ' + longDate(x.date) + '</p><p style="font-size:2rem;font-weight:700" class="num">' + $('#s-total').textContent + '</p><table class="frames"><tbody>' + rows + '</tbody></table><p style="margin-top:1rem">' + esc($('#s-photo-name').textContent) + '</p>';
      }
    });
  }

  function initLive() {
    var root = $('#live'); if (!root) return;
    var st = { frames: [3, 2], pts: [42, 17], atTable: 0, brk: 0, hist: [] };
    var names = ['Lewis Fenwick', 'Darren Shaw'];
    function render() {
      $('#lv-frames').textContent = st.frames[0] + ' – ' + st.frames[1];
      $('#lv-p0').textContent = st.pts[0]; $('#lv-p1').textContent = st.pts[1];
      $('#lv-n0').classList.toggle('at-table', st.atTable === 0); $('#lv-n1').classList.toggle('at-table', st.atTable === 1);
      $('#lv-at').textContent = names[st.atTable] + ' at the table · current break ' + st.brk;
      $('#lv-log').innerHTML = st.hist.slice(-6).reverse().map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('');
    }
    $('#lv-pad').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-pts]'); if (!b) return;
      var v = parseInt(b.getAttribute('data-pts'), 10);
      st.pts[st.atTable] += v; st.brk += v; render();
    });
    $('#lv-miss').addEventListener('click', function () {
      if (st.brk >= 20) st.hist.push(names[st.atTable] + ' made a break of ' + st.brk);
      st.brk = 0; st.atTable = 1 - st.atTable; render();
    });
    $('#lv-foul').addEventListener('click', function () { st.pts[1 - st.atTable] += 4; st.hist.push('Foul by ' + names[st.atTable] + ', 4 points to ' + names[1 - st.atTable]); st.brk = 0; st.atTable = 1 - st.atTable; render(); });
    $('#lv-end').addEventListener('click', function () {
      var w = st.pts[0] >= st.pts[1] ? 0 : 1;
      st.frames[w]++; st.hist.push('Frame to ' + names[w] + ', ' + Math.max(st.pts[0], st.pts[1]) + '–' + Math.min(st.pts[0], st.pts[1]));
      st.pts = [0, 0]; st.brk = 0; st.atTable = 1 - w; render(); toast('Frame saved. Viewers see the new score straight away.');
    });
    render();
  }

  /* ======================================================================
     4. Players
     ====================================================================== */
  function h2hFor(a, b) {
    if ((a === 'lewis-fenwick' && b === 'dan-okafor') || (a === 'dan-okafor' && b === 'lewis-fenwick')) {
      return LS.h2h.map(function (m) { return a === 'lewis-fenwick' ? m : { date: m.date, season: m.season, a: m.b, b: m.a, hb_a: m.hb_b, hb_b: m.hb_a }; });
    }
    var seed = (a + b).split('').reduce(function (s, c) { return (s * 31 + c.charCodeAt(0)) % 9973; }, 7), out = [];
    var n = seed % 4;
    for (var i = 0; i < n; i++) { var x = (seed >> i) % 3; out.push({ date: (2025 - i) + '-0' + (2 + i) + '-1' + i, season: (2024 - i) + '/' + String(25 - i), a: x, b: 2 - x, hb_a: x ? 20 + seed % 40 : null, hb_b: x < 2 ? 25 + seed % 30 : null }); }
    return out;
  }

  function initPlayer() {
    var host = $('#player-host'); if (!host) return;
    var id = param('p') || 'lewis-fenwick';
    var p = P[id] || P['lewis-fenwick']; id = p.id;
    document.title = p.name + ' · Players · Cambridge & District Snooker League (prototype)';
    $('#pl-name').textContent = p.name;
    $('#pl-hcp').innerHTML = p.hcp === null || p.hcp === undefined ? '' : '<span class="hcp">Handicap ' + (p.hcp > 0 ? '+' : p.hcp < 0 ? '−' : '') + Math.abs(p.hcp) + '</span>';
    $('#pl-sub').innerHTML = teamLink(p.team) + ' · Division ' + p.division + ' · Cambridge &amp; District Snooker League · playing in leagues on this site since ' + (p.career.length ? p.career[0].season : p.since);
    var fb = $('#pl-follow'); fb.setAttribute('data-follow-id', id); syncFollow();
    var cf = p.career.reduce(function (s, c) { return s + c.frames; }, 0) + p.ff + p.fa;
    var cw = p.career.reduce(function (s, c) { return s + c.won; }, 0) + p.ff;
    var best = Math.max.apply(null, p.career.map(function (c) { return c.hb; }).concat([p.hb || 0]));
    var cents = (p.centuries || []).length || p.career.filter(function (c) { return c.hb >= 100; }).length + (p.hb >= 100 ? 1 : 0);
    $('#pl-kpi').innerHTML = '<div><b>' + p.ff + '–' + p.fa + '</b><span>Frames this season</span></div><div><b>' + pct(p.ff, p.ff + p.fa) + '</b><span>Won this season</span></div><div><b>' + pct(cw, cf) + '</b><span>Won, career</span></div><div><b>' + cf + '</b><span>Frames, career</span></div><div><b>' + (best || '–') + '</b><span>Highest break</span></div><div><b>' + cents + '</b><span>Centuries</span></div>';
    var seasons = p.career.concat([{ season: '2026/27', team: p.team, league: 'Cambridge & District Snooker League', frames: p.ff + p.fa, won: p.ff, hb: p.hb, hcp: p.hcp }]);
    $('#pl-bars').innerHTML = seasons.slice(-8).map(function (c) { var v = c.frames ? Math.round(100 * c.won / c.frames) : 0; return '<div class="bar-row"><span>' + c.season + '</span><span class="bar-track" aria-hidden="true"><span class="bar-fill" style="display:block;width:' + v + '%"></span></span><span>' + (c.frames ? v + '%' : '–') + '</span></div>'; }).join('');
    $('#pl-career').innerHTML = seasons.slice().reverse().map(function (c) { return '<tr><th scope="row">' + c.season + '</th><td>' + esc(c.team) + '<br><small>' + esc(c.league) + '</small></td><td class="n">' + c.frames + '</td><td class="n">' + c.won + '</td><td class="n">' + pct(c.won, c.frames) + '</td><td class="n">' + hb(c.hb) + '</td><td class="n">' + (c.hcp === null || c.hcp === undefined ? '<span class="dash">–</span>' : (c.hcp > 0 ? '+' : c.hcp < 0 ? '−' : '') + Math.abs(c.hcp)) + '</td></tr>'; }).join('');
    $('#pl-matches').innerHTML = FIX.filter(function (f) { return f.status === 'result' && f.games.some(function (g) { return g.h === id || g.a === id; }); }).map(function (f) {
      var g = f.games.filter(function (g2) { return g2.h === id || g2.a === id; })[0]; var home = g.h === id;
      var us = home ? g.hf : g.af, them = home ? g.af : g.hf, bs = home ? g.hb : g.ab;
      return '<tr><td>' + shortDate(f.date) + '</td><td>' + playerLink(home ? g.a : g.h) + '<br><small>' + esc(home ? f.away : f.home) + '</small></td><td class="n"><b>' + us + '–' + them + '</b></td><td>' + (bs.length ? bs.map(brk).join(' ') : '<span class="dash">–</span>') + '</td><td><a href="' + rel('match.html?m=' + f.id) + '">Match card</a></td></tr>';
    }).join('') || '<tr><td colspan="5" class="muted">No matches yet this season.</td></tr>';
    var al = $('#pl-aliases');
    if (al) al.innerHTML = (p.aliases || []).length ? 'On the current site this player also appears as ' + p.aliases.map(function (a) { return '"' + esc(a) + '"'; }).join(', ') + '. In the rebuild those records are merged and the handicap is stored on its own, with its history in the career table.' : 'No duplicate records found for this player in the sample data.';
    var sel = $('#h2h-opp');
    var opp = Object.keys(P).filter(function (k) { return k !== id; }).sort(function (a, b) { return P[a].name.localeCompare(P[b].name); });
    sel.innerHTML = opp.map(function (k) { return '<option value="' + k + '"' + (k === (id === 'dan-okafor' ? 'lewis-fenwick' : 'dan-okafor') ? ' selected' : '') + '>' + esc(P[k].name) + ' (' + esc(P[k].team) + ')</option>'; }).join('');
    function h2h() {
      var o = sel.value, ms = h2hFor(id, o);
      var a = ms.reduce(function (s, m) { return s + m.a; }, 0), b = ms.reduce(function (s, m) { return s + m.b; }, 0);
      $('#h2h-box').innerHTML = '<div><b>' + esc(p.name) + '</b><div class="big">' + a + '</div><small>frames</small></div><div class="wf-meta">' + ms.length + ' meeting' + (ms.length === 1 ? '' : 's') + '</div><div><b>' + esc(P[o].name) + '</b><div class="big">' + b + '</div><small>frames</small></div>';
      $('#h2h-list').innerHTML = ms.length ? ms.map(function (m) { return '<tr><td>' + fullDate(m.date) + '</td><td>' + m.season + '</td><td class="n"><b>' + m.a + '–' + m.b + '</b></td><td class="n">' + hb(m.hb_a) + '</td><td class="n">' + hb(m.hb_b) + '</td></tr>'; }).join('') : '<tr><td colspan="5" class="muted">These two have not played each other in a league match on this site.</td></tr>';
    }
    sel.addEventListener('change', h2h); h2h();
  }

  function initRankings() {
    var host = $('#rank-host'); if (!host) return;
    var cur = 1;
    function render() {
      var min = parseInt($('#rank-min').value, 10), sort = $('#rank-sort').value;
      var rows = Object.keys(P).map(function (k) { return P[k]; }).filter(function (p) { return p.division === cur && p.pl > 0; });
      var shown = rows.filter(function (p) { return (p.ff + p.fa) >= min; });
      shown.sort(function (a, b) {
        if (sort === 'pct') return (b.ff / (b.ff + b.fa)) - (a.ff / (a.ff + a.fa)) || (b.ff + b.fa) - (a.ff + a.fa);
        if (sort === 'hb') return (b.hb || 0) - (a.hb || 0);
        return (b.ff - b.fa) - (a.ff - a.fa) || b.ff - a.ff;
      });
      host.innerHTML = '<div class="lt-wrap"><table class="lt"><caption>Division ' + cur + ' players · ' + (min ? 'minimum ' + min + ' frames to qualify' : 'all players') + ' · ' + (rows.length - shown.length) + ' not yet qualified</caption><thead><tr><th scope="col">#</th><th scope="col">Player</th><th scope="col" class="hide-sm">Team</th><th scope="col" class="n">Frames</th><th scope="col" class="n">Won</th><th scope="col" class="n">+/-</th><th scope="col" class="n">%</th><th scope="col" class="n">High break</th></tr></thead><tbody>' +
        shown.map(function (p, i) { return '<tr' + (follows().players.indexOf(p.id) !== -1 || p.team === myTeam() ? ' class="mine"' : '') + '><td class="n">' + (i + 1) + '</td><th scope="row">' + playerLink(p.id, { hcp: true }) + '</th><td class="hide-sm">' + esc(p.team) + '</td><td class="n">' + (p.ff + p.fa) + '</td><td class="n">' + p.ff + '</td><td class="n">' + (p.ff - p.fa > 0 ? '+' : '') + (p.ff - p.fa) + '</td><td class="n">' + pct(p.ff, p.ff + p.fa) + '</td><td class="n">' + hb(p.hb) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    divSwitch($('#rank-div'), function (n) { cur = n; render(); });
    $('#rank-min').addEventListener('change', render); $('#rank-sort').addEventListener('change', render);
    renderers.push(render);
  }

  function initBreaks() {
    var host = $('#hall-host'); if (!host) return;
    var lsel = $('#hall-league');
    var names = []; LS.hall.forEach(function (h) { if (names.indexOf(h.league) === -1) names.push(h.league); });
    names.sort();
    lsel.innerHTML = '<option value="">All leagues</option>' + names.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('');
    var ssel = $('#hall-season');
    var ss = []; LS.hall.forEach(function (h) { if (ss.indexOf(h.season) === -1) ss.push(h.season); }); ss.sort().reverse();
    ssel.innerHTML = '<option value="">All seasons</option>' + ss.map(function (s) { return '<option>' + s + '</option>'; }).join('');
    if (param('league') === 'cambridge') lsel.value = 'Cambridge & District Snooker League';
    function render() {
      var l = lsel.value, s = ssel.value, only = $('#hall-147').checked, q = $('#hall-q').value.toLowerCase();
      var rows = LS.hall.filter(function (h) { return (!l || h.league === l) && (!s || h.season === s) && (!only || h.b >= 147) && (!q || h.player.toLowerCase().indexOf(q) !== -1); });
      $('#hall-count').textContent = rows.length + ' centur' + (rows.length === 1 ? 'y' : 'ies') + ' (sample data)';
      host.innerHTML = rows.length ? '<div class="lt-wrap"><table class="lt"><caption>Centuries in league and cup matches · highest first</caption><thead><tr><th scope="col" class="n">Break</th><th scope="col">Player</th><th scope="col">League</th><th scope="col">Season</th><th scope="col"><span class="sr-only">Share</span></th></tr></thead><tbody>' +
        rows.map(function (h, i) { return '<tr><td class="n">' + brk(h.b) + '</td><th scope="row">' + (h.pid ? playerLink(h.pid) : esc(h.player)) + '</th><td class="team-cell">' + esc(h.league) + '</td><td>' + h.season + '</td><td><button type="button" class="btn-link" data-share="' + i + '">Share</button></td></tr>'; }).join('') + '</tbody></table></div>' :
        '<div class="empty-state"><p>No centuries match. Try another season or league.</p></div>';
      host.onclick = function (e) {
        var b = e.target.closest('[data-share]'); if (!b) return;
        var h = rows[parseInt(b.getAttribute('data-share'), 10)];
        modal('share-modal', 'Share this break', '<div class="summary-box" style="text-align:center"><p class="eyebrow">' + esc(h.league) + ' · ' + h.season + '</p><p style="font-size:3rem;font-weight:700;line-height:1" class="num">' + h.b + '</p><p><b>' + esc(h.player) + '</b></p><div class="wf-placeholder" style="height:60px">League logo · sponsor</div></div><p class="wf-meta" style="margin-top:1rem">A square image sized for Facebook and WhatsApp, generated for every century.</p><div class="row"><button type="button" class="btn" id="share-copy">Copy link</button><a class="btn btn-secondary" href="#">Facebook group</a></div>');
        openModal('share-modal');
        $('#share-copy').addEventListener('click', function (ev) { copyText('https://leaguesnooker.co.uk/breaks/' + h.b + '-' + h.player.toLowerCase().replace(/\s+/g, '-'), ev.currentTarget); });
      };
    }
    [lsel, ssel, $('#hall-147'), $('#hall-q')].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('change', render); });
    render();
  }

  function initAccount() {
    var host = $('#acct'); if (!host) return;
    function render() {
      var f = follows();
      $('#acct-follows').innerHTML = (f.teams.map(function (t) { return '<li class="row between"><span><b>' + esc(t) + '</b> <small>team</small></span><button type="button" class="btn-link" data-unf="team" data-id="' + esc(t) + '">Unfollow</button></li>'; }).concat(f.players.map(function (p) { return '<li class="row between"><span><b>' + esc(P[p] ? P[p].name : p) + '</b> <small>player</small></span><button type="button" class="btn-link" data-unf="player" data-id="' + esc(p) + '">Unfollow</button></li>'; }))).join('') || '<li class="muted">You are not following anyone yet. Use Follow on a team or player page, or <button type="button" class="btn-link" data-follow-open>follow a team</button>.</li>';
      var pv = privacy(); $all('input[name="privacy"]').forEach(function (r) { r.checked = r.value === pv; });
    }
    host.addEventListener('click', function (e) { var b = e.target.closest('[data-unf]'); if (b) { toggleFollow(b.getAttribute('data-unf'), b.getAttribute('data-id')); render(); } });
    $('#alerts-form').addEventListener('submit', function (e) { e.preventDefault(); toast('Alert settings saved'); });
    $all('input[name="privacy"]').forEach(function (r) { r.addEventListener('change', function () { store('ls-privacy', r.value); toast(r.value === 'initials' ? 'Your name will show as initial and surname on public pages' : 'Your full name will show on public pages'); }); });
    var cl = $('#claim-form');
    cl.addEventListener('submit', function (e) { e.preventDefault(); if (!validate(cl)) return; cl.hidden = true; $('#claim-done').hidden = false; });
    $('#claim-player').innerHTML = '<option value="">Choose your name</option>' + Object.keys(P).sort(function (a, b) { return P[a].name.localeCompare(P[b].name); }).map(function (k) { return '<option value="' + k + '">' + esc(P[k].name) + ' (' + esc(P[k].team) + ')</option>'; }).join('');
    renderers.push(render); render();
  }

  /* ======================================================================
     5. Run a league
     ====================================================================== */
  function initCalc() {
    var root = $('#calc'); if (!root) return;
    function render() {
      var teams = Math.max(1, parseInt($('#c-teams').value, 10) || 0), per = Math.max(1, parseInt($('#c-per').value, 10) || 0);
      var singles = $('#c-format').value === 'singles';
      var players = singles ? Math.max(1, parseInt($('#c-players').value, 10) || 0) : teams * per;
      var rate = singles ? 3.5 : 1.5, cost = players * rate;
      $('#c-team-fields').hidden = singles; $('#c-singles-fields').hidden = !singles;
      $('#c-out').innerHTML = '<p class="eyebrow">Your first season</p><p class="big">Free</p><p class="eyebrow" style="margin-top:1rem">Each season after that</p><p class="big">£' + cost.toFixed(2) + '</p><p>' + players + ' players at £' + rate.toFixed(2) + ' each per season' + (singles ? ' (singles league rate)' : ', counting ' + per + ' per team; extra registered players are free') + '.</p><p class="wf-meta">That is about £' + (cost / 30).toFixed(2) + ' a week across a 30-week season, or ' + Math.round(100 * rate / 30) + 'p per player per week.</p>';
    }
    root.addEventListener('input', render); root.addEventListener('change', render); render();
  }

  function initSetup() {
    var root = $('#setup-flow'); if (!root) return;
    var form = root;
    stepper(root, [
      function () { return validate($('#st-1')); },
      function () { return validate($('#st-2')); },
      function () {
        var ok = validate($('#st-3'));
        var pw = $('#st-pw'), pw2 = $('#st-pw2'), err = $('#st-pw2-error');
        if (ok && pw.value !== pw2.value) { err.hidden = false; pw2.closest('.field').classList.add('has-error'); pw2.focus(); return false; }
        err.hidden = true; pw2.closest('.field').classList.remove('has-error');
        return ok;
      },
      function () { return validate($('#st-4')); }
    ], function (n) {
      if (n === 4) {
        var name = $('#st-name').value || 'Your league';
        var divs = parseInt($('#st-divs').value, 10) || 1;
        $('#pv-name').textContent = name;
        $('#pv-meta').textContent = ($('#st-county').value || 'County') + ' · ' + $('#st-sport').value + ' · ' + NIGHTS[$('#st-night').value];
        var tabs = ''; for (var i = 1; i <= divs; i++) tabs += '<button type="button" aria-pressed="' + (i === 1) + '">Division ' + i + '</button>';
        $('#pv-divs').innerHTML = tabs;
        var opts = $all('#st-2 input[type=checkbox]:checked').map(function (c) { return c.closest('label').textContent.trim(); });
        $('#pv-rules').innerHTML = opts.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') || '<li class="muted">Standard frames-won table</li>';
        $('#pv-pay').textContent = $('input[name="st-pay"]:checked') ? $('input[name="st-pay"]:checked').value : '';
        $('#pv-email').textContent = $('#st-email').value;
      }
    });
    var strength = $('#st-pw-hint');
    $('#st-pw').addEventListener('input', function (e) { var v = e.target.value; strength.textContent = v.length >= 12 ? 'Good length.' : 'At least 12 characters. A short phrase works well.'; });
    $('#st-go').addEventListener('click', function () { $('#setup-flow').hidden = true; $('#setup-done').hidden = false; $('#setup-done h2').focus(); });
  }

  function initSignIn() {
    var f = $('#signin-form'); if (!f) return;
    f.addEventListener('submit', function (e) { e.preventDefault(); if (!validate(f)) return; window.location.href = 'admin.html'; });
    $('#forgot-link').addEventListener('click', function (e) { e.preventDefault(); f.hidden = true; $('#reset-form').hidden = false; $('#reset-email').focus(); });
    $('#reset-form').addEventListener('submit', function (e) { e.preventDefault(); if (!validate($('#reset-form'))) return; $('#reset-form').hidden = true; $('#reset-done').hidden = false; });
    $('#reset-back').addEventListener('click', function () { $('#reset-form').hidden = true; f.hidden = false; });
  }

  function initAdmin() {
    var grid = $('#entry-grid'); if (!grid) return;
    var tw = thisWeek();
    var fx = FIX.filter(function (f) { return f.week === tw && f.div === 1; });
    $('#entry-week').textContent = 'Division 1 · week ' + tw + ' · ' + longDate(weekDate(tw));
    grid.innerHTML = fx.map(function (f, i) {
      return '<tr data-row="' + i + '"><th scope="row">' + esc(f.home) + ' v ' + esc(f.away) + '</th><td><label class="sr-only" for="eh' + i + '">' + esc(f.home) + ' frames</label><input id="eh' + i + '" inputmode="numeric" maxlength="2"></td><td><label class="sr-only" for="ea' + i + '">' + esc(f.away) + ' frames</label><input id="ea' + i + '" inputmode="numeric" maxlength="2"></td><td><span class="status pending" id="es' + i + '">To enter</span></td><td><a href="' + rel('submit-result.html?m=' + f.id) + '">Frames and breaks</a></td></tr>';
    }).join('');
    function check(i) {
      var h = $('#eh' + i).value, a = $('#ea' + i).value, s = $('#es' + i), row = $('tr[data-row="' + i + '"]');
      if (h === '' || a === '') { s.className = 'status pending'; s.textContent = 'To enter'; row.classList.remove('ok'); return; }
      var ok = /^\d+$/.test(h) && /^\d+$/.test(a) && (parseInt(h, 10) + parseInt(a, 10) === 10);
      s.className = 'status' + (ok ? ' done' : ''); s.textContent = ok ? 'Ready' : 'Frames must total 10'; row.classList.toggle('ok', ok);
    }
    grid.addEventListener('input', function (e) { var r = e.target.closest('tr'); if (r) check(r.getAttribute('data-row')); });
    grid.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return; e.preventDefault();
      var ins = $all('input', grid), i = ins.indexOf(e.target); if (ins[i + 1]) ins[i + 1].focus();
    });
    $('#entry-save').addEventListener('click', function () {
      var ready = $all('.status.done', grid).length;
      toast(ready ? ready + ' result' + (ready > 1 ? 's' : '') + ' published. Subscribers following those teams have been told.' : 'Nothing ready to publish yet.');
    });
    var q = $('#queue');
    q.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]'); if (!b) return;
      var li = b.closest('li'); var act = b.getAttribute('data-q');
      li.querySelector('.status').className = 'status' + (act === 'approve' ? ' done' : '');
      li.querySelector('.status').textContent = act === 'approve' ? 'Published' : 'Queried with both captains';
      $all('button', li).forEach(function (x) { x.hidden = true; });
      toast(act === 'approve' ? 'Result published' : 'Query sent');
    });
    var hf = $('#helper-form');
    hf.addEventListener('submit', function (e) {
      e.preventDefault(); if (!validate(hf)) return;
      var li = document.createElement('li'); li.className = 'row between';
      li.innerHTML = '<span><b>' + esc($('#helper-name').value) + '</b> <small>' + esc($('#helper-role').value) + ' · invite sent</small></span><span class="status pending">Invited</span>';
      $('#helper-list').appendChild(li); hf.reset(); toast('Invitation sent. They choose their own password.');
    });
    $all('[data-export]').forEach(function (b) {
      b.addEventListener('click', function () {
        var kind = b.getAttribute('data-export'), rows;
        if (kind === 'tables') rows = [['Division', 'Pos', 'Team', 'P', 'W', 'D', 'L', 'F', 'A']].concat(['1', '2'].reduce(function (acc, dv) { return acc.concat(LS.tables[dv].map(function (r) { return [dv, r.pos, r.team, r.p, r.w, r.d, r.l, r.f, r.a]; })); }, []));
        else if (kind === 'results') rows = [['Week', 'Date', 'Division', 'Home', 'Home frames', 'Away frames', 'Away']].concat(results().map(function (f) { return [f.week, f.date, f.div, f.home, f.hf, f.af, f.away]; }));
        else rows = [['Player', 'Team', 'Division', 'Handicap', 'Frames won', 'Frames lost', 'High break']].concat(Object.keys(P).map(function (k) { var p = P[k]; return [p.name, p.team, p.division, p.hcp === null ? '' : p.hcp, p.ff, p.fa, p.hb || '']; }));
        var csv = rows.map(function (r) { return r.map(function (c) { c = String(c); return /[",]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
        try {
          var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'cambridge-district-' + kind + '-2026-27.csv'; document.body.appendChild(a); a.click(); a.remove();
        } catch (err) { /* sandboxed hosts block downloads */ }
        modal('csv-modal', 'Export: ' + kind, '<p>' + (rows.length - 1) + ' rows. The file downloads where the browser allows it; the first rows are shown here.</p><div class="code">' + esc(csv.split('\n').slice(0, 8).join('\n')) + '</div>');
        openModal('csv-modal');
      });
    });
  }

  /* ======================================================================
     Foundations
     ====================================================================== */
  function initFoundations() {
    var f = $('#redirect-form'); if (!f) return;
    var map = [
      [/online-snooker\.asp.*leagueid=50/i, '/leagues/cambridge-district-snooker/tables'],
      [/snooker-results\.asp.*leagueid=50/i, '/leagues/cambridge-district-snooker/fixtures'],
      [/snooker-players\.asp.*leagueid=50/i, '/leagues/cambridge-district-snooker/players'],
      [/snooker-player-results\.asp/i, '/players/{player-name}'],
      [/snooker-clubs\.asp.*leagueid=50/i, '/leagues/cambridge-district-snooker/clubs'],
      [/snooker-highest-break\.asp/i, '/breaks'],
      [/snooker-uk\.asp/i, '/run-a-league/pricing'],
      [/snooker-forum\.asp/i, '/community/forum-archive'],
      [/snooker-software\.asp/i, '/privacy'],
      [/snooker-search\.asp|search-snooker-players\.asp/i, '/search'],
      [/mobile\//i, '(same address as desktop; the /mobile/ copy is retired)']
    ];
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('#old-url').value.trim(), out = null;
      for (var i = 0; i < map.length; i++) if (map[i][0].test(v)) { out = map[i][1]; break; }
      $('#redirect-out').innerHTML = out ? '<b>301 redirect to</b> <span class="code" style="display:inline-block;padding:0.25rem 0.5rem">' + esc(out) + '</span>' : 'No rule matches yet. Unmatched old addresses go to search with the old page name filled in, and are logged so we can add a rule.';
    });
    $all('[data-try-url]').forEach(function (b) { b.addEventListener('click', function () { $('#old-url').value = b.getAttribute('data-try-url'); f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit')); }); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHubTabs(); initSiteNav();
    initConsent(); initOmni(); initHomeStats(); initFinder();
    initOverview(); initTables(); initFixtures(); initCups(); initClubs(); initArchive(); initLeagueInfo();
    initMatch(); initSubmit(); initLive();
    initPlayer(); initRankings(); initBreaks(); initAccount();
    initCalc(); initSetup(); initSignIn(); initAdmin();
    initFoundations();
    syncFollow();
  });
})();
