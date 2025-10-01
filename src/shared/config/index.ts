/**
 * Configuration Module
 * 
 * Centralized configuration management for the ZERA SDK.
 * Provides type-safe configuration with environment variable support.
 */

export {
  ConfigManager,
  configManager,
  getConfig,
  updateConfig,
  resetConfig,
  validateConfig,
  setEnvironment
} from './config-manager.js';

export type {
  ConfigEnvironment,
  BaseConfig,
  NetworkConfig,
  SecurityConfig,
  PerformanceConfig,
  SDKConfig,
  ConfigValidationResult
} from './config-manager.js';
