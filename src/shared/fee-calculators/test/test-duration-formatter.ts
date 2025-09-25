/**
 * Test Duration Formatter
 * Demonstrates the friendly duration formatting
 */

// Import the formatter function (we'll need to export it from test-runner.js)
// For now, let's recreate it here for testing

/**
 * Format duration in milliseconds to a human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Human-readable duration
 */
function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }
  
  const minutes = seconds / 60;
  if (minutes < 60) {
    const remainingSeconds = Math.floor(seconds % 60);
    return `${Math.floor(minutes)}m ${remainingSeconds}s`;
  }
  
  const hours = minutes / 60;
  if (hours < 24) {
    const remainingMinutes = Math.floor(minutes % 60);
    return `${Math.floor(hours)}h ${remainingMinutes}m`;
  }
  
  const days = hours / 24;
  const remainingHours = Math.floor(hours % 24);
  return `${Math.floor(days)}d ${remainingHours}h`;
}

/**
 * Test the duration formatter with various durations
 */
export async function testDurationFormatter() {
  console.log('🧪 Testing Duration Formatter');
  
  const testCases = [
    { ms: 500, expected: '500ms' },
    { ms: 1500, expected: '1.50s' },
    { ms: 22519, expected: '22.52s' },
    { ms: 65000, expected: '1m 5s' },
    { ms: 125000, expected: '2m 5s' },
    { ms: 3661000, expected: '1h 1m' },
    { ms: 7200000, expected: '2h 0m' },
    { ms: 90061000, expected: '1d 1h' },
    { ms: 172800000, expected: '2d 0h' }
  ];
  
  console.log('\n📊 Duration Formatting Test Cases:');
  
  for (const testCase of testCases) {
    const result = formatDuration(testCase.ms);
    const passed = result === testCase.expected;
    
    console.log(`  ${passed ? '✅' : '❌'} ${testCase.ms}ms → ${result} ${passed ? '' : `(expected: ${testCase.expected})`}`);
  }
  
  console.log('\n🎯 Real-world Examples:');
  console.log(`  Quick test: ${formatDuration(150)}`);
  console.log(`  Medium test: ${formatDuration(22519)}`);
  console.log(`  Long test: ${formatDuration(125000)}`);
  console.log(`  Very long test: ${formatDuration(3661000)}`);
  
  console.log('\n✅ Duration Formatter Tests Completed');
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDurationFormatter();
}
