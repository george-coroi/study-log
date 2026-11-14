/* Google sign-in and cloud save (Firebase). Does nothing until firebase-config.js is filled in,
   so the app still works on its own, saving in the browser. One document per person: users/<uid>. */
(function () {
  var cfg = window.FIREBASE_CONFIG;
  var box = document.getElementById('account');
  if (!cfg || !cfg.apiKey || location.protocol === 'file:' || !box) return;
  box.hidden = false;

  var base = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var note = document.getElementById('account-note'), inBtn = document.getElementById('sign-in'), outBtn = document.getElementById('sign-out');
  var user = null, db = null, auth = null, timer = null, applying = false, lastSent = '';
  var tsKey = function () { return 'study-log-cloud-ts-' + user.uid; };

  function script(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s);
    });
  }

  function upload() {
    if (!user) return Promise.resolve();
    var json = JSON.stringify(window.studyLogData());
    if (json === lastSent) return Promise.resolve();
    var now = Date.now(); timer = null;
    return db.collection('users').doc(user.uid).set({ data: json, updatedAt: now }).then(function () {
      lastSent = json; try { localStorage.setItem(tsKey(), String(now)); } catch (e) {}
    }).catch(function () { note.textContent = 'Could not save to your account just now. It is still saved on this device.'; });
  }

  function pull() {
    return db.collection('users').doc(user.uid).get().then(function (snap) {
      var remote = snap.exists ? snap.data() : null, local = Number(localStorage.getItem(tsKey()) || 0);
      if (remote && remote.updatedAt > local) {
        applying = true;
        try { window.studyLogApply(JSON.parse(remote.data)); lastSent = remote.data; localStorage.setItem(tsKey(), String(remote.updatedAt)); }
        finally { applying = false; }
      } else { lastSent = ''; return upload(); }
    });
  }

  // Coming back to this tab (or opening it on another device): fetch anything newer, unless a change here is still waiting to be saved.
  document.addEventListener('visibilitychange', function () { if (!document.hidden && user && !timer) pull().catch(function () {}); });

  window.studyLogCloud = {
    changed: function () {
      if (!user || applying) return;
      clearTimeout(timer); timer = setTimeout(upload, 2000);
    }
  };

  function show() {
    inBtn.hidden = !!user; outBtn.hidden = !user;
    note.textContent = user
      ? 'Signed in as ' + (user.email || user.displayName) + '. Your study log is saved to your account and only you can read it.'
      : 'Sign in with Google to keep your study log on every device. Only you can read it.';
  }

  Promise.all([script(base + 'firebase-app-compat.js')]).then(function () {
    return Promise.all([script(base + 'firebase-auth-compat.js'), script(base + 'firebase-firestore-compat.js')]);
  }).then(function () {
    firebase.initializeApp(cfg); auth = firebase.auth(); db = firebase.firestore();
    auth.onAuthStateChanged(function (u) { user = u; show(); if (u) pull().catch(function () { note.textContent = 'Could not reach your account. Working from this device.'; }); });
    inBtn.addEventListener('click', function () {
      auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(function () { note.textContent = 'Sign-in did not finish. Try again.'; });
    });
    outBtn.addEventListener('click', function () {
      clearTimeout(timer);
      upload().then(function () {
        if (JSON.stringify(window.studyLogData()) !== lastSent) { note.textContent = 'Not signed out: your latest changes have not reached your account yet. Check your connection and try again.'; throw new Error('unsaved'); }
        // Wipe this device so the next person on a shared computer starts clean; the data stays in the account.
        try { localStorage.removeItem('study-log-v1'); } catch (e) {}
        return auth.signOut();
      }).then(function () { location.reload(); }, function () {});
    });
  }).catch(function () { box.hidden = true; });  // offline or blocked: carry on without accounts
})();
