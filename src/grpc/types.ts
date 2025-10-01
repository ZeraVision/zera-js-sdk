/**
 * gRPC Type Definitions
 * 
 * Provides strongly-typed interfaces for gRPC operations
 * to eliminate the need for type assertions and improve type safety.
 */

import * as grpc from '@grpc/grpc-js';

/**
 * gRPC method signature type
 */
export type GRPCMethod<TRequest = unknown, TResponse = unknown> = (
  request: TRequest,
  callback: (error: grpc.ServiceError | null, response: TResponse) => void
) => void;


/**
 * gRPC service definition
 */
export interface GRPCServiceDefinition {
  [methodName: string]: {
    requestType: new () => unknown;
    responseType: new () => unknown;
    requestStream: boolean;
    responseStream: boolean;
  };
}

/**
 * gRPC package definition
 */
export interface GRPCPackageDefinition {
  [serviceName: string]: GRPCServiceDefinition;
}

/**
 * Typed gRPC client options
 */
export interface TypedGRPCClientOptions {
  /** Path to the .proto file */
  protoFile: string;
  /** Package name in the proto file */
  packageName: string;
  /** Service name in the proto file */
  serviceName: string;
  /** Host to connect to */
  host?: string;
  /** Port to connect to */
  port?: number;
  /** gRPC credentials */
  credentials?: grpc.ChannelCredentials;
  /** Additional options */
  options?: Record<string, unknown>;
}

/**
 * Typed gRPC client result
 */
export interface TypedGRPCClient {
  /** The typed gRPC client instance */
  client: Record<string, GRPCMethod>;
  /** Proto definition */
  proto: GRPCPackageDefinition;
  /** Service name */
  serviceName: string;
  /** Host */
  host: string;
  /** Port */
  port: number;
  /** Service definition */
  serviceDefinition: GRPCServiceDefinition;
  /** Index signature for method access */
  [key: string]: GRPCMethod | Record<string, GRPCMethod> | GRPCPackageDefinition | string | number | GRPCServiceDefinition;
}

/**
 * gRPC call options
 */
export interface GRPCCallOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
  /** Metadata to include with the request */
  metadata?: grpc.Metadata;
}

/**
 * gRPC call result
 */
export interface GRPCCallResult<TResponse = unknown> {
  /** Response data */
  response: TResponse;
  /** Response metadata */
  metadata: grpc.Metadata;
  /** Call status */
  status: grpc.StatusObject;
}

/**
 * gRPC error with additional context
 */
export interface GRPCError extends grpc.ServiceError {
  /** Additional error context */
  context?: {
    method: string;
    service: string;
    request?: unknown;
  };
}

/**
 * Type guard to check if an error is a gRPC error
 */
export function isGRPCError(error: unknown): error is GRPCError {
  return error instanceof Error && 'code' in error && 'details' in error;
}

/**
 * Create a typed gRPC method call
 */
export function createTypedGRPCMethod<TRequest, TResponse>(
  client: TypedGRPCClient,
  methodName: string
): GRPCMethod<TRequest, TResponse> {
  const method = client[methodName];
  if (!method) {
    throw new Error(`Method '${methodName}' not found on client`);
  }
  return method as GRPCMethod<TRequest, TResponse>;
}

/**
 * Validate gRPC service definition
 */
export function validateServiceDefinition(
  serviceDefinition: GRPCServiceDefinition,
  methodName: string
): boolean {
  return methodName in serviceDefinition;
}

/**
 * Get method signature from service definition
 */
export function getMethodSignature(
  serviceDefinition: GRPCServiceDefinition,
  methodName: string
) {
  if (!validateServiceDefinition(serviceDefinition, methodName)) {
    throw new Error(`Method '${methodName}' not found in service definition`);
  }
  return serviceDefinition[methodName];
}
