// Generates public/data/shows-free.json from public/data/shows.json by
// stripping every rating-related field. Run via `npm run generate:free`,
// or automatically as part of `npm run build`. Always regenerate this file
// from shows.json — never hand-edit shows-free.json directly, it's a
// derived build artifact, not a source of truth.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = path.join(__dirname, "..", "public", "data", "shows.json");
const OUTPUT_PATH = path.join(__dirname, "..", "public", "data", "shows-free.json");

const FREE_FIELDS = ["name", "platforms", "genre", "ageMin", "ageMax", "recommended"];

const shows = JSON.parse(fs.readFileSync(SOURCE_PATH, "utf8"));

const freeShows = shows.map((show) => {
  const stripped = {};
  for (const field of FREE_FIELDS) {
    if (field in show) stripped[field] = show[field];
  }
  return stripped;
});

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(freeShows, null, 2) + "\n");

console.log(`Generated ${OUTPUT_PATH} with ${freeShows.length} shows (rating fields stripped).`);
