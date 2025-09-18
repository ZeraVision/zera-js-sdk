# CoinTXN Module

Create and submit coin transactions using modern protobuf schemas and a gRPC (Connect) client.

## What this module provides
- `createCoinTXN(inputs, outputs, contractId, feeConfig?, baseMemo?)`: Build a complete Coin transaction using exact decimal math and real protobuf messages
- `sendCoinTXN(coinTxn, grpcConfig?)`: Submit the transaction to a node over HTTP/2 (Connect)

## FeeConfig (your "struct")
JS "struct" is a plain object with named fields:
- `baseFeeId` (string, optional): The fee instrument ID (defaults to `'$ZRA+0000'`) - **if provided, automatic fee calculation uses this instrument**
- `baseFee` (Decimal|string|number, optional): Base fee amount in user-friendly units (will be converted to smallest units) - **if not provided, automatic fee calculation is used**
- `contractFeeId` (string, optional): Contract fee instrument (defaults to `contractId`) - **if provided, automatic fee calculation uses this instrument**
- `contractFee` (Decimal|string|number, optional): Contract fee amount in user-friendly units (will be converted to smallest units) - **if not provided, automatic fee calculation is used**

**Flexible Behavior**: 
- **Fee Instrument IDs**: Specify which currency/instrument to use for fees (auto-calculates amounts)
- **Fee Amounts**: Specify exact amounts (manual control)
- **Mix and Match**: Use auto for one fee type, manual for another

Examples:
```js
// Fully automatic (default behavior)
const feeConfig = {}; // Uses automatic fee calculation with default instruments

// Specify fee instruments, auto-calculate amounts
const feeConfig = {
  baseFeeId: '$BTC+1234',    // Use BTC for base fees (auto-calculated amount)
  contractFeeId: '$ETH+5678' // Use ETH for contract fees (auto-calculated amount)
};

// Manual base fee, auto contract fee
const feeConfig = {
  baseFeeId: '$ZRA+0000',
  baseFee: '0.001',          // Manual base fee amount
  contractFeeId: '$BTC+1234' // Auto-calculated contract fee in BTC
};

// Manual contract fee, auto base fee
const feeConfig = {
  baseFeeId: '$ZRA+0000',    // Auto-calculated base fee in ZRA
  contractFeeId: '$BTC+1234',
  contractFee: '0.0005'      // Manual contract fee amount
};

// Fully manual (explicit control)
const feeConfig = {
  baseFeeId: '$ZRA+0000',
  baseFee: '0.001',          // Manual base fee
  contractFeeId: '$BTC+1234',
  contractFee: '0.0005'       // Manual contract fee
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
- **Flexible fee calculation**: Uses automatic fee calculation unless fee amounts are explicitly provided
- **Fee Instrument IDs**: Specify which currency/instrument to use for fees (auto-calculates amounts)
- **Fee Amounts**: Specify exact amounts (manual control)
- **Mix and Match**: Use auto for one fee type, manual for another
- Converts all amounts (including fees) to smallest units using the token decimals for the respective fee IDs
- Validates that total inputs == total outputs (exact decimal math)
- Validates input `feePercent` values sum to exactly 100% (scaled to `100,000,000`)
- Attaches `BaseTXN` with calculated or provided fees

Examples:
```js
import { createCoinTXN } from './transaction.js';

// Fully automatic (default behavior)
const coinTxn = await createCoinTXN(
  [{ privateKey: 'alice_private_key', publicKey: 'alice_public_key', amount: '1.0', feePercent: '100' }],
  [{ to: 'bob_address', amount: '1.0', memo: 'payment' }],
  '$BTC+1234',  // contractId required
  {}, // Empty config - uses automatic fee calculation with default instruments
  'base memo'
);

// Specify fee instruments, auto-calculate amounts
const coinTxnWithCustomInstruments = await createCoinTXN(
  [{ privateKey: 'alice_private_key', publicKey: 'alice_public_key', amount: '1.0', feePercent: '100' }],
  [{ to: 'bob_address', amount: '1.0', memo: 'payment' }],
  '$BTC+1234',  // contractId required
  { 
    baseFeeId: '$ETH+5678',    // Use ETH for base fees (auto-calculated amount)
    contractFeeId: '$ZRA+0000' // Use ZRA for contract fees (auto-calculated amount)
  },
  'base memo'
);

// Mix manual and automatic fees
const coinTxnMixed = await createCoinTXN(
  [{ privateKey: 'alice_private_key', publicKey: 'alice_public_key', amount: '1.0', feePercent: '100' }],
  [{ to: 'bob_address', amount: '1.0', memo: 'payment' }],
  '$BTC+1234',  // contractId required
  { 
    baseFeeId: '$ZRA+0000',
    baseFee: '0.001',          // Manual base fee amount
    contractFeeId: '$ETH+5678' // Auto-calculated contract fee in ETH
  },
  'base memo'
);
```

### sendCoinTXN(coinTxn, grpcConfig?)
- `coinTxn`: A CoinTXN protobuf message or a plain object matching the schema
- `grpcConfig`: **Parameter-based configuration (no environment variables needed)**
  - `endpoint`: `'http://host:port'` or `'host:port'` (overrides host/port if provided)
  - `host` (default `'routing.zerascan.io'`)
  - `port` (default `50052`)
  - `protocol` (default `'http'`)
  - `nodeOptions`: optional Node HTTP/2 connect options (TLS, CA, etc.)

Notes:
- **All configuration is parameter-based** - no environment variables required
- If you call `sendCoinTXN`, you need the Connect runtime installed at runtime:
  - `@connectrpc/connect`
  - `@connectrpc/connect-node`
- The module uses dynamic imports so simply importing this file won't require those dependencies until you actually call `sendCoinTXN`.

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
