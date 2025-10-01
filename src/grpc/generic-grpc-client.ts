/**
 * Generic gRPC Client Factory
 * 
 * This provides a clean, reusable factory for creating gRPC clients
 * for any protobuf service. No business logic - just infrastructure.
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { sanitizeProtobufObject } from '../shared/utils/protobuf-utils.js';
import type { 
  GRPCClientOptions, 
  GRPCClient
} from '../types/index.js';

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

  // Load the protobuf definition
  const packageDefinition = protoLoader.loadSync(protoFile, {
    longs: String,
    enums: String,
    oneofs: true
  });

  // Get the package and service
  const proto = grpc.loadPackageDefinition(packageDefinition)[packageName] as Record<string, unknown>;
  
  if (!proto) {
    throw new Error(`Package '${packageName}' not found in proto definition. Available packages: ${Object.keys(grpc.loadPackageDefinition(packageDefinition)).join(', ')}`);
  }
  
  const ServiceClass = proto[serviceName] as new (...args: unknown[]) => unknown;
  
  if (!ServiceClass) {
    throw new Error(`Service '${serviceName}' not found in package '${packageName}'. Available services: ${Object.keys(proto).join(', ')}`);
  }

  // Create the gRPC client
  const client = new ServiceClass(
    `${host}:${port}`,
    grpc.credentials.createInsecure()
  ) as any;

  return {
    client: client as any,
    proto,
    serviceName,
    host,
    port
  };
}

/**
 * Generic gRPC call wrapper
 */
export function makeGRPCCall<TRequest = unknown, TResponse = unknown>(
  client: any, 
  method: string, 
  request: TRequest
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
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

    const clientMethod = client[method] as (
      request: unknown,
      callback: (error: Error | null, response: TResponse) => void
    ) => void;
    
    if (!clientMethod) {
      reject(new Error(`Method '${method}' not found on client. Available methods: ${Object.keys(client).join(', ')}. Client type: ${typeof client}, Client constructor: ${client?.constructor?.name}`));
      return;
    }
    
    // Bind the method to the client to ensure proper 'this' context
    const boundMethod = clientMethod.bind(client);
    boundMethod(sanitizedRequest, (error: Error | null, response: TResponse) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}
