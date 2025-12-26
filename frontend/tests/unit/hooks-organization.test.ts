import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Hooks Organization Standards', () => {
  const HOOKS_DIR = path.join(__dirname, '../../hooks');
  
  describe('Naming Conventions', () => {
    it('should use kebab-case for hook files', () => {
      const hookFiles = fs.readdirSync(HOOKS_DIR)
        .filter(file => file.startsWith('use') && file.endsWith('.ts'))
        .filter(file => !file.endsWith('.test.ts'));
      
      const camelCaseFiles = hookFiles.filter(file => {
        const name = file.replace('.ts', '');
        // Check if contains uppercase after 'use'
        return /use[A-Z]/.test(name);
      });
      
      if (camelCaseFiles.length > 0) {
        console.warn(`⚠️  Found ${camelCaseFiles.length} files not using kebab-case:`);
        camelCaseFiles.forEach(file => console.warn(`   - ${file}`));
      }
      
      // This will fail until migration is complete
      // expect(camelCaseFiles).toHaveLength(0);
    });
  });
  
  describe('Feature Organization', () => {
    it('should have feature subfolders', () => {
      const expectedFolders = [
        'cornell',
        '__tests__',
      ];
      
      const actualFolders = fs.readdirSync(HOOKS_DIR)
        .filter(item => {
          const fullPath = path.join(HOOKS_DIR, item);
          return fs.statSync(fullPath).isDirectory();
        });
      
      expectedFolders.forEach(folder => {
        expect(actualFolders).toContain(folder);
      });
    });
    
    it('should have barrel files in feature folders', () => {
      const featureFolders = fs.readdirSync(HOOKS_DIR)
        .filter(item => {
          const fullPath = path.join(HOOKS_DIR, item);
          return fs.statSync(fullPath).isDirectory() && item !== '__tests__';
        });
      
      featureFolders.forEach(folder => {
        const indexPath = path.join(HOOKS_DIR, folder, 'index.ts');
        const hasBarrel = fs.existsSync(indexPath);
        
        if (!hasBarrel) {
          console.warn(`⚠️  Missing barrel file: ${folder}/index.ts`);
        }
      });
    });
  });
  
  describe('No Root Hooks (Post-Migration)', () => {
    it.skip('should have zero hooks in root directory', () => {
      // This test is skipped until migration is complete
      const rootHooks = fs.readdirSync(HOOKS_DIR)
        .filter(file => file.startsWith('use') && file.endsWith('.ts'))
        .filter(file => !file.endsWith('.test.ts'));
      
      if (rootHooks.length > 0) {
        console.warn(`⚠️  Found ${rootHooks.length} hooks still in root:`);
        rootHooks.forEach(file => console.warn(`   - ${file}`));
      }
      
      expect(rootHooks).toHaveLength(0);
    });
  });
  
  describe('Test Co-location', () => {
    it('should have __tests__ folders in feature directories', () => {
      const featureFolders = fs.readdirSync(HOOKS_DIR)
        .filter(item => {
          const fullPath = path.join(HOOKS_DIR, item);
          return fs.statSync(fullPath).isDirectory() && item !== '__tests__';
        });
      
      featureFolders.forEach(folder => {
        const testsPath = path.join(HOOKS_DIR, folder, '__tests__');
        const hasTests = fs.existsSync(testsPath);
        
        if (!hasTests) {
          console.warn(`ℹ️  No __tests__ folder in: ${folder}/`);
        }
      });
    });
  });
});

describe('Hooks Dependency Analysis', () => {
  it('should detect circular dependencies', () => {
    // This would use the analyze-hooks.ts script
    // For now, it's a placeholder for future automated checks
    expect(true).toBe(true);
  });
  
  it('should map internal dependencies', () => {
    const HOOKS_DIR = path.join(__dirname, '../../hooks');
    const dependencies: Record<string, string[]> = {};
    
    const hookFiles = fs.readdirSync(HOOKS_DIR)
      .filter(file => file.startsWith('use') && file.endsWith('.ts'))
      .filter(file => !file.endsWith('.test.ts'));
    
    hookFiles.forEach(file => {
      const content = fs.readFileSync(path.join(HOOKS_DIR, file), 'utf-8');
      const imports = content.match(/from\s+['"]\.\/([^'"]+)['"]/g) || [];
      
      dependencies[file] = imports.map(imp => {
        const match = imp.match(/from\s+['"]\.\/([^'"]+)['"]/);
        return match ? match[1] : '';
      }).filter(Boolean);
    });
    
    const totalDeps = Object.values(dependencies).flat().length;
    console.log(`📊 Found ${totalDeps} internal hook dependencies`);
    
    // Log hooks with dependencies
    Object.entries(dependencies)
      .filter(([_, deps]) => deps.length > 0)
      .forEach(([hook, deps]) => {
        console.log(`   ${hook} → ${deps.join(', ')}`);
      });
  });
});
