import React, { useMemo, useState, useEffect } from "react";

// "full" (default/unset) = current paid behavior, ratings shown normally.
// "free" = lead-magnet mode: every show is listed but ratings are locked.
const IS_FREE_MODE = import.meta.env.VITE_APP_MODE === "free";
const SHOWS_DATA_URL = IS_FREE_MODE ? "/data/shows-free.json" : "/data/shows.json";

// Edit this line to change the free-mode banner copy — it's the only
// place this string lives.
const FREE_MODE_BANNER =
  "Showing all shows — unlock full ratings and stimulation breakdowns in the Screen Time Hub.";

// Page title, shown on both full and free versions.
const PAGE_TITLE = "The Safe Screen Time Database";

// CTA fixed to the bottom of the viewport, free version only.
const CTA_LABEL = "Unlock Access";
const CTA_LINK = "https://www.thedadvibes.com/offers/zyys5nzo/checkout?coupon_code=INTRO20";

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
  font: "'Libre Baskerville', serif",
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

const LOCAL_STORAGE_KEY = "stimscout:v1";

function loadLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return { favorites: [] };
    const parsed = JSON.parse(raw);
    return { favorites: parsed.favorites ?? [] };
  } catch {
    return { favorites: [] };
  }
}

function saveLocalData(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ version: 1, ...data }));
  } catch {
    // private browsing / quota exceeded — fail silently, feature just doesn't persist
  }
}

function Chip({ active, onClick, children, color, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`motion-safe:transition-colors duration-150 px-3 py-1.5 rounded-full text-sm font-medium border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
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

function HeartButton({ isFavorite, onToggleFavorite, showName }) {
  return (
    <button
      onClick={() => onToggleFavorite(showName)}
      aria-label={isFavorite ? "Remove from My Shows" : "Save to My Shows"}
      className="rounded-full p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      style={{ color: isFavorite ? TOKENS.high : TOKENS.inkMuted }}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"}>
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function LockIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Same padlock body as LockIcon, but the shackle swings open — used on the
// "Unlock Access" CTA rather than the read-only locked badges.
function UnlockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function LockedBadge() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: TOKENS.surfaceAlt, color: TOKENS.inkMuted, fontFamily: TOKENS.font }}
      title="Rating locked in the free preview"
      aria-label="Rating locked — unlock in the Screen Time Hub"
    >
      <LockIcon />
      Unlock rating
    </span>
  );
}

function ShowCard({ show, isFavorite, onToggleFavorite }) {
  const [open, setOpen] = useState(false);

  if (IS_FREE_MODE) {
    return (
      <div
        className="rounded-2xl border p-5 flex flex-col gap-3 motion-safe:transition-shadow duration-150 hover:shadow-md"
        style={{ borderColor: TOKENS.line, backgroundColor: TOKENS.surface }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              className="text-lg leading-snug"
              style={{ fontFamily: TOKENS.font, color: TOKENS.ink }}
            >
              {show.name}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: TOKENS.inkMuted }}>
              {show.genre}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <HeartButton isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} showName={show.name} />
            <LockedBadge />
          </div>
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

        <span
          className="inline-flex items-center gap-1 text-xs cursor-not-allowed"
          style={{ color: TOKENS.inkMuted }}
          aria-disabled="true"
          title="Unlock in the Screen Time Hub to see this"
        >
          <LockIcon size={11} />
          Why this rating?
        </span>
      </div>
    );
  }

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
            style={{ fontFamily: TOKENS.font, color: TOKENS.ink }}
          >
            {show.name}
          </h3>
          <p className="text-sm mt-0.5" style={{ color: TOKENS.inkMuted }}>
            {show.genre}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <HeartButton isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} showName={show.name} />
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: colors.bg, color: colors.fg, fontFamily: TOKENS.font }}
            title={`${tier} stimulation — score ${total}/25`}
            aria-label={`${tier} stimulation — score ${total}/25`}
          >
            {tierEmoji(tier)} {total}/25
          </span>
        </div>
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
          <div className="flex flex-col gap-1 text-xs" style={{ fontFamily: TOKENS.font }}>
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
            style={{ borderTop: `1px solid ${TOKENS.line}`, fontFamily: TOKENS.font }}
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
  { id: "myShows", label: "My Shows" },
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
  const [favorites, setFavorites] = useState([]);
  const [localDataLoaded, setLocalDataLoaded] = useState(false);

  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    setSortDesc(activeTab === "avoid");
  }, [activeTab]);

  useEffect(() => {
    const local = loadLocalData();
    setFavorites(local.favorites);
    setLocalDataLoaded(true);
  }, []);

  useEffect(() => {
    // Guard against saving before the initial load above has completed —
    // without this, the effect fires on mount with the default empty
    // state before the load effect's update has flushed, overwriting
    // real saved data with nothing (most visible under StrictMode's
    // double-invoked effects in dev, but the underlying race exists
    // regardless).
    if (!localDataLoaded) return;
    saveLocalData({ favorites });
  }, [favorites, localDataLoaded]);

  function toggleFavorite(name) {
    setFavorites((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  useEffect(() => {
    let cancelled = false;
    fetch(SHOWS_DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${SHOWS_DATA_URL}`);
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

  // The Limit tab and the Filters/Sort controls all operate on rating data
  // that doesn't exist in free mode (stripped from shows-free.json) — showing
  // them would mean either an always-empty tab or, worse, every show
  // misreporting as "High" stimulation (tierOf() falls through to "High" for
  // the NaN total you get from summing undefined fields). Hiding them here
  // rather than leaving broken/misleading controls visible.
  const visibleTabs = IS_FREE_MODE ? TABS.filter((t) => t.id !== "avoid") : TABS;

  const platforms = useMemo(() => {
    const set = new Set();
    SHOWS.forEach((s) => s.platforms.forEach((p) => set.add(p)));
    set.delete("TikTok");
    return ["All", ...Array.from(set).sort()];
  }, [SHOWS]);

  const baseList = useMemo(() => {
    if (activeTab === "recommendations") return SHOWS.filter((s) => s.recommended);
    if (activeTab === "myShows") return SHOWS.filter((s) => favorites.includes(s.name));
    if (activeTab === "avoid") return SHOWS.filter((s) => scoreOf(s) >= AVOID_THRESHOLD);
    return SHOWS;
  }, [activeTab, SHOWS, favorites]);

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
      .sort((a, b) => (IS_FREE_MODE ? 0 : sortDesc ? scoreOf(b) - scoreOf(a) : scoreOf(a) - scoreOf(b)));
  }, [baseList, query, platform, ageBucket, tier, contentTag, sortDesc]);

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: TOKENS.bg, fontFamily: TOKENS.font }}
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
        .cta-button { transition: filter 0.15s ease; }
        .cta-button:hover { filter: brightness(0.92); }
      `}</style>

      <header className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <h1
          className="hidden text-2xl sm:text-3xl"
          style={{ fontFamily: TOKENS.font, color: TOKENS.ink }}
        >
          StimScout.com | ScreenSniff.com
        </h1>

        <h2
          className="text-2xl sm:text-3xl"
          style={{ fontFamily: TOKENS.font, color: TOKENS.ink }}
        >
          {PAGE_TITLE}
        </h2>

        <p className="mt-3 max-w-2xl text-base sm:text-lg" style={{ color: TOKENS.inkMuted }}>
          Discover shows based on their stimulation level so you can choose what shows are best for your child...
        </p>

        {IS_FREE_MODE && (
          <p className="mt-2 text-sm" style={{ color: TOKENS.inkMuted }}>
            {FREE_MODE_BANNER}
          </p>
        )}

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
          {visibleTabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="px-4 py-2.5 text-sm font-medium motion-safe:transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded-t-lg"
                style={{
                  color: t.id === "myShows" ? TOKENS.age : active ? TOKENS.ink : TOKENS.inkMuted,
                  backgroundColor: t.id === "myShows" ? TOKENS.ageBg : "transparent",
                  borderBottom: active
                    ? `2px solid ${t.id === "myShows" ? TOKENS.age : TOKENS.low}`
                    : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {t.id === "myShows" && favorites.length > 0 ? `${t.label} (${favorites.length})` : t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className={`max-w-6xl mx-auto px-6 ${IS_FREE_MODE ? "pb-32" : "pb-20"}`}>
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
            onClick={() => !IS_FREE_MODE && setSortDesc((v) => !v)}
            disabled={IS_FREE_MODE}
            className={`ml-auto rounded-xl border px-3 py-2 text-sm font-medium motion-safe:transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
              IS_FREE_MODE ? "cursor-not-allowed opacity-60" : ""
            }`}
            style={{ borderColor: TOKENS.line, backgroundColor: TOKENS.surface, color: TOKENS.ink }}
          >
            {IS_FREE_MODE ? (
              <span className="inline-flex items-center gap-1.5">
                <LockIcon size={12} /> Sort: Stimulation
              </span>
            ) : (
              <>Sort: Stimulation {sortDesc ? "↓" : "↑"}</>
            )}
          </button>
        </div>

        {activeTab === "database" && (
          <div className="mt-2">
            {filtersOpen && (
              <>
                {IS_FREE_MODE && (
                  <p className="mb-1 inline-flex items-center gap-1.5 text-xs" style={{ color: TOKENS.inkMuted }}>
                    <LockIcon size={11} /> Unlock to apply filters
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Low", "Moderate", "High"].map((t) => (
                    <Chip
                      key={t}
                      active={tier === t}
                      disabled={IS_FREE_MODE}
                      onClick={() => setTier(tier === t ? "All" : t)}
                      color={tierColors(t)}
                    >
                      {tierEmoji(t)} {t} stimulation
                    </Chip>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CONTENT_TAGS.map((ct) => (
                    <Chip
                      key={ct.id}
                      active={contentTag === ct.id}
                      disabled={IS_FREE_MODE}
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
            <p style={{ fontFamily: TOKENS.font, fontSize: "1.1rem", color: TOKENS.ink }}>
              Loading shows…
            </p>
          </div>
        )}

        {loadState === "error" && (
          <div
            className="mt-6 rounded-2xl border p-10 text-center"
            style={{ borderColor: TOKENS.high, backgroundColor: TOKENS.highBg, color: TOKENS.high }}
          >
            <p style={{ fontFamily: TOKENS.font, fontSize: "1.1rem" }}>
              Couldn't load the show data.
            </p>
            <p className="mt-1 text-sm">Check that {SHOWS_DATA_URL} is reachable, then refresh.</p>
          </div>
        )}

        {loadState === "ready" && filtered.length === 0 && (
          <div
            className="mt-6 rounded-2xl border p-10 text-center"
            style={{ borderColor: TOKENS.line, backgroundColor: TOKENS.surface, color: TOKENS.inkMuted }}
          >
            <p style={{ fontFamily: TOKENS.font, fontSize: "1.1rem", color: TOKENS.ink }}>
              No shows match that combination yet.
            </p>
            <p className="mt-1 text-sm">Try widening a filter, the database grows every week.</p>
          </div>
        )}

        {loadState === "ready" && filtered.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <ShowCard
                key={s.name}
                show={s}
                isFavorite={favorites.includes(s.name)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        <footer className="mt-16 pt-6 border-t text-xs" style={{ borderColor: TOKENS.line, color: TOKENS.inkMuted }}>
          Ratings combine Speed, Emotional Intensity, Pacing, Novelty, and Sensory Load (1–5 each, summed to a
          total out of 25). Low 5–11 · Moderate 12–18 · High 19–25. Built from published parent reviews and
          documented pacing data — use alongside your own judgment of your child.
        </footer>
      </main>

      {IS_FREE_MODE && (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 w-full border-t"
          style={{ backgroundColor: TOKENS.surface, borderColor: TOKENS.line }}
        >
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center">
            <a
              href={CTA_LINK}
              className="cta-button inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{ backgroundColor: TOKENS.low, color: TOKENS.surface, fontFamily: TOKENS.font }}
            >
              <UnlockIcon size={16} />
              {CTA_LABEL}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
