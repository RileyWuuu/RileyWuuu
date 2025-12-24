// Architecture Guard - Enforce import rules

import * as fs from 'fs';
import * as path from 'path';

interface Violation {
  file: string;
  line: number;
  message: string;
}

const violations: Violation[] = [];

// Patterns to check
const FORBIDDEN_PATTERNS = [
  // Direct import from other feature's internal files
  {
    pattern: /from\s+['"]@features\/[^/]+\/(usecases|repo|reducer|ecs\/[^/]+|replay)\//,
    message: 'Cannot import from feature internal files (usecases/repo/reducer/ecs/replay). Use feature index.ts instead.'
  },
  {
    pattern: /from\s+['"]\.\.\/features\/[^/]+\/(usecases|repo|reducer|ecs\/[^/]+|replay)\//,
    message: 'Cannot import from feature internal files (usecases/repo/reducer/ecs/replay). Use feature index.ts instead.'
  },
  {
    pattern: /from\s+['"]\.\.\/\.\.\/features\/[^/]+\/(usecases|repo|reducer|ecs\/[^/]+|replay)\//,
    message: 'Cannot import from feature internal files (usecases/repo/reducer/ecs/replay). Use feature index.ts instead.'
  }
];

function checkFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    FORBIDDEN_PATTERNS.forEach(({ pattern, message }) => {
      if (pattern.test(line)) {
        violations.push({
          file: filePath,
          line: index + 1,
          message
        });
      }
    });
  });
}

function walkDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and build directories
      if (file !== 'node_modules' && file !== 'build' && file !== 'dist') {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function main(): void {
  const assetsDir = path.join(process.cwd(), 'assets');
  
  if (!fs.existsSync(assetsDir)) {
    console.error('assets directory not found');
    process.exit(1);
  }

  const files = walkDir(assetsDir);
  
  files.forEach(file => {
    // Skip this script itself
    if (!file.includes('arch-guard.ts')) {
      checkFile(file);
    }
  });

  if (violations.length > 0) {
    console.error('\n❌ Architecture violations found:\n');
    violations.forEach(v => {
      console.error(`  ${v.file}:${v.line}`);
      console.error(`    ${v.message}\n`);
    });
    process.exit(1);
  } else {
    console.log('✅ No architecture violations found');
  }
}

main();

