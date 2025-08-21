import { ZeraWallet, createZeraWallet, validateZeraAddress, validateMnemonicPhrase } from './index.js';
import { generateMnemonic, generatePassphrase, assessPassphraseSecurity } from './utils.js';

async function runAllTests() {
  console.log('🚀 ZERA Network Wallet Creation - Complete Test Suite\n');
  
  try {
    // Test 1: Basic functionality test
    console.log('📋 Test 1: Basic Functionality');
    const wallet = new ZeraWallet();
    const info = wallet.getWalletInfo();
    console.log('Wallet Info:', JSON.stringify(info, null, 2));
    console.log('');
    
    // Test 2: Mnemonic generation and validation
    console.log('🔑 Test 2: Mnemonic Generation and Validation');
    const mnemonic = generateMnemonic(24);
    console.log('Generated 24-word mnemonic:', mnemonic);
    console.log('Mnemonic valid:', validateMnemonicPhrase(mnemonic));
    console.log('');
    
    // Test 3: Create both wallet types
    console.log('🔐 Test 3: Create Both Wallet Types');
    const ed25519Wallet = await createZeraWallet('ed25519', mnemonic);
    const ed448Wallet = await createZeraWallet('ed448', mnemonic);
    
    console.log('ed25519 Wallet created successfully');
    console.log('ed448 Wallet created successfully');
    console.log('');
    
    // Test 4: Address validation
    console.log('✅ Test 4: Address Validation');
    console.log('ed25519 address valid:', validateZeraAddress(ed25519Wallet.address));
    console.log('ed448 address valid:', validateZeraAddress(ed448Wallet.address));
    console.log('');
    
    // Test 5: Passphrase functionality
    console.log('🔐 Test 5: Passphrase Functionality');
    const passphrase = generatePassphrase(16);
    console.log('Generated passphrase:', passphrase);
    
    const security = assessPassphraseSecurity(passphrase);
    console.log('Passphrase security:', JSON.stringify(security, null, 2));
    
    const ed25519WithPass = await createZeraWallet('ed25519', mnemonic, passphrase);
    console.log('Wallet with passphrase created successfully');
    console.log('');
    
    // Test 6: Error handling
    console.log('❌ Test 6: Error Handling');
    
    try {
      await createZeraWallet('invalid-type', mnemonic);
    } catch (error) {
      console.log('Expected error caught (invalid key type):', error.message);
    }
    
    try {
      await createZeraWallet('ed25519');
    } catch (error) {
      console.log('Expected error caught (missing mnemonic):', error.message);
    }
    
    try {
      await createZeraWallet('ed25519', 'invalid mnemonic phrase');
    } catch (error) {
      console.log('Expected error caught (invalid mnemonic):', error.message);
    }
    console.log('');
    
    // Test 7: Wallet consistency
    console.log('🔄 Test 7: Wallet Consistency');
    const wallet1 = await wallet.createEd25519Wallet(mnemonic);
    const wallet2 = await wallet.createEd25519Wallet(mnemonic);
    
    console.log('Same mnemonic produces same wallet:', 
      wallet1.privateKey === wallet2.privateKey &&
      wallet1.publicKey === wallet2.publicKey &&
      wallet1.address === wallet2.address
    );
    console.log('');
    
    console.log('🎉 All basic tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- ✅ Wallet instance creation');
    console.log('- ✅ Mnemonic generation and validation');
    console.log('- ✅ Both ed25519 and ed448 wallet types');
    console.log('- ✅ Address generation and validation');
    console.log('- ✅ Passphrase generation and security assessment');
    console.log('- ✅ Error handling for invalid inputs');
    console.log('- ✅ Wallet consistency verification');
    
    console.log('\n💡 To run individual module tests, use:');
    console.log('  node tests/test-constants.js     - Test constants module');
    console.log('  node tests/test-shared.js         - Test shared utilities');
    console.log('  node tests/test-ed25519.js        - Test ed25519 module');
    console.log('  node tests/test-ed448.js           - Test ed448 module');
    console.log('  node tests/test-integration.js    - Test complete integration');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the main test suite
runAllTests();
