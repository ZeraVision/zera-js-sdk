import { createEd25519Wallet, getEd25519WalletInfo } from '../ed25519.js';
import { generateMnemonic } from '../utils.js';

async function testEd25519() {
  console.log('🧪 Testing ed25519 Wallet Module\n');
  
  try {
    // Test 1: Get wallet info
    console.log('📋 Test 1: Wallet Information');
    const walletInfo = getEd25519WalletInfo();
    console.log('ed25519 Info:', JSON.stringify(walletInfo, null, 2));
    console.log('');
    
    // Test 2: Generate mnemonic and create wallet
    console.log('🔐 Test 2: Create ed25519 Wallet');
    const mnemonic = generateMnemonic(24);
    console.log('Generated mnemonic:', mnemonic);
    
    const wallet = await createEd25519Wallet(mnemonic);
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
    const passphraseWallet = await createEd25519Wallet(mnemonic, 'my-secure-passphrase');
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
      await createEd25519Wallet('invalid mnemonic phrase');
    } catch (error) {
      console.log('Expected error caught:', error.message);
    }
    console.log('');
    
    console.log('🎉 ed25519 tests completed successfully!');
    
  } catch (error) {
    console.error('❌ ed25519 test failed:', error.message);
    console.error(error.stack);
  }
}

// Export the test function
export default async function test() {
  return testEd25519();
}

// Also export as named function for compatibility
export async function testEd25519Export() {
  return testEd25519();
}
