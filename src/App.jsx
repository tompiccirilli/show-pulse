import React, { useMemo, useState, useEffect } from "react";

/* ---------------------------------------------
   Design tokens
   bg: cool pale sage paper (not cream)
   ink: deep forest-charcoal
   tiers: teal (low) / amber (moderate) / coral (high)
   font: Libre Baskerville (display, body, and data)
---------------------------------------------- */
const TOKENS = {
  bg: "#EEF2ED",
  surface: "#FFFFFF",
  surfaceAlt: "#F6F8F4",
  ink: "#1B2621",
  inkMuted: "#5C6B62",
  line: "#DBE2D6",
  low: "#3E7D6F",
  lowBg: "#E4F0EC",
  moderate: "#C4832E",
  moderateBg: "#F6E9D5",
  high: "#B94636",
  highBg: "#F5DFDA",
  age: "#3D5A80",
  ageBg: "#E3E9F5",
};

const AGE_BUCKETS = [
  { label: "0–3", min: 0, max: 3 },
  { label: "4–6", min: 4, max: 6 },
  { label: "7–10", min: 7, max: 10 },
  { label: "11+", min: 11, max: 18 },
];

const CONTENT_TAGS = [
  { id: "rainyDays", emoji: "🌧️", label: "Rainy Days" },
  { id: "beforeBedtime", emoji: "🌙", label: "Before Bedtime" },
  { id: "travel", emoji: "✈️", label: "Travel" },
  { id: "familyTime", emoji: "👨‍👩‍👧", label: "Family Time" },
];

function scoreOf(s) {
  return s.speed + s.emotional + s.pacing + s.novelty + s.sensory;
}
function tierOf(total) {
  if (total <= 11) return "Low";
  if (total <= 18) return "Moderate";
  return "High";
}
function tierColors(tier) {
  if (tier === "Low") return { fg: TOKENS.low, bg: TOKENS.lowBg };
  if (tier === "Moderate") return { fg: TOKENS.moderate, bg: TOKENS.moderateBg };
  return { fg: TOKENS.high, bg: TOKENS.highBg };
}
function tierEmoji(tier) {
  if (tier === "Low") return "🟢";
  if (tier === "Moderate") return "🟡";
  return "🔴";
}

function Chip({ active, onClick, children, color }) {
  return (
    <button
      onClick={onClick}
      className="motion-safe:transition-colors duration-150 px-3 py-1.5 rounded-full text-sm font-medium border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      style={{
        borderColor: active ? color.fg : TOKENS.line,
        backgroundColor: active ? color.bg : TOKENS.surface,
        color: active ? color.fg : TOKENS.inkMuted,
      }}
    >
      {children}
    </button>
  );
}

function ShowCard({ show }) {
  const [open, setOpen] = useState(false);
  const total = scoreOf(show);
  const tier = tierOf(total);
  const colors = tierColors(tier);

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-3 motion-safe:transition-shadow duration-150 hover:shadow-md"
      style={{ borderColor: TOKENS.line, backgroundColor: TOKENS.surface }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            className="text-lg leading-snug"
            style={{ fontFamily: "'Libre Baskerville', serif", color: TOKENS.ink }}
          >
            {show.name}
          </h3>
          <p className="text-sm mt-0.5" style={{ color: TOKENS.inkMuted }}>
            {show.genre}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: colors.bg, color: colors.fg, fontFamily: "'Libre Baskerville', serif" }}
          title={`${tier} stimulation — score ${total}/25`}
          aria-label={`${tier} stimulation — score ${total}/25`}
        >
          {tierEmoji(tier)} {total}/25
        </span>
      </div>

      <div>
        <span
          className="text-xs px-2 py-1 rounded-md"
          style={{ backgroundColor: TOKENS.ageBg, color: TOKENS.age }}
        >
          Ages {show.ageMin}–{show.ageMax}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {show.platforms.map((p) => (
          <span
            key={p}
            className="text-xs px-2 py-1 rounded-md"
            style={{ backgroundColor: TOKENS.surfaceAlt, color: TOKENS.inkMuted }}
          >
            {p}
          </span>
        ))}
      </div>

      <div className="text-xs" style={{ color: TOKENS.inkMuted }}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded"
          style={{ color: TOKENS.ink }}
        >
          {open ? "Hide details" : "Why this rating?"}
        </button>
      </div>

      {open && (
        <div
          className="text-sm rounded-xl p-3 leading-relaxed"
          style={{ backgroundColor: TOKENS.surfaceAlt, color: TOKENS.ink }}
        >
          <p className="mb-2 pb-2" style={{ borderBottom: `1px solid ${TOKENS.line}` }}>{show.notes}</p>
          <div className="flex flex-col gap-1 text-xs" style={{ fontFamily: "'Libre Baskerville', serif" }}>
            {[
              ["Speed", show.speed],
              ["Emotion", show.emotional],
              ["Pacing", show.pacing],
              ["Novelty", show.novelty],
              ["Sensory", show.sensory],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span style={{ color: TOKENS.inkMuted }}>{label}</span>
                <span style={{ color: TOKENS.ink, fontWeight: 700 }}>{value}</span>
              </div>
            ))}
          </div>
          <div
            className="flex justify-between mt-2 pt-2 text-xs"
            style={{ borderTop: `1px solid ${TOKENS.line}`, fontFamily: "'Libre Baskerville', serif" }}
          >
            <span style={{ color: TOKENS.inkMuted }}>Confidence</span>
            <span style={{ color: TOKENS.ink, fontWeight: 700 }}>{show.confidence}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "database", label: "All Shows" },
  { id: "recommendations", label: "Parent Picks" },
  { id: "avoid", label: "Limit" },
];

const AVOID_THRESHOLD = 22;

export default function StimulationDatabase() {
  const [SHOWS, setShows] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [activeTab, setActiveTab] = useState("database");
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("All");
  const [ageBucket, setAgeBucket] = useState("All");
  const [tier, setTier] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [contentTag, setContentTag] = useState("All");
  const [sortDesc, setSortDesc] = useState(false);

  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    setSortDesc(activeTab === "avoid");
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/shows.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load shows.json");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setShows(data);
          setLoadState("ready");
        }
      })
      .catch((err) => {
        console.error("Failed to load show data:", err);
        if (!cancelled) setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.github.com/repos/tompiccirilli/show-pulse/commits?path=public/data/shows.json&per_page=1")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("GitHub API request failed"))))
      .then((commits) => {
        const date = commits?.[0]?.commit?.author?.date;
        if (!cancelled && date) setLastUpdated(date);
      })
      .catch((err) => {
        console.error("Failed to load last-updated info:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const platforms = useMemo(() => {
    const set = new Set();
    SHOWS.forEach((s) => s.platforms.forEach((p) => set.add(p)));
    set.delete("TikTok");
    return ["All", ...Array.from(set).sort()];
  }, [SHOWS]);

  const baseList = useMemo(() => {
    if (activeTab === "recommendations") return SHOWS.filter((s) => s.recommended);
    if (activeTab === "avoid") return SHOWS.filter((s) => scoreOf(s) >= AVOID_THRESHOLD);
    return SHOWS;
  }, [activeTab, SHOWS]);

  const filtered = useMemo(() => {
    return baseList
      .filter((s) => {
        const total = scoreOf(s);
        const sTier = tierOf(total);
        const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase());
        const matchesPlatform = platform === "All" || s.platforms.includes(platform);
        const matchesTier = activeTab !== "database" || tier === "All" || sTier === tier;
        const matchesContentTag =
          activeTab !== "database" || contentTag === "All" || (s.tags || []).includes(contentTag);
        const matchesAge =
          ageBucket === "All" ||
          (() => {
            const bucket = AGE_BUCKETS.find((b) => b.label === ageBucket);
            return s.ageMin <= bucket.max && s.ageMax >= bucket.min;
          })();
        return matchesQuery && matchesPlatform && matchesTier && matchesContentTag && matchesAge;
      })
      .sort((a, b) => (sortDesc ? scoreOf(b) - scoreOf(a) : scoreOf(a) - scoreOf(b)));
  }, [baseList, query, platform, ageBucket, tier, contentTag, sortDesc]);

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: TOKENS.bg, fontFamily: "'Libre Baskerville', serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        input:focus, select:focus, button:focus-visible { outline: none; box-shadow: 0 0 0 3px ${TOKENS.lowBg}; }
        @keyframes livePulse {
          0%, 100% { background-color: ${TOKENS.age}; opacity: 1; }
          50% { background-color: ${TOKENS.low}; opacity: 0.7; }
        }
        .live-dot { animation: livePulse 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .live-dot { animation: none; }
        }
      `}</style>

      <header className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <p className="max-w-2xl text-base sm:text-lg" style={{ color: TOKENS.inkMuted }}>
          Discover shows based on their stimulation level so you can choose what shows are best for your child...
        </p>

        {lastUpdated && SHOWS.length > 0 && (
          <p
            className="mt-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs italic"
            style={{ backgroundColor: TOKENS.ageBg, color: TOKENS.age }}
          >
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TOKENS.age }} />
            Tracking {SHOWS.length} shows · Updated{" "}
            {new Date(lastUpdated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}

        <div className="mt-8 flex gap-1 border-b" style={{ borderColor: TOKENS.line }}>
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="px-4 py-2.5 text-sm font-medium motion-safe:transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded-t-lg"
                style={{
                  color: active ? TOKENS.ink : TOKENS.inkMuted,
                  borderBottom: active ? `2px solid ${TOKENS.low}` : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-20">
        <div
          className="rounded-2xl border p-4 sm:p-5 sticky top-4 z-10"
          style={{ backgroundColor: TOKENS.surface, borderColor: TOKENS.line }}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by show name…"
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm bg-transparent"
              style={{ borderColor: TOKENS.line, color: TOKENS.ink }}
            />
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="rounded-xl border px-3 py-2.5 text-sm"
              style={{ borderColor: TOKENS.line, color: TOKENS.ink, backgroundColor: TOKENS.surface }}
            >
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p === "All" ? "All platforms" : p}
                </option>
              ))}
            </select>
            <select
              value={ageBucket}
              onChange={(e) => setAgeBucket(e.target.value)}
              className="rounded-xl border px-3 py-2.5 text-sm"
              style={{ borderColor: TOKENS.line, color: TOKENS.ink, backgroundColor: TOKENS.surface }}
            >
              <option value="All">All ages</option>
              {AGE_BUCKETS.map((b) => (
                <option key={b.label} value={b.label}>
                  Ages {b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 text-sm" style={{ color: TOKENS.inkMuted }}>
            {loadState === "ready" && (
              <>
                Showing <span style={{ fontWeight: 700 }}>{filtered.length}</span> of{" "}
                {SHOWS.length} shows
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {activeTab === "database" && (
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="rounded-xl border px-3 py-2 text-sm font-medium motion-safe:transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                borderColor: filtersOpen ? TOKENS.low : TOKENS.line,
                backgroundColor: filtersOpen ? TOKENS.lowBg : TOKENS.surface,
                color: filtersOpen ? TOKENS.low : TOKENS.ink,
              }}
            >
              ≔ Filters
            </button>
          )}
          <button
            onClick={() => setSortDesc((v) => !v)}
            className="ml-auto rounded-xl border px-3 py-2 text-sm font-medium motion-safe:transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{ borderColor: TOKENS.line, backgroundColor: TOKENS.surface, color: TOKENS.ink }}
          >
            Sort: Stimulation {sortDesc ? "↓" : "↑"}
          </button>
        </div>

        {activeTab === "database" && (
          <div className="mt-2">
            {filtersOpen && (
              <>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Low", "Moderate", "High"].map((t) => (
                    <Chip key={t} active={tier === t} onClick={() => setTier(tier === t ? "All" : t)} color={tierColors(t)}>
                      {tierEmoji(t)} {t} stimulation
                    </Chip>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CONTENT_TAGS.map((ct) => (
                    <Chip
                      key={ct.id}
                      active={contentTag === ct.id}
                      onClick={() => setContentTag(contentTag === ct.id ? "All" : ct.id)}
                      color={{ fg: TOKENS.age, bg: TOKENS.ageBg }}
                    >
                      {ct.emoji} {ct.label}
                    </Chip>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {loadState === "loading" && (
          <div
            className="mt-6 rounded-2xl border p-10 text-center"
            style={{ borderColor: TOKENS.line, backgroundColor: TOKENS.surface, color: TOKENS.inkMuted }}
          >
            <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "1.1rem", color: TOKENS.ink }}>
              Loading shows…
            </p>
          </div>
        )}

        {loadState === "error" && (
          <div
            className="mt-6 rounded-2xl border p-10 text-center"
            style={{ borderColor: TOKENS.high, backgroundColor: TOKENS.highBg, color: TOKENS.high }}
          >
            <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "1.1rem" }}>
              Couldn't load the show data.
            </p>
            <p className="mt-1 text-sm">Check that /data/shows.json is reachable, then refresh.</p>
          </div>
        )}

        {loadState === "ready" && filtered.length === 0 && (
          <div
            className="mt-6 rounded-2xl border p-10 text-center"
            style={{ borderColor: TOKENS.line, backgroundColor: TOKENS.surface, color: TOKENS.inkMuted }}
          >
            <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "1.1rem", color: TOKENS.ink }}>
              No shows match that combination yet.
            </p>
            <p className="mt-1 text-sm">Try widening a filter, the database grows every week.</p>
          </div>
        )}

        {loadState === "ready" && filtered.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <ShowCard key={s.name} show={s} />
            ))}
          </div>
        )}

        <footer className="mt-16 pt-6 border-t text-xs" style={{ borderColor: TOKENS.line, color: TOKENS.inkMuted }}>
          Ratings combine Speed, Emotional Intensity, Pacing, Novelty, and Sensory Load (1–5 each, summed to a
          total out of 25). Low 5–11 · Moderate 12–18 · High 19–25. Built from published parent reviews and
          documented pacing data — use alongside your own judgment of your child.
        </footer>
      </main>
    </div>
  );
}
