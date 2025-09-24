/**
 * Generic gRPC Client Factory
 * 
 * This provides a clean, reusable factory for creating gRPC clients
 * for any protobuf service. No business logic - just infrastructure.
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { sanitizeProtobufObject } from '../shared/utils/protobuf-utils.js';

/**
 * Create a generic gRPC client for any protobuf service
 * @param {Object} options - Configuration options
 * @param {string} options.protoFile - Path to the .proto file
 * @param {string} options.packageName - Package name in the proto file
 * @param {string} options.serviceName - Service name in the proto file
 * @param {string} options.host - Host to connect to
 * @param {number} options.port - Port to connect to
 * @returns {Object} gRPC client with service methods
 */
export function createGenericGRPCClient(options) {
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
  const proto = grpc.loadPackageDefinition(packageDefinition)[packageName];
  const ServiceClass = proto[serviceName];

  // Create the gRPC client
  const client = new ServiceClass(
    `${host}:${port}`,
    grpc.credentials.createInsecure()
  );

  return {
    client,
    proto,
    serviceName,
    host,
    port
  };
}

/**
 * Generic gRPC call wrapper
 * @param {Object} client - gRPC client object
 * @param {string} method - Method name to call
 * @param {Object} request - Request data
 * @returns {Promise<Object>} Response data
 */
export function makeGRPCCall(client, method, request) {
  return new Promise((resolve, reject) => {
    const sanitizedRequest = sanitizeProtobufObject(request, { removeEmptyFields: true });

    if (process.env.DEBUG_GRPC_REQUESTS === 'true') {
      try {
        console.log('gRPC request to', method);
        console.log(JSON.stringify(sanitizedRequest, (key, value) => {
          if (value instanceof Uint8Array) {
            return Buffer.from(value).toString('hex');
          }
          return value;
        }, 2));
      } catch (logError) {
        console.warn('Failed to log gRPC request', logError);
      }
    }

    client[method](sanitizedRequest, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}

