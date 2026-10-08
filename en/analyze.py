#!/usr/bin/env python3
"""
「나한테 맞는 AI 에이전트는?」 분석 스크립트

사용법:
    python3 analyze.py <raw시트_내보내기.tsv>          # 결과를 화면에 출력
    python3 analyze.py <파일> --out results/           # 표·그림·CSV를 폴더에 저장

입력: 구글 시트 raw 탭을 TSV(또는 CSV)로 내보낸 파일
      열 구성: ts, sid, pid, src, status, persona, json

필요 패키지: pandas, scipy  (그림을 그리려면 matplotlib, 순서형 모형은 statsmodels)
"""

import argparse, csv, json, math, os, sys
from collections import Counter, defaultdict
from statistics import mean, median

try:
    from scipy import stats
except ImportError:
    sys.exit("scipy가 필요합니다:  pip install scipy")

# ───────────────────────── 사전등록 설정 ─────────────────────────
MIN_MINUTES = 3.0      # 이보다 빨리 완주 = 성실하지 않은 응답으로 제외
MAX_MINUTES = 40.0     # 이보다 오래 = 탭을 열어둔 것으로 보고 제외
ALPHA = 0.05

# 시나리오 속성. (블록, 선례성, 표명성, 가역성, 관계)
SCN = {
    "C1": ("coord", 0, 0, 1, 0, "팀 회의 시간"),
    "C2": ("coord", 0, 0, 1, 0, "여행 정산"),
    "C3": ("coord", 0, 0, 1, 0, "호텔 예약 변경"),
    "C4": ("coord", 0, 0, 1, 0, "공동구매 배분"),
    "C5": ("coord", 0, 0, 1, 0, "중고거래 시간"),
    "C6": ("coord", 0, 0, 1, 0, "이사 견적"),
    "C7": ("coord", 0, 0, 1, 0, "스터디 순서"),
    "C8": ("coord", 0, 0, 1, 0, "렌터카 분담"),
    "E1": ("edge", 0, 0, 1, 1, "단골집 취소"),
    "E2": ("edge", 1, 0, 1, 0, "작업 범위 재협의"),
    "E3": ("edge", 0, 0, 1, 1, "명절 일정"),
    "E4": ("edge", 1, 0, 1, 1, "업무 재분배"),
    "X1": ("exception", 1, 0, 0, 1, "저자 순서"),
    "X2": ("exception", 1, 0, 0, 1, "선배 부탁 거절"),
    "X3": ("exception", 0, 1, 0, 1, "조의 전하기"),
    "X4": ("exception", 0, 1, 0, 1, "내 실수 사과"),
}
BLOCKS = ["coord", "edge", "exception"]
BLOCK_KR = {"coord": "조율", "edge": "경계", "exception": "예외"}
CHOICE_KR = {"auto": "맡김", "cond": "제한 후 위임", "self": "직접"}
CHOICE_ORD = {"auto": 0, "cond": 1, "self": 2}   # 위임 거부 방향으로 증가

OUT = []
def say(s=""):
    print(s)
    OUT.append(str(s))

def head(t):
    say()
    say("─" * 68)
    say(t)
    say("─" * 68)

def pct(x):
    return f"{x:.0%}"

def fmt_p(p):
    return "p < .001" if p < .001 else f"p = {p:.3f}"

# ───────────────────────── 데이터 읽기 ─────────────────────────
def load(path):
    """raw 시트 내보내기를 읽는다. lang 열이 있는 새 형식과 없는 예전 형식을 모두 처리."""
    csv.field_size_limit(10 ** 7)
    delim = "\t" if path.lower().endswith((".tsv", ".txt")) else ","
    rows, c_json = [], None
    with open(path, newline="", encoding="utf-8-sig") as f:
        for r in csv.reader(f, delimiter=delim):
            if not r:
                continue
            if c_json is None and "json" in r:          # 헤더 행
                c_json = r.index("json")
                continue
            if len(r) > (c_json if c_json is not None else 6):
                rows.append(r)
    if c_json is None:
        c_json = 6                                       # 헤더가 없으면 예전 형식으로 가정
    latest, good = {}, []
    for r in rows:
        if len(r) <= c_json or not r[c_json].strip():
            continue
        try:
            j = json.loads(r[c_json])
        except Exception:
            continue
        good.append(r)
        sid = j.get("sid")
        if not sid:
            continue
        if sid not in latest or (j.get("updatedAt") or 0) >= (latest[sid].get("updatedAt") or 0):
            latest[sid] = j
    return good, list(latest.values())

def n1(j): return len(j.get("stage1") or [])
def n2(j): return len(j.get("stage2") or [])
def minutes(j):
    if j.get("completedAt") and j.get("startedAt"):
        return (j["completedAt"] - j["startedAt"]) / 60000
    return None

def persona_of(j):
    """유형은 저장값 대신 재계산한다 (일부 세션에 라벨이 비어 있음)."""
    s = j.get("stage1") or []
    if not s:
        return None
    c = Counter(a["choice"] for a in s)
    deleg = (c["auto"] + c["cond"] * .5) / len(s)
    p = j.get("pre") or {}
    comm = mean([p.get(k, 4) for k in ("comm1", "comm2", "comm3", "comm4")])
    dirv = mean([p.get(k, 4) for k in ("dir1", "dir2")])
    rel = comm - dirv
    if deleg >= .7:
        return "chief" if rel > 0 else "twin"
    if deleg >= .4:
        return "ruler" if c["cond"] >= c["self"] else "dial"
    return "letter" if rel > 0 else "wheel"

def deleg_index(j):
    c = Counter(a["choice"] for a in j["stage1"])
    return (c["auto"] + c["cond"] * .5) / len(j["stage1"])

def comm_score(j):
    p = j.get("pre") or {}
    return mean([p.get(k, 4) for k in ("comm1", "comm2", "comm3", "comm4")]) if p else None

# ───────────────────────── 분석 ─────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", help="raw 시트 내보내기 파일 (.tsv/.csv)")
    ap.add_argument("--out", help="결과를 저장할 폴더")
    ap.add_argument("--keep-outliers", action="store_true", help="시간 기준 제외를 적용하지 않음")
    ap.add_argument("--lang", choices=["ko", "en"], help="언어별로 나눠 분석 (en=영어판, ko=한국어판)")
    args = ap.parse_args()

    rows, S = load(args.path)

    # ── 1. 표본과 제외 ────────────────────────────────────────
    head("1. 표본")
    say(f"기록 행 {len(rows)}개 · 고유 세션 {len(S)}명")
    langs = Counter(j.get("lang") or "ko" for j in S)
    if len(langs) > 1:
        say("언어별: " + " · ".join(f"{k} {v}명" for k, v in langs.most_common()))
    if args.lang:
        S = [j for j in S if (j.get("lang") or "ko") == args.lang]
        say(f"언어 필터 적용: {args.lang} → {len(S)}명")

    excluded = []
    if not args.keep_outliers:
        keep = []
        for j in S:
            m = minutes(j)
            if m is not None and (m < MIN_MINUTES or m > MAX_MINUTES):
                excluded.append((j["sid"][:8], round(m, 1)))
            else:
                keep.append(j)
        S = keep
    say(f"제외 기준: 완주 {MIN_MINUTES}분 미만 또는 {MAX_MINUTES}분 초과")
    say(f"제외된 참가자 {len(excluded)}명  {excluded if excluded else ''}")

    s1 = [j for j in S if n1(j) >= 16]          # 1단계 완료 = 주 분석 표본
    done = [j for j in s1 if j.get("policy")]    # 전체 완주
    part = [j for j in s1 if not j.get("policy")]
    say()
    say("참여 단계별 인원")
    funnel = [
        ("들어옴", len(S)),
        ("성향 문항 완료", sum(1 for j in S if j.get("pre"))),
        ("1단계 16문항 완료 (주 분석)", len(s1)),
        ("비교 과제 1개 이상", sum(1 for j in S if n2(j) >= 1)),
        ("비교 과제 3개 완료", sum(1 for j in S if n2(j) >= 3)),
        ("설문 완료", sum(1 for j in S if j.get("survey"))),
        ("정책 확인 완료 (전체 완주)", len(done)),
    ]
    prev = None
    for lab, c in funnel:
        tail = "" if prev is None else f"  (직전 단계의 {c/prev:.0%})"
        say(f"  {lab:28s} {c:4d}명{tail}")
        prev = c
    if s1:
        ms = [m for m in (minutes(j) for j in done) if m]
        if ms:
            say()
            say(f"완주 소요 시간: 중앙값 {median(ms):.1f}분 (범위 {min(ms):.1f}–{max(ms):.1f})")

    if len(s1) < 10:
        say("\n표본이 너무 작아 분석을 중단합니다.")
        return

    # ── 2. 이탈 편향 점검 ─────────────────────────────────────
    head("2. 이탈 편향 점검 (완주자 vs 1단계만 완료자)")
    if part:
        say(f"{'':14s} {'완주 '+str(len(done))+'명':>14s} {'중단 '+str(len(part))+'명':>14s}   검정")
        a = [deleg_index(j) for j in done]
        b = [deleg_index(j) for j in part]
        u = stats.mannwhitneyu(a, b)
        say(f"  {'맡김 지수':12s} {mean(a):>14.3f} {mean(b):>14.3f}   {fmt_p(u.pvalue)}")
        ca = [c for c in (comm_score(j) for j in done) if c]
        cb = [c for c in (comm_score(j) for j in part) if c]
        if ca and cb:
            u2 = stats.mannwhitneyu(ca, cb)
            say(f"  {'관계 성향':12s} {mean(ca):>14.2f} {mean(cb):>14.2f}   {fmt_p(u2.pvalue)}")
        for blk in BLOCKS:
            pa = [sum(1 for x in j["stage1"] if SCN[x["id"]][0] == blk and x["choice"] == "auto") /
                  sum(1 for x in j["stage1"] if SCN[x["id"]][0] == blk) for j in done]
            pb = [sum(1 for x in j["stage1"] if SCN[x["id"]][0] == blk and x["choice"] == "auto") /
                  sum(1 for x in j["stage1"] if SCN[x["id"]][0] == blk) for j in part]
            u3 = stats.mannwhitneyu(pa, pb)
            say(f"  {BLOCK_KR[blk]+' 맡김률':12s} {mean(pa):>14.0%} {mean(pb):>14.0%}   {fmt_p(u3.pvalue)}")
        say()
        say("  → 모든 지표에서 유의한 차이가 없으면 이탈이 결과와 무관하다고 볼 수 있음")
    else:
        say("  중단자가 없어 생략")

    # ── 3. 참가자 특성 ────────────────────────────────────────
    head("3. 참가자 특성")
    sv = [j["survey"] for j in s1 if j.get("survey")]
    say(f"설문 응답 {len(sv)}명")
    for key, lab, order in [("age", "나이대", ["20대", "30대", "40대", "50대 이상"]),
                            ("use", "AI 에이전트 사용 경험", ["없음", "써본 적 있음", "가끔 씀", "자주 씀"])]:
        c = Counter(s.get(key) for s in sv)
        say(f"  {lab}: " + " · ".join(f"{k} {c[k]}명" for k in order if c[k]))
    c = Counter(persona_of(j) for j in s1)
    PK = {"twin": "AI 쌍둥이형", "chief": "비서실장형", "ruler": "조건파형",
          "dial": "케바케형", "letter": "손편지형", "wheel": "운전대형"}
    say("  위임 성향 유형: " + " · ".join(f"{PK.get(k,k)} {v}" for k, v in c.most_common()))
    idx = sorted(deleg_index(j) for j in s1)
    say(f"  맡김 지수: 중앙값 {median(idx):.2f} (범위 {idx[0]:.2f}–{idx[-1]:.2f})")

    # ── 4. H1 — 위임이 기본값인가 ─────────────────────────────
    head("4. H1 — 일상적 조율에서 위임이 기본값인가")
    tab = {}
    for blk in BLOCKS:
        cc = Counter(a["choice"] for j in s1 for a in j["stage1"] if SCN[a["id"]][0] == blk)
        tab[blk] = cc
        n = sum(cc.values())
        say(f"  {BLOCK_KR[blk]:4s} (n={n:4d})  " +
            "  ".join(f"{CHOICE_KR[k]} {cc[k]/n:>4.0%}" for k in ("auto", "cond", "self")))
    say()
    per = {blk: [sum(1 for a in j["stage1"] if SCN[a["id"]][0] == blk and a["choice"] == "auto") /
                 sum(1 for a in j["stage1"] if SCN[a["id"]][0] == blk) for j in s1] for blk in BLOCKS}
    fr = stats.friedmanchisquare(*[per[b] for b in BLOCKS])
    say(f"  세 블록 맡김률 차이 (Friedman, 사람 내 비교, n={len(s1)}):  "
        f"χ²={fr.statistic:.1f}, {fmt_p(fr.pvalue)}")
    w = stats.wilcoxon(per["coord"], per["exception"])
    r = abs(stats.norm.ppf(w.pvalue / 2)) / math.sqrt(len(s1))
    say(f"  조율 vs 예외:  {mean(per['coord']):.0%} vs {mean(per['exception']):.0%}   "
        f"Wilcoxon {fmt_p(w.pvalue)}, r={r:.2f}")

    # ── 5. H2 — 무엇이 위임 거부를 예측하는가 ─────────────────
    head("5. H2 — 무엇이 위임 거부를 예측하는가")
    say("시나리오별 '직접 하겠다' 비율")
    per_s = defaultdict(Counter)
    for j in s1:
        for a in j["stage1"]:
            per_s[a["id"]][a["choice"]] += 1
    ranked = sorted(per_s.items(), key=lambda e: -(e[1]["self"] / sum(e[1].values())))
    for sid, cc in ranked:
        blk, prec, expr, rev, rel, title = SCN[sid]
        n = sum(cc.values())
        tags = "".join(t for t, f in [("선례", prec), ("표명", expr), ("관계", rel)] if f)
        say(f"  {sid}  {title:12s} n={n:3d}  직접 {cc['self']/n:>4.0%}  "
            f"제한 {cc['cond']/n:>4.0%}  맡김 {cc['auto']/n:>4.0%}   {tags}")

    say()
    say("속성별 비교 (사람 내, 각자의 '직접' 비율로 집계)")
    for lab, f_yes, f_no in [
        ("선례성", lambda s: s[1] == 1, lambda s: s[1] == 0),
        ("표명성", lambda s: s[2] == 1, lambda s: s[2] == 0),
        ("가역성 없음", lambda s: s[3] == 0, lambda s: s[3] == 1),
        ("관계 걸림", lambda s: s[4] == 1, lambda s: s[4] == 0)]:
        ids_y = [k for k, v in SCN.items() if f_yes(v)]
        ids_n = [k for k, v in SCN.items() if f_no(v)]
        y = [sum(1 for a in j["stage1"] if a["id"] in ids_y and a["choice"] == "self") / len(ids_y) for j in s1]
        nn = [sum(1 for a in j["stage1"] if a["id"] in ids_n and a["choice"] == "self") / len(ids_n) for j in s1]
        w = stats.wilcoxon(y, nn)
        say(f"  {lab:10s} 해당 {mean(y):>4.0%}  비해당 {mean(nn):>4.0%}   {fmt_p(w.pvalue)}")

    # 순서형 로지스틱 (참가자 군집 보정)
    try:
        import pandas as pd, numpy as np
        from statsmodels.miscmodels.ordinal_model import OrderedModel
        recs = [dict(pid=j["sid"], y=CHOICE_ORD[a["choice"]],
                     prec=SCN[a["id"]][1], expr=SCN[a["id"]][2],
                     irrev=1 - SCN[a["id"]][3], rel=SCN[a["id"]][4])
                for j in s1 for a in j["stage1"]]
        df = pd.DataFrame(recs)
        X = df[["prec", "expr", "irrev", "rel"]].astype(float)
        m = OrderedModel(df.y, X, distr="logit").fit(method="bfgs", disp=False)
        say()
        say(f"순서형 로지스틱 (종속=맡김<제한<직접, N={len(df)} 관측 / {df.pid.nunique()}명)")
        say(f"  {'변수':12s} {'계수':>8s} {'오즈비':>8s} {'p':>10s}")
        for k in X.columns:
            say(f"  {k:12s} {m.params[k]:>8.2f} {np.exp(m.params[k]):>8.2f} {m.pvalues[k]:>10.4f}")
        say("  주의: 참가자 랜덤 절편이 빠져 있어 표준오차가 과소추정됨.")
        say("        확정 결과는 R의 ordinal::clmm 으로 확인할 것 (long_format.csv 저장됨).")
    except ImportError:
        say("\n(순서형 모형 생략: pip install statsmodels pandas)")

    # ── 6. H3 — 사람들이 못 알아보는 경계 ─────────────────────
    head("6. H3 — 사람들이 스스로 알아보지 못하는 경계")
    say("6-1. '직접 하겠다'를 고른 이유")
    whys = Counter(a["why"] for j in s1 for a in j["stage1"] if a.get("why"))
    tot = sum(whys.values()) or 1
    for k, v in whys.most_common():
        say(f"  {k:28s} {v:4d}  ({v/tot:>4.0%})")
    prec_why = whys["다음번의 기준이 될까 봐"]
    expr_why = whys["내가 직접 해야 의미가 있어서"]
    say(f"  → 표명({expr_why})과 선례({prec_why})의 비 = {expr_why/max(prec_why,1):.0f}배")
    say("     사람들은 표명성은 언어화하지만 선례성은 언어화하지 못한다")

    say()
    say("6-2. 작업군별 이유 분포")
    t = defaultdict(Counter)
    for j in s1:
        for a in j["stage1"]:
            if a.get("why"):
                t[SCN[a["id"]][0]][a["why"]] += 1
    for blk in BLOCKS:
        n = sum(t[blk].values()) or 1
        top = t[blk].most_common(3)
        say(f"  {BLOCK_KR[blk]:4s} (n={n:3d})  " + " · ".join(f"{k} {v/n:.0%}" for k, v in top))

    say()
    say("6-3. 정책 추출 정확도와 수정 방향")
    pol = [j["policy"] for j in done if j.get("policy")]
    if pol:
        accs = [p["accuracy"] for p in pol if p.get("accuracy") is not None]
        say(f"  정확도 평균 {mean(accs):.2f} (n={len(accs)}) · 네 줄 모두 승인 "
            f"{sum(1 for a in accs if a == 1)}명 ({sum(1 for a in accs if a==1)/len(accs):.0%})")
        fix, tot2, corr = Counter(), Counter(), defaultdict(Counter)
        for p in pol:
            for r_ in p.get("rules") or []:
                tot2[r_["bucket"]] += 1
                if not r_.get("confirmed"):
                    fix[r_["bucket"]] += 1
                    corr[r_["bucket"]][f"{r_.get('derived')}→{r_.get('corrected')}"] += 1
        say(f"  {'작업군':8s} {'수정률':>10s}   방향")
        for b in ["expr", "prec", "edge", "coord"]:
            if tot2[b]:
                say(f"  {b:8s} {fix[b]}/{tot2[b]} = {fix[b]/tot2[b]:>4.0%}   {dict(corr[b])}")
        if tot2["prec"] and tot2["coord"]:
            fe = stats.fisher_exact([[fix["prec"], tot2["prec"] - fix["prec"]],
                                     [fix["coord"], tot2["coord"] - fix["coord"]]])
            say(f"  선례형 vs 조율형 수정률: Fisher {fmt_p(fe[1])}")
            say("  (표본상 검정력이 부족할 수 있음 — 방향만 기술로 보고할 것)")
        auto_self = sum(v for b in ("prec", "edge") for k, v in corr[b].items() if k == "auto→self")
        if auto_self:
            say(f"  ※ 선례·경계형에서 '맡김→직접'으로 바꾼 사례 {auto_self}건 "
                f"= 개별 판단에서는 맡긴다고 했다가 규칙으로 보고 철회")

    # ── 7. 비교 과제 ──────────────────────────────────────────
    head("7. 비교 과제 — 어떤 에이전트를 내 이름으로 내보내는가")
    s2 = [a for j in S for a in (j.get("stage2") or []) if a.get("action")]
    say(f"총 {len(s2)}건")
    for f_ in ("concession", "closure"):
        sub = [a for a in s2 if a.get("factor") == f_]
        if not sub:
            continue
        c = Counter(a.get("chosenLevel") or "neither" for a in sub)
        lab = {"concession": "양보 권한 (조건 관철 hold vs 손해 감수 yield)",
               "closure": "마무리 방식 (전부 확정 closed vs 여지 남김 open)"}[f_]
        say()
        say(f"[{lab}]  n={len(sub)}")
        pair = ("yield", "hold") if f_ == "concession" else ("open", "closed")
        a_, b_ = c[pair[0]], c[pair[1]]
        if a_ + b_:
            bt = stats.binomtest(a_, a_ + b_, .5)
            say(f"  전체: {pair[0]} {a_} vs {pair[1]} {b_}  = {a_/(a_+b_):.0%}   {fmt_p(bt.pvalue)}")
        cl = defaultdict(Counter)
        for a in sub:
            if a.get("chosenLevel"):
                cl[SCN[a["id"]][0]][a["chosenLevel"]] += 1
        for blk in BLOCKS:
            x, y = cl[blk][pair[0]], cl[blk][pair[1]]
            if x + y:
                say(f"    {BLOCK_KR[blk]:4s} n={x+y:3d}  {pair[0]} {x/(x+y):>4.0%}")
        xe, ye = cl["exception"][pair[0]], cl["exception"][pair[1]]
        xc, yc = cl["coord"][pair[0]], cl["coord"][pair[1]]
        if (xe + ye) and (xc + yc):
            fe = stats.fisher_exact([[xe, ye], [xc, yc]])
            say(f"    예외 vs 조율: Fisher {fmt_p(fe[1])}")

    say()
    say("[둘 다 못 내보내겠다]")
    nei = [a for a in s2 if a["action"] == "neither"]
    say(f"  {len(nei)}/{len(s2)} = {len(nei)/len(s2):.0%}")
    bl = Counter(SCN[a["id"]][0] for a in nei)
    tb = Counter(SCN[a["id"]][0] for a in s2)
    for blk in BLOCKS:
        if tb[blk]:
            say(f"    {BLOCK_KR[blk]:4s} {bl[blk]}/{tb[blk]} = {bl[blk]/tb[blk]:>4.0%}")
    if tb["exception"] and tb["coord"]:
        fe = stats.fisher_exact([[bl["exception"], tb["exception"] - bl["exception"]],
                                 [bl["coord"], tb["coord"] - bl["coord"]]])
        say(f"    예외 vs 조율: Fisher {fmt_p(fe[1])}")
    say("  거부된 시나리오: " + ", ".join(f"{SCN[k][5]} {v}" for k, v in
        Counter(a["id"] for a in nei).most_common()))
    bans = Counter(b for a in nei for b in (a.get("bans2") or []))
    if bans:
        say("  거부 시 지목한 금지 항목: " + ", ".join(f"{k} {v}" for k, v in bans.most_common()))
    m = [a["match"] for a in s2 if a.get("match")]
    if m:
        say(f"  '내가 했을 결과와 비슷하다' 평균 {mean(m):.2f} / 7 (n={len(m)})")

    # ── 8. 무엇을 금지하는가 ──────────────────────────────────
    head("8. 사람들이 AI에게 금지하는 것")
    ban_ev = Counter()
    ban_pp = Counter()
    for j in s1:
        seen = set()
        for a in j["stage1"]:
            for b in (a.get("bans") or []):
                ban_ev[b] += 1
                seen.add(b)
        for b in seen:
            ban_pp[b] += 1
    tot = sum(ban_ev.values()) or 1
    say(f"  {'항목':26s} {'선택 건수':>10s} {'한 번 이상 고른 사람':>18s}")
    for k, v in ban_ev.most_common():
        say(f"  {k:26s} {v:>6d} ({v/tot:>3.0%}) {ban_pp[k]:>12d}명 ({ban_pp[k]/len(s1):>3.0%})")

    # ── 9. 개인차 ─────────────────────────────────────────────
    head("9. 개인차 — 경험과 성향")
    rows_ = [(j, persona_of(j), deleg_index(j), comm_score(j),
              (j.get("survey") or {}).get("use"), (j.get("survey") or {}).get("age")) for j in s1]
    for key, lab, order in [(4, "AI 사용 경험", ["없음", "써본 적 있음", "가끔 씀", "자주 씀"]),
                            (5, "나이대", ["20대", "30대", "40대", "50대 이상"])]:
        g = defaultdict(list)
        for r_ in rows_:
            if r_[key]:
                g[r_[key]].append(r_[2])
        if not g:
            continue
        say(f"  [{lab}별 맡김 지수]")
        for k in order:
            if g[k]:
                say(f"    {k:12s} n={len(g[k]):3d}  평균 {mean(g[k]):.2f}")
        groups = [g[k] for k in order if len(g[k]) >= 3]
        if len(groups) >= 2:
            kw = stats.kruskal(*groups)
            say(f"    Kruskal–Wallis {fmt_p(kw.pvalue)}")

    # 경험 × 작업군
    say()
    say("  [사용 경험별 작업군 맡김률]")
    for lab, f_ in [("경험 없음", lambda u: u == "없음"), ("경험 있음", lambda u: u and u != "없음")]:
        grp = [j for j in s1 if f_((j.get("survey") or {}).get("use"))]
        if not grp:
            continue
        line = []
        for blk in BLOCKS:
            cc = Counter(a["choice"] for j in grp for a in j["stage1"] if SCN[a["id"]][0] == blk)
            n = sum(cc.values())
            line.append(f"{BLOCK_KR[blk]} {cc['auto']/n:>4.0%}")
        say(f"    {lab:8s} (n={len(grp):2d})  " + "  ".join(line))
    say("    → 경험은 맡기는 범위를 넓히지만 예외의 경계는 바꾸지 않는가?")

    pts = [(r_[3], r_[2]) for r_ in rows_ if r_[3] is not None]
    if len(pts) > 3:
        rr, pp = stats.spearmanr([a for a, _ in pts], [b for _, b in pts])
        say()
        say(f"  관계 성향 × 맡김 지수: Spearman ρ={rr:+.2f}, {fmt_p(pp)} (n={len(pts)})")

    # ── 10. 내보내기 ─────────────────────────────────────────
    if args.out:
        os.makedirs(args.out, exist_ok=True)
        with open(os.path.join(args.out, "results.txt"), "w", encoding="utf-8") as f:
            f.write("\n".join(OUT))

        # long format (R의 clmm 용)
        with open(os.path.join(args.out, "long_format.csv"), "w", newline="", encoding="utf-8-sig") as f:
            w_ = csv.writer(f)
            w_.writerow(["pid", "scenario", "title", "block", "prec", "expr", "irrev", "rel",
                         "choice", "choice_ord", "why", "bans", "pos", "ms",
                         "persona", "deleg_index", "comm", "age", "use", "completed"])
            for j in s1:
                sv_ = j.get("survey") or {}
                for a in j["stage1"]:
                    blk, prec, expr, rev, rel, title = SCN[a["id"]]
                    w_.writerow([j["sid"], a["id"], title, blk, prec, expr, 1 - rev, rel,
                                 a["choice"], CHOICE_ORD[a["choice"]], a.get("why") or "",
                                 "|".join(a.get("bans") or []), a.get("pos"),
                                 (a.get("tDone") - a["shown"]) if a.get("tDone") and a.get("shown") else "",
                                 persona_of(j), round(deleg_index(j), 3), comm_score(j),
                                 sv_.get("age", ""), sv_.get("use", ""), int(bool(j.get("policy")))])

        with open(os.path.join(args.out, "stage2.csv"), "w", newline="", encoding="utf-8-sig") as f:
            w_ = csv.writer(f)
            w_.writerow(["pid", "scenario", "title", "block", "factor", "picked_because",
                         "shown_left", "shown_right", "action", "chosen_level", "why",
                         "bans", "match", "view_ms"])
            for j in S:
                for a in (j.get("stage2") or []):
                    if not a.get("action"):
                        continue
                    blk, *_, title = SCN[a["id"]]
                    so = a.get("shownOrder") or ["", ""]
                    w_.writerow([j["sid"], a["id"], title, blk, a.get("factor", ""), a.get("reason", ""),
                                 so[0], so[1], a["action"], a.get("chosenLevel") or "",
                                 a.get("why") or "", "|".join(a.get("bans2") or []),
                                 a.get("match", ""), a.get("viewMs", "")])

        with open(os.path.join(args.out, "participants.csv"), "w", newline="", encoding="utf-8-sig") as f:
            w_ = csv.writer(f)
            w_.writerow(["pid", "persona", "deleg_index", "comm", "dir", "age", "use",
                         "general", "boundary", "minutes", "n_stage2", "policy_accuracy", "completed"])
            for j in s1:
                p = j.get("pre") or {}
                sv_ = j.get("survey") or {}
                w_.writerow([j["sid"], persona_of(j), round(deleg_index(j), 3), comm_score(j),
                             mean([p.get(k, 4) for k in ("dir1", "dir2")]) if p else "",
                             sv_.get("age", ""), sv_.get("use", ""), sv_.get("general", ""),
                             sv_.get("boundary", ""),
                             round(minutes(j), 1) if minutes(j) else "", n2(j),
                             (j.get("policy") or {}).get("accuracy", ""), int(bool(j.get("policy")))])

        # 그림
        try:
            import matplotlib
            matplotlib.use("Agg")
            import matplotlib.pyplot as plt
            from matplotlib import font_manager
            for cand in ("NanumGothic", "Noto Sans CJK KR", "AppleGothic", "Malgun Gothic"):
                if any(cand in f_.name for f_ in font_manager.fontManager.ttflist):
                    plt.rcParams["font.family"] = cand
                    break
            plt.rcParams["axes.unicode_minus"] = False

            labels = [SCN[k][5] for k, _ in ranked]
            vals = [cc["self"] / sum(cc.values()) * 100 for _, cc in ranked]
            cols = {"coord": "#8A8175", "edge": "#F2B705", "exception": "#C2502F"}
            fig, ax = plt.subplots(figsize=(9, 5.5))
            ax.bar(range(len(vals)), vals, color=[cols[SCN[k][0]] for k, _ in ranked])
            ax.set_xticks(range(len(vals)))
            ax.set_xticklabels(labels, rotation=45, ha="right", fontsize=9)
            ax.set_ylabel("‘내가 직접 하겠다’ (%)")
            ax.set_ylim(0, 100)
            ax.spines[["top", "right"]].set_visible(False)
            handles = [plt.Rectangle((0, 0), 1, 1, color=cols[b]) for b in BLOCKS]
            ax.legend(handles, [BLOCK_KR[b] for b in BLOCKS], frameon=False, loc="upper right")
            ax.set_title(f"시나리오별 위임 거부율 (n={len(s1)})")
            fig.tight_layout()
            fig.savefig(os.path.join(args.out, "fig1_scenarios.png"), dpi=200)

            fig, ax = plt.subplots(figsize=(6, 4))
            x = range(len(BLOCKS))
            bot = [0] * 3
            for ch, col in [("auto", "#1F6F6B"), ("cond", "#F2B705"), ("self", "#C2502F")]:
                vals = [tab[b][ch] / sum(tab[b].values()) * 100 for b in BLOCKS]
                ax.bar(x, vals, bottom=bot, color=col, label=CHOICE_KR[ch])
                bot = [a + b for a, b in zip(bot, vals)]
            ax.set_xticks(list(x))
            ax.set_xticklabels([BLOCK_KR[b] for b in BLOCKS])
            ax.set_ylabel("%")
            ax.set_ylim(0, 100)
            ax.spines[["top", "right"]].set_visible(False)
            ax.legend(frameon=False, bbox_to_anchor=(1.02, 1), loc="upper left")
            ax.set_title("작업군별 위임 선택")
            fig.tight_layout()
            fig.savefig(os.path.join(args.out, "fig2_blocks.png"), dpi=200)
            say(f"\n그림 2개와 CSV 3개를 {args.out}/ 에 저장했습니다.")
        except ImportError:
            say(f"\nCSV 3개를 {args.out}/ 에 저장했습니다. (그림: pip install matplotlib)")

    head("끝")

if __name__ == "__main__":
    main()
