# Zera Protocol Buffers

This folder contains all Protocol Buffer definitions and build tools for the Zera JavaScript SDK.

## Structure

```
proto/
├── txn.proto           # Main transaction definitions
├── package.json        # Dependencies and build scripts
├── build.js           # Build automation script
├── README.md          # This file
└── generated/         # Generated JavaScript files (after building)
    ├── txn_pb.js     # Main protobuf classes
    └── index.js      # Auto-generated index for easy importing
```

## Prerequisites

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
# or
sudo yum install protobuf-compiler
```

### 2. Install Node.js Dependencies

```bash
cd proto
npm install
```

## Building Protocol Buffers

### Quick Build

```bash
cd proto
npm run build
```

### Manual Build

```bash
cd proto

# Generate JavaScript files
protoc --js_out=./generated --js_opt=import_style=commonjs *.proto

# Generate TypeScript definitions (if using TypeScript)
protoc --js_out=./generated --js_opt=import_style=commonjs --ts_out=./generated *.proto

# Generate gRPC-Web files
protoc --js_out=./generated --grpc-web_out=./generated --plugin=protoc-gen-grpc-web=./node_modules/.bin/protoc-gen-grpc-web *.proto
```

### Using the Build Script

```bash
cd proto
node build.js
```

## Generated Files

After building, the following files will be generated in the `generated/` directory:

- `txn_pb.js` - Main protobuf message classes
- `index.js` - Auto-generated index for easy importing
- `txn_grpc_web_pb.js` - gRPC-Web service definitions (if using gRPC-Web)

## Usage

### From the proto folder

```javascript
const { CoinTXN, BaseTXN, PublicKey } = require('./generated');
```

### From the root project

```javascript
const { CoinTXN, BaseTXN, PublicKey } = require('./proto/generated');
```

## Example Usage

```javascript
const { CoinTXN, BaseTXN, PublicKey } = require('./generated');

// Create a new transaction
const baseTxn = new BaseTXN();
baseTxn.setFeeAmount("1000000");
baseTxn.setFeeId("ZERA");

const coinTxn = new CoinTXN();
coinTxn.setBase(baseTxn);
coinTxn.setContractId("contract123");

// Serialize to binary
const binary = coinTxn.serializeBinary();

// Deserialize from binary
const deserialized = CoinTXN.deserializeBinary(binary);
```

## Build Options

- `--js_out=./generated`: Output directory for JavaScript files
- `--js_opt=import_style=commonjs`: Use CommonJS import style (recommended for Node.js)
- `--grpc-web_out=./generated`: Output directory for gRPC-Web files
- `--ts_out=./generated`: Output directory for TypeScript definitions

## Clean Build

To clean generated files and rebuild:

```bash
cd proto
npm run clean
npm run build
```

## Troubleshooting

### Common Issues

1. **protoc not found**: Ensure protoc is installed and in your PATH
2. **Import errors**: Make sure you're using the correct import path
3. **Missing dependencies**: Run `npm install` in the proto folder
4. **Permission errors**: Ensure you have write permissions in the proto folder

### Build Verification

After building, verify that:
- `generated/` folder exists
- `txn_pb.js` file is present
- `index.js` file is created
- No build errors in console output
