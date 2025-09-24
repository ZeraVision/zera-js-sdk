# ZERA Wallet Storage Guide

Complete guide for storing and unpacking ZERA wallet data with secure storage, address book management, and CRUD operations for both web and React Native applications.

## Quick Answer: Store the Entire Object!

The wallet object returned by `createWallet()` is a plain JavaScript object, so you can store and unpack it directly for use elsewhere in this SDK.

## 🛡️ Security Recommendations (IMPORTANT!)

### ✅ **RECOMMENDED SECURE APPROACH:**
```javascript
// 🛡️ PRODUCTION APPS: Use OS Native Keychain (iOS Keychain + Android Keystore)
const storageManager = new EnhancedWalletStorageManager('keychain'); // 🔒 SECURE

// 🔐 MAXIMUM SECURITY: OS Keychain + Biometric Authentication
const storageManager = new EnhancedWalletStorageManager('secureStorage'); // 🔐 MAXIMUM SECURITY
```

**Why OS Native Keychain?**
- ✅ **Hardware-backed encryption** - Uses device's secure hardware
- ✅ **OS-level security** - Encrypted by iOS/Android, not your app
- ✅ **Device unlock required** - Data encrypted until device unlocked
- ✅ **App-specific access** - Only your app can access the data
- ✅ **Biometric integration** - TouchID/FaceID/Fingerprint support

### ⚠️ **NEVER USE FOR PRODUCTION:**
```javascript
// These are NOT SECURE - only for development/testing
const storageManager = new EnhancedWalletStorageManager('memory'); // ⚠️ NOT SECURE
const storageManager = new EnhancedWalletStorageManager('localStorage'); // ⚠️ NOT SECURE  
const storageManager = new EnhancedWalletStorageManager('file'); // ⚠️ NOT SECURE
const storageManager = new EnhancedWalletStorageManager('asyncStorage'); // ⚠️ NOT SECURE
```

**Always use secure storage backends (`keychain`, `secureStorage`, `expoSecureStore`) for production applications!**

## 🔐 Secure Wallet Storage (Sensitive Data)

### Full Wallet Storage with Private Keys

For storing complete wallet objects with private keys (sensitive data):

```javascript
import { EnhancedWalletStorageManager } from './wallet-storage-manager.js';

const storageManager = new EnhancedWalletStorageManager('keychain'); // Use secure storage

// Create and store wallet with private keys
const wallet = await storageManager.createWallet({
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.BLAKE3],
  mnemonic: "your mnemonic here...",
  hdOptions: { addressIndex: 0 }
}, 'My Primary Wallet');

// Store complete wallet (includes private keys)
await storageManager.storeWalletByAddress(wallet);

// Retrieve complete wallet for signing transactions
const retrievedWallet = await storageManager.getWalletByAddress(wallet.address);
console.log('Private key available:', !!retrievedWallet.privateKey);
console.log('Address:', retrievedWallet.address);
```

### CRUD Operations for Sensitive Wallets

```javascript
// Create multiple wallets
const wallets = [];
for (let i = 0; i < 3; i++) {
  const wallet = await storageManager.createWallet({
    keyType: KEY_TYPE.ED25519,
    hashTypes: [HASH_TYPE.BLAKE3],
    mnemonic: "your mnemonic here...",
    hdOptions: { addressIndex: i }
  }, `Wallet ${i + 1}`);
  wallets.push(wallet);
}

// Read wallet by address
const wallet = await storageManager.readWallet(wallets[0].address);

// Update wallet
const updatedWallet = { ...wallet, lastUsed: new Date().toISOString() };
await storageManager.updateWallet(wallet.address, updatedWallet);

// Delete specific wallet
await storageManager.deleteWallet(wallets[1].address);

// Delete all wallets
const deletedCount = await storageManager.deleteAllWallets();
console.log(`Deleted ${deletedCount} wallets`);

// Get wallet count
const count = await storageManager.getWalletCount();
console.log(`Total wallets: ${count}`);
```

## 📋 Address Book / Contact Management (Public Data)

### Add and Remove Addresses with Profile Names

```javascript
// Add external addresses to your address book
await storageManager.addToAddressBook('AliceAddress123', 'Alice\'s Wallet', null);
await storageManager.addToAddressBook('BobAddress456', 'Bob\'s Trading Account', null);
await storageManager.addToAddressBook('ExchangeAddress789', 'Binance Deposit', null);

// Add your own wallet to address book (with full wallet data)
const myWallet = await storageManager.createWallet({
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.BLAKE3],
  mnemonic: "your mnemonic here...",
  hdOptions: { addressIndex: 0 }
}, 'My Primary Wallet'); // Automatically added to address book

// Remove addresses from address book
await storageManager.removeFromAddressBook('AliceAddress123');
await storageManager.removeFromAddressBook('ExchangeAddress789');
```

### Retrieve All Addresses and Profiles

```javascript
// Get complete address book
const addressBook = await storageManager.getAddressBook();
console.log(`Address book contains ${addressBook.length} entries:`);

addressBook.forEach((entry, index) => {
  const type = entry.isOwnWallet ? 'Own Wallet' : 'External Contact';
  console.log(`${index + 1}. ${entry.profileName} (${type})`);
  console.log(`   Address: ${entry.address}`);
  console.log(`   Added: ${entry.createdAt}`);
});

// Get only your own wallets
const ownWallets = await storageManager.getOwnWallets();
console.log(`Your wallets: ${ownWallets.length}`);

// Get only external contacts
const externalContacts = await storageManager.getExternalAddresses();
console.log(`External contacts: ${externalContacts.length}`);

// Search address book
const searchResults = await storageManager.searchAddressBook('Alice');
console.log(`Found ${searchResults.length} results for "Alice"`);

// Update profile information
await storageManager.updateAddressBookEntry('BobAddress456', {
  profileName: 'Bob\'s Updated Account',
  lastUsed: new Date().toISOString()
});
```

### Address-Only Storage (Public Data Only)

For storing only public address information (no private keys):

```javascript
// Store only public address data
await storageManager.storeAddressOnly(wallet);

// Get all stored addresses (public data only)
const allAddresses = await storageManager.getAllAddresses();
allAddresses.forEach(addr => {
  console.log(`Address: ${addr.address}`);
  console.log(`Type: ${addr.keyType}`);
  console.log(`Public Key: ${addr.publicKey}`);
  // No private key available
});
```


## 🔒 Storage Security Options

### ⚠️ Development/Testing Only (NOT SECURE)

#### 1. **Memory Storage** (Default)
```javascript
const storageManager = new EnhancedWalletStorageManager('memory');
```
**Security**: ⚠️ **NOT SECURE** - Data lost on restart, good for testing only

#### 2. **LocalStorage** (Browser)
```javascript
const storageManager = new EnhancedWalletStorageManager('localStorage');
```
**Security**: ⚠️ **NOT SECURE** - Data stored in plain text, persistent across sessions

#### 3. **File Storage** (Node.js)
```javascript
const storageManager = new EnhancedWalletStorageManager('file');
```
**Security**: ⚠️ **NOT SECURE** - Data stored in plain text files, persistent across restarts

### 🔒 Secure Storage (React Native)

#### 1. **react-native-keychain** (🔒 SECURE - OS Native Keychain - RECOMMENDED)
```bash
npm install react-native-keychain
```

```javascript
import * as Keychain from 'react-native-keychain';

// ✅ Store wallet in OS Native Keychain (iOS Keychain + Android Keystore)
const walletJSON = JSON.stringify(wallet);
await Keychain.setInternetCredentials('zera_wallet', 'wallet_data', walletJSON);

// ✅ Load wallet from OS Native Keychain (requires device unlock)
const credentials = await Keychain.getInternetCredentials('zera_wallet');
const wallet = JSON.parse(credentials.password);
```

**Security**: 🔒 **SECURE** - **OS Native Keychain** (iOS Keychain Services + Android Keystore)
- ✅ **Hardware-backed encryption** - Uses device's secure hardware
- ✅ **OS-level security** - Encrypted by iOS/Android, not your app
- ✅ **Device unlock required** - Data encrypted until device unlocked
- ✅ **App-specific access** - Only your app can access the data

#### 2. **react-native-secure-storage** (🔐 MAXIMUM SECURITY - Biometric Required)
```bash
npm install react-native-secure-storage
```

```javascript
import SecureStorage from 'react-native-secure-storage';

// Store wallet with biometric protection
const walletJSON = JSON.stringify(wallet);
await SecureStorage.setItem('zera_wallet', walletJSON, {
  touchID: true,
  showModal: true
});

// Load wallet with biometric authentication
const walletJSON = await SecureStorage.getItem('zera_wallet', {
  touchID: true,
  showModal: true
});
const wallet = JSON.parse(walletJSON);
```

**Security**: 🔐 **MAXIMUM SECURITY** - Biometric authentication required

#### 3. **expo-secure-store** (🔒 SECURE - Expo Compatible)
```bash
expo install expo-secure-store
```

```javascript
import * as SecureStore from 'expo-secure-store';

// Store wallet securely
const walletJSON = JSON.stringify(wallet);
await SecureStore.setItemAsync('zera_wallet', walletJSON, {
  requireAuthentication: true,
  authenticationPrompt: 'Authenticate to access your wallet'
});

// Load wallet securely
const walletJSON = await SecureStore.getItemAsync('zera_wallet', {
  requireAuthentication: true,
  authenticationPrompt: 'Authenticate to access your wallet'
});
const wallet = JSON.parse(walletJSON);
```

**Security**: 🔒 **SECURE** - Encrypted with optional biometric auth

### ⚠️ Development Only (NOT SECURE)

#### 4. **@react-native-async-storage/async-storage** (⚠️ NOT SECURE - Development Only)
```bash
npm install @react-native-async-storage/async-storage
```

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store wallet (NOT SECURE)
const walletJSON = JSON.stringify(wallet);
await AsyncStorage.setItem('zera_wallet', walletJSON);

// Load wallet (NOT SECURE)
const walletJSON = await AsyncStorage.getItem('zera_wallet');
const wallet = JSON.parse(walletJSON);
```

**Security**: ⚠️ **NOT SECURE** - Data stored in plain text (use for non-sensitive data only)

## React Native Enhanced Storage (🔒 SECURE - Recommended)

### 🛡️ **RECOMMENDED: OS Native Keychain Storage**

For React Native applications, use the **OS native keychain** for maximum security:

```javascript
import { EnhancedWalletStorageManager } from './wallet-storage-manager.js';

// ✅ RECOMMENDED: OS Native Keychain (iOS Keychain + Android Keystore)
const walletManager = new EnhancedWalletStorageManager('keychain');

// Create wallet with profile name
const wallet = await walletManager.createWallet({
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.BLAKE3],
  mnemonic: "your mnemonic here...",
  hdOptions: { addressIndex: 0 }
}, 'My Primary Wallet');

// Store by address (encrypted by OS)
await walletManager.storeWalletByAddress(wallet);

// Retrieve by address (requires device unlock)
const retrievedWallet = await walletManager.getWalletByAddress(wallet.address);
console.log('Retrieved wallet:', retrievedWallet.address);
console.log('Private key available:', !!retrievedWallet.privateKey);
```

### 🔐 **MAXIMUM SECURITY: Biometric Authentication**

For apps requiring biometric authentication:

```javascript
// 🔐 MAXIMUM SECURITY: Biometric + OS Keychain
const walletManager = new EnhancedWalletStorageManager('secureStorage');

// Same API - biometric authentication required for access
const wallet = await walletManager.createWallet({
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.BLAKE3],
  mnemonic: "your mnemonic here...",
  hdOptions: { addressIndex: 0 }
}, 'My Secure Wallet');
```

### 🔧 **Complete End-to-End OS Native Keychain Implementation**

Here's the complete implementation showing how the OS native keychain works:

#### **1. Install OS Native Keychain Library**
```bash
# Install the OS native keychain library
npm install react-native-keychain

# iOS: Add to Podfile (if using CocoaPods)
cd ios && pod install
```

#### **2. OS Native Keychain Backend Implementation**
```javascript
import * as Keychain from 'react-native-keychain';

// ✅ OS Native Keychain Storage Backend
class ReactNativeKeychainStorage {
  async setItem(key, value) {
    // Store wallet data encrypted by iOS Keychain/Android Keystore
    const walletJSON = JSON.stringify(value);
    await Keychain.setInternetCredentials(key, 'wallet_data', walletJSON);
    return true;
  }

  async getItem(key) {
    try {
      // Retrieve wallet data (requires device unlock)
      const credentials = await Keychain.getInternetCredentials(key);
      return credentials ? JSON.parse(credentials.password) : null;
    } catch {
      return null;
    }
  }

  async removeItem(key) {
    try {
      // Remove from OS keychain
      await Keychain.resetInternetCredentials(key);
      return true;
    } catch {
      return false;
    }
  }

  async hasItem(key) {
    try {
      const credentials = await Keychain.getInternetCredentials(key);
      return !!credentials;
    } catch {
      return false;
    }
  }

  async getAllKeys() {
    // Keychain doesn't support getAllKeys for security
    return [];
  }
}
```

#### **3. Complete End-to-End Example**
```javascript
import { EnhancedWalletStorageManager } from './wallet-storage-manager.js';

// ✅ STEP 1: Initialize with OS Native Keychain
const walletManager = new EnhancedWalletStorageManager('keychain');

// ✅ STEP 2: Create wallet (automatically stored in OS keychain)
const wallet = await walletManager.createWallet({
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.BLAKE3],
  mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
  hdOptions: { addressIndex: 0 }
}, 'My Primary Wallet');

console.log('✅ Wallet created and stored in OS keychain:', wallet.address);

// ✅ STEP 3: Store additional wallet data (encrypted by OS)
await walletManager.storeWalletByAddress(wallet);
console.log('✅ Wallet data encrypted and stored in OS keychain');

// ✅ STEP 4: Retrieve wallet (requires device unlock)
const retrievedWallet = await walletManager.getWalletByAddress(wallet.address);
console.log('✅ Wallet retrieved from OS keychain:', retrievedWallet.address);
console.log('✅ Private key available:', !!retrievedWallet.privateKey);

// ✅ STEP 5: Add to address book (also stored securely)
await walletManager.addToAddressBook('ExternalAddress123', 'Alice\'s Wallet', null);
const addressBook = await walletManager.getAddressBook();
console.log('✅ Address book stored securely:', addressBook.length, 'entries');

// ✅ STEP 6: Clean up (removes from OS keychain)
await walletManager.deleteWallet(wallet.address);
console.log('✅ Wallet removed from OS keychain');
```

#### **4. OS Native Keychain Security Features**

**iOS (iOS Keychain Services):**
- ✅ **Secure Enclave encryption** - Hardware-backed encryption
- ✅ **Device unlock required** - Data encrypted until device unlocked
- ✅ **App-specific access** - Only your app can access the data
- ✅ **Biometric integration** - TouchID/FaceID support

**Android (Android Keystore):**
- ✅ **Hardware-backed encryption** - Uses device's secure hardware
- ✅ **Device unlock required** - Data encrypted until device unlocked
- ✅ **App-specific access** - Only your app can access the data
- ✅ **Biometric integration** - Fingerprint/Face unlock support

## Practical Usage Examples

### Example 1: Wallet Management App (🔒 SECURE - Recommended)
```javascript
// Use secure storage for production apps
const walletManager = new EnhancedWalletStorageManager('keychain'); // 🔒 SECURE

// Create multiple wallets with profile names
const wallets = [];
for (let i = 0; i < 5; i++) {
  const wallet = await walletManager.createWallet({
    keyType: KEY_TYPE.ED25519,
    hashTypes: [HASH_TYPE.BLAKE3],
    mnemonic: generateWords(12),
    hdOptions: { addressIndex: i }
  }, `Wallet ${i + 1}`); // Automatically added to address book
  wallets.push(wallet);
}

// Display all addresses (public data only)
const addresses = await walletManager.getAllAddresses();
addresses.forEach(addr => {
  console.log(`Address: ${addr.address}`);
  console.log(`Type: ${addr.keyType}`);
});

// Get wallet for signing transaction
const signingWallet = await walletManager.readWallet(addresses[0].address);
console.log('Private key available:', !!signingWallet.privateKey);

// Get address book with profile names
const addressBook = await walletManager.getAddressBook();
console.log(`Address book contains ${addressBook.length} entries`);
```

### Example 2: Address Book (🔒 SECURE - Recommended)
```javascript
// Use secure storage for production apps
const walletManager = new EnhancedWalletStorageManager('keychain'); // 🔒 SECURE

// Store addresses for easy lookup
const addressBook = await walletManager.getAllAddresses();

// Search for specific wallet
const ed25519Wallets = await walletManager.searchWallets({ 
  keyType: 'ed25519' 
});

// Check if address exists before operations
const exists = await walletManager.walletExistsByAddress('some-address');
if (exists) {
  const wallet = await walletManager.readWallet('some-address');
  // Use wallet for operations
}
```

### Example 3: Cleanup Operations (🔒 SECURE - Recommended)
```javascript
// Use secure storage for production apps
const walletManager = new EnhancedWalletStorageManager('keychain'); // 🔒 SECURE

// Delete specific wallet
await walletManager.deleteWallet('unwanted-address');

// Delete all wallets (cleanup)
const deletedCount = await walletManager.deleteAllWallets();
console.log(`Cleaned up ${deletedCount} wallets`);

// Verify cleanup
const remainingCount = await walletManager.getWalletCount();
console.log(`Remaining wallets: ${remainingCount}`);
```

## Available Methods

### Address Book / Contact List
- ✅ `addToAddressBook(address, profileName, wallet)` - Add address with profile name
- ✅ `removeFromAddressBook(address)` - Remove from address book
- ✅ `getAddressBookEntry(address)` - Get specific address book entry
- ✅ `getAddressBook()` - Get all addresses in address book
- ✅ `updateAddressBookEntry(address, updates)` - Update address book entry
- ✅ `searchAddressBook(query)` - Search by profile name or address
- ✅ `getOwnWallets()` - Get only own wallets from address book
- ✅ `getExternalAddresses()` - Get only external addresses
- ✅ `clearAddressBook()` - Clear entire address book

### Address-Based Operations
- ✅ `storeWalletByAddress(wallet)` - Store using address as key
- ✅ `getWalletByAddress(address)` - Retrieve by address
- ✅ `walletExistsByAddress(address)` - Check if wallet exists
- ✅ `deleteWalletByAddress(address)` - Delete by address

### Address-Only Storage (Legacy)
- ✅ `storeAddressOnly(wallet)` - Store public data only
- ✅ `getAddressOnly(address)` - Get public data
- ✅ `getAllAddresses()` - Get all stored addresses

### Complete CRUD Operations
- ✅ `createWallet(options, profileName)` - Create and store with profile name
- ✅ `readWallet(address)` - Read by address
- ✅ `updateWallet(address, wallet)` - Update existing
- ✅ `deleteWallet(address)` - Delete specific
- ✅ `deleteAllWallets()` - Delete all

### Additional Features
- ✅ `getAllWallets()` - Get all wallets
- ✅ `getWalletCount()` - Count wallets
- ✅ `searchWallets(criteria)` - Search by criteria

## Security Recommendations

### ✅ **FOR PRODUCTION APPS (REQUIRED):**
1. **🛡️ Use OS Native Keychain** - `keychain` (iOS Keychain + Android Keystore)
2. **🔐 Enable biometric authentication** for maximum security (`secureStorage`)
3. **⚠️ NEVER store private keys in unsecure storage** - `memory`, `localStorage`, `file`, `asyncStorage`
4. **🛡️ Implement proper error handling** for storage operations
5. **🧹 Use secureClear() method** when done with wallet objects

### 🛡️ **OS Native Keychain Benefits:**
- ✅ **Hardware-backed encryption** - Uses device's secure hardware
- ✅ **OS-level security** - Encrypted by iOS/Android, not your app
- ✅ **Device unlock required** - Data encrypted until device unlocked
- ✅ **App-specific access** - Only your app can access the data
- ✅ **Biometric integration** - TouchID/FaceID/Fingerprint support

### ⚠️ **DEVELOPMENT/TESTING ONLY:**
- `memory` - Data lost on restart
- `localStorage` - Browser only, plain text
- `file` - Node.js only, plain text files
- `asyncStorage` - React Native only, plain text

### 🔐 **MAXIMUM SECURITY OPTIONS:**
1. **`secureStorage`** - Biometric authentication required (TouchID/FaceID)
2. **`keychain`** - OS-encrypted, requires device unlock
3. **`expoSecureStore`** - Expo-compatible secure storage

### Address-Only Storage Benefits:
- ✅ Safe to store in less secure locations
- ✅ Can be shared publicly
- ✅ Good for address books and public displays
- ✅ No risk of private key exposure

## Running the Examples

```bash
# Run the example
node src/wallet-creation/examples/wallet-storage-manager.js
```

## Summary

This storage solution provides:

### 🔐 Secure Wallet Storage
✅ **Full wallet storage** - Store complete wallet objects with private keys  
✅ **🛡️ OS Native Keychain** - iOS Keychain + Android Keystore (RECOMMENDED)  
✅ **🔐 Biometric authentication** - TouchID/FaceID/Fingerprint support  
✅ **Complete CRUD operations** - Create, Read, Update, Delete, Delete All  
✅ **Address-based retrieval** - Use actual wallet addresses as keys  

### 📋 Address Book Management  
✅ **Profile names** - Manage addresses with custom contact names  
✅ **Own vs external addresses** - Distinguish between your wallets and contacts  
✅ **Add/remove addresses** - Easy contact management  
✅ **Search and filtering** - Find addresses by name or address  
✅ **Public data storage** - Store address-only information safely  

### 🛡️ Security Features
✅ **Clear security indicators** - ⚠️ NOT SECURE, 🔒 SECURE, 🔐 MAXIMUM SECURITY  
✅ **ED25519 + BLAKE3 defaults** - Modern cryptographic standards  
✅ **Ready for use** - Proper error handling and security features  
✅ **React Native support** - Same API with secure storage backends  

**Perfect for both sensitive wallet storage and public address book management!**

## Files

- **`wallet-storage-manager.js`** - Single example file with all functionality
- **`WALLET_STORAGE_GUIDE.md`** - Complete documentation and usage guide
