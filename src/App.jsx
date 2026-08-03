import React, { useMemo, useState, useEffect } from "react";

/* ---------------------------------------------
   Design tokens
   bg: cool pale sage paper (not cream)
   ink: deep forest-charcoal
   tiers: teal (low) / amber (moderate) / coral (high)
   display: Fredoka (rounded, warm, dad-brand friendly)
   data: Space Mono (meter/readout feel)
   body: Work Sans
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
};

const AGE_BUCKETS = [
  { label: "0–3", min: 0, max: 3 },
  { label: "4–6", min: 4, max: 6 },
  { label: "7–10", min: 7, max: 10 },
  { label: "11+", min: 11, max: 18 },
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
            style={{ fontFamily: "'Fredoka', sans-serif", color: TOKENS.ink }}
          >
            {show.name}
          </h3>
          <p className="text-sm mt-0.5" style={{ color: TOKENS.inkMuted }}>
            {show.genre} · Ages {show.ageMin}–{show.ageMax}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: colors.bg, color: colors.fg, fontFamily: "'Space Mono', monospace" }}
        >
          {tier}
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

      <div className="flex items-center justify-between text-xs" style={{ color: TOKENS.inkMuted }}>
        <span style={{ fontFamily: "'Space Mono', monospace" }}>
          Score {total}/25
        </span>
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
          <p className="mb-2">{show.notes}</p>
          <div className="grid grid-cols-5 gap-2 text-xs" style={{ color: TOKENS.inkMuted, fontFamily: "'Space Mono', monospace" }}>
            <div>Speed {show.speed}</div>
            <div>Emotion {show.emotional}</div>
            <div>Pacing {show.pacing}</div>
            <div>Novelty {show.novelty}</div>
            <div>Sensory {show.sensory}</div>
          </div>
          <p className="mt-2 text-xs" style={{ color: TOKENS.inkMuted }}>
            Confidence: {show.confidence}
          </p>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "database", label: "Shows" },
  { id: "recommendations", label: "Recommendations" },
  { id: "avoid", label: "Avoid" },
];

const AVOID_THRESHOLD = 23;

export default function StimulationDatabase() {
  const [SHOWS, setShows] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [activeTab, setActiveTab] = useState("database");
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("All");
  const [ageBucket, setAgeBucket] = useState("All");
  const [tier, setTier] = useState("All");

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

  const platforms = useMemo(() => {
    const set = new Set();
    SHOWS.forEach((s) => s.platforms.forEach((p) => set.add(p)));
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
        const matchesTier = tier === "All" || sTier === tier;
        const matchesAge =
          ageBucket === "All" ||
          (() => {
            const bucket = AGE_BUCKETS.find((b) => b.label === ageBucket);
            return s.ageMin <= bucket.max && s.ageMax >= bucket.min;
          })();
        return matchesQuery && matchesPlatform && matchesTier && matchesAge;
      })
      .sort((a, b) => (activeTab === "avoid" ? scoreOf(b) - scoreOf(a) : scoreOf(a) - scoreOf(b)));
  }, [baseList, query, platform, ageBucket, tier, activeTab]);

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: TOKENS.bg, fontFamily: "'Work Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Space+Mono:wght@400;700&family=Work+Sans:wght@400;500;600&display=swap');
        input:focus, select:focus, button:focus-visible { outline: none; box-shadow: 0 0 0 3px ${TOKENS.lowBg}; }
      `}</style>

      <header className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <p className="max-w-2xl text-base sm:text-lg" style={{ color: TOKENS.inkMuted }}>
          How much does a show asks of your child's brain? Filter by platform, age, and
          stimulation to find the right shows for your child.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {["Low", "Moderate", "High"].map((t) => (
            <Chip key={t} active={tier === t} onClick={() => setTier(tier === t ? "All" : t)} color={tierColors(t)}>
              {t} stimulation
            </Chip>
          ))}
        </div>

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

        {activeTab === "avoid" && (
          <p className="mt-4 text-sm" style={{ color: TOKENS.high }}>
            These are the shows you should avoid with your little ones, which is everything rated{" "}
            {AVOID_THRESHOLD} or higher on the stimulation scale.
          </p>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-20">
        <div
          className="rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center sticky top-4 z-10"
          style={{ backgroundColor: TOKENS.surface, borderColor: TOKENS.line }}
        >
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

        <div className="mt-4 text-sm" style={{ color: TOKENS.inkMuted }}>
          {loadState === "ready" ? `Showing ${filtered.length} of ${SHOWS.length} shows` : ""}
        </div>

        {loadState === "loading" && (
          <div
            className="mt-6 rounded-2xl border p-10 text-center"
            style={{ borderColor: TOKENS.line, backgroundColor: TOKENS.surface, color: TOKENS.inkMuted }}
          >
            <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.1rem", color: TOKENS.ink }}>
              Loading shows…
            </p>
          </div>
        )}

        {loadState === "error" && (
          <div
            className="mt-6 rounded-2xl border p-10 text-center"
            style={{ borderColor: TOKENS.high, backgroundColor: TOKENS.highBg, color: TOKENS.high }}
          >
            <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.1rem" }}>
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
            <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.1rem", color: TOKENS.ink }}>
              No shows match that combination yet.
            </p>
            <p className="mt-1 text-sm">Try widening a filter — the database grows every week.</p>
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
