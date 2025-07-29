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
  // Determine output based on file name. If this is an Inventory CSV, write to
  // inventory.json. Otherwise derive the payer name and prefix with allowables_.
  const lower = file.toLowerCase();
  if (lower.includes('inventory')) {
    // Normalize inventory record fields. Coerce numeric fields.
    const invRecords = records.map((r) => ({
      sku: r.sku || r.SKU || r.Sku,
      name: r.name || r.Name || r.description || r.Description || '',
      hcpcs: r.hcpcs || r.HCPCS || r.procCode || r.ProcCode || '',
      onHand: r.onHand !== undefined ? Number(r.onHand) : Number(r.onhand || r.OnHand || r.quantity || 0),
      reorderPoint: r.reorderPoint !== undefined ? Number(r.reorderPoint) : Number(r.reorderpoint || r.ReorderPoint || r.reorder_pt || 0),
      avgCost: r.avgCost !== undefined ? Number(r.avgCost) : Number(r.avgcost || r.unitCost || r.UnitCost || 0),
      rentalRate: r.rentalRate !== undefined ? Number(r.rentalRate) : Number(r.rentalrate || r.RentalRate || 0),
    }));
    const outPath = new URL('inventory.json', DATA_DIR);
    fs.writeFileSync(outPath, JSON.stringify(invRecords));
    console.log(`Converted ${file} -> inventory.json`);
  } else {
    // Derive payer name from filename
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
    fs.writeFileSync(outPath, JSON.stringify(records));
    console.log(`Converted ${file} -> ${outName}`);
  }
});