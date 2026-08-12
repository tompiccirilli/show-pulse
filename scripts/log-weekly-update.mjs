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

const dateLabel = new Date().toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const lines = [];
lines.push(`📬 New shows added — ${dateLabel}`);
lines.push("=".repeat(50));
lines.push("");
lines.push(`I added ${added.length} new show${added.length === 1 ? "" : "s"} to The Safe Screen Time Database this week:`);
lines.push("");

for (const s of added) {
  const total = s.speed + s.emotional + s.pacing + s.novelty + s.sensory;
  const tier = tierOf(total);
  lines.push(`${tierEmoji(tier)} ${s.name} — Ages ${s.ageMin}–${s.ageMax} — ${tier} stimulation`);
  lines.push(`   Available on: ${s.platforms.join(", ")}`);
  if (s.notes) lines.push(`   ${s.notes}`);
  lines.push("");
}

lines.push("Browse the full database to find what's right for your family.");
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
