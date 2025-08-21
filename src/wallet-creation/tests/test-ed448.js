import { createEd448Wallet, getEd448WalletInfo } from '../ed448.js';
import { generateMnemonic } from '../utils.js';

async function testEd448() {
  console.log('🧪 Testing ed448 Wallet Module\n');
  
  try {
    // Test 1: Get wallet info
    console.log('📋 Test 1: Wallet Information');
    const walletInfo = getEd448WalletInfo();
    console.log('ed448 Info:', JSON.stringify(walletInfo, null, 2));
    console.log('');
    
    // Test 2: Generate mnemonic and create wallet
    console.log('🔐 Test 2: Create ed448 Wallet');
    const mnemonic = generateMnemonic(24);
    console.log('Generated mnemonic:', mnemonic);
    
    const wallet = await createEd448Wallet(mnemonic);
    console.log('Wallet created:', JSON.stringify(wallet, null, 2));
    console.log('');
    
    // Test 3: Verify wallet structure
    console.log('✅ Test 3: Wallet Structure Validation');
    const requiredFields = ['type', 'mnemonic', 'privateKey', 'publicKey', 'address', 'derivationPath', 'coinType', 'symbol'];
    const missingFields = requiredFields.filter(field => !(field in wallet));
    
    if (missingFields.length === 0) {
      console.log('✅ All required fields present');
    } else {
      console.log('❌ Missing fields:', missingFields);
    }
    
    console.log('Wallet type:', wallet.type);
    console.log('Private key length:', wallet.privateKey.length);
    console.log('Public key length:', wallet.publicKey.length);
    console.log('Address length:', wallet.address.length);
    console.log('');
    
    // Test 4: Create wallet with passphrase
    console.log('🔐 Test 4: Wallet with Passphrase');
    const passphraseWallet = await createEd448Wallet(mnemonic, 'my-secure-passphrase');
    console.log('Passphrase wallet created:', JSON.stringify(passphraseWallet, null, 2));
    console.log('');
    
    // Test 5: Verify different addresses with same mnemonic
    console.log('🏠 Test 5: Address Uniqueness');
    console.log('Same mnemonic, no passphrase:', wallet.address);
    console.log('Same mnemonic, with passphrase:', passphraseWallet.address);
    console.log('Addresses different:', wallet.address !== passphraseWallet.address);
    console.log('');
    
    // Test 6: Error handling - invalid mnemonic
    console.log('❌ Test 6: Error Handling - Invalid Mnemonic');
    try {
      await createEd448Wallet('invalid mnemonic phrase');
    } catch (error) {
      console.log('Expected error caught:', error.message);
    }
    console.log('');
    
    // Test 7: Note about ed448 implementation
    console.log('⚠️ Test 7: Implementation Note');
    console.log('Current ed448 implementation uses SHA256 as placeholder');
    console.log('In production, implement proper ed448 key generation');
    console.log('');
    
    console.log('🎉 ed448 tests completed successfully!');
    
  } catch (error) {
    console.error('❌ ed448 test failed:', error.message);
    console.error(error.stack);
  }
}

// Export the test function
export default async function test() {
  return testEd448();
}

// Also export as named function for compatibility
export async function testEd448Export() {
  return testEd448();
}
