import numpy as np, pandas as pd
from statsmodels.miscmodels.ordinal_model import OrderedModel
import statsmodels.api as sm
from scipy import stats

rng = np.random.default_rng(7)

# 시나리오 속성 (앱의 16개와 동일한 구조)
SCN = pd.DataFrame([
 # id, block, prec(선례), expr(표명), rev(되돌릴 수 있음), rel(관계 걸림)
 ("C1","coord",0,0,1,0),("C2","coord",0,0,1,0),("C3","coord",0,0,1,0),("C4","coord",0,0,1,0),
 ("C5","coord",0,0,1,0),("C6","coord",0,0,1,0),("C7","coord",0,0,1,0),("C8","coord",0,0,1,0),
 ("E1","edge",0,0,1,1),("E2","edge",1,0,1,0),("E3","edge",0,0,1,1),("E4","edge",1,0,1,1),
 ("X1","exception",1,0,0,1),("X2","exception",1,0,0,1),
 ("X3","exception",0,1,0,1),("X4","exception",0,1,0,1),
], columns=["id","block","prec","expr","rev","rel"])

# ---- 가정한 참 효과 (우리 가설) ----
B_PREC, B_EXPR, B_REL, B_REV = 1.0, 2.2, 0.6, -0.8   # 위임 거부 쪽으로 미는 힘
CUT = [1.2, 2.6]        # auto|cond, cond|self 경계
SD_P = 0.9              # 사람 간 편차
# H3: 선례형은 사전에 "맡긴다"고 해도 결과를 보면 무르는 비율이 높다
P_REJECT = {"base":0.15, "prec":0.55, "expr":0.60}

def simulate(n_part, seed=0):
    r = np.random.default_rng(seed)
    s1, s2 = [], []
    for p in range(n_part):
        u = r.normal(0, SD_P)                      # 개인의 기본 보수성
        comm = np.clip(r.normal(4.5, 1.1), 1, 7)   # 관계 성향
        for _, sc in SCN.iterrows():
            eta = (u + B_PREC*sc.prec + B_EXPR*sc.expr + B_REL*sc.rel*(comm-4.5)/1.1*0.5
                   + B_REV*sc.rev + r.logistic(0,1))
            choice = 0 if eta < CUT[0] else (1 if eta < CUT[1] else 2)  # 0 auto 1 cond 2 self
            s1.append(dict(pid=p, sid=sc.id, block=sc.block, prec=sc.prec, expr=sc.expr,
                           rev=sc.rev, rel=sc.rel, comm=comm, choice=choice))
        # 2단계: 본인이 맡긴다고 한 것 1개 + 직접 하겠다고 한 것 1개 + 랜덤 1개
        mine = pd.DataFrame([x for x in s1 if x["pid"]==p])
        picks = []
        for cond, lab in [(mine.choice==0,"said_auto"), (mine.choice==2,"said_self")]:
            pool = mine[cond]
            if len(pool): picks.append((pool.sample(1, random_state=int(r.integers(1e6))).iloc[0], lab))
        pool = mine.sample(1, random_state=int(r.integers(1e6))).iloc[0]
        picks.append((pool, "random"))
        for row, lab in picks[:3]:
            key = "prec" if row.prec else ("expr" if row.expr else "base")
            # 사전에 맡긴다고 한 사람일수록 무를 확률이 낮지만, 선례·표명형에선 올라간다
            p_rej = P_REJECT[key] * (0.8 if row.choice==0 else 1.2)
            reject = r.random() < min(p_rej, .95)
            s2.append(dict(pid=p, sid=row.sid, said=lab, pre_choice=row.choice,
                           prec=row.prec, expr=row.expr, comm=row.comm, reject=int(reject)))
    return pd.DataFrame(s1), pd.DataFrame(s2)

d1, d2 = simulate(120, seed=1)

print("="*62)
print("1단계: 위임 선택 분포 (0=그냥 맡김 1=선 긋고 맡김 2=직접)")
print(pd.crosstab(d1.block, d1.choice, normalize="index").round(2))

print("\n시나리오별 '직접 하겠다' 비율 상위")
top = d1.groupby("sid").choice.apply(lambda c:(c==2).mean()).sort_values(ascending=False)
print(top.head(6).round(2).to_string())

print("\n" + "="*62)
print("모형 1 — 순서형 로지스틱 (위임 거부 방향)")
X = d1[["prec","expr","rev","rel"]].astype(float)
m = OrderedModel(d1.choice, X, distr="logit").fit(method="bfgs", disp=False)
res = pd.DataFrame({"coef": m.params[:4].round(2), "OR": np.exp(m.params[:4]).round(2),
                    "p": m.pvalues[:4].round(4)})
print(res.to_string())

print("\n" + "="*62)
print("모형 2 — H3: 사전 판단 × 상황 유형 → 사후 '무르기'")
d2["prec_or_expr"] = np.where(d2.prec==1,"선례형", np.where(d2.expr==1,"표명형","그 외"))
tab = d2.pivot_table(index="prec_or_expr", columns="pre_choice", values="reject", aggfunc=["mean","size"])
print(tab.round(2).to_string())

sub = d2[d2.pre_choice==0]           # 사전에 '그냥 맡긴다'고 한 건들만
a = sub[sub.prec==1].reject; b = sub[(sub.prec==0)&(sub.expr==0)].reject
chi = stats.chi2_contingency([[a.sum(), len(a)-a.sum()],[b.sum(), len(b)-b.sum()]])
print(f"\n맡긴다고 한 건 중 무르기 비율 — 선례형 {a.mean():.0%} (n={len(a)}) vs 평범 {b.mean():.0%} (n={len(b)})")
print(f"카이제곱 p = {chi.pvalue:.5f}")

print("\n" + "="*62)
print("검정력 — H3(선례형 vs 평범, 사전 위임자 한정)을 p<.05로 잡을 확률")
for n in [40, 80, 120, 200]:
    hits = 0
    for it in range(60):
        _, g2 = simulate(n, seed=1000+it)
        s = g2[g2.pre_choice==0]
        x = s[s.prec==1].reject; y = s[(s.prec==0)&(s.expr==0)].reject
        if len(x)<5 or len(y)<5: continue
        t = stats.chi2_contingency([[x.sum(), len(x)-x.sum()],[y.sum(), len(y)-y.sum()]])
        hits += t.pvalue < .05
    print(f"  N={n:>4} → {hits/60:.0%}")
