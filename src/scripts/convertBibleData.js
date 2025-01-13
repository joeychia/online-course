import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DIR = path.join(__dirname, '..', 'data', 'raw');
const QIANLI_DIR = path.join(__dirname, '..', 'data', 'qianli');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'processed');

// Ensure output directories exist
[OUTPUT_DIR, QIANLI_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function fetchQianliContent(url) {
  const filename = url.split('/').pop();
  const filePath = path.join(QIANLI_DIR, filename);

  // If file exists, read from disk
  if (fs.existsSync(filePath)) {
    console.log(`Reading Qianli content from cache: ${filename}`);
    return fs.readFileSync(filePath, 'utf-8');
  }

  // Otherwise fetch and save
  console.log(`Downloading Qianli content: ${url}`);
  const fullUrl = `https://bibleplan.github.io${url}`;
  const response = await axios.get(fullUrl);
  fs.writeFileSync(filePath, response.data);
  return response.data;
}

function extractYoutubeLink(html) {
  const $ = cheerio.load(html);
  
  // Try iframe first
  const iframeUrl = $('iframe[src*="youtube"]').attr('src');
  if (iframeUrl) {
    const match = iframeUrl.match(/\/embed\/([^?]+)/);
    if (match) {
      return {
        text: '',
        url: `https://www.youtube.com/watch?v=${match[1]}`
      };
    }
  }
  
  // Try anchor tag
  const youtubeLink = $('a[href*="youtu"]');
  if (youtubeLink.length) {
    return {
      text: youtubeLink.text().trim(),
      url: youtubeLink.attr('href').replace('_blank', '')
    };
  }
  
  return null;
}

function extractMarkdownContent($, element) {
  return $(element).children().map((_, el) => {
    const $el = $(el);
    if (el.tagName === 'p') return $el.text().trim();
    if (el.tagName === 'ul') {
      const items = $el.find('li').map((_, li) => `* ${$(li).text().trim()}`).get();
      return items.join('\n');
    }
    return $el.text().trim();
  }).get().join('\n\n');
}

async function convertHtmlToJson(html, filename) {
  const $ = cheerio.load(html);
  
  // Find Qianli link
  const qianliLink = $('#dailyContent ul:last-of-type a[href*="qianli.html"]').attr('href');
  let qianliContent = null;
  let youtubeData = null;

  if (qianliLink) {
    try {
      const qianliHtml = await fetchQianliContent(qianliLink);
      youtubeData = extractYoutubeLink(qianliHtml);
    } catch (error) {
      console.error(`Error fetching Qianli content: ${error.message}`);
    }
  }
  
  // Extract content from the page
  const content = {
    title: $('.project-name').first().text().trim(),
    description: $('.project-tagline').text().trim(),
    date: $('#dailyContent .meta').text().trim(),
    question: $('#dailyContent h3').first().text().replace('問題：', '').trim(),
    readings: {
      main: {
        text: $('#dailyContent table:first-of-type a:first-of-type').text().trim(),
        links: {
          traditional: $('#dailyContent table:first-of-type a[href*="CUVMPT"]').attr('href'),
          simplified: $('#dailyContent table:first-of-type a[href*="CUVMPS"]').attr('href'),
          niv: $('#dailyContent table:first-of-type a[href*="NIV"]').attr('href'),
          youversion: $('#dailyContent table:first-of-type a[href*="bible.com"]').attr('href')
        }
      },
      psalm: {
        text: $('#dailyContent table:nth-of-type(2) a:first-of-type').text().trim(),
        links: {
          traditional: $('#dailyContent table:nth-of-type(2) a[href*="CUVMPT"]').attr('href'),
          simplified: $('#dailyContent table:nth-of-type(2) a[href*="CUVMPS"]').attr('href'),
          niv: $('#dailyContent table:nth-of-type(2) a[href*="NIV"]').attr('href'),
          youversion: $('#dailyContent table:nth-of-type(2) a[href*="bible.com"]').attr('href')
        }
      }
    },
    meditation: {
      gods_story: {
        title: $('#dailyContent h3#默想神的故事').text().trim(),
        content: extractMarkdownContent($, $('#dailyContent h3#默想神的故事').nextUntil('h3'))
      },
      my_story: {
        title: $('#dailyContent h3#默想我的故事').text().trim(),
        content: extractMarkdownContent($, $('#dailyContent h3#默想我的故事').nextUntil('h3'))
      }
    },
    sharing_links: $('#dailyContent ul:last-of-type a').map((i, el) => ({
      title: $(el).text(),
      url: $(el).attr('href')
    })).get(),
    qianli: qianliLink ? {
      url: qianliLink,
      youtube: youtubeData
    } : null
  };

  return content;
}

async function convertData() {
  // Process weeks 1-3 files
  const files = fs.readdirSync(RAW_DIR)
    .filter(file => file.endsWith('.html'))
    .filter(file => {
      const weekMatch = file.match(/wk(\d+)-/);
      if (!weekMatch) return false;
      const weekNum = parseInt(weekMatch[1]);
      return weekNum >= 1 && weekNum <= 3;
    })
    .sort((a, b) => {
      // Sort by week and day for consistent processing order
      const [aWeek, aDay] = a.match(/wk(\d+)-day(\d+)/).slice(1).map(Number);
      const [bWeek, bDay] = b.match(/wk(\d+)-day(\d+)/).slice(1).map(Number);
      return aWeek === bWeek ? aDay - bDay : aWeek - bWeek;
    });
  
  let successCount = 0;
  let failureCount = 0;

  for (const filename of files) {
    try {
      console.log(`Converting ${filename}...`);
      const html = fs.readFileSync(path.join(RAW_DIR, filename), 'utf-8');
      const content = await convertHtmlToJson(html, filename);
      
      const outputPath = path.join(OUTPUT_DIR, filename.replace('.html', '.json'));
      fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));
      console.log(`Saved to ${outputPath}`);
      successCount++;
    } catch (error) {
      console.error(`Error converting ${filename}:`, error instanceof Error ? error.message : String(error));
      failureCount++;
    }
  }

  console.log(`\nConversion complete!`);
  console.log(`Successfully converted: ${successCount} files`);
  console.log(`Failed to convert: ${failureCount} files`);
}

// Run the script
convertData().catch(console.error); 