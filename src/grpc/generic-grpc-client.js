/**
 * Generic gRPC Client Factory
 * 
 * This provides a clean, reusable factory for creating gRPC clients
 * for any protobuf service. No business logic - just infrastructure.
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

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
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
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
    client[method](request, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}
