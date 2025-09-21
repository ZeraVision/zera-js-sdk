# gRPC Infrastructure

This folder contains **generic, reusable gRPC infrastructure** for the ZERA SDK. All business logic is handled in the `api/` folders.

## Architecture

### Generic Infrastructure (`src/grpc/`)
- **`generic-grpc-client.js`**: Factory for creating gRPC clients for any protobuf service
- **`base/universal-grpc-service.js`**: Base class for gRPC services (if needed)
- **`index.js`**: Main exports for gRPC infrastructure

### Specific Pre-configured Clients (`src/grpc/`)
- **`api/validator-api-client.js`**: Pre-configured client for validator API (port 50053)
- **`transaction/transaction-client.js`**: Pre-configured client for transaction service (port 50052)

### Business Logic (`src/api/`)
- **`validator/nonce/`**: Nonce retrieval business logic
- **`transaction/`**: Transaction submission business logic
- **`zv-indexer/`**: ZV-Indexer API business logic

## Usage

### Specific Pre-configured Clients (Recommended)
```javascript
// Use pre-configured clients for specific services
import { createValidatorAPIClient } from '../grpc/api/validator-api-client.js';
import { createTransactionClient } from '../grpc/transaction/transaction-client.js';

// API client (pre-configured for validator API)
const apiClient = createValidatorAPIClient({
  host: 'routing.zerascan.io',
  port: 50053
});
const nonceResponse = await apiClient.getNonce(address);

// Transaction client (pre-configured for transaction service)
const txnClient = createTransactionClient({
  host: 'routing.zerascan.io',
  port: 50052
});
const txnResponse = await txnClient.submitCoinTransaction(coinTxn);
```

### Generic gRPC Client (For Custom Services)
```javascript
import { createGenericGRPCClient, makeGRPCCall } from '../grpc/generic-grpc-client.js';

// Create a client for any protobuf service
const client = createGenericGRPCClient({
  protoFile: 'proto/api.proto',
  packageName: 'zera_api',
  serviceName: 'APIService',
  host: 'localhost',
  port: 50053
});

// Make a gRPC call
const response = await makeGRPCCall(client.client, 'Nonce', request);
```

### Business Logic Services (Highest Level)
```javascript
// Nonce service (handles all nonce business logic)
import { getNonce, getNonces } from '../api/validator/nonce/service.js';

// Transaction service (handles all transaction business logic)
import { submitCoinTransaction } from '../api/transaction/service.js';
```

## Service Ports

| Service | Port | Protobuf | Package | Service Name | Default Host |
|---------|------|----------|---------|--------------|--------------|
| **Validator API** | 50053 | `api.proto` | `zera_api` | `APIService` | `routing.zerascan.io` |
| **Transaction** | 50052 | `txn.proto` | `zera_txn` | `TXNService` | `routing.zerascan.io` |

## Benefits

1. **Separation of Concerns**: Infrastructure vs. business logic
2. **Pre-configured Clients**: Ready-to-use clients for common services
3. **Reusability**: Generic gRPC client can be used for any protobuf service
4. **Maintainability**: Business logic is organized by domain
5. **Testability**: Easy to mock and test individual components
6. **Minimal Configuration**: Pre-configured clients with sensible defaults