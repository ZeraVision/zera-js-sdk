# Zera JavaScript SDK

This repository contains the Zera JavaScript SDK with Protocol Buffer definitions.

## Project Structure

```
zera-js-sdk/
├── proto/              # Protocol Buffer definitions and build tools
│   ├── txn.proto      # Main transaction definitions
│   ├── package.json   # Protobuf dependencies and scripts
│   ├── build.js       # Build automation script
│   ├── example.js     # Usage examples
│   ├── README.md      # Protobuf-specific documentation
│   └── generated/     # Generated JavaScript files (after building)
├── ...
└── README.md           # This file
```

## Quick Start

### 1. Install Protocol Buffers Compiler (protoc)

**Windows:**
- Download from [Google's official releases](https://github.com/protocolbuffers/protobuf/releases)
- Extract and add to PATH, or use Chocolatey: `choco install protoc`

**macOS:**
```bash
brew install protobuf
```

**Linux:**
```bash
sudo apt-get install protobuf-compiler
```

### 2. Build Protocol Buffers

```bash
# Install protobuf dependencies
npm run proto:install

# Build JavaScript files
npm run build:proto

# Run examples
npm run proto:example
```

## Available Scripts

- `npm run build:proto` - Build JavaScript protobuf files
- `npm run build:proto:js` - Build JavaScript only
- `npm run build:proto:ts` - Build JavaScript + TypeScript
- `npm run build:proto:grpc` - Build JavaScript + gRPC-Web
- `npm run proto:install` - Install protobuf dependencies
- `npm run proto:clean` - Clean generated files
- `npm run proto:example` - Run usage examples

## Usage

After building, you can import the generated protobuf classes:

```javascript
// From the root project
const { CoinTXN, BaseTXN, PublicKey } = require('./proto/generated');

// Or from within the proto folder
const { CoinTXN, BaseTXN, PublicKey } = require('./generated');
```

## Example

```javascript
const { CoinTXN, BaseTXN, PublicKey } = require('./proto/generated');

// Create a new transaction
const baseTxn = new BaseTXN();
baseTxn.setFeeAmount("1000000");
baseTxn.setFeeId("ZERA");

const coinTxn = new CoinTXN();
coinTxn.setBase(baseTxn);
coinTxn.setContractId("contract123");

// Serialize to binary
const binary = coinTxn.serializeBinary();
```

## Detailed Documentation

For detailed protobuf build instructions, examples, and troubleshooting, see:
- [Proto Folder README](./proto/README.md) - Complete protobuf documentation
- [Proto Example](./proto/example.js) - Usage examples

## License

MIT License - see LICENSE file for details.
