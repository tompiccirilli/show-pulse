# The Show Pulse — Rating Rubric

This is the scoring method used for every show in `public/data/shows.json`. Follow it exactly
when adding new shows so ratings stay comparable to each other.

## The five factors (each scored 1–5)

- **speed** — how quickly scenes/shots change. 1 = long, slow scenes. 5 = rapid cuts every 1–2 seconds.
- **emotional** — intensity of emotional highs/lows (excitement, danger, conflict, drama). 1 = calm and even. 5 = frequent big emotional spikes.
- **pacing** — overall rhythm/tempo of the show, distinct from cut speed (e.g. a show can cut slowly but still feel frantic in tone, or vice versa). 1 = unhurried. 5 = relentless.
- **novelty** — how much new/unexpected stimuli appear (new characters, settings, jokes, twists per minute). 1 = highly repetitive/predictable. 5 = constant novelty.
- **sensory** — combined visual + audio intensity (brightness, saturation, sound effects, music volume/density). 1 = muted and quiet. 5 = loud, bright, and dense.

## Tier calculation

```
total = speed + emotional + pacing + novelty + sensory   (range: 5–25)

Low:      5–11
Moderate: 12–18
High:     19–25
```

The app calculates `total` and `tier` automatically from the five factors — never hardcode them.

## Confidence field

Every show must include a `confidence` field, one of:

- `"High"` — grounded in specific reviews, published pacing/scene-length data, or direct research for this show.
- `"Medium"` — rated from general knowledge of a well-established show, not independently verified against fresh sources.
- `"Medium (user-supplied)"` — reserved for entries originally sourced from Tom's own CSV import; don't use this for new entries.
- `"High (creator-confirmed)"` — reserved for entries Tom has personally corrected; don't use this for new entries.

When in doubt, use `"Medium"` and say so in the notes — never invent a `"High"` confidence you can't back up.

## Notes field

One to two sentences. State *why* the show got its rating — cite something concrete (a review's
description, documented pacing, or a specific behavior pattern) rather than a vague summary. If
the rating is from general knowledge only, say so explicitly, e.g. "General reputation, not
independently verified."

## Required fields for a new show entry

```json
{
  "name": "Show Title",
  "platforms": ["Platform One", "Platform Two"],
  "genre": "Genre / Sub-genre",
  "ageMin": 2,
  "ageMax": 6,
  "speed": 3,
  "emotional": 2,
  "pacing": 3,
  "novelty": 3,
  "sensory": 3,
  "confidence": "Medium",
  "notes": "One to two sentences explaining the rating."
}
```

Add `"recommended": true` only for shows Tom has personally flagged as a recommendation — never
set this automatically.

## Process for weekly additions

1. Read `public/data/shows.json` and collect the full list of existing show names.
2. Research a batch of new, real children's shows not already in the list — vary platform, age
   range, and genre so the database stays broad rather than clustering on one type of show.
3. Score each show against the five factors above, using real research (reviews, pacing
   descriptions, parent commentary) wherever possible.
4. Do not duplicate a show already in the list (check by name, case-insensitive, ignoring
   parenthetical suffixes like "(Selected)" or "(UK)").
5. Append new entries to the JSON array. Keep the file valid JSON — no trailing commas.
6. Commit with a message like `Add N new shows (weekly update)`.
