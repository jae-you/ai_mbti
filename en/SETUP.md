# English version — setup

The English study runs on **its own spreadsheet and its own Apps Script**.
Nothing here touches the Korean study; the two collections stay completely separate.

## 1. New spreadsheet and backend

1. Create a **new** Google Sheet.
2. **Extensions → Apps Script**, paste in `en/Code.gs`, save.
3. **Project Settings → Script Properties**, add:
   - `SHARED_TOKEN` — any string, e.g. `jy-2026-en`
   - (optional) `COLLECTING` — set to `off` later to stop accepting responses
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Copy the `.../exec` URL.
5. Paste that URL into your browser. You should see `{"ok":true,"alive":true}`.
6. Reload the sheet — a **Research** menu appears at the top.

## 2. App config

In `en/index.html`, top of the script:

```js
endpoint: "https://script.google.com/macros/s/..../exec",   // the NEW deployment
token:    "jy-2026-en",                                      // the NEW token
prolificCompletionUrl: "https://app.prolific.com/submissions/complete?cc=XXXXXXXX",
```

Also replace the two `og:` URLs near the top of the file with your real address.

## 3. Prolific study settings

- **Study URL** — tick "I'll use URL parameters", then:
  `https://YOURNAME.github.io/YOURREPO/en/?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}`
- **Confirm completion** — "Redirect to a URL". Copy the completion URL Prolific
  generates into `prolificCompletionUrl` above.
  (To use a code instead: leave `prolificCompletionUrl` as `null`, set
  `completionCode`, and choose the code option in Prolific.)
- **Estimated time** 10 minutes · **Reward** $2.00 (= $12/hour, Prolific's recommended rate)
- **Participants** 60 · Filters: **US residence, English first language, approval rate ≥ 95%** — and nothing else.
  Do **not** filter on ethnicity: removing groups would make it no longer a US sample.
- **Devices** — allow mobile; the app is built for phones

Cost: 60 × $2.00 = $120 + 33.3% academic fee ≈ **$160**.

### Demographics — record, don't filter

Prolific exports age, sex, first language, country of residence, nationality,
country of birth, student and employment status for free. **Ethnicity is not a
base field** — add it as a *prescreener* (up to 15 allowed) so it appears in the
export. You can only edit your prescreener selection twice before it locks, and
Prolific cannot supply demographics retrospectively, so set this **before you
launch**.

Record it, but don't use it to screen anyone in or out. The hypothesis is about
relational orientation, not nationality or ethnicity — the six pre-task items
measure that directly. A participant with a high relational score who behaves
like the Korean sample is evidence for the mechanism, not noise.

The final survey also asks how long the participant has lived in the US
(`usyears`), with a "prefer not to say" option. Time in country predicts
cultural norms better than an ethnic category does.

## 4. Before publishing

Open your study URL with a fake ID (`?PROLIFIC_PID=test123`) and run it through
to the end. Check that:
- the "Finish and return to Prolific" button appears on the result screen
- a row lands in the `raw` tab of the new sheet

## 5. Getting the data out

- **Research → Flatten for analysis** builds `responses`, `comparisons`, and
  `sessions` tabs.
- **Research → List Prolific IDs** shows who finished and who didn't, for
  cross-checking before you approve payments.
- Export `raw` as TSV and run `analysis/analyze.py` on it, exactly as with the
  Korean data. The two exports are analyzed as separate files.

## 6. Scenario equivalence

Thirteen of the sixteen scenarios are direct translations. Three were
substituted because the Korean original has no close US equivalent; they carry
`adapted:true` in `index.html`:

| id | Korean original | English substitute |
|----|-----------------|--------------------|
| E1 | 단골집 예약 취소 | a neighborhood place where the owner knows you by name |
| E3 | 명절 일정 (set by parents) | a holiday schedule already set by your parents |
| X2 | 선배의 부탁 거절 | a request from someone who mentored you for years |

Report the thirteen matched scenarios as the primary cross-cultural comparison
and treat the three adapted ones as a secondary, functionally-equivalent set.

## 7. Note on attention checks

There is deliberately **no attention-check item**. Adding one would make the
English task differ from the Korean one and weaken the comparison. Careless
responding is filtered by completion time instead (`analyze.py` drops anyone
under 3 minutes or over 40).
