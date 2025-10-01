/**
 * Configuration Management System
 * 
 * Provides a centralized, type-safe configuration management system
 * for the ZERA SDK with support for environment variables, defaults,
 * and validation.
 */

import { createValidationError, createErrorContext } from '../utils/error-handler.js';

/**
 * Configuration environment types
 */
export type ConfigEnvironment = 'development' | 'staging' | 'production' | 'test';

/**
 * Base configuration interface
 */
export interface BaseConfig {
  environment: ConfigEnvironment;
  debug: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  /** Default gRPC host */
  defaultHost: string;
  /** Default gRPC port */
  defaultPort: number;
  /** Default protocol */
  defaultProtocol: 'http' | 'https';
  /** Connection timeout in milliseconds */
  connectionTimeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Whether to use secure connections */
  useSecureConnections: boolean;
  /** Certificate validation */
  validateCertificates: boolean;
  /** Private key protection */
  protectPrivateKeys: boolean;
  /** Memory clearing timeout in milliseconds */
  memoryClearTimeout: number;
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  /** Enable performance monitoring */
  enableMonitoring: boolean;
  /** Performance monitoring interval in milliseconds */
  monitoringInterval: number;
  /** Cache timeout in milliseconds */
  cacheTimeout: number;
  /** Maximum cache size */
  maxCacheSize: number;
}

/**
 * Complete SDK configuration
 */
export interface SDKConfig extends BaseConfig {
  network: NetworkConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration manager class
 */
export class ConfigManager {
  private config: SDKConfig;
  private readonly defaultConfig: SDKConfig;

  constructor() {
    this.defaultConfig = this.getDefaultConfig();
    this.config = { ...this.defaultConfig };
    this.loadFromEnvironment();
  }

  /**
   * Get the current configuration
   */
  getConfig(): SDKConfig {
    return { ...this.config };
  }

  /**
   * Update configuration with partial config
   */
  updateConfig(partialConfig: Partial<SDKConfig>): void {
    this.config = this.mergeConfig(this.config, partialConfig);
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.config = { ...this.defaultConfig };
  }

  /**
   * Validate current configuration
   */
  validateConfig(): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate base config
    if (!this.config.environment) {
      errors.push('Environment is required');
    }

    if (!['development', 'staging', 'production', 'test'].includes(this.config.environment)) {
      errors.push('Invalid environment value');
    }

    // Validate network config
    if (!this.config.network.defaultHost) {
      errors.push('Default host is required');
    }

    if (this.config.network.defaultPort < 1 || this.config.network.defaultPort > 65535) {
      errors.push('Invalid default port');
    }

    if (this.config.network.connectionTimeout < 1000) {
      warnings.push('Connection timeout is very low');
    }

    if (this.config.network.maxRetries < 0) {
      errors.push('Max retries cannot be negative');
    }

    // Validate security config
    if (this.config.security.memoryClearTimeout < 0) {
      errors.push('Memory clear timeout cannot be negative');
    }

    // Validate performance config
    if (this.config.performance.monitoringInterval < 1000) {
      warnings.push('Monitoring interval is very low');
    }

    if (this.config.performance.cacheTimeout < 0) {
      errors.push('Cache timeout cannot be negative');
    }

    if (this.config.performance.maxCacheSize < 0) {
      errors.push('Max cache size cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): void {
    const env = process.env;

    // Base configuration
    if (env.ZERA_ENVIRONMENT) {
      this.config.environment = env.ZERA_ENVIRONMENT as ConfigEnvironment;
    }

    if (env.ZERA_DEBUG) {
      this.config.debug = env.ZERA_DEBUG.toLowerCase() === 'true';
    }

    if (env.ZERA_LOG_LEVEL) {
      this.config.logLevel = env.ZERA_LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug';
    }

    // Network configuration
    if (env.ZERA_DEFAULT_HOST) {
      this.config.network.defaultHost = env.ZERA_DEFAULT_HOST;
    }

    if (env.ZERA_DEFAULT_PORT) {
      const port = parseInt(env.ZERA_DEFAULT_PORT, 10);
      if (!isNaN(port)) {
        this.config.network.defaultPort = port;
      }
    }

    if (env.ZERA_DEFAULT_PROTOCOL) {
      this.config.network.defaultProtocol = env.ZERA_DEFAULT_PROTOCOL as 'http' | 'https';
    }

    if (env.ZERA_CONNECTION_TIMEOUT) {
      const timeout = parseInt(env.ZERA_CONNECTION_TIMEOUT, 10);
      if (!isNaN(timeout)) {
        this.config.network.connectionTimeout = timeout;
      }
    }

    if (env.ZERA_MAX_RETRIES) {
      const retries = parseInt(env.ZERA_MAX_RETRIES, 10);
      if (!isNaN(retries)) {
        this.config.network.maxRetries = retries;
      }
    }

    if (env.ZERA_RETRY_DELAY) {
      const delay = parseInt(env.ZERA_RETRY_DELAY, 10);
      if (!isNaN(delay)) {
        this.config.network.retryDelay = delay;
      }
    }

    // Security configuration
    if (env.ZERA_USE_SECURE_CONNECTIONS) {
      this.config.security.useSecureConnections = env.ZERA_USE_SECURE_CONNECTIONS.toLowerCase() === 'true';
    }

    if (env.ZERA_VALIDATE_CERTIFICATES) {
      this.config.security.validateCertificates = env.ZERA_VALIDATE_CERTIFICATES.toLowerCase() === 'true';
    }

    if (env.ZERA_PROTECT_PRIVATE_KEYS) {
      this.config.security.protectPrivateKeys = env.ZERA_PROTECT_PRIVATE_KEYS.toLowerCase() === 'true';
    }

    if (env.ZERA_MEMORY_CLEAR_TIMEOUT) {
      const timeout = parseInt(env.ZERA_MEMORY_CLEAR_TIMEOUT, 10);
      if (!isNaN(timeout)) {
        this.config.security.memoryClearTimeout = timeout;
      }
    }

    // Performance configuration
    if (env.ZERA_ENABLE_MONITORING) {
      this.config.performance.enableMonitoring = env.ZERA_ENABLE_MONITORING.toLowerCase() === 'true';
    }

    if (env.ZERA_MONITORING_INTERVAL) {
      const interval = parseInt(env.ZERA_MONITORING_INTERVAL, 10);
      if (!isNaN(interval)) {
        this.config.performance.monitoringInterval = interval;
      }
    }

    if (env.ZERA_CACHE_TIMEOUT) {
      const timeout = parseInt(env.ZERA_CACHE_TIMEOUT, 10);
      if (!isNaN(timeout)) {
        this.config.performance.cacheTimeout = timeout;
      }
    }

    if (env.ZERA_MAX_CACHE_SIZE) {
      const size = parseInt(env.ZERA_MAX_CACHE_SIZE, 10);
      if (!isNaN(size)) {
        this.config.performance.maxCacheSize = size;
      }
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): SDKConfig {
    return {
      environment: 'development',
      debug: false,
      logLevel: 'info',
      network: {
        defaultHost: 'routing.zerascan.io',
        defaultPort: 50052,
        defaultProtocol: 'http',
        connectionTimeout: 30000,
        maxRetries: 3,
        retryDelay: 1000
      },
      security: {
        useSecureConnections: false,
        validateCertificates: true,
        protectPrivateKeys: true,
        memoryClearTimeout: 5000
      },
      performance: {
        enableMonitoring: false,
        monitoringInterval: 60000,
        cacheTimeout: 300000,
        maxCacheSize: 1000
      }
    };
  }

  /**
   * Merge configuration objects
   */
  private mergeConfig(base: SDKConfig, partial: Partial<SDKConfig>): SDKConfig {
    return {
      ...base,
      ...partial,
      network: {
        ...base.network,
        ...partial.network
      },
      security: {
        ...base.security,
        ...partial.security
      },
      performance: {
        ...base.performance,
        ...partial.performance
      }
    };
  }

  /**
   * Get configuration for specific environment
   */
  getEnvironmentConfig(environment: ConfigEnvironment): Partial<SDKConfig> {
    const configs: Record<ConfigEnvironment, Partial<SDKConfig>> = {
      development: {
        debug: true,
        logLevel: 'debug',
        network: {
          defaultHost: 'localhost',
          defaultPort: 50052,
          defaultProtocol: 'http',
          connectionTimeout: 10000,
          maxRetries: 3,
          retryDelay: 1000
        },
        performance: {
          enableMonitoring: true,
          monitoringInterval: 30000,
          cacheTimeout: 300000,
          maxCacheSize: 1000
        }
      },
      staging: {
        debug: true,
        logLevel: 'info',
        network: {
          defaultHost: 'staging.zerascan.io',
          defaultPort: 50052,
          defaultProtocol: 'https',
          connectionTimeout: 20000,
          maxRetries: 3,
          retryDelay: 1000
        },
        performance: {
          enableMonitoring: true,
          monitoringInterval: 60000,
          cacheTimeout: 300000,
          maxCacheSize: 1000
        }
      },
      production: {
        debug: false,
        logLevel: 'warn',
        network: {
          defaultHost: 'routing.zerascan.io',
          defaultPort: 50052,
          defaultProtocol: 'https',
          connectionTimeout: 30000,
          maxRetries: 3,
          retryDelay: 1000
        },
        security: {
          useSecureConnections: true,
          validateCertificates: true,
          protectPrivateKeys: true,
          memoryClearTimeout: 5000
        },
        performance: {
          enableMonitoring: false,
          monitoringInterval: 300000,
          cacheTimeout: 600000,
          maxCacheSize: 5000
        }
      },
      test: {
        debug: false,
        logLevel: 'error',
        network: {
          defaultHost: 'localhost',
          defaultPort: 50052,
          defaultProtocol: 'http',
          connectionTimeout: 5000,
          maxRetries: 1,
          retryDelay: 100
        },
        performance: {
          enableMonitoring: false,
          monitoringInterval: 10000,
          cacheTimeout: 1000,
          maxCacheSize: 100
        }
      }
    };

    return configs[environment] || {};
  }

  /**
   * Set environment and load environment-specific config
   */
  setEnvironment(environment: ConfigEnvironment): void {
    this.config.environment = environment;
    const envConfig = this.getEnvironmentConfig(environment);
    this.updateConfig(envConfig);
  }

  /**
   * Export current configuration
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson) as SDKConfig;
      this.config = this.mergeConfig(this.defaultConfig, importedConfig);
    } catch (error) {
      throw createValidationError(
        'Invalid configuration JSON',
        createErrorContext('importConfig', 'config', { error: error instanceof Error ? error.message : 'Unknown error' })
      );
    }
  }
}

/**
 * Global configuration manager instance
 */
export const configManager = new ConfigManager();

/**
 * Convenience functions for accessing configuration
 */
export const getConfig = () => configManager.getConfig();
export const updateConfig = (partialConfig: Partial<SDKConfig>) => configManager.updateConfig(partialConfig);
export const resetConfig = () => configManager.resetConfig();
export const validateConfig = () => configManager.validateConfig();
export const setEnvironment = (environment: ConfigEnvironment) => configManager.setEnvironment(environment);
