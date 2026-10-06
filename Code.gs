/**
 * 「나한테 맞는 AI 에이전트는?」 백엔드 — 응답 저장 전용
 *
 * 설정: 확장 프로그램 > Apps Script > 프로젝트 설정 > 스크립트 속성에 추가
 *   SHARED_TOKEN = 아무 문자열 (index.html의 CONFIG.token과 같게)
 *
 * 자극(에이전트 협상문)은 stimuli.js에 고정되어 있어 API 키가 필요 없습니다.
 */

var SHEET_RAW = 'raw';
var SHEET_S1 = 'responses';
var SHEET_S2 = 'comparisons';
var SHEET_SESS = 'sessions';

/* ===================== 엔트리 ===================== */
function doPost(e) {
  var out = {ok:false};
  try {
    var req = JSON.parse(e.postData.contents);
    if (req.token !== prop_('SHARED_TOKEN')) throw new Error('bad_token');
    if (req.action === 'log') out = logSession_(req.session);
    else throw new Error('unknown_action');
  } catch (err) {
    out = {ok:false, error:String(err && err.message || err)};
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ok:true, alive:true})).setMimeType(ContentService.MimeType.JSON);
}
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }
function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); if (headers) sh.appendRow(headers); }
  return sh;
}

/* ===================== 저장 =====================
   토큰은 브라우저 코드에 들어가므로 비밀이 아니다. 아래 가드는
   토큰이 알려졌을 때 생길 수 있는 '데이터 오염'을 막기 위한 것이다.
   - 세션 하나가 보낼 수 있는 기록 수 제한
   - 한 IP/세션이 과도하게 보내는 경우 차단
   - 저장 크기 상한
   - 수집 종료 스위치 (COLLECTING = 'off')                        */

var MAX_ROWS_PER_SESSION = 12;     // 정상 참여는 5~9행
var MAX_JSON_CHARS = 60000;        // 정상 세션은 1만자 안팎
var MAX_ROWS_TOTAL = 20000;        // 시트 폭주 방지

function logSession_(sess) {
  if (prop_('COLLECTING') === 'off') throw new Error('collection_closed');
  if (!sess || !sess.sid) throw new Error('no_session');
  if (typeof sess.sid !== 'string' || sess.sid.length > 64) throw new Error('bad_sid');

  var json = JSON.stringify(sess);
  if (json.length > MAX_JSON_CHARS) throw new Error('too_large');

  var sh = sheet_(SHEET_RAW, ['ts','sid','pid','src','status','persona','json']);
  if (sh.getLastRow() > MAX_ROWS_TOTAL) throw new Error('sheet_full');

  // 같은 세션이 지나치게 많은 행을 쌓는 것을 막는다 (캐시로 가볍게 센다)
  var cache = CacheService.getScriptCache();
  var key = 'n_' + sess.sid;
  var n = Number(cache.get(key) || 0) + 1;
  if (n > MAX_ROWS_PER_SESSION) throw new Error('too_many_rows');
  cache.put(key, String(n), 21600);   // 6시간

  sh.appendRow([new Date(), sess.sid, String(sess.pid || '').slice(0, 64),
                String(sess.src || '').slice(0, 64), String(sess.status || '').slice(0, 32),
                String(sess.persona || '').slice(0, 32), json]);
  return {ok:true};
}

/* ===================== 분석용 시트로 펼치기 ===================== */
/** raw의 세션별 최신 기록을 responses / comparisons / sessions 시트로 정리 */
function flatten() {
  var raw = sheet_(SHEET_RAW).getDataRange().getValues();
  var latest = {};
  for (var i = 1; i < raw.length; i++) {
    var sid = raw[i][1]; if (!sid) continue;
    var j = JSON.parse(raw[i][6]);
    if (!latest[sid] || (j.updatedAt || 0) >= (latest[sid].updatedAt || 0)) latest[sid] = j;
  }
  var s1 = [['sid','pid','src','status','persona','pos','scenario','block','choice','why','bans','ms_to_first','ms_total']];
  var s2 = [['sid','scenario','factor','picked_because','shown_left','shown_right','action','chosen_level','why','bans','match','view_ms']];
  var ss = [['sid','pid','src','status','persona','started','completed','minutes','comm1','comm2','comm3','comm4','dir1','dir2','general','boundary','age','use','n_auto','n_cond','n_self','n_neither']];

  Object.keys(latest).forEach(function(sid){
    var d = latest[sid], p = d.pre || {}, sv = d.survey || {};
    var c = {auto:0, cond:0, self:0};
    (d.stage1 || []).forEach(function(a, k){
      if (c[a.choice] !== undefined) c[a.choice]++;
      s1.push([sid, d.pid||'', d.src||'', d.status||'', d.persona||'', a.pos, a.id, a.block, a.choice,
               a.why||'', (a.bans||[]).join('|'),
               (a.tFirst && a.shown) ? a.tFirst - a.shown : '',
               (a.tDone && a.shown) ? a.tDone - a.shown : '']);
    });
    var neither = 0;
    (d.stage2 || []).forEach(function(b){
      if (b.action === 'neither') neither++;
      s2.push([sid, b.id, b.factor||'', b.reason||'', (b.shownOrder||[])[0]||'', (b.shownOrder||[])[1]||'',
               b.action||'', b.chosenLevel||'', b.why||'', (b.bans2||[]).join('|'), b.match||'',
               b.cached===true, b.viewMs||'']);
    });
    var mins = (d.completedAt && d.startedAt) ? Math.round((d.completedAt - d.startedAt)/600)/100 : '';
    ss.push([sid, d.pid||'', d.src||'', d.status||'', d.persona||'',
             d.startedAt? new Date(d.startedAt):'', d.completedAt? new Date(d.completedAt):'', mins,
             p.comm1||'', p.comm2||'', p.comm3||'', p.comm4||'', p.dir1||'', p.dir2||'',
             sv.general||'', sv.boundary||'', sv.age||'', sv.use||'',
             c.auto, c.cond, c.self, neither]);
  });

  write_(SHEET_S1, s1); write_(SHEET_S2, s2); write_(SHEET_SESS, ss);
  SpreadsheetApp.getActive().toast('정리 완료: 세션 ' + (ss.length-1) + '건');
}
function write_(name, rows) {
  var sh = sheet_(name);
  sh.clear();
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('연구')
    .addItem('분석용 시트로 정리 (flatten)', 'flatten')
    .addToUi();
}
