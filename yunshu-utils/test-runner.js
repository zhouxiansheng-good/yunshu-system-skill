const path = require('path');
const fs = require('fs');

const testDir = path.join(__dirname, 'test');
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js'));

let passed = 0;
let failed = 0;
const failures = [];

for (const file of files) {
  console.log(`\n▶ ${file}`);
  try {
    const result = require(path.join(testDir, file));
    if (result && result.passed !== undefined) {
      passed += result.passed;
      failed += result.failed;
      if (result.failures && result.failures.length > 0) {
        failures.push(...result.failures.map(f => `[${file}] ${f}`));
      }
      console.log(`  ✓ ${result.passed} passed, ✗ ${result.failed} failed`);
    }
  } catch (e) {
    failed++;
    failures.push(`[${file}] ${e.message}`);
    console.log(`  ✗ Error: ${e.message}`);
  }
}

console.log(`\n${'='.repeat(40)}`);
console.log(`Total: ${passed + failed} | ✓ ${passed} passed | ✗ ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f}`));
}
process.exit(failed > 0 ? 1 : 0);
