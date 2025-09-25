#!/usr/bin/env node

/**
 * Enhanced Wallet Storage Example
 * 
 * Shows address-based storage, address-only storage, and complete CRUD operations
 */

import { createWallet, generateWords, KEY_TYPE, HASH_TYPE } from '../index.js';

/**
 * Enhanced Wallet Storage Manager
 * 
 * Provides address-based storage, address-only storage, and complete CRUD operations
 */
export class EnhancedWalletStorageManager {
  constructor(storageType = 'memory') {
    this.storageType = storageType;
    this.storage = this.getStorageInstance();
  }

  getStorageInstance() {
    switch (this.storageType) {
      case 'memory':
        return new MemoryStorage();
      case 'localStorage':
        return new LocalStorageWrapper();
      case 'file':
        return new FileStorage();
      case 'keychain':
        return new KeychainStorage();
      case 'secureStorage':
        return new SecureStorage();
      case 'expoSecureStore':
        return new ExpoSecureStore();
      case 'asyncStorage':
        return new AsyncStorageWrapper();
      default:
        return new MemoryStorage();
    }
  }

  // ===== ADDRESS-BASED STORAGE =====
  
  /**
   * Store wallet using its address as the key
   */
  async storeWalletByAddress(wallet) {
    const key = `wallet_${wallet.address}`;
    return await this.storage.setItem(key, JSON.stringify(wallet));
  }

  /**
   * Retrieve wallet by its address
   */
  async getWalletByAddress(address) {
    const key = `wallet_${address}`;
    const data = await this.storage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Check if wallet exists by address
   */
  async walletExistsByAddress(address) {
    const key = `wallet_${address}`;
    return await this.storage.hasItem(key);
  }

  /**
   * Delete wallet by address
   */
  async deleteWalletByAddress(address) {
    const key = `wallet_${address}`;
    return await this.storage.removeItem(key);
  }

  // ===== ADDRESS BOOK / CONTACT LIST =====
  
  /**
   * Add address to address book with profile name
   */
  async addToAddressBook(address, profileName, wallet = null) {
    const addressEntry = {
      address: address,
      profileName: profileName,
      publicKey: wallet ? wallet.publicKey : null,
      keyType: wallet ? wallet.keyType : null,
      hashTypes: wallet ? wallet.hashTypes : null,
      derivationPath: wallet ? wallet.derivationPath : null,
      createdAt: new Date().toISOString(),
      isOwnWallet: !!wallet, // true if this is our own wallet, false if it's someone else's
      lastUsed: new Date().toISOString()
    };
    
    const key = `address_book_${address}`;
    return await this.storage.setItem(key, JSON.stringify(addressEntry));
  }

  /**
   * Remove address from address book
   */
  async removeFromAddressBook(address) {
    const key = `address_book_${address}`;
    return await this.storage.removeItem(key);
  }

  /**
   * Get address book entry
   */
  async getAddressBookEntry(address) {
    const key = `address_book_${address}`;
    const data = await this.storage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get all addresses in address book
   */
  async getAddressBook() {
    const keys = await this.storage.getAllKeys();
    const addressBookKeys = keys.filter(key => key.startsWith('address_book_'));
    const addressBook = [];
    
    for (const key of addressBookKeys) {
      const data = await this.storage.getItem(key);
      if (data) {
        addressBook.push(JSON.parse(data));
      }
    }
    
    // Sort by profile name
    return addressBook.sort((a, b) => a.profileName.localeCompare(b.profileName));
  }

  /**
   * Update address book entry
   */
  async updateAddressBookEntry(address, updates) {
    const existing = await this.getAddressBookEntry(address);
    if (!existing) {
      throw new Error(`Address ${address} not found in address book`);
    }
    
    const updated = {
      ...existing,
      ...updates,
      lastModified: new Date().toISOString()
    };
    
    const key = `address_book_${address}`;
    return await this.storage.setItem(key, JSON.stringify(updated));
  }

  /**
   * Search address book by profile name or address
   */
  async searchAddressBook(query) {
    const addressBook = await this.getAddressBook();
    const lowercaseQuery = query.toLowerCase();
    
    return addressBook.filter(entry => 
      entry.profileName.toLowerCase().includes(lowercaseQuery) ||
      entry.address.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get only own wallets from address book
   */
  async getOwnWallets() {
    const addressBook = await this.getAddressBook();
    return addressBook.filter(entry => entry.isOwnWallet);
  }

  /**
   * Get only external addresses from address book
   */
  async getExternalAddresses() {
    const addressBook = await this.getAddressBook();
    return addressBook.filter(entry => !entry.isOwnWallet);
  }

  /**
   * Clear entire address book
   */
  async clearAddressBook() {
    const keys = await this.storage.getAllKeys();
    const addressBookKeys = keys.filter(key => key.startsWith('address_book_'));
    
    let deletedCount = 0;
    for (const key of addressBookKeys) {
      if (await this.storage.removeItem(key)) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  // ===== ADDRESS-ONLY STORAGE (Legacy - for backward compatibility) =====
  
  /**
   * Store only the address (public data) - Legacy method
   */
  async storeAddressOnly(wallet) {
    const addressData = {
      address: wallet.address,
      publicKey: wallet.publicKey,
      keyType: wallet.keyType,
      hashTypes: wallet.hashTypes,
      derivationPath: wallet.derivationPath,
      createdAt: wallet.createdAt,
      version: wallet.version,
      standard: wallet.standard
    };
    
    const key = `address_${wallet.address}`;
    return await this.storage.setItem(key, JSON.stringify(addressData));
  }

  /**
   * Get address-only data - Legacy method
   */
  async getAddressOnly(address) {
    const key = `address_${address}`;
    const data = await this.storage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get all stored addresses - Legacy method
   */
  async getAllAddresses() {
    const keys = await this.storage.getAllKeys();
    const addressKeys = keys.filter(key => key.startsWith('address_'));
    const addresses = [];
    
    for (const key of addressKeys) {
      const data = await this.storage.getItem(key);
      if (data) {
        addresses.push(JSON.parse(data));
      }
    }
    
    return addresses;
  }

  // ===== COMPLETE CRUD OPERATIONS =====
  
  /**
   * Create and store a new wallet
   */
  async createWallet(options, profileName = null) {
    try {
      const wallet = await createWallet(options);
      await this.storeWalletByAddress(wallet);
      await this.storeAddressOnly(wallet);
      
      // Add to address book with profile name
      const name = profileName || `Wallet ${wallet.address.substring(0, 8)}`;
      await this.addToAddressBook(wallet.address, name, wallet);
      
      return wallet;
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  /**
   * Read wallet by address
   */
  async readWallet(address) {
    return await this.getWalletByAddress(address);
  }

  /**
   * Update wallet (replace existing)
   */
  async updateWallet(address, updatedWallet) {
    if (updatedWallet.address !== address) {
      throw new Error('Wallet address cannot be changed');
    }
    
    await this.storeWalletByAddress(updatedWallet);
    await this.storeAddressOnly(updatedWallet);
    return updatedWallet;
  }

  /**
   * Delete wallet by address
   */
  async deleteWallet(address) {
    const walletDeleted = await this.deleteWalletByAddress(address);
    const addressDeleted = await this.storage.removeItem(`address_${address}`);
    return walletDeleted && addressDeleted;
  }

  /**
   * Delete all wallets
   */
  async deleteAllWallets() {
    const keys = await this.storage.getAllKeys();
    const walletKeys = keys.filter(key => key.startsWith('wallet_') || key.startsWith('address_'));
    
    let deletedCount = 0;
    for (const key of walletKeys) {
      if (await this.storage.removeItem(key)) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * Get all wallets
   */
  async getAllWallets() {
    const keys = await this.storage.getAllKeys();
    const walletKeys = keys.filter(key => key.startsWith('wallet_'));
    const wallets = [];
    
    for (const key of walletKeys) {
      const data = await this.storage.getItem(key);
      if (data) {
        wallets.push(JSON.parse(data));
      }
    }
    
    return wallets;
  }

  /**
   * Get wallet count
   */
  async getWalletCount() {
    const keys = await this.storage.getAllKeys();
    return keys.filter(key => key.startsWith('wallet_')).length;
  }

  /**
   * Search wallets by criteria
   */
  async searchWallets(criteria) {
    const wallets = await this.getAllWallets();
    return wallets.filter(wallet => {
      if (criteria.keyType && wallet.keyType !== criteria.keyType) return false;
      if (criteria.hashTypes && !criteria.hashTypes.every(ht => wallet.hashTypes.includes(ht))) return false;
      if (criteria.address && !wallet.address.includes(criteria.address)) return false;
      return true;
    });
  }
}

// ===== STORAGE IMPLEMENTATIONS =====

/**
 * Memory Storage Implementation
 */
class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  async setItem(key, value) {
    this.data.set(key, value);
    return true;
  }

  async getItem(key) {
    return this.data.get(key) || null;
  }

  async removeItem(key) {
    return this.data.delete(key);
  }

  async hasItem(key) {
    return this.data.has(key);
  }

  async getAllKeys() {
    return Array.from(this.data.keys());
  }

  async clear() {
    this.data.clear();
    return true;
  }
}

/**
 * LocalStorage Wrapper (for browser)
 */
class LocalStorageWrapper {
  constructor() {
    this.isAvailable = typeof localStorage !== 'undefined';
    this.mockStorage = new Map(); // Fallback for Node.js
  }

  async setItem(key, value) {
    if (this.isAvailable) {
      localStorage.setItem(key, value);
      return true;
    }
    // Mock for Node.js environment
    console.log(`⚠️ LocalStorage (Mock): Stored ${key} - NOT SECURE`);
    this.mockStorage.set(key, value);
    return true;
  }

  async getItem(key) {
    if (this.isAvailable) {
      return localStorage.getItem(key);
    }
    // Mock for Node.js environment
    console.log(`⚠️ LocalStorage (Mock): Retrieved ${key} - NOT SECURE`);
    return this.mockStorage.get(key) || null;
  }

  async removeItem(key) {
    if (this.isAvailable) {
      localStorage.removeItem(key);
      return true;
    }
    // Mock for Node.js environment
    console.log(`⚠️ LocalStorage (Mock): Removed ${key}`);
    this.mockStorage.delete(key);
    return true;
  }

  async hasItem(key) {
    if (this.isAvailable) {
      return localStorage.getItem(key) !== null;
    }
    // Mock for Node.js environment
    console.log(`⚠️ LocalStorage (Mock): Checked ${key}`);
    return this.mockStorage.has(key);
  }

  async getAllKeys() {
    if (this.isAvailable) {
      return Object.keys(localStorage);
    }
    // Mock for Node.js environment
    console.log(`⚠️ LocalStorage (Mock): GetAllKeys`);
    return Array.from(this.mockStorage.keys());
  }

  async clear() {
    if (this.isAvailable) {
      localStorage.clear();
      return true;
    }
    // Mock for Node.js environment
    console.log(`⚠️ LocalStorage (Mock): Cleared`);
    this.mockStorage.clear();
    return true;
  }
}

/**
 * File Storage Implementation (for Node.js)
 */
class FileStorage {
  constructor() {
    this.isAvailable = typeof require !== 'undefined';
    if (this.isAvailable) {
      try {
        this.fs = require('fs').promises;
        this.path = require('path');
        this.storageDir = './wallet_storage';
      } catch {
        this.isAvailable = false;
      }
    }
  }

  async ensureStorageDir() {
    if (!this.isAvailable) {
      console.log(`⚠️ File Storage (Mock): Ensured storage directory`);
      return;
    }
    
    try {
      await this.fs.access(this.storageDir);
    } catch {
      await this.fs.mkdir(this.storageDir, { recursive: true });
    }
  }

  getFilePath(key) {
    if (!this.isAvailable) {
      return `./wallet_storage/${key}.json`;
    }
    return this.path.join(this.storageDir, `${key}.json`);
  }

  async setItem(key, value) {
    if (!this.isAvailable) {
      console.log(`⚠️ File Storage (Mock): Stored ${key} - NOT SECURE`);
      return true;
    }
    
    await this.ensureStorageDir();
    const filePath = this.getFilePath(key);
    await this.fs.writeFile(filePath, value, 'utf8');
    return true;
  }

  async getItem(key) {
    if (!this.isAvailable) {
      console.log(`⚠️ File Storage (Mock): Retrieved ${key} - NOT SECURE`);
      return null;
    }
    
    try {
      const filePath = this.getFilePath(key);
      const data = await this.fs.readFile(filePath, 'utf8');
      return data;
    } catch {
      return null;
    }
  }

  async removeItem(key) {
    if (!this.isAvailable) {
      console.log(`⚠️ File Storage (Mock): Removed ${key}`);
      return true;
    }
    
    try {
      const filePath = this.getFilePath(key);
      await this.fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async hasItem(key) {
    if (!this.isAvailable) {
      console.log(`⚠️ File Storage (Mock): Checked ${key}`);
      return false;
    }
    
    try {
      const filePath = this.getFilePath(key);
      await this.fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getAllKeys() {
    if (!this.isAvailable) {
      console.log(`⚠️ File Storage (Mock): GetAllKeys`);
      return [];
    }
    
    try {
      await this.ensureStorageDir();
      const files = await this.fs.readdir(this.storageDir);
      return files.map(file => file.replace('.json', ''));
    } catch {
      return [];
    }
  }

  async clear() {
    if (!this.isAvailable) {
      console.log(`⚠️ File Storage (Mock): Cleared`);
      return true;
    }
    
    try {
      const files = await this.getAllKeys();
      for (const key of files) {
        await this.removeItem(key);
      }
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * React Native Keychain Storage Implementation (🔒 SECURE)
 */
class KeychainStorage {
  constructor() {
    this.isAvailable = typeof require !== 'undefined';
    this.mockStorage = new Map(); // Fallback for Node.js
    if (this.isAvailable) {
      try {
        this.Keychain = require('react-native-keychain');
      } catch {
        this.isAvailable = false;
      }
    }
  }

  async setItem(key, value) {
    if (!this.isAvailable) {
      console.log(`🔒 Keychain Storage (Mock): Stored ${key}`);
      this.mockStorage.set(key, value);
      return true;
    }
    
    try {
      await this.Keychain.setInternetCredentials(key, 'wallet_data', value);
      return true;
    } catch (error) {
      console.error('Keychain setItem error:', error);
      return false;
    }
  }

  async getItem(key) {
    if (!this.isAvailable) {
      console.log(`🔒 Keychain Storage (Mock): Retrieved ${key}`);
      return this.mockStorage.get(key) || null;
    }
    
    try {
      const credentials = await this.Keychain.getInternetCredentials(key);
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Keychain getItem error:', error);
      return null;
    }
  }

  async removeItem(key) {
    if (!this.isAvailable) {
      console.log(`🔒 Keychain Storage (Mock): Removed ${key}`);
      this.mockStorage.delete(key);
      return true;
    }
    
    try {
      await this.Keychain.resetInternetCredentials(key);
      return true;
    } catch (error) {
      console.error('Keychain removeItem error:', error);
      return false;
    }
  }

  async hasItem(key) {
    if (!this.isAvailable) {
      console.log(`🔒 Keychain Storage (Mock): Checked ${key}`);
      return this.mockStorage.has(key);
    }
    
    try {
      const credentials = await this.Keychain.getInternetCredentials(key);
      return !!credentials;
    } catch (error) {
      console.error('Keychain hasItem error:', error);
      return false;
    }
  }

  async getAllKeys() {
    if (!this.isAvailable) {
      console.log(`🔒 Keychain Storage (Mock): GetAllKeys`);
      return Array.from(this.mockStorage.keys());
    }
    
    // Keychain doesn't support getAllKeys, return empty array
    return [];
  }

  async clear() {
    if (!this.isAvailable) {
      console.log(`🔒 Keychain Storage (Mock): Cleared`);
      this.mockStorage.clear();
      return true;
    }
    
    // Keychain doesn't support clear, return true
    return true;
  }
}

/**
 * React Native Secure Storage Implementation (🔐 MAXIMUM SECURITY - Biometric)
 */
class SecureStorage {
  constructor() {
    this.isAvailable = typeof require !== 'undefined';
    this.mockStorage = new Map(); // Fallback for Node.js
    if (this.isAvailable) {
      try {
        this.SecureStorage = require('react-native-secure-storage');
      } catch {
        this.isAvailable = false;
      }
    }
  }

  async setItem(key, value) {
    if (!this.isAvailable) {
      console.log(`🔐 Secure Storage (Mock): Stored ${key} with biometric protection`);
      this.mockStorage.set(key, value);
      return true;
    }
    
    try {
      await this.SecureStorage.setItem(key, value, {
        touchID: true,
        showModal: true,
        kSecAccessControl: 'BiometryAny'
      });
      return true;
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
      return false;
    }
  }

  async getItem(key) {
    if (!this.isAvailable) {
      console.log(`🔐 Secure Storage (Mock): Retrieved ${key} with biometric authentication`);
      return this.mockStorage.get(key) || null;
    }
    
    try {
      return await this.SecureStorage.getItem(key, {
        touchID: true,
        showModal: true
      });
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  }

  async removeItem(key) {
    if (!this.isAvailable) {
      console.log(`🔐 Secure Storage (Mock): Removed ${key}`);
      this.mockStorage.delete(key);
      return true;
    }
    
    try {
      await this.SecureStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('SecureStorage removeItem error:', error);
      return false;
    }
  }

  async hasItem(key) {
    if (!this.isAvailable) {
      console.log(`🔐 Secure Storage (Mock): Checked ${key}`);
      return this.mockStorage.has(key);
    }
    
    try {
      const item = await this.SecureStorage.getItem(key);
      return !!item;
    } catch (error) {
      console.error('SecureStorage hasItem error:', error);
      return false;
    }
  }

  async getAllKeys() {
    if (!this.isAvailable) {
      console.log(`🔐 Secure Storage (Mock): GetAllKeys`);
      return Array.from(this.mockStorage.keys());
    }
    
    // SecureStorage doesn't support getAllKeys, return empty array
    return [];
  }

  async clear() {
    if (!this.isAvailable) {
      console.log(`🔐 Secure Storage (Mock): Cleared`);
      this.mockStorage.clear();
      return true;
    }
    
    // SecureStorage doesn't support clear, return true
    return true;
  }
}

/**
 * Expo Secure Store Implementation (🔒 SECURE - Expo Compatible)
 */
class ExpoSecureStore {
  constructor() {
    this.isAvailable = typeof require !== 'undefined';
    this.mockStorage = new Map(); // Fallback for Node.js
    if (this.isAvailable) {
      try {
        this.SecureStore = require('expo-secure-store');
      } catch {
        this.isAvailable = false;
      }
    }
  }

  async setItem(key, value) {
    if (!this.isAvailable) {
      console.log(`🔒 Expo Secure Store (Mock): Stored ${key} securely`);
      this.mockStorage.set(key, value);
      return true;
    }
    
    try {
      await this.SecureStore.setItemAsync(key, value, {
        requireAuthentication: true,
        authenticationPrompt: 'Authenticate to access your wallet'
      });
      return true;
    } catch (error) {
      console.error('ExpoSecureStore setItem error:', error);
      return false;
    }
  }

  async getItem(key) {
    if (!this.isAvailable) {
      console.log(`🔒 Expo Secure Store (Mock): Retrieved ${key} securely`);
      return this.mockStorage.get(key) || null;
    }
    
    try {
      return await this.SecureStore.getItemAsync(key, {
        requireAuthentication: true,
        authenticationPrompt: 'Authenticate to access your wallet'
      });
    } catch (error) {
      console.error('ExpoSecureStore getItem error:', error);
      return null;
    }
  }

  async removeItem(key) {
    if (!this.isAvailable) {
      console.log(`🔒 Expo Secure Store (Mock): Removed ${key}`);
      this.mockStorage.delete(key);
      return true;
    }
    
    try {
      await this.SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error('ExpoSecureStore removeItem error:', error);
      return false;
    }
  }

  async hasItem(key) {
    if (!this.isAvailable) {
      console.log(`🔒 Expo Secure Store (Mock): Checked ${key}`);
      return this.mockStorage.has(key);
    }
    
    try {
      const item = await this.SecureStore.getItemAsync(key);
      return !!item;
    } catch (error) {
      console.error('ExpoSecureStore hasItem error:', error);
      return false;
    }
  }

  async getAllKeys() {
    if (!this.isAvailable) {
      console.log(`🔒 Expo Secure Store (Mock): GetAllKeys`);
      return Array.from(this.mockStorage.keys());
    }
    
    // ExpoSecureStore doesn't support getAllKeys, return empty array
    return [];
  }

  async clear() {
    if (!this.isAvailable) {
      console.log(`🔒 Expo Secure Store (Mock): Cleared`);
      this.mockStorage.clear();
      return true;
    }
    
    // ExpoSecureStore doesn't support clear, return true
    return true;
  }
}

/**
 * React Native AsyncStorage Implementation (⚠️ NOT SECURE - Development Only)
 */
class AsyncStorageWrapper {
  constructor() {
    this.isAvailable = typeof require !== 'undefined';
    this.mockStorage = new Map(); // Fallback for Node.js
    if (this.isAvailable) {
      try {
        this.AsyncStorage = require('@react-native-async-storage/async-storage');
      } catch {
        this.isAvailable = false;
      }
    }
  }

  async setItem(key, value) {
    if (!this.isAvailable) {
      console.log(`⚠️ AsyncStorage (Mock): Stored ${key} - NOT SECURE`);
      this.mockStorage.set(key, value);
      return true;
    }
    
    try {
      await this.AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
      return false;
    }
  }

  async getItem(key) {
    if (!this.isAvailable) {
      console.log(`⚠️ AsyncStorage (Mock): Retrieved ${key} - NOT SECURE`);
      return this.mockStorage.get(key) || null;
    }
    
    try {
      return await this.AsyncStorage.getItem(key);
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  }

  async removeItem(key) {
    if (!this.isAvailable) {
      console.log(`⚠️ AsyncStorage (Mock): Removed ${key}`);
      this.mockStorage.delete(key);
      return true;
    }
    
    try {
      await this.AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
      return false;
    }
  }

  async hasItem(key) {
    if (!this.isAvailable) {
      console.log(`⚠️ AsyncStorage (Mock): Checked ${key}`);
      return this.mockStorage.has(key);
    }
    
    try {
      const item = await this.AsyncStorage.getItem(key);
      return item !== null;
    } catch (error) {
      console.error('AsyncStorage hasItem error:', error);
      return false;
    }
  }

  async getAllKeys() {
    if (!this.isAvailable) {
      console.log(`⚠️ AsyncStorage (Mock): GetAllKeys`);
      return Array.from(this.mockStorage.keys());
    }
    
    try {
      return await this.AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('AsyncStorage getAllKeys error:', error);
      return [];
    }
  }

  async clear() {
    if (!this.isAvailable) {
      console.log(`⚠️ AsyncStorage (Mock): Cleared`);
      this.mockStorage.clear();
      return true;
    }
    
    try {
      await this.AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('AsyncStorage clear error:', error);
      return false;
    }
  }
}

// ===== DEMONSTRATION =====

async function demonstrateEnhancedStorage() {
  console.log('🚀 Enhanced Wallet Storage Demonstration - All Storage Options\n');

  try {
    const mnemonic = generateWords(12);
    console.log('📝 Generated mnemonic:', mnemonic);
    console.log('');

    // ===== DEMONSTRATE ALL STORAGE OPTIONS =====
    console.log('🔒 Testing All Storage Options:');
    
    const storageTypes = [
      { type: 'memory', name: 'Memory Storage', security: '⚠️ NOT SECURE - Testing Only' },
      { type: 'localStorage', name: 'LocalStorage', security: '⚠️ NOT SECURE - Browser Only' },
      { type: 'file', name: 'File Storage', security: '⚠️ NOT SECURE - Node.js Only' },
      { type: 'keychain', name: 'Keychain Storage', security: '🔒 SECURE - React Native' },
      { type: 'secureStorage', name: 'Secure Storage', security: '🔐 MAXIMUM SECURITY - Biometric' },
      { type: 'expoSecureStore', name: 'Expo Secure Store', security: '🔒 SECURE - Expo Compatible' },
      { type: 'asyncStorage', name: 'AsyncStorage', security: '⚠️ NOT SECURE - Development Only' }
    ];

    for (const storage of storageTypes) {
      console.log(`\n📱 Testing ${storage.name} (${storage.security}):`);
      
      const storageManager = new EnhancedWalletStorageManager(storage.type);
      
      // Create a test wallet
      const wallet = await storageManager.createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.BLAKE3],
        mnemonic,
        hdOptions: { addressIndex: 0 }
      }, `Test Wallet (${storage.name})`);

      console.log(`   ✅ Created wallet: ${wallet.address.substring(0, 20)}...`);
      
      // Test retrieval
      const retrievedWallet = await storageManager.getWalletByAddress(wallet.address);
      console.log(`   ✅ Retrieved wallet: ${retrievedWallet ? 'Success' : 'Failed'}`);
      
      // Test address book
      await storageManager.addToAddressBook('TestAddress123', 'Test Contact', null);
      const addressBook = await storageManager.getAddressBook();
      console.log(`   ✅ Address book entries: ${addressBook.length}`);
      
      // Clean up
      await storageManager.deleteAllWallets();
      console.log(`   🧹 Cleaned up storage`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 Storage Options Summary:');
    console.log('='.repeat(60));
    
    storageTypes.forEach((storage, index) => {
      console.log(`${index + 1}. ${storage.name}`);
      console.log(`   Security: ${storage.security}`);
      console.log(`   Usage: ${storage.type}`);
      console.log('');
    });

    // ===== DEMONSTRATION =====
    console.log('🎯 Demonstration (Using Keychain Storage):');
    
    const storageManager = new EnhancedWalletStorageManager('keychain');
    
    // Create multiple wallets
    const wallets = [];
    const profileNames = ['My Primary Wallet', 'My Savings Wallet', 'My Trading Wallet'];
    
    for (let i = 0; i < 3; i++) {
      const wallet = await storageManager.createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.BLAKE3],
        mnemonic,
        hdOptions: { addressIndex: i }
      }, profileNames[i]);
      wallets.push(wallet);
      console.log(`   ✅ Created ${profileNames[i]}: ${wallet.address}`);
    }

    console.log('');

    // ===== ADDRESS-BASED RETRIEVAL =====
    console.log('2️⃣ Address-Based Retrieval:');
    
    for (const wallet of wallets) {
      const retrievedWallet = await storageManager.readWallet(wallet.address);
      console.log(`   ✅ Retrieved wallet by address: ${retrievedWallet.address}`);
      console.log(`      Public Key: ${retrievedWallet.publicKey}`);
      console.log(`      Key Type: ${retrievedWallet.keyType}`);
    }

    console.log('');

    // ===== ADDRESS BOOK FUNCTIONALITY =====
    console.log('3️⃣ Address Book / Contact List:');
    
    // Add some external addresses to address book
    await storageManager.addToAddressBook('ExternalAddress1', 'Alice\'s Wallet', null);
    await storageManager.addToAddressBook('ExternalAddress2', 'Bob\'s Trading Account', null);
    
    // Get full address book
    const addressBook = await storageManager.getAddressBook();
    console.log(`   ✅ Address book contains ${addressBook.length} entries:`);
    addressBook.forEach((entry, index) => {
      const type = entry.isOwnWallet ? 'Own Wallet' : 'External';
      console.log(`      ${index + 1}. ${entry.profileName} (${type})`);
      console.log(`         Address: ${entry.address}`);
    });
    
    // Get only own wallets
    const ownWallets = await storageManager.getOwnWallets();
    console.log(`   📱 Own wallets: ${ownWallets.length}`);
    
    // Get only external addresses
    const externalAddresses = await storageManager.getExternalAddresses();
    console.log(`   👥 External addresses: ${externalAddresses.length}`);
    
    // Search address book
    const searchResults = await storageManager.searchAddressBook('Alice');
    console.log(`   🔍 Search for "Alice": ${searchResults.length} results`);

    console.log('');

    // ===== ADDRESS-ONLY STORAGE (Legacy) =====
    console.log('4️⃣ Address-Only Storage (Legacy):');
    
    const allAddresses = await storageManager.getAllAddresses();
    console.log(`   ✅ Retrieved ${allAddresses.length} address records:`);
    allAddresses.forEach((addr, index) => {
      console.log(`      ${index + 1}. ${addr.address} (${addr.keyType})`);
    });

    console.log('');

    // ===== CRUD OPERATIONS =====
    console.log('5️⃣ CRUD Operations:');
    
    // Read
    const walletCount = await storageManager.getWalletCount();
    console.log(`   📊 Total wallets stored: ${walletCount}`);
    
    // Search
    const ed25519Wallets = await storageManager.searchWallets({ keyType: 'ed25519' });
    console.log(`   🔍 Found ${ed25519Wallets.length} Ed25519 wallets`);
    
    // Update (create a new wallet with same address - not recommended in practice)
    const firstWallet = wallets[0];
    const updatedWallet = { ...firstWallet, createdAt: new Date().toISOString() };
    await storageManager.updateWallet(firstWallet.address, updatedWallet);
    console.log(`   ✏️  Updated wallet: ${firstWallet.address}`);

    console.log('');

    // ===== DELETE OPERATIONS =====
    console.log('6️⃣ Delete Operations:');
    
    // Delete specific wallet
    const addressToDelete = wallets[1].address;
    const deleted = await storageManager.deleteWallet(addressToDelete);
    console.log(`   🗑️  Deleted wallet: ${addressToDelete} (${deleted ? 'Success' : 'Failed'})`);
    
    // Check remaining wallets
    const remainingWallets = await storageManager.getAllWallets();
    console.log(`   📊 Remaining wallets: ${remainingWallets.length}`);
    
    // Delete all wallets
    const deletedCount = await storageManager.deleteAllWallets();
    console.log(`   🗑️  Deleted all wallets: ${deletedCount} items removed`);
    
    // Verify deletion
    const finalCount = await storageManager.getWalletCount();
    console.log(`   📊 Final wallet count: ${finalCount}`);

    console.log('');

    // ===== ADDRESS BOOK MANAGEMENT =====
    console.log('7️⃣ Address Book Management:');
    
    // Create a new wallet for address book management
    const managementWallet = await storageManager.createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.BLAKE3],
      mnemonic,
      hdOptions: { addressIndex: 5 }
    }, 'Management Wallet');
    
    // Add external address for management
    await storageManager.addToAddressBook('ManagementAddress123', 'Management Contact', null);
    
    // Update address book entry
    await storageManager.updateAddressBookEntry('ManagementAddress123', {
      profileName: 'Updated Management Contact',
      lastUsed: new Date().toISOString()
    });
    console.log('   ✏️  Updated management contact profile name');
    
    // Remove an address
    await storageManager.removeFromAddressBook('ManagementAddress123');
    console.log('   🗑️  Removed management contact from address book');
    
    // Get updated address book
    const updatedAddressBook = await storageManager.getAddressBook();
    console.log(`   📋 Updated address book: ${updatedAddressBook.length} entries`);

    console.log('');

    // ===== PRACTICAL EXAMPLES =====
    console.log('8️⃣ Practical Usage Examples:');
    
    // Create a wallet for practical example
    const practicalWallet = await storageManager.createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.BLAKE3], // Changed to BLAKE3
      mnemonic,
      hdOptions: { addressIndex: 10 }
    }, 'My Practical Wallet');

    console.log(`   ✅ Created practical wallet: ${practicalWallet.address}`);
    
    // Store address for public display
    await storageManager.storeAddressOnly(practicalWallet);
    console.log(`   ✅ Stored address-only data for public display`);
    
    // Retrieve for transaction signing
    const signingWallet = await storageManager.readWallet(practicalWallet.address);
    console.log(`   ✅ Retrieved wallet for signing: ${signingWallet ? 'Success' : 'Failed'}`);
    
    // Check if wallet exists before operations
    const exists = await storageManager.walletExistsByAddress(practicalWallet.address);
    console.log(`   ✅ Wallet exists check: ${exists ? 'Yes' : 'No'}`);
    
    // Add external address for sending funds
    await storageManager.addToAddressBook('RecipientAddress123', 'Payment Recipient', null);
    console.log(`   ✅ Added external address to address book`);
    
    // Get address book for transaction
    const finalAddressBook = await storageManager.getAddressBook();
    console.log(`   📋 Address book ready for transactions: ${finalAddressBook.length} contacts`);

    console.log('');

    // ===== SUMMARY =====
    console.log('📋 Enhanced Storage Features Summary:');
    console.log('   ✅ Address-based storage and retrieval');
    console.log('   ✅ Address book with profile names');
    console.log('   ✅ Own wallets vs external addresses');
    console.log('   ✅ Search and filter address book');
    console.log('   ✅ Complete CRUD operations (Create, Read, Update, Delete)');
    console.log('   ✅ Delete all functionality');
    console.log('   ✅ Multiple storage backends:');
    console.log('      ⚠️ Memory Storage (Testing Only)');
    console.log('      ⚠️ LocalStorage (Browser - Not Secure)');
    console.log('      ⚠️ File Storage (Node.js - Not Secure)');
    console.log('      🔒 Keychain Storage (React Native - Secure)');
    console.log('      🔐 Secure Storage (React Native - Biometric)');
    console.log('      🔒 Expo Secure Store (Expo - Secure)');
    console.log('      ⚠️ AsyncStorage (React Native - Not Secure)');
    console.log('   ✅ Wallet existence checking');
    console.log('   ✅ Count and statistics');
    console.log('   ✅ ED25519 + BLAKE3 default configuration');

    console.log('\n🎉 Storage demonstration completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the demonstration
demonstrateEnhancedStorage();

export default demonstrateEnhancedStorage;
