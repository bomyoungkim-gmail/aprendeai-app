#!/usr/bin/env node

/**
 * Pre-commit hook to validate hooks naming conventions
 * Prevents commits with incorrectly named hooks
 */

const fs = require('fs');
const path = require('path');

const HOOKS_DIR = path.join(__dirname, '../hooks');
const ALLOWED_FOLDERS = ['cornell', 'sessions', 'games', 'ui', 'social', 'auth', 'content', 'billing', 'profile', 'shared'];

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let errors = [];
let warnings = [];

/**
 * Check if filename follows kebab-case convention
 */
function isKebabCase(filename) {
  const hookName = filename.replace('.ts', '');
  return /^use(-[a-z0-9]+)+$/.test(hookName);
}

/**
 * Recursively check hooks directory
 */
function checkDirectory(dir, relativePath = '') {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
    
    if (stat.isDirectory()) {
      // Check if it's a feature folder
      if (!relativePath && !ALLOWED_FOLDERS.includes(item) && item !== '__tests__' && item !== 'node_modules') {
        warnings.push(`Unknown folder: ${item} (allowed: ${ALLOWED_FOLDERS.join(', ')})`);
      }
      
      // Check for barrel file in feature folders
      if (!relativePath && ALLOWED_FOLDERS.includes(item)) {
        const barrelPath = path.join(fullPath, 'index.ts');
        if (!fs.existsSync(barrelPath)) {
          errors.push(`Missing barrel file: ${item}/index.ts`);
        }
      }
      
      // Recurse into subdirectories
      checkDirectory(fullPath, itemRelativePath);
    } else if (stat.isFile() && item.endsWith('.ts')) {
      // Check for hooks in root directory
      if (!relativePath && item.startsWith('use-')) {
        errors.push(`Hook in root directory: ${item} (should be in a feature folder)`);
      }
      
      // Check for test files in hooks/
      if (item.endsWith('.test.ts') || item.endsWith('.spec.ts')) {
        errors.push(`Test file in hooks/: ${itemRelativePath} (should be in tests/unit/hooks/)`);
      }
      
      // Check naming convention
      if (item.startsWith('use') && !item.endsWith('.test.ts') && item !== 'index.ts') {
        if (!isKebabCase(item)) {
          errors.push(`Invalid naming: ${itemRelativePath} (must be kebab-case: use-hook-name.ts)`);
        }
      }
      
      // Check for __tests__ folders
      if (relativePath.includes('__tests__')) {
        errors.push(`Tests in __tests__/: ${itemRelativePath} (move to tests/unit/hooks/)`);
      }
    }
  }
}

/**
 * Main validation
 */
function validate() {
  console.log(`${YELLOW}🔍 Validating hooks structure...${RESET}\n`);
  
  if (!fs.existsSync(HOOKS_DIR)) {
    console.log(`${RED}❌ Hooks directory not found: ${HOOKS_DIR}${RESET}`);
    process.exit(1);
  }
  
  checkDirectory(HOOKS_DIR);
  
  // Report results
  if (warnings.length > 0) {
    console.log(`${YELLOW}⚠️  Warnings (${warnings.length}):${RESET}`);
    warnings.forEach(w => console.log(`  - ${w}`));
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log(`${RED}❌ Errors (${errors.length}):${RESET}`);
    errors.forEach(e => console.log(`  - ${e}`));
    console.log('');
    console.log(`${RED}Commit blocked! Fix the errors above.${RESET}`);
    process.exit(1);
  }
  
  console.log(`${GREEN}✅ All hooks follow naming conventions!${RESET}`);
  process.exit(0);
}

// Run validation
validate();
