/**
 * ACE Exchange Rate Service - Main Exports
 * 
 * This provides convenient access to all rate-related functionality.
 */

export { 
  ACEExchangeRateService, 
  aceExchangeService,
  getExchangeRate, 
  convertUSDToCurrency, 
  convertCurrencyToUSD 
} from './service.js';
export { runRateExamples } from './examples.js';
