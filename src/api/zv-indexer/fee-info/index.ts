/**
 * ZV-Indexer Rate Service - Main Exports
 * 
 * This provides convenient access to ZV-Indexer rate fetching functionality.
 */

export { 
  ZVIndexerRateService, 
  zvIndexerRateService,
  getExchangeRate,
  type ZVIndexerRateServiceOptions
} from './service.js';
export { runRateExamples } from './examples/index.js';
