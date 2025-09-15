# CoinTXN Module

Create and submit coin transactions using modern protobuf schemas and a gRPC (Connect) client.

## What this module provides
- `createCoinTXN(inputs, outputs, contractId, feeConfig?, baseMemo?)`: Build a complete Coin transaction using exact decimal math and real protobuf messages
- `sendCoinTXN(coinTxn, grpcConfig?)`: Submit the transaction to a node over HTTP/2 (Connect)

## FeeConfig (your "struct")
JS "struct" is a plain object with named fields:
- `baseFeeId` (string, optional): The fee instrument ID (defaults to `'$ZRA+0000'`)
- `baseFee` (Decimal|string|number, optional): Base fee amount in user-friendly units (will be converted to smallest units)
- `contractFeeId` (string, optional): Defaults to the provided `contractId`
- `contractFee` (Decimal|string|number, optional): Contract fee amount in user-friendly units (will be converted to smallest units)

Examples:
```js
// Minimal - contractId required, baseFeeId defaults to $ZRA+0000
const feeConfig = {};

// Custom base fee
const feeConfig = {
  baseFeeId: '$ZRA+0000',
  baseFee: '0.001'         // user-friendly units (0.001 ZRA)
};

// Full configuration
const feeConfig = {
  baseFeeId: '$ZRA+0000',
  baseFee: '0.001',         // user-friendly units (0.001 ZRA)
  contractFeeId: '$BTC+1234', // defaults to contractId if not provided
  contractFee: '0.0005'     // user-friendly units (0.0005 BTC)
};
```

## API

### createCoinTXN(inputs, outputs, contractId, feeConfig?, baseMemo?)
- `inputs`: `[{ privateKey, publicKey, amount, feePercent? }, ...]`
  - `amount`: Decimal-friendly (string/number/Decimal)
  - `feePercent`: string like `'60'` — scaled internally with exact decimal math
- `outputs`: `[{ to, amount, memo? }, ...]` (per-recipient memos)
- `contractId`: Contract ID (e.g., `'$BTC+1234'`) - must follow format `$[letters]+[4 digits]`
- `feeConfig`: See "FeeConfig" above
- `baseMemo`: Optional transaction-level memo

Behavior:
- Converts all amounts (including fees) to smallest units using the token decimals for the respective fee IDs
- Validates that total inputs == total outputs (exact decimal math)
- Validates input `feePercent` values sum to exactly 100% (scaled to `100,000,000`)
- Attaches `BaseTXN` when `baseFee` or `baseMemo` provided

Example:
```js
import { createCoinTXN } from './transaction.js';

const coinTxn = createCoinTXN(
  [{ privateKey: 'alice_private_key', publicKey: 'alice_public_key', amount: '1.0', feePercent: '100' }],
  [{ to: 'bob_address', amount: '1.0', memo: 'payment' }],
  '$BTC+1234',  // contractId required
  { baseFeeId: '$ZRA+0000', baseFee: '0.001' },
  'base memo'
);
```

### sendCoinTXN(coinTxn, grpcConfig?)
- `coinTxn`: A CoinTXN protobuf message or a plain object matching the schema
- `grpcConfig`:
  - `endpoint`: `'http://host:port'` or `'host:port'`
  - `host` (default `'routing.zeravision.ca'`)
  - `port` (default `50052`)
  - `protocol` (default `'http'`)
  - `nodeOptions`: optional Node HTTP/2 connect options (TLS, CA, etc.)

Notes:
- If you call `sendCoinTXN`, you need the Connect runtime installed at runtime:
  - `@connectrpc/connect`
  - `@connectrpc/connect-node`
- The module uses dynamic imports so simply importing this file won’t require those dependencies until you actually call `sendCoinTXN`.

Example:
```js
import { sendCoinTXN } from './transaction.js';

await sendCoinTXN(coinTxn, { endpoint: 'http://localhost:50052' });
// or
await sendCoinTXN(coinTxn, { host: 'node.local', port: 50052, protocol: 'http' });
```

## End-to-end example (ready to run)
- Script: `npm run example:coin:grpc`
- File: `src/coin-txn/examples/example-coin.js`

What it does:
1) Builds a `CoinTXN` with a simple input/output
2) Submits it via `sendCoinTXN` to `ZERA_GRPC_ENDPOINT` (or `http://localhost:50052`)

Set endpoint in PowerShell:
```powershell
$env:ZERA_GRPC_ENDPOINT='http://your-node:50052'
```

## Testing
- Run all tests: `npm test`
- Run just this module: `node test-runner.js --module=coin-txn`

## Amounts and decimals
- Use user-friendly amounts like `'1.5'` when building inputs/outputs
- Conversion to smallest units uses token decimals for `baseFeeId`
- ZRA (`'$ZRA+0000'`) uses 9 decimals

## Error handling
- `createCoinTXN` throws if:
  - Inputs/outputs are missing or not arrays
  - Input/output totals don’t balance
  - Fee percentages don’t sum to exactly 100%
- `sendCoinTXN` throws on network/protocol errors

## Secure vs insecure transport
- Insecure (HTTP, h2c): use `http://host:port`
- Secure (TLS): use `https://host[:port]` and optionally provide `nodeOptions` (e.g. custom `ca`)
