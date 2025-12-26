module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce hooks folder structure organization',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      useFeatureFolder: 'Hooks must be inside a feature folder (cornell, games, sessions, etc.), not in the root hooks/ directory',
      useKebabCase: 'Hook files must use kebab-case naming (use-hook-name.ts)',
      noTestsInHooks: 'Test files must be in tests/unit/hooks/, not in hooks/ subdirectories',
      requireBarrelFile: 'Feature folder "{{folder}}" must have an index.ts barrel file',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();
    
    // Only check files in hooks/ directory
    if (!filename.includes('/hooks/') && !filename.includes('\\hooks\\')) {
      return {};
    }

    // Normalize path separators
    const normalizedPath = filename.replace(/\\/g, '/');
    const hooksIndex = normalizedPath.indexOf('/hooks/');
    
    if (hooksIndex === -1) return {};
    
    const relativePath = normalizedPath.substring(hooksIndex + '/hooks/'.length);
    const pathParts = relativePath.split('/');
    
    return {
      Program(node) {
        // Rule 1: No hooks in root hooks/ directory
        if (pathParts.length === 1 && pathParts[0].startsWith('use-') && pathParts[0].endsWith('.ts')) {
          context.report({
            node,
            messageId: 'useFeatureFolder',
          });
        }
        
        // Rule 2: Enforce kebab-case naming
        const fileName = pathParts[pathParts.length - 1];
        if (fileName.startsWith('use') && fileName.endsWith('.ts') && !fileName.endsWith('.test.ts')) {
          const hookName = fileName.replace('.ts', '');
          // Check if it's kebab-case: use-kebab-case pattern
          const isKebabCase = /^use(-[a-z0-9]+)+$/.test(hookName);
          
          if (!isKebabCase) {
            context.report({
              node,
              messageId: 'useKebabCase',
            });
          }
        }
        
        // Rule 3: No test files in hooks/ subdirectories
        if (fileName.endsWith('.test.ts') || fileName.endsWith('.spec.ts')) {
          if (relativePath.includes('__tests__') || pathParts.length > 1) {
            context.report({
              node,
              messageId: 'noTestsInHooks',
            });
          }
        }
      },
    };
  },
};
