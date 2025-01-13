import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DIR = path.join(__dirname, '..', 'data', 'raw');

// Ensure output directory exists
if (!fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

function findLatestDownloadedWeek() {
  const files = fs.readdirSync(RAW_DIR).filter(file => file.endsWith('.html'));
  if (files.length === 0) return 0;

  const weekNumbers = files.map(file => {
    const match = file.match(/wk(\d+)-/);
    return match ? parseInt(match[1]) : 0;
  });

  return Math.max(...weekNumbers);
}

async function downloadData() {
  const startWeek = findLatestDownloadedWeek() + 1;
  console.log(`Starting download from week ${startWeek}`);

  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 7; // Stop after a full week of failures
  let successCount = 0;
  let failureCount = 0;
  let currentWeek = startWeek;

  while (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
    for (let day = 1; day <= 7; day++) {
      const filename = `wk${currentWeek}-day${day}-daily.html`;
      const filePath = path.join(RAW_DIR, filename);
      
      // Skip if file already exists
      if (fs.existsSync(filePath)) {
        console.log(`Skipping ${filename} - already exists`);
        continue;
      }

      const url = `https://bibleplan.github.io/daily/2024/wk${currentWeek}-day${day}-daily.html`;
      
      try {
        console.log(`Downloading ${url}...`);
        const response = await axios.get(url);
        
        fs.writeFileSync(filePath, response.data);
        console.log(`Saved to ${filePath}`);
        successCount++;
        consecutiveFailures = 0; // Reset counter on success
      } catch (error) {
        console.error(`Error downloading ${url}:`, error instanceof Error ? error.message : String(error));
        failureCount++;
        consecutiveFailures++;
        
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.log(`\nStopping after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`);
          break;
        }
      }

      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) break;
    currentWeek++;
  }

  console.log(`\nDownload complete!`);
  console.log(`Started from week: ${startWeek}`);
  console.log(`Ended at week: ${currentWeek}`);
  console.log(`Successfully downloaded: ${successCount} files`);
  console.log(`Failed to download: ${failureCount} files`);
}

// Run the script
downloadData().catch(console.error); 