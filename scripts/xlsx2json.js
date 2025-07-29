// xlsx2json.js
// Node script to convert Driver assist Excel file into a minified JSON lookup table.
// The script expects to find an XLSX file in the raw-data directory whose name
// contains "driver" and "assist" (case‑insensitive). It reads the first sheet
// of the workbook and normalises columns to the fields: city, state, lat,
// lng and milesFromHQ. The milesFromHQ value is computed using a simple
// Haversine formula relative to the first row in the sheet (treated as HQ).

import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

// Directories
const RAW_DIR = new URL('../raw-data/', import.meta.url);
const DATA_DIR = new URL('../data/', import.meta.url);

// Ensure the data directory exists
fs.mkdirSync(path.dirname(DATA_DIR.pathname), { recursive: true });

// Helper to compute distance between two lat/lng points in miles
function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // radius of the Earth in miles
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find any XLSX file matching the driver assist naming pattern
const files = fs
  .readdirSync(RAW_DIR)
  .filter((f) => f.toLowerCase().endsWith('.xlsx') && f.toLowerCase().includes('driver') && f.toLowerCase().includes('assist'));

if (files.length === 0) {
  console.warn('No driver assist XLSX file found in raw-data');
  process.exit(0);
}

files.forEach((file) => {
  const filePath = new URL(file, RAW_DIR);
  // Read workbook using xlsx package
  const workbook = xlsx.readFile(filePath.pathname);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);
  if (!rows || rows.length === 0) {
    console.warn(`No rows found in ${file}`);
    return;
  }
  // Determine HQ lat/lng from the first row
  const hqLat = Number(rows[0].lat || rows[0].Lat || rows[0].latitude || rows[0].Latitude);
  const hqLng = Number(rows[0].lng || rows[0].Lng || rows[0].longitude || rows[0].Longitude);
  // Normalise records
  const records = rows.map((row) => {
    const city = row.city || row.City || row.town || row.Town;
    const state = row.state || row.state_name || row.State || row.province;
    const lat = Number(row.lat || row.Lat || row.latitude || row.Latitude);
    const lng = Number(row.lng || row.Lng || row.longitude || row.Longitude);
    // Compute milesFromHQ relative to first row
    const miles = haversine(hqLat, hqLng, lat, lng);
    return {
      city,
      state,
      lat,
      lng,
      milesFromHQ: Math.round(miles * 100) / 100,
    };
  });
  const outPath = new URL('driver_assist.json', DATA_DIR);
  fs.writeFileSync(outPath, JSON.stringify(records));
  console.log(`Converted ${file} -> driver_assist.json (${records.length} rows)`);
});
