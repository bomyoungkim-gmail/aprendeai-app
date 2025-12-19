#!/usr/bin/env node

/**
 * Documentation Verification Script
 * 
 * Checks:
 * 1. Critical doc files exist
 * 2. No broken relative links
 * 3. Schema doc reflects Prisma schema (basic)
 */

const fs = require('fs');
const path = require('path');

const DOCS_ROOT = path.join(__dirname, '..', 'docs');

const CRITICAL_FILES = [
  '00-overview/00-README.md',
  '00-overview/01-glossary.md',
  '00-overview/04-docs-dod.md',
  '02-business-rules/00-rules-index.md',
  '02-business-rules/02-srs.md',
  '02-business-rules/03-gating-layers.md',
];

let errors = [];
let warnings = [];

// Check 1: Critical files exist
console.log('Checking critical files...');
for (const file of CRITICAL_FILES) {
  const fullPath = path.join(DOCS_ROOT, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing critical file: ${file}`);
  } else {
    console.log(`✓ ${file}`);
  }
}

// Check 2: Find all markdown files and check links
console.log('\nChecking relative links...');
function checkLinksInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(DOCS_ROOT, filePath);
  
  // Match markdown links: [text](path)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const linkPath = match[2];
    
    // Skip external links
    if (linkPath.startsWith('http') || linkPath.startsWith('#')) {
      continue;
    }
    
    // Resolve relative path
    const fileDir = path.dirname(filePath);
    const targetPath = path.join(fileDir, linkPath.split('#')[0]);
    
    if (!fs.existsSync(targetPath)) {
      warnings.push(`Broken link in ${relPath}: ${linkPath}`);
    }
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.md')) {
      checkLinksInFile(fullPath);
    }
  }
}

walkDir(DOCS_ROOT);

// Check 3: Schema sync (basic - just check if both changed)
console.log('\nChecking schema sync...');
const schemaPath = path.join(__dirname, '..', 'services', 'api', 'prisma', 'schema.prisma');
const schemaDocPath = path.join(DOCS_ROOT, '04-data', '00-schema.md');

if (fs.existsSync(schemaPath) && fs.existsSync(schemaDocPath)) {
  const schemaStat = fs.statSync(schemaPath);
  const docStat = fs.statSync(schemaDocPath);
  
  if (schemaStat.mtimeMs > docStat.mtimeMs + (7 * 24 * 60 * 60 * 1000)) {
    warnings.push('Schema.prisma modified more recently than schema doc (>7 days). Consider updating.');
  } else {
    console.log('✓ Schema doc up to date');
  }
}

// Report
console.log('\n' + '='.repeat(50));
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log('='.repeat(50));

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(err => console.log(`  - ${err}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warn => console.log(`  - ${warn}`));
}

// Exit code
if (errors.length > 0) {
  console.log('\n❌ Documentation check FAILED');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Documentation check passed with warnings');
  process.exit(0);
} else {
  console.log('\n✅ Documentation check PASSED');
  process.exit(0);
}
