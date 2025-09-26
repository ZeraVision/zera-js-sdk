import type { GRPCConfig, GRPCOverrideConfig } from '../../../types/index.js';

/**
 * Testing gRPC override configuration -- select your GRPC endpoint
 */
export const TESTING_GRPC_OVERRIDE_CONFIG: GRPCOverrideConfig = {
  grpcConfig: {
    host: '146.190.114.124',
  },
};
