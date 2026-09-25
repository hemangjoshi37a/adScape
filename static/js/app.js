// adScape — shared client helpers used by every page.
(function () {
  'use strict';

  var ICONS = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    video: '<rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3"/>',
    text: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>'
  };

  function icon(name) {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Toasts ----------
  function toast(message, type) {
    type = type || 'success';
    var region = document.getElementById('toasts');
    if (!region) return;
    var el = document.createElement('div');
    el.className = 'toast ' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = icon(type === 'error' ? 'alert' : 'check') + '<span>' + escapeHtml(message) + '</span>';
    region.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 250);
    }, type === 'error' ? 6000 : 3500);
  }

  // ---------- Confirm dialog ----------
  function confirmDialog(opts) {
    var dialog = document.getElementById('confirm-dialog');
    if (!dialog || typeof dialog.showModal !== 'function') {
      return Promise.resolve(window.confirm(opts.title + '\n\n' + (opts.message || '')));
    }
    dialog.querySelector('[data-title]').textContent = opts.title;
    dialog.querySelector('[data-message]').textContent = opts.message || '';
    dialog.querySelector('[data-confirm]').textContent = opts.confirmLabel || 'Confirm';
    dialog.returnValue = '';
    dialog.showModal();
    return new Promise(function (resolve) {
      dialog.addEventListener('close', function onClose() {
        dialog.removeEventListener('close', onClose);
        resolve(dialog.returnValue === 'confirm');
      });
    });
  }

  // ---------- Dates & ad status ----------
  function parseDate(value) {
    // Backend sends "YYYY-MM-DD HH:MM:SS" in the display's local time.
    return new Date(String(value).replace(' ', 'T'));
  }

  function adStatus(ad, now) {
    now = now || new Date();
    if (parseDate(ad.ad_end_time) < now) return 'expired';
    if (parseDate(ad.ad_start_time) > now) return 'upcoming';
    return 'live';
  }

  var STATUS_LABEL = { live: 'Live', upcoming: 'Scheduled', expired: 'Ended' };

  function statusBadge(status) {
    var cls = status === 'live' ? 'badge-live' : status === 'upcoming' ? 'badge-upcoming' : '';
    return '<span class="badge ' + cls + '">' + STATUS_LABEL[status] + '</span>';
  }

  function formatDate(date) {
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function relative(date, now) {
    now = now || new Date();
    var diff = date - now;
    var abs = Math.abs(diff);
    var units = [['day', 864e5], ['hour', 36e5], ['minute', 6e4]];
    for (var i = 0; i < units.length; i++) {
      if (abs >= units[i][1] || i === units.length - 1) {
        var n = Math.max(1, Math.round(abs / units[i][1]));
        var text = n + ' ' + units[i][0] + (n === 1 ? '' : 's');
        return diff >= 0 ? 'in ' + text : text + ' ago';
      }
    }
  }

  function thumb(ad) {
    if (ad.ad_type === 'picture') {
      // The icon sits behind the image and shows through if the file is missing.
      return '<div class="thumb" style="position:relative">' + icon('image') +
        '<img loading="lazy" alt="" style="position:absolute;inset:0" src="/uploads/' + encodeURIComponent(ad.file_name) +
        '" onerror="this.remove()"></div>';
    }
    return '<div class="thumb">' + icon(ad.ad_type === 'video' ? 'video' : 'text') + '</div>';
  }

  function fetchAds() {
    return fetch('/fetchdata.py').then(function (res) {
      if (!res.ok) throw new Error('Request failed (' + res.status + ')');
      return res.json();
    });
  }

  // ---------- Theme ----------
  function initTheme() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var root = document.documentElement;
      var current = root.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('adscape-theme', next); } catch (e) { /* storage unavailable */ }
    });
  }

  // ---------- Mobile navigation ----------
  function initNav() {
    var btn = document.getElementById('menu-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (document.body.classList.contains('nav-open') && !e.target.closest('.sidebar') && !e.target.closest('#menu-btn')) {
        document.body.classList.remove('nav-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---------- Display power control ----------
  var player = { running: null, listeners: [] };

  function renderPlayer() {
    var el = document.getElementById('player');
    if (!el) return;
    var state = player.running === null ? 'unknown' : player.running ? 'running' : 'stopped';
    el.setAttribute('data-state', state);
    el.querySelector('.player-label').textContent =
      state === 'running' ? 'Display on' : state === 'stopped' ? 'Display off' : 'Checking…';
    var btn = el.querySelector('button');
    btn.textContent = player.running ? 'Stop' : 'Start';
    btn.className = 'btn ' + (player.running ? '' : 'btn-primary');
    btn.disabled = player.running === null;
    player.listeners.forEach(function (fn) { fn(player.running); });
  }

  function setPlayer(running) {
    player.running = running;
    renderPlayer();
  }

  function initPlayer() {
    var el = document.getElementById('player');
    if (!el) return;
    fetch('/script_status').then(function (r) { return r.json(); })
      .then(function (d) { setPlayer(!!d.running); })
      .catch(function () { setPlayer(false); });

    el.querySelector('button').addEventListener('click', function () {
      var wantRunning = !player.running;
      var btn = this;
      btn.disabled = true;
      btn.textContent = wantRunning ? 'Starting…' : 'Stopping…';
      fetch(wantRunning ? '/start_script' : '/stop_script')
        .then(function (r) {
          if (!r.ok) throw new Error();
          return r.json().catch(function () { return { running: wantRunning }; });
        })
        .then(function (d) {
          setPlayer(!!d.running);
          toast(d.running ? 'Display started' : 'Display stopped');
        })
        .catch(function () {
          renderPlayer();
          toast('Could not ' + (wantRunning ? 'start' : 'stop') + ' the display', 'error');
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initNav();
    initPlayer();
  });

  window.adscape = {
    icon: icon,
    escapeHtml: escapeHtml,
    toast: toast,
    confirmDialog: confirmDialog,
    parseDate: parseDate,
    adStatus: adStatus,
    statusBadge: statusBadge,
    formatDate: formatDate,
    relative: relative,
    thumb: thumb,
    fetchAds: fetchAds,
    onPlayerChange: function (fn) { player.listeners.push(fn); if (player.running !== null) fn(player.running); }
  };
})();
