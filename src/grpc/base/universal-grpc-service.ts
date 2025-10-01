/**
 * Universal gRPC Service Base Class
 * 
 * This provides a clean, reusable base for all gRPC services in the ZERA SDK.
 * Handles connection management, error handling, and common patterns.
 */

export interface UniversalGRPCServiceOptions {
  host?: string;
  port?: number;
  protocol?: string;
  nodeOptions?: Record<string, unknown>;
  endpoint?: string;
}

/**
 * Universal gRPC Service Base Class
 */
export class UniversalGRPCService {
  public host: string;
  public port: number;
  public protocol: string;
  public nodeOptions: Record<string, unknown>;
  public endpoint?: string;
  
  // Lazy-loaded service class (created on first use)
  private _serviceClass: unknown = null;

  constructor(options: UniversalGRPCServiceOptions = {}) {
    this.host = options.host || 'routing.zerascan.io';
    this.port = options.port || 50052;
    this.protocol = options.protocol || 'http';
    this.nodeOptions = options.nodeOptions || {};
    if (options.endpoint !== undefined) {
      this.endpoint = options.endpoint;
    }
  }

  /**
   * Get the base URL for the gRPC connection
   * @returns Base URL
   */
  getBaseUrl(): string {
    if (this.endpoint) {
      return this.endpoint.startsWith('http') ? this.endpoint : `${this.protocol}://${this.endpoint}`;
    }
    return `${this.protocol}://${this.host}:${this.port}`;
  }

  /**
   * Update connection configuration
   * @param options - New configuration options
   */
  updateConfig(options: UniversalGRPCServiceOptions): void {
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
