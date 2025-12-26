/**
 * Hook Dependency Analyzer
 * Analyzes dependencies between hooks to detect circular dependencies
 * and plan optimal migration order
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface HookDependency {
  file: string;
  imports: string[];
}

interface DependencyGraph {
  [hookName: string]: string[];
}

const HOOKS_DIR = path.join(__dirname, '../hooks');

/**
 * Extract imports from a TypeScript file
 */
function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports: string[] = [];
  
  // Match: import { ... } from './other-hook'
  const relativeImportRegex = /from\s+['"]\.\/([^'"]+)['"]/g;
  let match;
  
  while ((match = relativeImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

/**
 * Build dependency graph of all hooks
 */
function buildDependencyGraph(): DependencyGraph {
  const graph: DependencyGraph = {};
  const hookFiles = fs.readdirSync(HOOKS_DIR)
    .filter(file => file.startsWith('use') && file.endsWith('.ts'))
    .filter(file => !file.endsWith('.test.ts'));
  
  for (const file of hookFiles) {
    const hookName = file.replace('.ts', '');
    const filePath = path.join(HOOKS_DIR, file);
    const imports = extractImports(filePath);
    
    graph[hookName] = imports;
  }
  
  return graph;
}

/**
 * Detect circular dependencies
 */
function detectCircularDependencies(graph: DependencyGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  
  function dfs(node: string, path: string[]): void {
    if (recStack.has(node)) {
      // Found cycle
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart));
      return;
    }
    
    if (visited.has(node)) return;
    
    visited.add(node);
    recStack.add(node);
    path.push(node);
    
    const dependencies = graph[node] || [];
    for (const dep of dependencies) {
      dfs(dep, [...path]);
    }
    
    recStack.delete(node);
  }
  
  for (const node of Object.keys(graph)) {
    dfs(node, []);
  }
  
  return cycles;
}

/**
 * Get topological sort order (safe migration order)
 */
function topologicalSort(graph: DependencyGraph): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  
  function visit(node: string): void {
    if (visited.has(node)) return;
    
    visited.add(node);
    const dependencies = graph[node] || [];
    
    for (const dep of dependencies) {
      if (graph[dep]) { // Only visit if it's a hook
        visit(dep);
      }
    }
    
    sorted.push(node);
  }
  
  for (const node of Object.keys(graph)) {
    visit(node);
  }
  
  return sorted;
}

/**
 * Main analysis function
 */
export function analyzeHookDependencies(): void {
  console.log('🔍 Analyzing hook dependencies...\n');
  
  const graph = buildDependencyGraph();
  const totalHooks = Object.keys(graph).length;
  
  console.log(`📊 Total hooks analyzed: ${totalHooks}\n`);
  
  // Count dependencies
  const dependencyCounts = Object.entries(graph).map(([hook, deps]) => ({
    hook,
    count: deps.length,
  })).sort((a, b) => b.count - a.count);
  
  console.log('📈 Hooks with most dependencies:');
  dependencyCounts.slice(0, 5).forEach(({ hook, count }) => {
    console.log(`  - ${hook}: ${count} dependencies`);
  });
  console.log('');
  
  // Detect circular dependencies
  const cycles = detectCircularDependencies(graph);
  
  if (cycles.length > 0) {
    console.log('⚠️  CIRCULAR DEPENDENCIES DETECTED:');
    cycles.forEach((cycle, i) => {
      console.log(`  ${i + 1}. ${cycle.join(' → ')}`);
    });
    console.log('');
  } else {
    console.log('✅ No circular dependencies found\n');
  }
  
  // Get migration order
  const migrationOrder = topologicalSort(graph);
  
  console.log('📋 Suggested migration order (dependencies first):');
  migrationOrder.forEach((hook, i) => {
    const deps = graph[hook];
    console.log(`  ${i + 1}. ${hook} (depends on: ${deps.length > 0 ? deps.join(', ') : 'none'})`);
  });
  
  // Generate report
  const report = {
    totalHooks,
    hooksWithDependencies: Object.values(graph).filter(deps => deps.length > 0).length,
    circularDependencies: cycles,
    migrationOrder,
    dependencyGraph: graph,
  };
  
  // Save report
  const reportPath = path.join(__dirname, '../.hooks-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
}

// Run if called directly
if (require.main === module) {
  analyzeHookDependencies();
}
