/**
 * Automated Hook Migration Script
 * Moves hooks to their new organized structure and updates imports
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MigrationPlan {
  sourceFile: string;
  targetFile: string;
  targetFolder: string;
  newName: string;
}

const HOOKS_DIR = path.join(__dirname, '../hooks');

/**
 * Migration plan: old file → new location
 */
const MIGRATION_MAP: Record<string, { folder: string; newName: string }> = {
  // Cornell (rename to kebab-case)
  'useCornellAutosave.ts': { folder: 'cornell', newName: 'use-autosave.ts' },
  'useCornellData.ts': { folder: 'cornell', newName: 'use-data.ts' },
  'useReview.ts': { folder: 'cornell', newName: 'use-review.ts' },
  'useStreamFilter.ts': { folder: 'cornell', newName: 'use-stream-filter.ts' },
  'useUnifiedStream.ts': { folder: 'cornell', newName: 'use-unified-stream.ts' },
  
  // Games
  'useGameAnimation.ts': { folder: 'games', newName: 'use-game-animation.ts' },
  'useGameProgress.ts': { folder: 'games', newName: 'use-game-progress.ts' },
  
  // Sessions
  'useSession.ts': { folder: 'sessions', newName: 'use-session.ts' },
  'use-sessions.ts': { folder: 'sessions', newName: 'use-sessions.ts' },
  'use-session-events.ts': { folder: 'sessions', newName: 'use-session-events.ts' },
  'useSessionEvents.ts': { folder: 'sessions', newName: 'use-session-events-legacy.ts' }, // Mark for review
  'use-sessions-history.ts': { folder: 'sessions', newName: 'use-sessions-history.ts' },
  'use-reading-session.ts': { folder: 'sessions', newName: 'use-reading-session.ts' },
  'use-study-session.ts': { folder: 'sessions', newName: 'use-study-session.ts' },
  
  // Social
  'use-family.ts': { folder: 'social', newName: 'use-family.ts' },
  'use-groups.ts': { folder: 'social', newName: 'use-groups.ts' },
  'use-chat.ts': { folder: 'social', newName: 'use-chat.ts' },
  
  // Auth
  'use-oauth.ts': { folder: 'auth', newName: 'use-oauth.ts' },
  
  // Content
  'use-content-search.ts': { folder: 'content', newName: 'use-content-search.ts' },
  'use-content-upload.ts': { folder: 'content', newName: 'use-content-upload.ts' },
  'use-recommendations.ts': { folder: 'content', newName: 'use-recommendations.ts' },
  
  // Billing
  'use-entitlements.ts': { folder: 'billing', newName: 'use-entitlements.ts' },
  
  // Annotations
  'use-annotations.ts': { folder: 'annotations', newName: 'use-annotations.ts' },
  
  // Profile
  'use-user-profile.ts': { folder: 'profile', newName: 'use-user-profile.ts' },
  'use-activity.ts': { folder: 'profile', newName: 'use-activity.ts' },
  
  // UI
  'use-debounce.ts': { folder: 'ui', newName: 'use-debounce.ts' },
  'use-text-selection.ts': { folder: 'ui', newName: 'use-text-selection.ts' },
  'use-text-selection-adapted.ts': { folder: 'ui', newName: 'use-text-selection-adapted.ts' },
  'useFocusTracking.ts': { folder: 'ui', newName: 'use-focus-tracking.ts' },
  'useOnlineStatus.ts': { folder: 'ui', newName: 'use-online-status.ts' },
  
  // Shared
  'use-auto-track.ts': { folder: 'shared', newName: 'use-auto-track.ts' },
  'use-socket.ts': { folder: 'shared', newName: 'use-socket.ts' },
  'use-round-timer.ts': { folder: 'shared', newName: 'use-round-timer.ts' },
  'use-search.ts': { folder: 'shared', newName: 'use-search.ts' },
};

/**
 * Create migration plan
 */
function createMigrationPlan(): MigrationPlan[] {
  const plan: MigrationPlan[] = [];
  
  for (const [sourceFile, target] of Object.entries(MIGRATION_MAP)) {
    const sourcePath = path.join(HOOKS_DIR, sourceFile);
    
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️  Source file not found: ${sourceFile}`);
      continue;
    }
    
    plan.push({
      sourceFile: sourcePath,
      targetFile: path.join(HOOKS_DIR, target.folder, target.newName),
      targetFolder: path.join(HOOKS_DIR, target.folder),
      newName: target.newName,
    });
  }
  
  return plan;
}

/**
 * Execute migration (dry run by default)
 */
export function migrateHooks(dryRun: boolean = true): void {
  console.log(`🚀 Hook Migration Script ${dryRun ? '(DRY RUN)' : '(EXECUTING)'}\n`);
  
  const plan = createMigrationPlan();
  
  console.log(`📋 Migration plan: ${plan.length} files to move\n`);
  
  // Group by folder
  const byFolder = plan.reduce((acc, item) => {
    const folder = path.basename(item.targetFolder);
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(item);
    return acc;
  }, {} as Record<string, MigrationPlan[]>);
  
  for (const [folder, items] of Object.entries(byFolder)) {
    console.log(`📁 ${folder}/ (${items.length} files)`);
    items.forEach(item => {
      console.log(`   ${path.basename(item.sourceFile)} → ${item.newName}`);
    });
    console.log('');
  }
  
  if (dryRun) {
    console.log('ℹ️  This was a dry run. Run with --execute to perform migration.');
    return;
  }
  
  // Execute migration
  console.log('🔄 Executing migration...\n');
  
  for (const item of plan) {
    // Create target folder if doesn't exist
    if (!fs.existsSync(item.targetFolder)) {
      fs.mkdirSync(item.targetFolder, { recursive: true });
      console.log(`✅ Created folder: ${path.basename(item.targetFolder)}/`);
    }
    
    // Move file
    fs.renameSync(item.sourceFile, item.targetFile);
    console.log(`✅ Moved: ${path.basename(item.sourceFile)} → ${path.basename(item.targetFolder)}/${item.newName}`);
  }
  
  console.log('\n✨ Migration complete!');
  console.log('⚠️  Next steps:');
  console.log('   1. Update barrel files (index.ts)');
  console.log('   2. Run find & replace for imports');
  console.log('   3. Run tests: npm run test');
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  migrateHooks(!execute);
}
