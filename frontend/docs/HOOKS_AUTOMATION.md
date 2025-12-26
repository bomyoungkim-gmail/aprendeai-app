# Hooks Quality Automation - Installation Guide

## 🛠️ Tools Created

### 1. ESLint Rule - Enforce Folder Structure

**File:** `eslint-rules/hooks-folder-structure.js`

**What it does:**

- ✅ Prevents hooks in root `hooks/` directory
- ✅ Enforces kebab-case naming (`use-hook-name.ts`)
- ✅ Blocks test files in `hooks/` subdirectories
- ✅ Requires barrel files in feature folders

**Usage:** (To be configured in `.eslintrc.js`)

---

### 2. Pre-commit Hook - Validate Naming

**File:** `scripts/validate-hooks.js`

**What it does:**

- ✅ Validates all hooks follow naming conventions
- ✅ Checks folder structure
- ✅ Ensures barrel files exist
- ✅ Blocks commits with errors

**Manual Installation:**

```bash
# From project root
cp frontend/scripts/validate-hooks.js .git/hooks/pre-commit-hooks-validator

# Make executable (Linux/Mac)
chmod +x .git/hooks/pre-commit-hooks-validator

# Add to existing pre-commit hook or create new one
echo "node frontend/scripts/validate-hooks.js" >> .git/hooks/pre-commit
```

**Test it:**

```bash
npm run validate:hooks
```

---

### 3. Dependency Visualizer

**File:** `scripts/visualize-hooks.ts`

**What it does:**

- ✅ Scans all hooks and their dependencies
- ✅ Generates interactive Mermaid diagram
- ✅ Identifies coupling and circular dependencies
- ✅ Outputs HTML file with visualization

**Usage:**

```bash
npm run visualize:hooks
```

**Output:** `docs/hooks-dependency-graph.html` (open in browser)

---

### 4. Auto-Documentation Generator

**File:** `scripts/generate-hooks-docs.ts`

**What it does:**

- ✅ Reads barrel files and JSDoc comments
- ✅ Generates markdown docs following folder structure
- ✅ Creates index with quick reference
- ✅ Auto-updates on command

**Usage:**

```bash
npm run docs:hooks
```

**Output:** `docs/hooks/` directory with:

- `README.md` - Index page
- `cornell.md`, `games.md`, etc. - Per-feature docs

---

## 📋 NPM Scripts Added

```json
{
  "validate:hooks": "node scripts/validate-hooks.js",
  "visualize:hooks": "ts-node scripts/visualize-hooks.ts",
  "docs:hooks": "ts-node scripts/generate-hooks-docs.ts"
}
```

---

## 🚀 Quick Start

### Run All Quality Checks

```bash
# Validate structure
npm run validate:hooks

# Generate visualization
npm run visualize:hooks

# Generate documentation
npm run docs:hooks
```

### Pre-commit Setup (Recommended)

```bash
# Create git hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
echo "🔍 Validating hooks..."
node frontend/scripts/validate-hooks.js || exit 1
EOF

# Make executable
chmod +x .git/hooks/pre-commit
```

---

## 📊 What Gets Checked

### ✅ Naming Convention

- All hooks use `use-kebab-case.ts`
- No `useCamelCase.ts` or `use_snake_case.ts`

### ✅ Folder Structure

- No hooks in root `hooks/` directory
- All hooks in feature folders (cornell, games, etc.)
- Each feature has `index.ts` barrel file

### ✅ Test Location

- All tests in `tests/unit/hooks/`
- No `__tests__/` folders in `hooks/`

### ✅ Documentation

- JSDoc comments extracted
- Barrel file exports documented
- Auto-generated per feature

---

## 🎯 Benefits

1. **Enforced Standards** - Pre-commit prevents bad commits
2. **Visual Insights** - Dependency graph shows coupling
3. **Up-to-date Docs** - Auto-generated from code
4. **Linting** - ESLint catches issues in IDE

---

## 🔧 Maintenance

### Regenerate docs after changes:

```bash
npm run docs:hooks
```

### Check dependency graph:

```bash
npm run visualize:hooks
# Then open docs/hooks-dependency-graph.html
```

### Validate before commit:

```bash
npm run validate:hooks
```

---

**Last Updated:** 25/12/2024  
**Maintained By:** Engineering Team
