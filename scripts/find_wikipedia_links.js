import fs from "fs";
import path from "path";

// ANSI console colors
const Colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, "data");

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Check if a URL is valid and resolves (accepting 200, 301, 302)
async function checkUrl(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "HistoryGameLinkFinder/1.0 (martinblaustein@gmail.com)",
      },
    });
    if (res.status === 200 || res.status === 301 || res.status === 302)
      return true;

    // Fallback to GET
    const getRes = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "HistoryGameLinkFinder/1.0 (martinblaustein@gmail.com)",
      },
    });
    return (
      getRes.status === 200 || getRes.status === 301 || getRes.status === 302
    );
  } catch (e) {
    return false;
  }
}

// Search Wikipedia for a topic and return the page title
async function searchWikipedia(query) {
  const url = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=1&format=json&origin=*`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "HistoryGameLinkFinder/1.0 (martinblaustein@gmail.com)",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.query?.search;
    if (results && results.length > 0) {
      return results[0].title;
    }
  } catch (e) {
    console.error(
      `${Colors.red}Search error for "${query}":${Colors.reset}`,
      e.message,
    );
  }
  return null;
}

async function processDeck(deckName, options, unmatchedList) {
  const filePath = path.join(DATA_DIR, `${deckName}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(
      `${Colors.red}Deck file not found:${Colors.reset} ${filePath}`,
    );
    return;
  }

  console.log(
    `\n${Colors.bright}${Colors.blue}=== Processing Deck: ${deckName} ===${Colors.reset}`,
  );

  const deck = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let modified = false;
  let missingCount = 0;
  let fixedCount = 0;

  for (let i = 0; i < deck.events.length; i++) {
    const event = deck.events[i];
    let hasLink = event.wikipediaUrl && event.wikipediaUrl.trim() !== "";

    if (!hasLink || options.forceUpdate) {
      missingCount++;
      console.log(`Searching link for: "${event.event}"...`);
      let searchTitle = await searchWikipedia(event.event);

      // Fallback search using first person if available
      if (!searchTitle && event.people && event.people.length > 0) {
        console.log(
          `  No search result for event. Trying person: "${event.people[0]}"...`,
        );
        searchTitle = await searchWikipedia(event.people[0]);
      }

      if (searchTitle) {
        // Construct canonical Spanish Wikipedia URL
        const canonicalUrl = `https://es.wikipedia.org/wiki/${encodeURIComponent(searchTitle.replace(/ /g, "_"))}`;
        console.log(
          `  Proposed URL: ${Colors.green}${canonicalUrl}${Colors.reset}`,
        );

        const isValid = await checkUrl(canonicalUrl);
        if (isValid) {
          console.log(`    Status: ${Colors.green}VALID${Colors.reset}`);
          if (options.fix) {
            deck.events[i].wikipediaUrl = canonicalUrl;
            modified = true;
            fixedCount++;
            console.log(
              `    ${Colors.bright}${Colors.green}[UPDATED]${Colors.reset} Set wikipediaUrl for "${event.event}"`,
            );
          } else {
            console.log(
              `    [DRY RUN] Would update "${event.event}" with wikipediaUrl: ${canonicalUrl}`,
            );
          }
        } else {
          console.log(
            `    Status: ${Colors.red}INVALID URL (cannot resolve)${Colors.reset}`,
          );
          unmatchedList.push({
            deck: deckName,
            event: event.event,
            reason: "Constructed URL failed resolution checks",
          });
        }
      } else {
        console.log(
          `    ${Colors.yellow}No Wikipedia article found for "${event.event}"${Colors.reset}`,
        );
        unmatchedList.push({
          deck: deckName,
          event: event.event,
          reason: "No matching Wikipedia article found",
        });
      }

      // Delay to respect rate limits
      await sleep(250);
    }
  }

  if (options.fix && modified) {
    fs.writeFileSync(filePath, JSON.stringify(deck, null, 2), "utf8");
    console.log(
      `\n${Colors.green}${Colors.bright}✓ Deck ${deckName}.json successfully updated and saved!${Colors.reset}`,
    );
  } else if (modified) {
    console.log(
      `\n${Colors.yellow}[DRY RUN] Links were proposed but not saved.${Colors.reset}`,
    );
  }

  console.log(`\n${Colors.bright}Deck Summary (${deckName}):${Colors.reset}`);
  console.log(`  - Total Events: ${deck.events.length}`);
  console.log(`  - Missing Links Checked: ${missingCount}`);
  console.log(`  - Successfully Linked/Proposed: ${fixedCount}`);
}

async function run() {
  const args = process.argv.slice(2);
  const options = {
    deck: "all",
    fix: false,
    dryRun: true,
    forceUpdate: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--deck" && args[i + 1]) {
      options.deck = args[i + 1];
      i++;
    } else if (args[i] === "--fix") {
      options.fix = true;
      options.dryRun = false;
    } else if (args[i] === "--dry-run") {
      options.dryRun = true;
      options.fix = false;
    } else if (args[i] === "--force") {
      options.forceUpdate = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Wikipedia Link Finder Script for History Game

Usage:
  node scripts/find_wikipedia_links.js [options]

Options:
  --deck <name>     Name of the deck (argentina, filosofia, mundo, all) [default: all]
  --dry-run         Query wikipedia and log proposals, do not write to JSON [default]
  --fix             Write successfully validated Wikipedia links to deck JSON files
  --force           Force checking/overwriting links for all events (even those with existing URLs)
  --help, -h        Show this help message
      `);
      process.exit(0);
    }
  }

  const decksToProcess =
    options.deck === "all"
      ? ["argentina", "filosofia", "mundo"]
      : [options.deck];

  console.log(
    `${Colors.bright}Starting Wikipedia Link Search & Validation Utility${Colors.reset}`,
  );
  console.log(
    `Mode: ${options.fix ? Colors.red + "FIX (In-Place Update)" : Colors.green + "DRY RUN (Preview Only)"}${Colors.reset}`,
  );

  const unmatchedList = [];

  for (const deck of decksToProcess) {
    await processDeck(deck, options, unmatchedList);
  }

  console.log(
    `\n${Colors.bright}${Colors.magenta}====================================================${Colors.reset}`,
  );
  console.log(
    `${Colors.bright}${Colors.magenta}               FINAL UNMATCHED REPORT               ${Colors.reset}`,
  );
  console.log(
    `${Colors.bright}${Colors.magenta}====================================================${Colors.reset}`,
  );
  if (unmatchedList.length === 0) {
    console.log(
      `${Colors.green}All events across all processed decks were successfully matched and linked to Wikipedia!${Colors.reset}`,
    );
  } else {
    console.log(
      `${Colors.yellow}The following ${unmatchedList.length} events could not be matched to a valid Wikipedia URL:${Colors.reset}`,
    );
    unmatchedList.forEach((item) => {
      console.log(
        `  - [${item.deck}] "${item.event}" -> ${Colors.red}${item.reason}${Colors.reset}`,
      );
    });
  }
}

run();
