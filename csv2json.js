// csv2json.js
// Node script to convert allowables CSV files into JSON arrays.

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Directories
const RAW_DIR = new URL('../raw-data/', import.meta.url);
const DATA_DIR = new URL('../data/', import.meta.url);

// Ensure data directory exists
fs.mkdirSync(path.dirname(DATA_DIR.pathname), { recursive: true });

// Read all CSV files in the raw-data directory
const files = fs.readdirSync(RAW_DIR).filter((f) => f.toLowerCase().endsWith('.csv'));

files.forEach((file) => {
  const filePath = new URL(file, RAW_DIR);
  const csvString = fs.readFileSync(filePath, 'utf-8');
  // Parse CSV using csv-parse/sync with headers
  const records = parse(csvString, {
    columns: true,
    skip_empty_lines: true,
  });
  // Derive payer name from filename
  const lower = file.toLowerCase();
  let payer;
  if (lower.includes('medicaid')) {
    payer = 'medicaid';
  } else if (lower.includes('medicare')) {
    payer = 'medicare';
  } else if (lower.includes('commercial')) {
    payer = 'commercial';
  } else {
    // Default: use filename without extension, remove spaces
    payer = path.basename(file, '.csv').replace(/\s+/g, '').toLowerCase();
  }
  const outName = `allowables_${payer}.json`;
  const outPath = new URL(outName, DATA_DIR);
  // Write minified JSON
  fs.writeFileSync(outPath, JSON.stringify(records));
  console.log(`Converted ${file} -> ${outName}`);
});