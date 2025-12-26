/**
 * Auto-generate documentation from barrel files
 * Creates markdown docs following folder structure
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOOKS_DIR = path.join(__dirname, '../hooks');
const DOCS_DIR = path.join(__dirname, '../docs/hooks');

interface HookInfo {
  name: string;
  file: string;
  description: string;
  exports: string[];
}

interface FolderInfo {
  name: string;
  description: string;
  hooks: HookInfo[];
  subfolders: FolderInfo[];
}

/**
 * Extract JSDoc description from file
 */
function extractDescription(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Look for JSDoc comment before export function
  const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
  if (jsdocMatch) {
    return jsdocMatch[1];
  }
  
  // Look for single-line comment
  const commentMatch = content.match(/\/\/\s*(.+?)\s*\n\s*export\s+function/);
  if (commentMatch) {
    return commentMatch[1];
  }
  
  return 'No description available';
}

/**
 * Extract exports from barrel file
 */
function extractExports(barrelPath: string): string[] {
  if (!fs.existsSync(barrelPath)) return [];
  
  const content = fs.readFileSync(barrelPath, 'utf-8');
  const exports: string[] = [];
  
  // Match: export * from './use-hook-name'
  const exportRegex = /export\s+\*\s+from\s+['"]\.\/([^'"]+)['"]/g;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  return exports;
}

/**
 * Scan a folder and extract info
 */
function scanFolder(dir: string, folderName: string): FolderInfo {
  const barrelPath = path.join(dir, 'index.ts');
  const exports = extractExports(barrelPath);
  
  const hooks: HookInfo[] = [];
  const subfolders: FolderInfo[] = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== '__tests__' && item !== 'node_modules') {
      subfolders.push(scanFolder(fullPath, item));
    } else if (stat.isFile() && item.endsWith('.ts') && item !== 'index.ts' && !item.endsWith('.test.ts')) {
      const hookName = item.replace('.ts', '');
      hooks.push({
        name: hookName,
        file: item,
        description: extractDescription(fullPath),
        exports: exports.filter(e => e.includes(hookName)),
      });
    }
  }
  
  // Get folder description from barrel file comment
  let description = '';
  if (fs.existsSync(barrelPath)) {
    const barrelContent = fs.readFileSync(barrelPath, 'utf-8');
    const commentMatch = barrelContent.match(/\/\/\s*(.+)/);
    if (commentMatch) {
      description = commentMatch[1];
    }
  }
  
  return {
    name: folderName,
    description: description || `${folderName.charAt(0).toUpperCase() + folderName.slice(1)} hooks`,
    hooks,
    subfolders,
  };
}

/**
 * Generate markdown for a folder
 */
function generateMarkdown(folder: FolderInfo, level = 1): string {
  const heading = '#'.repeat(level);
  let md = '';
  
  md += `${heading} ${folder.name}\n\n`;
  md += `${folder.description}\n\n`;
  
  if (folder.hooks.length > 0) {
    md += `### Hooks (${folder.hooks.length})\n\n`;
    
    folder.hooks.forEach(hook => {
      md += `#### \`${hook.name}\`\n\n`;
      md += `${hook.description}\n\n`;
      md += `**File:** \`hooks/${folder.name}/${hook.file}\`\n\n`;
      
      if (hook.exports.length > 0) {
        md += `**Exports:** ${hook.exports.map(e => `\`${e}\``).join(', ')}\n\n`;
      }
      
      md += `---\n\n`;
    });
  }
  
  // Process subfolders
  if (folder.subfolders.length > 0) {
    folder.subfolders.forEach(subfolder => {
      md += generateMarkdown(subfolder, level + 1);
    });
  }
  
  return md;
}

/**
 * Generate index page
 */
function generateIndex(folders: FolderInfo[]): string {
  let md = '# Hooks Documentation\n\n';
  md += `> Auto-generated on ${new Date().toLocaleString()}\n\n`;
  md += '## Overview\n\n';
  md += 'This documentation is automatically generated from the hooks folder structure and barrel files.\n\n';
  md += '## Organization\n\n';
  
  folders.forEach(folder => {
    md += `- **[${folder.name}](${folder.name}.md)** - ${folder.description}\n`;
    md += `  - ${folder.hooks.length} hooks\n`;
    if (folder.subfolders.length > 0) {
      md += `  - ${folder.subfolders.length} subfolders\n`;
    }
  });
  
  md += '\n## Quick Reference\n\n';
  md += '```typescript\n';
  md += '// Import from barrel files\n';
  folders.forEach(folder => {
    md += `import { ... } from '@/hooks/${folder.name}';\n`;
  });
  md += '```\n\n';
  
  return md;
}

/**
 * Main function
 */
export function generateDocs(): void {
  console.log('📚 Generating hooks documentation...\n');
  
  // Create docs directory
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  
  // Scan all feature folders
  const items = fs.readdirSync(HOOKS_DIR);
  const folders: FolderInfo[] = [];
  
  for (const item of items) {
    const fullPath = path.join(HOOKS_DIR, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== '__tests__' && item !== 'node_modules') {
      folders.push(scanFolder(fullPath, item));
    }
  }
  
  console.log(`📁 Found ${folders.length} feature folders\n`);
  
  // Generate index
  const indexMd = generateIndex(folders);
  fs.writeFileSync(path.join(DOCS_DIR, 'README.md'), indexMd);
  console.log(`✅ Generated: docs/hooks/README.md`);
  
  // Generate individual folder docs
  folders.forEach(folder => {
    const md = generateMarkdown(folder);
    fs.writeFileSync(path.join(DOCS_DIR, `${folder.name}.md`), md);
    console.log(`✅ Generated: docs/hooks/${folder.name}.md`);
  });
  
  console.log(`\n🎉 Documentation generated successfully!`);
  console.log(`📖 View at: ${DOCS_DIR}/README.md`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDocs();
}
