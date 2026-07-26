#!/usr/bin/env node
/**
 * gabrieltoth.com — i18n parameter coverage & consistency validator (CI gate).
 *
 * Deterministically checks that every translation key in all target locale files
 * matches the exact interpolation / template parameters declared in `en.json` (source).
 *
 * Prevents runtime errors caused by missing, extra, or renamed placeholders
 * (e.g. `{credentials}` vs `{count}`, `{actor}` vs `{name}`) when switching languages.
 *
 * Supported parameter formats:
 *   - ICU MessageFormat: `{count}`, `{name}`, `{date, dateTime}`, `{count, plural, ...}`
 *   - next-intl format: same as ICU MessageFormat
 *
 * Usage:
 *   node scripts/i18n/check-params.mjs                     # Default: strict check
 *   node scripts/i18n/check-params.mjs --threshold=100    # Require 100% parameter match
 *   node scripts/i18n/check-params.mjs --report           # Detailed tabular report
 *   node scripts/i18n/check-params.mjs --json             # Machine-readable JSON output
 *
 * Exits 1 if any parameter mismatch is detected or if coverage < threshold.
 */

import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..", "..");

const DEFAULT_TARGETS = [
  { name: "UI Messages", dir: path.join(ROOT, "src", "i18n", "messages") },
];

const SOURCE_LOCALE = "en";

function parseArgs(argv) {
  const opts = { threshold: 100, report: false, json: false, strict: true };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--threshold=")) {
      opts.threshold = Number(arg.slice(12));
    } else if (arg === "--report") {
      opts.report = true;
    } else if (arg === "--json") {
      opts.json = true;
    } else if (arg === "--warn") {
      opts.strict = false;
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage: node scripts/i18n/check-params.mjs [options]",
          "",
          "  --threshold=<n>   Minimum parameter matching coverage % required (default 100)",
          "  --report          Print detailed per-locale parameter mismatch report",
          "  --json            Emit machine-readable JSON summary to stdout",
          "  --warn            Print warnings but exit 0 on mismatch",
        ].join("\n")
      );
      process.exit(0);
    }
  }
  if (!Number.isFinite(opts.threshold) || opts.threshold < 0 || opts.threshold > 100) {
    throw new Error(`Invalid --threshold value: ${opts.threshold}`);
  }
  return opts;
}

/**
 * Deterministically extracts top-level parameter identifiers from an ICU template string.
 * Correctly ignores sub-branches in plural/select blocks (e.g. `{count, plural, one {} other {s}}` -> `['count']`).
 */
export function extractIcuParams(text) {
  if (typeof text !== "string") return new Set();
  const params = new Set();

  function parse(str) {
    let depth = 0;
    let start = -1;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (str[i] === "}") {
        depth--;
        if (depth === 0 && start !== -1) {
          const content = str.slice(start + 1, i);
          const commaIdx = content.indexOf(",");
          const spaceIdx = content.search(/\s/);
          let endIdx = content.length;
          if (commaIdx !== -1 && (spaceIdx === -1 || commaIdx < spaceIdx)) {
            endIdx = commaIdx;
          } else if (spaceIdx !== -1) {
            endIdx = spaceIdx;
          }

          let paramName = content.slice(0, endIdx).trim();
          paramName = paramName.replace(/^\{+/, "").replace(/\}+$/, "").trim();

          if (paramName && /^[a-zA-Z0-9_-]+$/.test(paramName)) {
            params.add(paramName);
          }
          start = -1;
        }
      }
    }
  }

  parse(text);
  return params;
}

function flattenKeys(obj, prefix = "") {
  const res = {};
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(res, flattenKeys(v, full));
    } else if (typeof v === "string") {
      res[full] = v;
    }
  }
  return res;
}

function pad(str, width) {
  const s = String(str);
  return s.length >= width ? s : s + " ".repeat(width - s.length);
}

function padLeft(str, width) {
  const s = String(str);
  return s.length >= width ? s : " ".repeat(width - s.length) + s;
}

async function auditTree(targetGroup, opts) {
  const dirPath = targetGroup.dir;
  const enFile = path.join(dirPath, `${SOURCE_LOCALE}.json`);
  if (!existsSync(enFile)) {
    return { name: targetGroup.name, error: `Missing source locale file: ${enFile}` };
  }

  const enJson = JSON.parse(await fs.readFile(enFile, "utf8"));
  const enFlat = flattenKeys(enJson);
  const enParams = {};
  for (const [key, text] of Object.entries(enFlat)) {
    const params = extractIcuParams(text);
    if (params.size > 0) {
      enParams[key] = params;
    }
  }

  const totalEnParamsCount = Object.keys(enParams).length;
  const files = (await fs.readdir(dirPath))
    .filter((f) => f.endsWith(".json") && f !== `${SOURCE_LOCALE}.json`)
    .sort();

  const localeResults = [];

  for (const f of files) {
    const locale = f.replace(".json", "");
    const filePath = path.join(dirPath, f);
    let targetFlat = {};
    try {
      targetFlat = flattenKeys(JSON.parse(await fs.readFile(filePath, "utf8")));
    } catch (err) {
      localeResults.push({
        locale,
        totalEnParams: totalEnParamsCount,
        checked: 0,
        mismatches: [],
        coverage: 0,
        parseError: err.message,
      });
      continue;
    }

    let checkedCount = 0;
    const mismatches = [];

    for (const [key, enSet] of Object.entries(enParams)) {
      const targetText = targetFlat[key];
      if (typeof targetText !== "string") continue;

      checkedCount++;
      const targetSet = extractIcuParams(targetText);
      const enSorted = Array.from(enSet).sort();
      const targetSorted = Array.from(targetSet).sort();

      const enStr = enSorted.join(",");
      const targetStr = targetSorted.join(",");

      if (enStr !== targetStr) {
        const missing = enSorted.filter((p) => !targetSet.has(p));
        const extra = targetSorted.filter((p) => !enSet.has(p));
        mismatches.push({
          key,
          enParams: enSorted,
          targetParams: targetSorted,
          missing,
          extra,
          enText: enFlat[key],
          targetText,
        });
      }
    }

    const matchedCount = checkedCount - mismatches.length;
    const coverage = checkedCount === 0 ? 100 : (matchedCount / checkedCount) * 100;

    localeResults.push({
      locale,
      totalEnParams: totalEnParamsCount,
      checked: checkedCount,
      matched: matchedCount,
      mismatchCount: mismatches.length,
      mismatches,
      coverage,
    });
  }

  return {
    name: targetGroup.name,
    dir: dirPath,
    totalEnParamsCount,
    localesCount: files.length,
    localeResults,
  };
}

async function main() {
  const opts = parseArgs(process.argv);
  const groups = [];

  for (const group of DEFAULT_TARGETS) {
    if (existsSync(group.dir)) {
      const res = await auditTree(group, opts);
      groups.push(res);
    }
  }

  let globalFailures = 0;
  const jsonReport = {
    threshold: opts.threshold,
    strict: opts.strict,
    ok: true,
    groups: [],
  };

  for (const g of groups) {
    if (g.error) {
      jsonReport.ok = false;
      globalFailures++;
      continue;
    }

    const groupFailures = g.localeResults.filter(
      (r) => r.mismatchCount > 0 || r.coverage < opts.threshold
    );
    if (groupFailures.length > 0) {
      globalFailures += groupFailures.length;
    }

    jsonReport.groups.push({
      name: g.name,
      totalEnParamsKeys: g.totalEnParamsCount,
      localesChecked: g.localesCount,
      ok: groupFailures.length === 0,
      results: g.localeResults.map((r) => ({
        locale: r.locale,
        checked: r.checked,
        matched: r.matched,
        mismatchCount: r.mismatchCount,
        coveragePct: Number(r.coverage.toFixed(2)),
        mismatches: r.mismatches.map((m) => ({
          key: m.key,
          expected: m.enParams,
          received: m.targetParams,
          missing: m.missing,
          extra: m.extra,
        })),
      })),
    });
  }

  jsonReport.ok = globalFailures === 0;

  if (opts.json) {
    process.stdout.write(JSON.stringify(jsonReport, null, 2) + "\n");
    if (!jsonReport.ok && opts.strict) process.exit(1);
    return;
  }

  // Human-readable console output
  console.log("================================================================================");
  console.log("gabrieltoth.com i18n Parameter Consistency & Coverage Report");
  console.log("================================================================================");

  for (const g of groups) {
    if (g.error) {
      console.error(`[FAIL] ${g.name}: ${g.error}`);
      continue;
    }

    console.log(`\n--- ${g.name} (${g.localesCount} locales, ${g.totalEnParamsCount} EN parameterized keys) ---`);
    const localeW = Math.max(8, ...g.localeResults.map((r) => r.locale.length));

    const header =
      pad("locale", localeW) +
      "  " +
      padLeft("coverage", 10) +
      "  " +
      padLeft("matched", 8) +
      "  " +
      padLeft("mismatches", 11) +
      "  " +
      padLeft("checked", 8);
    console.log(header);
    console.log("-".repeat(header.length));

    for (const r of g.localeResults) {
      const pct = `${r.coverage.toFixed(1)}%`;
      const statusMarker = r.mismatchCount > 0 || r.coverage < opts.threshold ? " ✗ FAIL" : " ✓ OK";
      console.log(
        pad(r.locale, localeW) +
          "  " +
          padLeft(pct, 10) +
          "  " +
          padLeft(r.matched, 8) +
          "  " +
          padLeft(r.mismatchCount, 11) +
          "  " +
          padLeft(r.checked, 8) +
          statusMarker
      );

      if (opts.report && r.mismatches.length > 0) {
        for (const m of r.mismatches) {
          console.log(`    ↳ Key: "${m.key}"`);
          console.log(`       Expected (EN): [${m.enParams.join(", ")}]`);
          console.log(`       Found (${r.locale}):  [${m.targetParams.join(", ")}]`);
          if (m.missing.length > 0) console.log(`       Missing:      [${m.missing.join(", ")}]`);
          if (m.extra.length > 0) console.log(`       Extra:        [${m.extra.join(", ")}]`);
        }
      }
    }
  }

  console.log("\n================================================================================");
  if (globalFailures > 0) {
    console.error(`[FAIL] i18n Parameter Verification Failed: ${globalFailures} locale mismatch issue(s).`);
    console.error("Run with --report for key-by-key breakdown.");
    if (opts.strict) process.exit(1);
  } else {
    console.log("[PASS] 100% i18n Parameter Consistency Verified across all locales!");
  }
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
