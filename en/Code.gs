/**
 * English study backend — "What Kind of AI Agent Fits You?"
 *
 * Paste this into a NEW Google Spreadsheet's Apps Script.
 * The Korean study keeps its own sheet and its own script; nothing here touches it.
 *
 * Setup:
 *   1. New Google Sheet → Extensions → Apps Script → paste this file
 *   2. Project Settings → Script Properties → add:
 *        SHARED_TOKEN = any string (must match CONFIG.token in en/index.html)
 *        COLLECTING   = (optional) set to "off" to stop accepting responses
 *   3. Deploy → New deployment → Web app
 *        Execute as: Me        Who has access: Anyone
 *   4. Copy the /exec URL into CONFIG.endpoint in en/index.html
 *   5. Reload the sheet — a "Research" menu appears
 *
 * No API key is needed. The stimuli are fixed in en/stimuli.js.
 */

var SHEET_RAW  = 'raw';
var SHEET_S1   = 'responses';
var SHEET_S2   = 'comparisons';
var SHEET_SESS = 'sessions';

var MAX_ROWS_PER_SESSION = 12;     // a normal run writes 5–10 rows
var MAX_JSON_CHARS = 45000;        // under the 50,000-char cell limit (a real session is ~6,500)
var MAX_ROWS_TOTAL = 200000;       // runaway guard; ~28,000 participants
var LOCK_WAIT_MS = 20000;          // how long to wait when submissions collide

/* ===================== entry ===================== */
function doPost(e) {
  var out = {ok: false};
  try {
    var req = JSON.parse(e.postData.contents);
    if (req.token !== prop_('SHARED_TOKEN')) throw new Error('bad_token');
    if (req.action === 'log') out = logSession_(req.session);
    else throw new Error('unknown_action');
  } catch (err) {
    out = {ok: false, error: String(err && err.message || err)};
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ok: true, alive: true}))
    .setMimeType(ContentService.MimeType.JSON);
}
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }
function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); if (headers) sh.appendRow(headers); }
  return sh;
}

/* ===================== saving =====================
   The shared token lives in browser code, so it is not a secret. The guards
   below limit the damage if someone finds it: they can add junk rows, but
   cannot read the sheet or delete anything.                                  */
function logSession_(sess) {
  if (prop_('COLLECTING') === 'off') throw new Error('collection_closed');
  if (!sess || !sess.sid) throw new Error('no_session');
  if (typeof sess.sid !== 'string' || sess.sid.length > 64) throw new Error('bad_sid');

  var json = JSON.stringify(sess);
  if (json.length > MAX_JSON_CHARS) throw new Error('too_large');

  // cap how many rows one session can pile up
  var cache = CacheService.getScriptCache();
  var key = 'n_' + sess.sid;
  var n = Number(cache.get(key) || 0) + 1;
  if (n > MAX_ROWS_PER_SESSION) throw new Error('too_many_rows');
  cache.put(key, String(n), 21600);   // 6 hours

  // serialize writes so simultaneous submissions never overwrite each other
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) throw new Error('busy');
  try {
    var sh = sheet_(SHEET_RAW, ['ts', 'lang', 'sid', 'prolific_pid', 'src', 'status', 'persona', 'json']);
    if (sh.getLastRow() > MAX_ROWS_TOTAL) throw new Error('sheet_full');
    sh.appendRow([
      new Date(),
      String(sess.lang || 'en').slice(0, 8),
      sess.sid,
      String(sess.pid || '').slice(0, 64),
      String(sess.src || '').slice(0, 64),
      String(sess.status || '').slice(0, 32),
      String(sess.persona || '').slice(0, 32),
      json
    ]);
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  return {ok: true};
}

/* ===================== flatten for analysis ===================== */
function flatten() {
  var sh = sheet_(SHEET_RAW);
  var raw = sh.getDataRange().getValues();
  if (raw.length < 2) { SpreadsheetApp.getActive().toast('No data yet.'); return; }

  var hdr = raw[0];
  var cJson = hdr.indexOf('json'), cSid = hdr.indexOf('sid');
  if (cJson < 0 || cSid < 0) { SpreadsheetApp.getActive().toast('Unexpected header row.'); return; }

  var latest = {};
  for (var i = 1; i < raw.length; i++) {
    var sid = raw[i][cSid];
    if (!sid) continue;
    var j;
    try { j = JSON.parse(raw[i][cJson]); } catch (e) { continue; }
    if (!latest[sid] || (j.updatedAt || 0) >= (latest[sid].updatedAt || 0)) latest[sid] = j;
  }

  var s1 = [['sid', 'lang', 'prolific_pid', 'src', 'status', 'persona', 'pos', 'scenario',
             'block', 'choice', 'why', 'bans', 'ms_to_first', 'ms_total']];
  var s2 = [['sid', 'lang', 'scenario', 'factor', 'picked_because', 'shown_left', 'shown_right',
             'action', 'chosen_level', 'why', 'bans', 'match', 'view_ms']];
  var ss = [['sid', 'lang', 'prolific_pid', 'study_id', 'session_id', 'src', 'status', 'persona',
             'started', 'completed', 'minutes', 'comm1', 'comm2', 'comm3', 'comm4', 'dir1', 'dir2',
             'general', 'boundary', 'age', 'use', 'us_years', 'n_auto', 'n_cond', 'n_self', 'n_neither',
             'policy_accuracy']];

  Object.keys(latest).forEach(function (sid) {
    var d = latest[sid], p = d.pre || {}, sv = d.survey || {};
    var lang = d.lang || 'en';
    var c = {auto: 0, cond: 0, self: 0};

    (d.stage1 || []).forEach(function (a) {
      if (c[a.choice] !== undefined) c[a.choice]++;
      s1.push([sid, lang, d.pid || '', d.src || '', d.status || '', d.persona || '',
               a.pos, a.id, a.block, a.choice, a.why || '', (a.bans || []).join('|'),
               (a.tFirst && a.shown) ? a.tFirst - a.shown : '',
               (a.tDone && a.shown) ? a.tDone - a.shown : '']);
    });

    var neither = 0;
    (d.stage2 || []).forEach(function (b) {
      if (b.action === 'neither') neither++;
      s2.push([sid, lang, b.id, b.factor || '', b.reason || '',
               (b.shownOrder || [])[0] || '', (b.shownOrder || [])[1] || '',
               b.action || '', b.chosenLevel || '', b.why || '',
               (b.bans2 || []).join('|'), b.match || '', b.viewMs || '']);
    });

    var mins = (d.completedAt && d.startedAt)
      ? Math.round((d.completedAt - d.startedAt) / 600) / 100 : '';
    ss.push([sid, lang, d.pid || '', d.studyId || '', d.sessionId || '', d.src || '',
             d.status || '', d.persona || '',
             d.startedAt ? new Date(d.startedAt) : '',
             d.completedAt ? new Date(d.completedAt) : '', mins,
             p.comm1 || '', p.comm2 || '', p.comm3 || '', p.comm4 || '',
             p.dir1 || '', p.dir2 || '',
             sv.general || '', sv.boundary || '', sv.age || '', sv.use || '', sv.usyears || '',
             c.auto, c.cond, c.self, neither,
             (d.policy || {}).accuracy !== undefined ? d.policy.accuracy : '']);
  });

  write_(SHEET_S1, s1);
  write_(SHEET_S2, s2);
  write_(SHEET_SESS, ss);
  SpreadsheetApp.getActive().toast('Done — ' + (ss.length - 1) + ' sessions.');
}

function write_(name, rows) {
  var sh = sheet_(name);
  sh.clear();
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

/* ===================== Prolific helper =====================
   Lists the Prolific IDs of everyone who finished, so you can cross-check
   against Prolific's submission list before approving payments.             */
function completedProlificIds() {
  var sh = sheet_(SHEET_RAW);
  var raw = sh.getDataRange().getValues();
  var hdr = raw[0], cJson = hdr.indexOf('json'), cSid = hdr.indexOf('sid');
  var latest = {};
  for (var i = 1; i < raw.length; i++) {
    var sid = raw[i][cSid]; if (!sid) continue;
    var j; try { j = JSON.parse(raw[i][cJson]); } catch (e) { continue; }
    if (!latest[sid] || (j.updatedAt || 0) >= (latest[sid].updatedAt || 0)) latest[sid] = j;
  }
  var done = [], partial = [];
  Object.keys(latest).forEach(function (sid) {
    var d = latest[sid];
    if (!d.pid) return;
    (d.policy ? done : partial).push(d.pid);
  });
  var msg = 'Completed: ' + done.length + '\n' + done.join('\n') +
            '\n\nStarted but did not finish: ' + partial.length + '\n' + partial.join('\n');
  SpreadsheetApp.getUi().alert('Prolific IDs', msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Research')
    .addItem('Flatten for analysis', 'flatten')
    .addItem('List Prolific IDs', 'completedProlificIds')
    .addToUi();
}
