# Transfer Module

Modern transfer functionality using actual generated protobuf classes.
## Features

- **Real Protobuf Classes**: Uses actual generated protobuf message instances
- **Direct Property Access**: Access protobuf fields directly as properties
- **Binary Serialization**: Real protobuf binary format using @bufbuild/protobuf
- **Type Safety**: Built-in protobuf validation and type checking
- **Universal Patterns**: Supports 1-1, 1-M, and M-M transfer patterns
- **Complete Transactions**: Create full `CoinTXN` structures

## Usage

### Single Transfer (1-1)
```javascript
import { transfer } from './transfer.js';

const feeConfig = { baseFeeId: '$ZRA+0000' };
const t = transfer('alice', 'bob', '1.0', feeConfig, 'payment memo');
console.log(t.amount); // "1000000000" (smallest units)
console.log(t.contractId); // "$ZRA+0000"
console.log(t.$typeName); // "zera_txn.Transfer"
console.log(t.memo); // "payment memo"
```

### Multiple Transfers (1-M)
```javascript
const feeConfig = { baseFeeId: '$ZRA+0000' };
const transfers = transfer('alice', ['bob', 'charlie'], ['0.5', '0.3'], feeConfig, ['payment1', 'payment2']);
// Returns array of protobuf Transfer instances

transfers.forEach(t => {
  console.log(t.amount); // "500000000", "300000000" (smallest units)
  console.log(t.recipientAddress); // Uint8Array
  console.log(t.$typeName); // "zera_txn.Transfer"
});
```

### Complete Transaction Structure
```javascript
import { createCoinTXN } from './transfer.js';

const feeConfig = { baseFeeId: '$ZRA+0000' };
const inputs = [{from: 'alice', amount: '1.0', feePercent: '100'}];
const outputs = [{to: 'bob', amount: '1.0', memo: 'payment'}];
const coinTxn = createCoinTXN(inputs, outputs, feeConfig);
console.log(coinTxn.inputTransfers); // Array of InputTransfers
console.log(coinTxn.outputTransfers); // Array of OutputTransfers
console.log(coinTxn.$typeName); // "zera_txn.CoinTXN"
```

## API Reference

### `transfer(from, to, amount, feeConfig?, transferMemo?)`

Creates actual protobuf Transfer message instances.

**Parameters:**
- `from` (string|Array): Sender address(es)
- `to` (string|Array): Recipient address(es)  
- `amount` (Decimal|string|number|Array): Transfer amount(s) in user-friendly format
- `feeConfig` (Object): Fee configuration object
  - `baseFeeId` (string): Base fee instrument ID (required, default: '$ZRA+0000')
  - `contractFeeId` (string): Contract fee instrument ID (optional, defaults to baseFeeId)
  - `baseFee` (string): Base fee amount (optional)
  - `contractFee` (string): Contract fee amount (optional)
- `transferMemo` (string|Array): Transfer-specific memo(s) (optional)

**Returns:**
- Single protobuf Transfer instance or array of instances

### `createCoinTXN(inputs, outputs, feeConfig?, baseMemo?)`

Creates a complete `CoinTXN` with proper input/output transfers.

**Parameters:**
- `inputs` (Array): Array of input objects `{from: string, amount: Decimal|string|number, feePercent?: string}`
- `outputs` (Array): Array of output objects `{to: string, amount: Decimal|string|number, memo?: string}`
- `feeConfig` (Object): Fee configuration object
  - `baseFeeId` (string): Base fee instrument ID (required, default: '$ZRA+0000')
  - `contractFeeId` (string): Contract fee instrument ID (optional, defaults to baseFeeId)
  - `contractFee` (string): Contract fee amount (optional)
- `baseMemo` (string): Base memo for the transaction (optional)

**Returns:**
- Complete protobuf CoinTXN instance

## Protobuf Message Properties

All transfer instances provide direct property access to protobuf fields:

```javascript
import { transfer } from './transfer.js';
import { toJson, toBinary } from '@bufbuild/protobuf';

const feeConfig = { baseFeeId: '$ZRA+0000' };
const t = transfer('alice', 'bob', '1.0', feeConfig, 'payment memo');

// Direct property access
t.amount                        // string: "1000000000" (smallest units)
t.contractId                   // string: "$ZRA+0000"
t.recipientAddress             // Uint8Array: converted from "bob"
t.memo                         // string: "payment memo"
t.$typeName                    // string: "zera_txn.Transfer"

// JSON conversion
const obj = toJson(Transfer, t); // Plain object

// Binary serialization
const binary = toBinary(Transfer, t); // Uint8Array
```

## Transfer Patterns

### 1-1 Pattern
Single sender to single receiver:
```javascript
const t = transfer('alice', 'bob', 100);
// Returns: protobuf Transfer instance
```

### 1-M Pattern  
One sender to multiple receivers:
```javascript
const transfers = transfer('alice', ['bob', 'charlie'], [50, 30]);
// Returns: [protobuf Transfer, protobuf Transfer]
```

### M-M Pattern
Multiple senders to multiple receivers:
```javascript
const transfers = transfer(['alice', 'charlie'], ['bob', 'dave'], [50, 30]);
// Returns: [protobuf Transfer, protobuf Transfer]
```

## Benefits of Protobuf Integration

1. **Real Protobuf**: Uses actual generated classes, not custom implementations
2. **Type Safety**: Built-in validation and type checking
3. **Performance**: Optimized binary format
4. **Compatibility**: Standard protobuf format works across languages
5. **Structured Data**: Direct access to protobuf fields as properties
6. **Modern Tooling**: Uses @bufbuild/protobuf for modern JavaScript protobuf support

## Error Handling

The functions throw `Error('Invalid transfer parameters')` for invalid input combinations.