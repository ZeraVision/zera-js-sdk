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
import { transfer, serializeTransfer } from './transfer.js';

const t = transfer('alice', 'bob', 100);
console.log(t.amount); // "100"
console.log(t.contractId); // "$ZRA+0000"
console.log(t.$typeName); // "zera_txn.Transfer"

// Real protobuf binary serialization
const binary = serializeTransfer(t);
console.log(binary); // Uint8Array (real protobuf binary)
```

### Multiple Transfers (1-M)
```javascript
const transfers = transfer('alice', ['bob', 'charlie'], [50, 30]);
// Returns array of protobuf Transfer instances

transfers.forEach(t => {
  console.log(t.amount); // "50", "30"
  console.log(t.recipientAddress); // Uint8Array
  console.log(t.$typeName); // "zera_txn.Transfer"
});
```

### Complete Transaction Structure
```javascript
import { createCoinTXN } from './transfer.js';

const coinTxn = createCoinTXN('alice', 'bob', 100);
console.log(coinTxn.inputTransfers); // Array of InputTransfers
console.log(coinTxn.outputTransfers); // Array of OutputTransfers
console.log(coinTxn.$typeName); // "zera_txn.CoinTXN"
```

### Binary Serialization/Deserialization
```javascript
import { transfer, serializeTransfer, deserializeTransfer } from './transfer.js';
import { toJson } from '@bufbuild/protobuf';

const t = transfer('alice', 'bob', 100);

// Serialize to binary
const binary = serializeTransfer(t);

// Deserialize from binary
const deserialized = deserializeTransfer(binary);
console.log(deserialized.amount); // "100"

// Convert to JSON
const json = toJson(Transfer, t);
console.log(json); // Plain object
```

## API Reference

### `transfer(from, to, amount, feeId?, baseMemo?, transferMemo?)`

Creates actual protobuf Transfer message instances.

**Parameters:**
- `from` (string|Array): Sender address(es)
- `to` (string|Array): Recipient address(es)  
- `amount` (number|Array): Transfer amount(s)
- `feeId` (string): Fee instrument ID (default: '$ZRA+0000')
- `baseMemo` (string): Base memo (optional)
- `transferMemo` (string|Array): Transfer-specific memo(s) (optional)

**Returns:**
- Single protobuf Transfer instance or array of instances

### `createCoinTXN(from, to, amount, feeId?, baseMemo?, transferMemo?)`

Creates a complete `CoinTXN` with proper input/output transfers.

**Returns:**
- protobuf CoinTXN instance

### `serializeTransfer(transfer)`

Serializes transfer(s) to real protobuf binary format.

**Parameters:**
- `transfer` (Transfer|Array): Transfer instance(s)

**Returns:**
- `Uint8Array` or array of `Uint8Array`

### `deserializeTransfer(binaryData)`

Deserializes binary data back to Transfer instances.

**Parameters:**
- `binaryData` (Uint8Array|Array): Binary data

**Returns:**
- protobuf Transfer instance or array of instances

## Protobuf Message Properties

All transfer instances provide direct property access to protobuf fields:

```javascript
import { transfer } from './transfer.js';
import { toJson, toBinary } from '@bufbuild/protobuf';

const t = transfer('alice', 'bob', 100);

// Direct property access
t.amount                        // string: "100"
t.contractId                   // string: "$ZRA+0000"
t.recipientAddress             // Uint8Array: converted from "bob"
t.memo                         // string: transfer memo
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