// Diffs public/data/shows.json against a "before" snapshot to find shows
// added by the weekly automation, then prepends a copy-paste-ready
// community post summarizing them to logs/community-updates.txt.
//
// Usage: node scripts/log-weekly-update.mjs <path-to-before-snapshot>

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOWS_PATH = path.join(__dirname, "..", "public", "data", "shows.json");
const LOG_PATH = path.join(__dirname, "..", "logs", "community-updates.txt");

const ENTRIES_MARKER = "<!-- entries below — do not edit this line -->";

const LOG_HEADER = `# The Show Pulse — Weekly Community Update Log

Auto-generated every week when new shows are added. Newest post is at the top —
copy it from here to share with your community.

${ENTRIES_MARKER}

`;

function tierOf(total) {
  if (total <= 11) return "Low";
  if (total <= 18) return "Moderate";
  return "High";
}

function tierEmoji(tier) {
  if (tier === "Low") return "🟢";
  if (tier === "Moderate") return "🟡";
  return "🔴";
}

const beforePath = process.argv[2];
if (!beforePath) {
  console.error("Usage: node scripts/log-weekly-update.mjs <path-to-before-snapshot>");
  process.exit(1);
}

const before = JSON.parse(fs.readFileSync(beforePath, "utf8"));
const after = JSON.parse(fs.readFileSync(SHOWS_PATH, "utf8"));

const beforeNames = new Set(before.map((s) => s.name));
const added = after.filter((s) => !beforeNames.has(s.name));

if (added.length === 0) {
  console.log("No new shows added this run — skipping log entry.");
  process.exit(0);
}

const ACCESS_CODE_FOR_POST = "8965";

// Round down to the nearest hundred so the "over N00 shows" figure stays
// accurate (never overstates the database size) without needing a manual
// update every week.
const totalShowsRounded = Math.floor(after.length / 100) * 100;

const sortedAdded = [...added].sort(
  (a, b) =>
    a.speed + a.emotional + a.pacing + a.novelty + a.sensory -
    (b.speed + b.emotional + b.pacing + b.novelty + b.sensory)
);

const lines = [];
lines.push("Weekly Database Update");
lines.push("");
lines.push(`${added.length} new show${added.length === 1 ? " has" : "s have"} been added to The Safe Screen Time Database this week:`);
lines.push("");

for (const s of sortedAdded) {
  const total = s.speed + s.emotional + s.pacing + s.novelty + s.sensory;
  const tier = tierOf(total);
  lines.push(`${tierEmoji(tier)} ${s.name} — Ages ${s.ageMin}–${s.ageMax} — ${tier} stimulation`);
  lines.push("");
}

lines.push(
  `Full details of these shows, plus over ${totalShowsRounded} other kids shows can be found in the database.`
);
lines.push("");
lines.push(
  `Browse the full database to find what's right for your family. (access code: ${ACCESS_CODE_FOR_POST})`
);
lines.push("");
lines.push("-".repeat(50));
lines.push("");

const newEntry = lines.join("\n");

let existingEntries = "";
if (fs.existsSync(LOG_PATH)) {
  const raw = fs.readFileSync(LOG_PATH, "utf8");
  const markerIndex = raw.indexOf(ENTRIES_MARKER);
  existingEntries =
    markerIndex === -1 ? raw : raw.slice(markerIndex + ENTRIES_MARKER.length).replace(/^\s*\n/, "");
}

fs.writeFileSync(LOG_PATH, LOG_HEADER + newEntry + existingEntries);

console.log(`Logged ${added.length} new show(s) to ${LOG_PATH}.`);
