import { promises as fs } from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MD_DIR = path.join(__dirname, '../data/daily');
const RAW_DIR = path.join(__dirname, '../data/raw');
const OUTPUT_DIR = path.join(__dirname, '../data/daily_md');

async function extractBibleLinks(htmlFilePath) {
  try {
    const htmlContent = await fs.readFile(htmlFilePath, 'utf-8');
    const $ = cheerio.load(htmlContent);
    
    const bibleLinks = [];
    
    // Find all tables that contain Bible references
    $('table').each((_, table) => {
      const $table = $(table);
      const firstLink = $table.find('a').first();
      if (!firstLink.length) return;
      
      const linkText = firstLink.text();
      if (linkText.includes('創世記') || linkText.includes('詩篇') || 
          linkText.includes('Genesis') || linkText.includes('Psalms')) {
        const row = [];
        
        // Get the main link from the first row
        const mainLink = $table.find('tr').first().find('a').first();
        if (mainLink.length) {
          row.push(`[${mainLink.text()}](${mainLink.attr('href')})`);
        }
        
        // Get the version links from the second row (skip YouVersion)
        const versionLinks = $table.find('tr').eq(1).find('a');
        versionLinks.each((i, link) => {
          if ($(link).text().includes('YouVersion')) return;
          const $link = $(link);
          const text = $link.text().replace('【', '').replace('】', '');
          row.push(`[${text}](${$link.attr('href')})`);
        });
        
        if (row.length > 0) {
          bibleLinks.push(row);
        }
      }
    });

    if (bibleLinks.length === 0) {
      return null;
    }

    // Convert links to markdown table
    let markdownTable = '';
    for (const row of bibleLinks) {
      markdownTable += '| ' + row.join(' | ') + ' |\n';
      markdownTable += '|' + row.map(() => ':---').join('|') + '|\n\n';
    }
    
    return markdownTable;
  } catch (error) {
    console.error(`Error extracting Bible links from ${htmlFilePath}:`, error);
    return null;
  }
}

async function processFiles() {
  try {
    // Create output directory if it doesn't exist
    try {
      await fs.access(OUTPUT_DIR);
    } catch {
      await fs.mkdir(OUTPUT_DIR, { recursive: true });
    }

    // Get all markdown files
    const files = await fs.readdir(MD_DIR);
    const mdFiles = files.filter(f => f.endsWith('-daily.md'));
    console.log(`Found ${mdFiles.length} markdown files to process`);

    for (const mdFile of mdFiles) {
      console.log(`\nProcessing ${mdFile}...`);
      
      const mdPath = path.join(MD_DIR, mdFile);
      const mdContent = await fs.readFile(mdPath, 'utf-8');

      // Skip if no placeholder found
      if (!mdContent.includes('{% include BibleLinks2024.html %}')) {
        console.log(`  No placeholder found in ${mdFile}, skipping...`);
        continue;
      }

      // Extract date from the markdown filename
      const dateParts = mdFile.match(/(\d{4})-(\d{2})-(\d{2})-daily\.md/);
      if (!dateParts) {
        console.log(`  Invalid filename format: ${mdFile}, skipping...`);
        continue;
      }

      const date = new Date(dateParts[1], parseInt(dateParts[2]) - 1, parseInt(dateParts[3]));
      const dayOfWeek = date.getDay() || 7; // Convert 0 (Sunday) to 7

      // Calculate week number based on the date
      // Assuming week 1 starts on 2024-01-01
      const startDate = new Date('2024-01-01');
      const weekNum = Math.ceil((date - startDate) / (7 * 24 * 60 * 60 * 1000));
      
      const htmlFile = `wk${weekNum}-day${dayOfWeek}-daily.html`;
      const htmlPath = path.join(RAW_DIR, htmlFile);

      try {
        await fs.access(htmlPath);
      } catch {
        console.log(`  No corresponding HTML file found: ${htmlFile}, skipping...`);
        continue;
      }

      console.log(`  Found corresponding HTML file: ${htmlFile}`);
      const bibleLinks = await extractBibleLinks(htmlPath);
      
      if (!bibleLinks) {
        console.log(`  No Bible links found in ${htmlFile}, skipping...`);
        continue;
      }

      // Create the output file
      const newContent = mdContent.replace('{% include BibleLinks2024.html %}', bibleLinks);
      const outputPath = path.join(OUTPUT_DIR, mdFile);
      await fs.writeFile(outputPath, newContent, 'utf-8');
      console.log(`  Successfully wrote ${mdFile} to ${path.relative(process.cwd(), outputPath)}`);
    }

    console.log('\nConversion completed successfully!');
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

processFiles(); 