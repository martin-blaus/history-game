import fs from 'fs';
import https from 'https';

const data = JSON.parse(fs.readFileSync('data/filosofia.json', 'utf8'));
const events = data.events;

function checkUrl(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'HistoryGameChecker/1.0 (martinblaustein@gmail.com) Node.js'
      }
    };
    https.get(url, options, (res) => {
      resolve(res.statusCode);
    }).on('error', (e) => {
      resolve(500);
    });
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  let brokenCount = 0;
  for (const event of events) {
    if (event.image) {
      // Replace /400px- with /500px- in the URL
      const newUrl = event.image.replace('/400px-', '/500px-');
      const code = await checkUrl(newUrl);
      if (code !== 200) {
        console.log(`BROKEN - ${event.id}: ${event.event} - Code: ${code} - URL: ${newUrl}`);
        brokenCount++;
      } else {
        console.log(`OK - ${event.id}: ${event.event}`);
      }
      await sleep(250); // 250ms delay
    }
  }
  console.log(`Total broken with 500px: ${brokenCount}`);
}

run();
