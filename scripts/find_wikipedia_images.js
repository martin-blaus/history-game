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

// Check if a URL is valid and returning 200
async function checkUrl(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "HistoryGameImageFinder/1.0 (martinblaustein@gmail.com)",
      },
    });
    if (res.status === 200) return true;

    // Some servers block HEAD requests, fallback to GET (limiting response body download)
    const getRes = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "HistoryGameImageFinder/1.0 (martinblaustein@gmail.com)",
      },
    });
    return getRes.status === 200;
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
        "User-Agent": "HistoryGameImageFinder/1.0 (martinblaustein@gmail.com)",
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

// Get the main pageimage thumbnail for a given article title
async function getPageImage(title) {
  const url = `https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500&piprop=thumbnail&origin=*`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "HistoryGameImageFinder/1.0 (martinblaustein@gmail.com)",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      if (pageId && pages[pageId]?.thumbnail?.source) {
        return pages[pageId].thumbnail.source;
      }
    }
  } catch (e) {
    console.error(
      `${Colors.red}Page image error for "${title}":${Colors.reset}`,
      e.message,
    );
  }
  return null;
}

async function processDeck(deckName, options) {
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
  let brokenCount = 0;
  let fixedCount = 0;

  // Biografías nests events under characters[]; flat decks have them at the
  // top level. Iterate per group so both shapes work.
  const eventGroups = Array.isArray(deck.characters)
    ? deck.characters.map((c) => ({ label: c.name, events: c.events }))
    : [{ label: null, events: deck.events }];
  const totalEvents = eventGroups.reduce((n, g) => n + g.events.length, 0);

  for (const group of eventGroups) {
    for (let i = 0; i < group.events.length; i++) {
      const event = group.events[i];
      let isMissing = !event.image || event.image.trim() === "";
      let isBroken = false;

      if (!isMissing) {
        // Verify image
        const ok = await checkUrl(event.image);
        if (!ok) {
          isBroken = true;
          brokenCount++;
          console.log(
            `${Colors.yellow}[BROKEN]${Colors.reset} "${event.event}" has broken image URL: ${event.image}`,
          );
        }
      } else {
        missingCount++;
        console.log(
          `${Colors.cyan}[MISSING]${Colors.reset} "${event.event}" has no image.`,
        );
      }

      if (isMissing || isBroken || options.verifyAll) {
        // If verifyAll is enabled and image is working, just skip
        if (options.verifyAll && !isMissing && !isBroken) {
          continue;
        }

        console.log(`  Searching Wikipedia for: "${event.event}"...`);
        let searchTitle = await searchWikipedia(event.event);

        // Fallback search using first person (or the character, for biografías)
        const fallbackName =
          event.people && event.people.length > 0
            ? event.people[0]
            : group.label;
        if (!searchTitle && fallbackName) {
          console.log(
            `  No search result for event title. Trying person: "${fallbackName}"...`,
          );
          searchTitle = await searchWikipedia(fallbackName);
        }

        if (searchTitle) {
          console.log(`  Found Wikipedia Article: "${searchTitle}"`);
          const imgUrl = await getPageImage(searchTitle);
          if (imgUrl) {
            console.log(
              `  Found Image: ${Colors.green}${imgUrl}${Colors.reset}`,
            );
            const check = await checkUrl(imgUrl);
            if (check) {
              console.log(
                `    Status: ${Colors.green}VALID (resolves to HTTP 200)${Colors.reset}`,
              );
              if (options.fix) {
                group.events[i].image = imgUrl;
                modified = true;
                fixedCount++;
                console.log(
                  `    ${Colors.bright}${Colors.green}[UPDATED]${Colors.reset} Set new image for "${event.event}"`,
                );
              } else {
                console.log(
                  `    [DRY RUN] Would update "${event.event}" to: ${imgUrl}`,
                );
              }
            } else {
              console.log(
                `    Status: ${Colors.red}INVALID image URL (does not resolve)${Colors.reset}`,
              );
            }
          } else {
            console.log(
              `    ${Colors.dim}No thumbnail image found on Wikipedia page.${Colors.reset}`,
            );
          }
        } else {
          console.log(
            `    ${Colors.dim}No matching Wikipedia articles found.${Colors.reset}`,
          );
        }

        // Delay to respect rate limits
        await sleep(300);
      }
    }
  }

  if (options.fix && modified) {
    fs.writeFileSync(filePath, JSON.stringify(deck, null, 2), "utf8");
    console.log(
      `\n${Colors.green}${Colors.bright}✓ Deck ${deckName}.json successfully updated and saved!${Colors.reset}`,
    );
  } else if (modified) {
    console.log(
      `\n${Colors.yellow}[DRY RUN] Changes were proposed but not saved.${Colors.reset}`,
    );
  }

  console.log(`\n${Colors.bright}Deck Summary (${deckName}):${Colors.reset}`);
  console.log(`  - Total Events: ${totalEvents}`);
  console.log(`  - Missing Images Checked: ${missingCount}`);
  console.log(`  - Broken Images Checked: ${brokenCount}`);
  console.log(`  - Successfully Fixed/Proposed: ${fixedCount}`);
}

async function run() {
  const args = process.argv.slice(2);
  const options = {
    deck: "all",
    fix: false,
    dryRun: true,
    verifyAll: false,
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
    } else if (args[i] === "--verify-all") {
      options.verifyAll = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Wikipedia Image Finder Script for History Game

Usage:
  node scripts/find_wikipedia_images.js [options]

Options:
  --deck <name>     Name of the deck (argentina, filosofia, mundo, biografias, all) [default: all]
  --dry-run         Query wikipedia and log proposals, do not write to JSON [default]
  --fix             Write successfully validated image URLs to deck JSON files
  --verify-all      Force checking/updating images for all events (even those with existing valid URLs)
  --help, -h        Show this help message
      `);
      process.exit(0);
    }
  }

  const decksToProcess =
    options.deck === "all"
      ? ["argentina", "filosofia", "mundo", "biografias"]
      : [options.deck];

  console.log(
    `${Colors.bright}Starting Image Search & Repair Utility${Colors.reset}`,
  );
  console.log(
    `Mode: ${options.fix ? Colors.red + "FIX (In-Place Update)" : Colors.green + "DRY RUN (Preview Only)"}${Colors.reset}`,
  );

  for (const deck of decksToProcess) {
    await processDeck(deck, options);
  }
}

run();
