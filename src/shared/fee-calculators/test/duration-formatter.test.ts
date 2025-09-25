/**
 * Test Duration Formatter
 * Demonstrates the friendly duration formatting
 */

import { describe, it, expect } from 'vitest';

describe('ZERA Duration Formatter', () => {
  /**
   * Format duration in milliseconds to a human-readable string
   */
  function formatDuration(ms: number): string {
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

  describe('Duration Formatting', () => {
    it('should format milliseconds correctly', () => {
      const testCases = [
        { ms: 500, expected: '500ms' },
        { ms: 1500, expected: '1.50s' },
        { ms: 22519, expected: '22.52s' },
        { ms: 125000, expected: '2m 5s' },
        { ms: 3661000, expected: '1h 1m' },
        { ms: 90061000, expected: '1d 1h' }
      ];

      for (const testCase of testCases) {
        const result = formatDuration(testCase.ms);
        expect(result).toBe(testCase.expected);
      }
    });

    it('should format seconds correctly', () => {
      const testCases = [
        { ms: 1000, expected: '1.00s' },
        { ms: 5000, expected: '5.00s' },
        { ms: 30000, expected: '30.00s' },
        { ms: 59999, expected: '59.99s' }
      ];

      for (const testCase of testCases) {
        const result = formatDuration(testCase.ms);
        expect(result).toBe(testCase.expected);
      }
    });

    it('should format minutes correctly', () => {
      const testCases = [
        { ms: 60000, expected: '1m 0s' },
        { ms: 125000, expected: '2m 5s' },
        { ms: 300000, expected: '5m 0s' },
        { ms: 3599999, expected: '59m 59s' }
      ];

      for (const testCase of testCases) {
        const result = formatDuration(testCase.ms);
        expect(result).toBe(testCase.expected);
      }
    });

    it('should format hours correctly', () => {
      const testCases = [
        { ms: 3600000, expected: '1h 0m' },
        { ms: 3661000, expected: '1h 1m' },
        { ms: 7200000, expected: '2h 0m' },
        { ms: 86399999, expected: '23h 59m' }
      ];

      for (const testCase of testCases) {
        const result = formatDuration(testCase.ms);
        expect(result).toBe(testCase.expected);
      }
    });

    it('should format days correctly', () => {
      const testCases = [
        { ms: 86400000, expected: '1d 0h' },
        { ms: 90061000, expected: '1d 1h' },
        { ms: 172800000, expected: '2d 0h' },
        { ms: 2591999999, expected: '29d 23h' }
      ];

      for (const testCase of testCases) {
        const result = formatDuration(testCase.ms);
        expect(result).toBe(testCase.expected);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero duration', () => {
      const result = formatDuration(0);
      expect(result).toBe('0ms');
    });

    it('should handle very small durations', () => {
      const testCases = [
        { ms: 1, expected: '1ms' },
        { ms: 99, expected: '99ms' },
        { ms: 999, expected: '999ms' }
      ];

      for (const testCase of testCases) {
        const result = formatDuration(testCase.ms);
        expect(result).toBe(testCase.expected);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should format durations efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        formatDuration(Math.random() * 1000000);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(50); // Should be very fast
    });
  });
});