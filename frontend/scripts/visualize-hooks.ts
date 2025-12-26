/**
 * Hook Dependency Visualizer
 * Generates a visual graph of hook dependencies
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOOKS_DIR = path.join(__dirname, '../hooks');

interface HookNode {
  name: string;
  path: string;
  folder: string;
  imports: string[];
}

/**
 * Extract hook imports from a file
 */
function extractHookImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports: string[] = [];
  
  // Match: import ... from '@/hooks/...'
  const hooksImportRegex = /from\s+['"]@\/hooks\/([^'"]+)['"]/g;
  let match;
  
  while ((match = hooksImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

/**
 * Recursively scan hooks directory
 */
function scanHooks(dir: string, relativePath = ''): HookNode[] {
  const nodes: HookNode[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== '__tests__' && item !== 'node_modules') {
      nodes.push(...scanHooks(fullPath, relativePath ? `${relativePath}/${item}` : item));
    } else if (stat.isFile() && item.endsWith('.ts') && !item.endsWith('.test.ts') && item !== 'index.ts') {
      const hookImports = extractHookImports(fullPath);
      
      nodes.push({
        name: item.replace('.ts', ''),
        path: relativePath ? `${relativePath}/${item}` : item,
        folder: relativePath.split('/')[0] || 'root',
        imports: hookImports,
      });
    }
  }
  
  return nodes;
}

/**
 * Generate Mermaid diagram
 */
function generateMermaidDiagram(nodes: HookNode[]): string {
  let mermaid = 'graph TD\n';
  
  // Group by folder
  const folders = Array.from(new Set(nodes.map(n => n.folder)));
  
  // Define subgraphs for each folder
  folders.forEach(folder => {
    mermaid += `  subgraph ${folder}\n`;
    nodes
      .filter(n => n.folder === folder)
      .forEach(node => {
        const nodeId = node.path.replace(/\//g, '_').replace(/\./g, '_');
        mermaid += `    ${nodeId}["${node.name}"]\n`;
      });
    mermaid += '  end\n';
  });
  
  // Add dependencies
  nodes.forEach(node => {
    const nodeId = node.path.replace(/\//g, '_').replace(/\./g, '_');
    
    node.imports.forEach(imp => {
      // Find the imported hook
      const importedNode = nodes.find(n => n.path.includes(imp) || imp.includes(n.name));
      if (importedNode) {
        const importId = importedNode.path.replace(/\//g, '_').replace(/\./g, '_');
        mermaid += `  ${nodeId} --> ${importId}\n`;
      }
    });
  });
  
  return mermaid;
}

/**
 * Generate HTML visualization
 */
function generateHTML(mermaid: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Hooks Dependency Graph</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    .info {
      background: #fff;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .mermaid {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h1>🔗 Hooks Dependency Graph</h1>
  <div class="info">
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Purpose:</strong> Visualize dependencies between hooks to identify coupling and circular dependencies.</p>
  </div>
  <div class="mermaid">
${mermaid}
  </div>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</body>
</html>`;
}

/**
 * Main function
 */
export function generateDependencyGraph(): void {
  console.log('🔍 Scanning hooks directory...\n');
  
  const nodes = scanHooks(HOOKS_DIR);
  
  console.log(`📊 Found ${nodes.length} hooks\n`);
  
  // Calculate statistics
  const withDeps = nodes.filter(n => n.imports.length > 0);
  console.log(`📈 Dependencies: ${withDeps.length} hooks have dependencies\n`);
  
  // Generate diagram
  const mermaid = generateMermaidDiagram(nodes);
  const html = generateHTML(mermaid);
  
  // Save to file
  const outputPath = path.join(__dirname, '../docs/hooks-dependency-graph.html');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  
  console.log(`✅ Dependency graph saved to: ${outputPath}`);
  console.log(`\n💡 Open the file in a browser to view the interactive graph`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDependencyGraph();
}
