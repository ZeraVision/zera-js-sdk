/**
 * Universal Test Keys for ZERA SDK Testing
 * 
 * This module provides standardized test key pairs for consistent testing across all modules.
 * These keys are specifically designed for testing purposes and should not be used in production.
 * 
 * Generated on: 2025-09-15T16:51:19.680Z
 */


export interface TestKeyPair {
  privateKey: string;
  publicKey: string;
  address: string;
}


/**
 * Test Key Pairs for ED25519 with different hash types:
 * - Alice: BLAKE3 (A_c_ prefix)
 * - Bob: SHA3_256 + SHA3_512 (A_a_b_ prefix) 
 * - Charlie: SHA3_512 + SHA3_256 (A_b_a_ prefix)
 */
export const ED25519_TEST_KEYS: Record<'alice' | 'bob' | 'charlie', TestKeyPair> = {
  alice: {
    privateKey: 'Akyo231kUTYfC9AXokfUVhq7XoL6gri7zVfFi8WSG5Kt',
    publicKey: 'A_c_AKpo7NMd3JhGAonxXJXuG8XgDXA8jZGikK6UaHDYxksU',
    address: '7AC43j5mVxGZDZraaDN3Guz68rRoh2S7P6VXcS8GGJ8b'
  },
  bob: {
    privateKey: '7ES16G6gu4YKsNyhRsvX4hznhgWLHaVcpcWJtUQyqodJ',
    publicKey: 'A_a_b_8ffgHJD1aNbiYn5r8oP6bJtKW6vFcXFUizRJLCRQVX6H',
    address: 'G5F1NDFmpLsym7TvAt67Ju1jzRL2mPLxev25JFi7ZSWt'
  },
  charlie: {
    privateKey: 'BmKNB363Sppn8twb6cUntLKsuFDpBrhGQLxkfFCS9R5K',
    publicKey: 'A_b_a_6Tn7ZEW3fep5PJnENTmJzGd1NTsML4WbmKFmJB8VoND',
    address: 'AMdCPzvcLFyPBBebsfBfXdzsaGCKrENq76fa4xLNFoJqR8Bfvgedi3D8GTNTw77Unw1meKR297z2263ooLX5kYi'
  }
};

/**
 * Test Key Pairs for ED448 with different hash types:
 * - Alice: BLAKE3 (B_c_ prefix)
 * - Bob: SHA3_256 + SHA3_512 (B_a_b_ prefix)
 * - Charlie: SHA3_512 + SHA3_256 (B_b_a_ prefix)
 */
export const ED448_TEST_KEYS: Record<'alice' | 'bob' | 'charlie', TestKeyPair> = {
  alice: {
    privateKey: '8CL2rdGSJWgj5ghe1Fg39UeNtWHhVGu6yoU8W7Ac57x2',
    publicKey: 'B_c_BTDwQNwypMZUDdJkY9jyTS4DPtVS91EqeAdZdnHNijUFoEWGxoA6nXdB4TJHGuXjVHq37VsznXHuXd',
    address: '53kh7iUoNcczgcBjEQuo3CmPqPtYnWGLVCfeZSZtjuxB'
  },
  bob: {
    privateKey: '5NGTFZfS9TE12SKLceUhAhUnRTixJmpD4imcjbsHnExa',
    publicKey: 'B_a_b_VU7J4BNRYk1M6WYcNrDyGjoFU8onVryZPNhZ7tuhQAD8fCizJPZMJEeBSMJkLF3YKrs95TcmxDbH4b',
    address: 'GMMgTQJnMEa3vHhvPF2JtmxLEGST1SevQNNfULbcN2Rv'
  },
  charlie: {
    privateKey: 'A47VfEGGQYDAEtibZCBNtJ7dTARVZfHQKRiQxqbVz5P3',
    publicKey: 'B_b_a_AupmN6d1KLntoXVcodk8cQTNq8tvAsi1vNW8MiBQmBvwuVmh7rzgHLbSsxc6iKK8fBZ462Dczi3nDu',
    address: '5WpSC8PtVPLneG1TppxmCx9ng4bwdTatQKNFoiiLHmVt9ihJ6coRveCCKKoHwP8rJSCyLg3GLpFJ6WYyh9pE7eQC'
  }
};

/**
 * Test Wallet Addresses (derived from public keys)
 */
export const TEST_WALLET_ADDRESSES: Record<'alice' | 'bob' | 'charlie' | 'jesse', string> = {
  alice: '7AC43j5mVxGZDZraaDN3Guz68rRoh2S7P6VXcS8GGJ8b',
  bob: 'G5F1NDFmpLsym7TvAt67Ju1jzRL2mPLxev25JFi7ZSWt',
  charlie: 'AMdCPzvcLFyPBBebsfBfXdzsaGCKrENq76fa4xLNFoJqR8Bfvgedi3D8GTNTw77Unw1meKR297z2263ooLX5kYi',
  jesse: 'WYEKj2jB1exPn7BStQ7WBkr8WpST9x3iT7gvoPjyZcYAP'
};

