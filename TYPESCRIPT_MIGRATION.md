# ZERA JavaScript SDK - TypeScript Migration

## 🎉 TypeScript Migration Complete!

The ZERA JavaScript SDK has been successfully migrated to TypeScript, providing:

- **Full type safety** throughout the entire codebase
- **Enhanced developer experience** with IntelliSense and autocomplete
- **Better error detection** at compile time
- **Comprehensive type definitions** for all APIs
- **Backward compatibility** with existing JavaScript code

## 📦 What's New

### TypeScript Configuration
- `tsconfig.json` - Main TypeScript configuration
- `tsconfig.test.json` - Test-specific configuration
- `tsconfig.esm.json` - ESM module generation configuration

### Type Definitions
- `src/types/index.ts` - Core type definitions and interfaces
- Comprehensive type coverage for all modules
- Type guards and validation utilities

### Build System
- `scripts/build.ts` - Advanced TypeScript build script
- `scripts/test-ts.ts` - TypeScript test runner
- Automatic declaration file generation
- Source map generation for debugging

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Building
```bash
# Full build (TypeScript compilation + ESM generation)
npm run build

# Type checking only
npm run type-check

# Clean build directory
npm run build:clean

# Watch mode for development
npm run build:watch
```

### Testing
```bash
# Run TypeScript tests
npm run test:ts

# Run all tests (TypeScript + JavaScript)
npm run test:ts:all

# Run JavaScript tests only
npm run test:ts:js
```

## 📁 Project Structure

```
src/
├── types/
│   └── index.ts              # Core type definitions
├── wallet-creation/
│   ├── constants.ts          # TypeScript constants
│   ├── errors.ts            # TypeScript error classes
│   ├── wallet-factory.ts    # TypeScript wallet factory
│   ├── index.ts             # TypeScript main entry
│   └── tests/
│       └── test-wallet-simple.ts  # TypeScript tests
├── coin-txn/
│   ├── transaction.ts       # TypeScript transaction module
│   └── index.ts             # TypeScript main entry
├── grpc/
│   ├── generic-grpc-client.ts  # TypeScript gRPC client
│   └── index.ts             # TypeScript main entry
└── shared/
    ├── protobuf-enums.ts    # TypeScript protobuf enums
    └── utils/
        ├── amount-utils.ts  # TypeScript amount utilities
        └── token-config.ts  # TypeScript token configuration
```

## 🔧 TypeScript Features

### Type Safety
```typescript
import { createWallet, KEY_TYPE, HASH_TYPE } from 'zera-js-sdk';

// Fully typed wallet creation
const wallet = await createWallet({
  keyType: KEY_TYPE.ED25519,        // ✅ Type-safe enum
  hashTypes: [HASH_TYPE.SHA3_256], // ✅ Type-safe array
  mnemonic: 'your mnemonic here'    // ✅ Type-safe string
});

// Type-safe wallet properties
console.log(wallet.address);        // ✅ string
console.log(wallet.keyType);       // ✅ KeyType
console.log(wallet.hashTypes);     // ✅ HashType[]
```

### Interface Definitions
```typescript
import type { WalletOptions, Wallet, CoinTXNInput } from 'zera-js-sdk';

// Type-safe function parameters
function processWallet(options: WalletOptions): Promise<Wallet> {
  // Implementation with full type safety
}

// Type-safe transaction inputs
const inputs: CoinTXNInput[] = [
  {
    privateKey: 'base58key',
    publicKey: 'base58key',
    amount: '100.5',           // ✅ AmountInput type
    feePercent: '100'          // ✅ Optional string
  }
];
```

### Type Guards
```typescript
import { isValidKeyType, isValidHashType } from 'zera-js-sdk';

// Runtime type validation
if (isValidKeyType(userInput)) {
  // userInput is now typed as KeyType
  const wallet = await createWallet({
    keyType: userInput,  // ✅ Type-safe
    // ...
  });
}
```

## 🌐 Compatibility

### JavaScript Compatibility
The TypeScript SDK is fully compatible with existing JavaScript code:

```javascript
// Existing JavaScript code works unchanged
const { createWallet, KEY_TYPE, HASH_TYPE } = require('zera-js-sdk');

const wallet = await createWallet({
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.SHA3_256],
  mnemonic: 'your mnemonic here'
});
```

### Module Systems
- **CommonJS**: `require('zera-js-sdk')`
- **ES Modules**: `import { createWallet } from 'zera-js-sdk'`
- **TypeScript**: Full type definitions included

### Platform Support
- ✅ **Node.js** (v18+)
- ✅ **Web browsers** (modern browsers)
- ✅ **React Native** (with proper configuration)
- ✅ **Deno** (with proper configuration)
- ✅ **Bun** (with proper configuration)

## 🔍 Type Definitions

### Core Types
```typescript
// Wallet types
type KeyType = 'ed25519' | 'ed448';
type HashType = 'sha3-256' | 'sha3-512' | 'blake3';
type MnemonicLength = 12 | 15 | 18 | 21 | 24;

// Transaction types
interface CoinTXNInput {
  privateKey: string;
  publicKey: string;
  amount: AmountInput;
  feePercent?: string;
  keyType?: KeyType;
  allowanceAddress?: string;
}

// Configuration types
interface WalletOptions {
  keyType: KeyType;
  hashTypes: HashType[];
  mnemonic: string;
  passphrase?: string;
  hdOptions?: HDOptions;
}
```

### Utility Types
```typescript
// Amount handling
type AmountInput = string | number | Decimal;

// Address types
type Base58Address = string;
type Base58Key = string;

// Contract types
type ContractId = string; // Format: $SYMBOL+XXXX
```

## 🛠️ Development

### Adding New Types
1. Add type definitions to `src/types/index.ts`
2. Export types from module index files
3. Update main `index.ts` exports

### Type Safety Best Practices
- Use type guards for runtime validation
- Prefer interfaces over type aliases for objects
- Use const assertions for immutable data
- Leverage TypeScript's strict mode settings

### Testing Types
```typescript
// Test type safety
import type { Wallet } from 'zera-js-sdk';

function testWalletType(wallet: Wallet): void {
  // TypeScript will catch type errors at compile time
  console.log(wallet.address);     // ✅ string
  console.log(wallet.keyType);      // ✅ KeyType
  console.log(wallet.hashTypes);    // ✅ HashType[]
}
```

## 📚 Migration Guide

### From JavaScript to TypeScript
1. **Install TypeScript**: `npm install -D typescript @types/node`
2. **Add type annotations**: Gradually add types to existing code
3. **Use type definitions**: Import types from the SDK
4. **Enable strict mode**: Use strict TypeScript configuration

### Gradual Migration
```typescript
// Step 1: Add basic types
const wallet = await createWallet({
  keyType: KEY_TYPE.ED25519 as const,
  hashTypes: [HASH_TYPE.SHA3_256] as const,
  mnemonic: 'your mnemonic here'
});

// Step 2: Use type definitions
import type { WalletOptions } from 'zera-js-sdk';
const options: WalletOptions = {
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.SHA3_256],
  mnemonic: 'your mnemonic here'
};

// Step 3: Full type safety
const wallet = await createWallet(options);
```

## 🎯 Benefits

### For Developers
- **IntelliSense**: Auto-completion and documentation
- **Error Prevention**: Catch errors at compile time
- **Refactoring**: Safe code refactoring with type checking
- **Documentation**: Types serve as living documentation

### For Teams
- **Consistency**: Enforced coding standards
- **Maintainability**: Easier to understand and modify code
- **Collaboration**: Clear interfaces between modules
- **Quality**: Reduced runtime errors

### For Production
- **Reliability**: Type-safe operations
- **Performance**: No runtime type checking overhead
- **Debugging**: Better error messages and stack traces
- **Monitoring**: Type-safe logging and metrics

## 🔮 Future Enhancements

- **Advanced Type Inference**: More sophisticated type inference
- **Generic Types**: Reusable type patterns
- **Conditional Types**: Advanced type manipulation
- **Template Literal Types**: String-based type patterns
- **Branded Types**: Distinguish between similar types

## 📖 Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [ZERA SDK Documentation](./README.md)
- [API Reference](./docs/api-reference.md)

## 🤝 Contributing

When contributing to the TypeScript codebase:

1. **Follow TypeScript best practices**
2. **Add comprehensive type definitions**
3. **Include type tests where appropriate**
4. **Update documentation for new types**
5. **Ensure backward compatibility**

---

**The ZERA JavaScript SDK is now a fully TypeScript-first SDK while maintaining complete backward compatibility with JavaScript!** 🎉
