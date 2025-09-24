# API Services - Complete Structure

## 🏗️ **Folder Organization**

```
src/api/
├── validator/
│   └── nonce/
│       ├── service.js          # Nonce service implementation
│       ├── examples.js         # 5 examples
│       └── index.js            # Clean exports
├── zv-indexer/
│   ├── nonce/
│   │   ├── service.js          # ZV-Indexer nonce service
│   │   ├── examples.js         # 5 examples
│   │   └── index.js            # Clean exports
│   ├── rate/
│   │   ├── service.js          # ACE exchange rate service
│   │   ├── examples.js         # 5 examples
│   │   └── index.js            # Clean exports
│   └── README.md               # ZV-Indexer documentation
├── test/
│   └── index.js                # Complete API test suite
├── examples/
│   └── index.js                # Complete API examples showcase
├── test-api.js                 # Legacy test file
└── README.md                   # This file
```

## 🎯 **Service Overview**

### **Validator Nonce Service** (`src/api/validator/nonce/`)
- **Purpose**: gRPC-based nonce retrieval from ZERA validator
- **Port**: 50053
- **Features**: Decimal precision, +1 increment, error handling
- **Files**: `service.js`, `examples.js`, `index.js`

### **ZV-Indexer Nonce Service** (`src/api/zv-indexer/nonce/`)
- **Purpose**: HTTP API-based nonce retrieval from ZV-Indexer
- **Protocol**: HTTP/HTTPS
- **Features**: Batch requests, API key auth, timeout handling
- **Files**: `service.js`, `examples.js`, `index.js`

### **ACE Exchange Rate Service** (`src/api/zv-indexer/rate/`)
- **Purpose**: Exchange rate fetching and currency conversion
- **Protocol**: HTTP/HTTPS
- **Features**: Caching, fallback rates, minimum rate safeguards
- **Files**: `service.js`, `examples.js`, `index.js`

## 📦 **Usage**

### **Import Services**
```javascript
// Validator nonce service
import { getNonce, getNonces } from './api/validator/nonce/index.js';

// ZV-Indexer nonce service
import { createZVIndexerNonceService } from './api/zv-indexer/nonce/index.js';

// ACE exchange rate service
import { getExchangeRate, convertUSDToCurrency } from './api/zv-indexer/rate/index.js';
```

### **Run Examples**
```bash
# Individual service examples
node src/api/validator/nonce/examples.js
node src/api/zv-indexer/nonce/examples.js
node src/api/zv-indexer/rate/examples.js

# Complete examples showcase
node src/api/examples/index.js
```

### **Run Tests**
```bash
# Complete API test suite
node src/api/test/index.js
```

## 🔧 **Service Details**

### **Validator Nonce Service**
```javascript
import { getNonces } from './api/validator/nonce/index.js';

const nonces = await getNonces(addresses, {
  host: 'localhost',
  port: 50053,
  protocol: 'http'
});
// Returns: Array<Decimal> with +1 increment
```

### **ZV-Indexer Nonce Service**
```javascript
import { createZVIndexerNonceService } from './api/zv-indexer/nonce/index.js';

const service = createZVIndexerNonceService({
  baseUrl: 'https://api.zerascan.io/v1',
  apiKey: 'your-api-key',
  timeout: 10000
});

const nonces = await service.getNonces(addresses);
// Returns: Array<Decimal> with +1 increment
```

### **ACE Exchange Rate Service**
```javascript
import { getExchangeRate, convertUSDToCurrency } from './api/zv-indexer/rate/index.js';

const rate = await getExchangeRate('$ZRA+0000');
const currencyAmount = await convertUSDToCurrency(10.50, '$ZRA+0000');
// Returns: Decimal objects
```

## 🧪 **Testing**

### **Individual Service Tests**
Each service has 5 tests using **real test wallet data**:
1. **Basic Functionality** - Simple service calls with Alice's address
2. **Input Validation** - Invalid inputs and edge cases
3. **Error Handling** - Network errors and timeouts
4. **Performance** - Caching and optimization with test addresses
5. **Edge Cases** - Real-world usage patterns

### **Complete Test Suite**
```bash
node src/api/test/index.js
```
Runs all service tests and provides results.

## 📚 **Examples**

### **Complete Examples Showcase**
```bash
node src/api/examples/index.js
```
Runs all service examples and provides results.

### **Individual Service Examples**
Each service has detailed examples showing:
- Basic usage patterns with **Alice, Bob, and Charlie's test addresses**
- Additional configuration with **test wallet data**
- Error handling strategies
- Performance optimization
- Real-world integration with **test transaction creation**

## 🎯 **Benefits**

### **✅ Maximum Organization**
- **Clear hierarchy**: Provider → Function → Implementation
- **Easy navigation**: Know exactly where to find anything
- **Scalable**: Easy to add new services/functions

### **✅ Testing**
- **5 examples per service**: Basic, additional, error handling, etc.
- **Complete test suite**: All services tested together
- **Real-world patterns**: Actual implementation examples

### **✅ Clean Imports**
- **Single import point**: Each service has one index.js
- **No confusion**: Clear what each import provides
- **Consistent patterns**: Same structure everywhere

### **✅ Easy Maintenance**
- **Single responsibility**: Each file has one clear purpose
- **Isolated changes**: Modify one service without affecting others
- **Clear dependencies**: Easy to see what depends on what

## 🚀 **Getting Started**

1. **Choose your service**: Validator (gRPC) or ZV-Indexer (HTTP)
2. **Import the service**: Use the clean index.js imports
3. **Run examples**: See how to use each service
4. **Run tests**: Verify everything works correctly
5. **Integrate**: Use in your application

Your API is now **super structured** with maximum organization! 🎉