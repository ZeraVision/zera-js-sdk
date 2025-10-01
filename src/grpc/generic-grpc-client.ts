/**
 * Generic gRPC Client Factory
 * 
 * This provides a clean, reusable factory for creating gRPC clients
 * for any protobuf service. No business logic - just infrastructure.
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { sanitizeProtobufObject } from '../shared/utils/protobuf-utils.js';
import { 
  createNetworkError,
  grpcErrorContext,
  ErrorHandler
} from '../shared/utils/error-handler.js';
import type { 
  GRPCClientOptions, 
  GRPCClient
} from '../types/index.js';
import type {
  TypedGRPCClientOptions,
  TypedGRPCClient,
  GRPCMethod,
  GRPCCallOptions,
  GRPCCallResult,
  GRPCError,
  isGRPCError
} from './types.js';

/**
 * Create a generic gRPC client for any protobuf service
 */
export function createGenericGRPCClient(options: GRPCClientOptions): GRPCClient {
  const {
    protoFile,
    packageName,
    serviceName,
    host = 'localhost',
    port = 50052
  } = options;

  try {
    // Load the protobuf definition
    const packageDefinition = protoLoader.loadSync(protoFile, {
      longs: String,
      enums: String,
      oneofs: true
    });

    // Get the package and service
    const proto = grpc.loadPackageDefinition(packageDefinition)[packageName];
    
    if (!proto) {
      throw createNetworkError(
        `Package '${packageName}' not found in proto definition. Available packages: ${Object.keys(grpc.loadPackageDefinition(packageDefinition)).join(', ')}`,
        grpcErrorContext('createGenericGRPCClient', { packageName, protoFile })
      );
    }
    
    const ServiceClass = (proto as any)[serviceName];
    
    if (!ServiceClass || typeof ServiceClass !== 'function') {
      throw createNetworkError(
        `Service '${serviceName}' not found in package '${packageName}'. Available services: ${Object.keys(proto).join(', ')}`,
        grpcErrorContext('createGenericGRPCClient', { packageName, serviceName, protoFile })
      );
    }

    // Create the gRPC client
    const client = new ServiceClass(
      `${host}:${port}`,
      grpc.credentials.createInsecure()
    );

    return {
      client,
      proto: proto as Record<string, unknown>,
      serviceName,
      host,
      port
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw createNetworkError(
      'Failed to create gRPC client',
      grpcErrorContext('createGenericGRPCClient', { 
        protoFile, 
        packageName, 
        serviceName, 
        host, 
        port 
      })
    );
  }
}

/**
 * Generic gRPC call wrapper with improved typing
 */
export function makeGRPCCall<TRequest = unknown, TResponse = unknown>(
  client: Record<string, unknown>, 
  method: string, 
  request: TRequest,
  options: GRPCCallOptions = {}
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    try {
      const sanitizedRequest = sanitizeProtobufObject(request, { removeEmptyFields: true });

      if (process.env.DEBUG_GRPC_REQUESTS === 'true') {
        try {
          console.log('gRPC request to', method);
          console.log(JSON.stringify(sanitizedRequest, (key, value) => {
            if (value instanceof Uint8Array) {
              return Buffer.from(value).toString('hex');
            }
            if (typeof value === 'bigint') {
              return value.toString();
            }
            return value;
          }, 2));
        } catch (logError) {
          console.warn('Failed to log gRPC request', logError);
        }
      }

      // Type-safe method access
      const clientMethod = client[method];
      
      if (!clientMethod || typeof clientMethod !== 'function') {
        const availableMethods = Object.keys(client).filter(key => typeof client[key] === 'function');
        reject(createNetworkError(
          `Method '${method}' not found on client. Available methods: ${availableMethods.join(', ')}`,
          grpcErrorContext('makeGRPCCall', { method, availableMethods })
        ));
        return;
      }
      
      // Bind the method to the client to ensure proper 'this' context
      const boundMethod = clientMethod.bind(client) as GRPCMethod<TRequest, TResponse>;
      
      // Set up timeout if specified
      let timeoutId: NodeJS.Timeout | undefined;
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          reject(createNetworkError(
            `gRPC call to '${method}' timed out after ${options.timeout}ms`,
            grpcErrorContext('makeGRPCCall', { method, timeout: options.timeout })
          ));
        }, options.timeout);
      }
      
      boundMethod(sanitizedRequest as TRequest, (error: grpc.ServiceError | null, response: TResponse) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        if (error) {
          const grpcError: GRPCError = {
            ...error,
            context: {
              method,
              service: 'unknown',
              request: sanitizedRequest
            }
          };
          reject(grpcError);
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      reject(createNetworkError(
        `Failed to make gRPC call to '${method}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        grpcErrorContext('makeGRPCCall', { method, error: error instanceof Error ? error.message : String(error) })
      ));
    }
  });
}

/**
 * Create a typed gRPC client with better type safety
 */
export function createTypedGRPCClient<TClient extends Record<string, GRPCMethod>>(
  options: TypedGRPCClientOptions
): TypedGRPCClient & { client: TClient } {
  const baseClient = createGenericGRPCClient(options);
  
  return {
    ...baseClient,
    client: baseClient.client as TClient,
    serviceDefinition: {} // Will be populated based on proto definition
  } as TypedGRPCClient & { client: TClient };
}
