/**
 * Rate Handler - Main Exports
 * 
 * This provides centralized rate handling with safeguards and core logic.
 * Validator and zv-indexer services should only fetch data and feed it here.
 */

export { 
  RateHandler, 
  rateHandler,
  getExchangeRate, 
  convertUSDToCurrency, 
  convertCurrencyToUSD,
  type RateHandlerOptions,
  type FallbackRateInfo,
  type CacheInfo,
  type RateSource
} from './service.js';

export { runRateHandlerExamples } from './examples/index.js';
