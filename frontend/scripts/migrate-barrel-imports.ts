#!/usr/bin/env ts-node

/**
 * Codemod: Migrate barrel imports to direct imports
 * 
 * Usage:
 *   npx ts-node scripts/migrate-barrel-imports.ts
 *   npx ts-node scripts/migrate-barrel-imports.ts --dry-run
 *   npx ts-node scripts/migrate-barrel-imports.ts --file path/to/file.tsx
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface ImportMapping {
  hookName: string;
  directPath: string;
}

// Mapping of hooks to their direct import paths
const IMPORT_MAPPINGS: ImportMapping[] = [
  // Cornell hooks
  { hookName: 'useContent', directPath: '@/hooks/cornell/use-data' },
  { hookName: 'useCornellNotes', directPath: '@/hooks/cornell/use-data' },
  { hookName: 'useHighlights', directPath: '@/hooks/cornell/use-data' },
  { hookName: 'useCornellAutosave', directPath: '@/hooks/cornell/use-autosave' },
  { hookName: 'useUnifiedStream', directPath: '@/hooks/cornell/use-unified-stream' },
  { hookName: 'useStreamFilter', directPath: '@/hooks/cornell/use-stream-filter' },
  { hookName: 'useSuggestions', directPath: '@/hooks/cornell/use-suggestions' },
  { hookName: 'useContentContext', directPath: '@/hooks/cornell/use-content-context' },
  { hookName: 'useUpdateCornellNotes', directPath: '@/hooks/cornell' },
  { hookName: 'useCreateHighlight', directPath: '@/hooks/cornell' },
  { hookName: 'useUpdateHighlight', directPath: '@/hooks/cornell' },
  { hookName: 'useDeleteHighlight', directPath: '@/hooks/cornell' },
  
  // Session hooks
  { hookName: 'useReadingSession', directPath: '@/hooks/sessions/reading/use-session' },
  { hookName: 'useReadingSessionEvents', directPath: '@/hooks/sessions/reading/use-session-events' },
  { hookName: 'useGroupSession', directPath: '@/hooks/sessions/group/use-sessions' },
  { hookName: 'useGroupSessionEvents', directPath: '@/hooks/sessions/group/use-session-events' },
  { hookName: 'useSessionsHistory', directPath: '@/hooks/sessions/use-sessions-history' },
  
  // UI hooks
  { hookName: 'useTextSelection', directPath: '@/hooks/ui/use-text-selection' },
  { hookName: 'useTextSelectionAdapted', directPath: '@/hooks/ui/use-text-selection-adapted' },
  { hookName: 'useDebounce', directPath: '@/hooks/ui/use-debounce' },
  { hookName: 'useOnlineStatus', directPath: '@/hooks/ui/use-online-status' },
  { hookName: 'useSaveStatusWithOnline', directPath: '@/hooks/ui/use-online-status' },
  { hookName: 'useFocusTracking', directPath: '@/hooks/ui/use-focus-tracking' },
  
  // Content hooks
  { hookName: 'useUploadContent', directPath: '@/hooks/content/use-upload' },
  { hookName: 'useAnnotations', directPath: '@/hooks/content/use-annotations' },
  { hookName: 'useContentSearch', directPath: '@/hooks/content/use-search' },
  { hookName: 'useRecommendations', directPath: '@/hooks/content/use-recommendations' },
  
  // Game hooks
  { hookName: 'useGameAnimation', directPath: '@/hooks/games/use-game-animation' },
  { hookName: 'useGameProgress', directPath: '@/hooks/games/use-game-progress' },
  { hookName: 'useRoundTimer', directPath: '@/hooks/games/use-round-timer' },
  
  // Auth hooks
  { hookName: 'useOAuth', directPath: '@/hooks/auth/use-oauth' },
  
  // Billing hooks
  { hookName: 'useEntitlements', directPath: '@/hooks/billing/use-entitlements' },
  
  // Profile hooks
  { hookName: 'useActivity', directPath: '@/hooks/profile/use-activity' },
  { hookName: 'useUserProfile', directPath: '@/hooks/profile/use-user-profile' },
  
  // Social hooks
  { hookName: 'useFamily', directPath: '@/hooks/social/use-family' },
  { hookName: 'useGroups', directPath: '@/hooks/social/use-groups' },
  { hookName: 'useChat', directPath: '@/hooks/social/use-chat' },
];

interface MigrationResult {
  file: string;
  changed: boolean;
  oldImport: string;
  newImports: string[];
}

function migrateFile(filePath: string, dryRun: boolean): MigrationResult | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if file has barrel import
  const barrelImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/hooks['"];?/g;
  const match = barrelImportRegex.exec(content);
  
  if (!match) {
    return null; // No barrel imports found
  }
  
  const oldImport = match[0];
  const importedHooks = match[1]
    .split(',')
    .map(h => h.trim())
    .filter(h => h.length > 0);
  
  // Group hooks by their direct paths
  const pathGroups = new Map<string, string[]>();
  
  for (const hookName of importedHooks) {
    const mapping = IMPORT_MAPPINGS.find(m => m.hookName === hookName);
    
    if (mapping) {
      const hooks = pathGroups.get(mapping.directPath) || [];
      hooks.push(hookName);
      pathGroups.set(mapping.directPath, hooks);
    } else {
      console.warn(`⚠️  Unknown hook: ${hookName} in ${filePath}`);
    }
  }
  
  // Generate new import statements
  const newImports: string[] = [];
  for (const [directPath, hooks] of Array.from(pathGroups.entries())) {
    if (hooks.length === 1) {
      newImports.push(`import { ${hooks[0]} } from '${directPath}';`);
    } else {
      newImports.push(`import {\n  ${hooks.join(',\n  ')}\n} from '${directPath}';`);
    }
  }
  
  // Replace old import with new imports
  let newContent = content.replace(oldImport, newImports.join('\n'));
  
  if (!dryRun) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }
  
  return {
    file: filePath,
    changed: true,
    oldImport,
    newImports,
  };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetFile = args.find(arg => arg.startsWith('--file='))?.split('=')[1];
  
  console.log('🔄 Barrel Import Migration Codemod\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }
  
  // Get files to process
  const files = targetFile
    ? [targetFile]
    : glob.sync('**/*.{ts,tsx}', {
        cwd: process.cwd(),
        ignore: ['node_modules/**', '**/*.spec.ts', '**/*.test.ts', '.next/**'],
      });
  
  console.log(`📂 Processing ${files.length} files...\n`);
  
  const results: MigrationResult[] = [];
  
  for (const file of files) {
    const result = migrateFile(file, dryRun);
    if (result) {
      results.push(result);
    }
  }
  
  // Print results
  console.log('\n📊 Migration Results:\n');
  
  if (results.length === 0) {
    console.log('✅ No barrel imports found. All files already use direct imports!');
  } else {
    results.forEach(result => {
      console.log(`✏️  ${result.file}`);
      console.log(`   ❌ ${result.oldImport}`);
      result.newImports.forEach(imp => {
        console.log(`   ✅ ${imp}`);
      });
      console.log('');
    });
    
    console.log(`\n📈 Summary: ${results.length} file(s) ${dryRun ? 'would be' : 'were'} migrated`);
  }
  
  if (dryRun && results.length > 0) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
}

main();
