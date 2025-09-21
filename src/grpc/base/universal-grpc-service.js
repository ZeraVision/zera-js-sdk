/**
 * Universal gRPC Service Base Class
 * 
 * This provides a clean, reusable base for all gRPC services in the ZERA SDK.
 * Handles connection management, error handling, and common patterns.
 */

/**
 * Universal gRPC Service Base Class
 */
export class UniversalGRPCService {
  constructor(options = {}) {
    this.host = options.host || 'routing.zerascan.io';
    this.port = options.port || 50052;
    this.protocol = options.protocol || 'http';
    this.nodeOptions = options.nodeOptions || {};
    this.endpoint = options.endpoint;
    
    // Lazy-loaded service class (created on first use)
    this._serviceClass = null;
  }

  /**
   * Get the base URL for the gRPC connection
   * @returns {string} Base URL
   */
  getBaseUrl() {
    if (this.endpoint) {
      return this.endpoint.startsWith('http') ? this.endpoint : `${this.protocol}://${this.endpoint}`;
    }
    return `${this.protocol}://${this.host}:${this.port}`;
  }

  /**
   * Update connection configuration
   * @param {Object} options - New configuration options
   */
  updateConfig(options) {
    // Reset service class if connection details change
    if (options.host !== this.host || 
        options.port !== this.port || 
        options.protocol !== this.protocol ||
        options.endpoint !== this.endpoint) {
      this._serviceClass = null;
    }
    
    Object.assign(this, options);
  }
}
