#!/usr/bin/env node

import { createCoinTXN, sendCoinTXN } from '../transaction.js';

function getEnv(name, fallback = undefined) {
  return process.env[name] ?? fallback;
}

async function main() {
  const endpoint = getEnv('ZERA_GRPC_ENDPOINT', 'http://localhost:50052');

  // Create CoinTXN with new input structure that includes both private and public keys
  // The publicKey is used to derive the address for nonce lookup
  // The privateKey is available for signing (though signing is handled by the network)
  const coinTxn = createCoinTXN(
    [{ 
      privateKey: '5KJvsngHeMby884zrh6A5u6b4SqzZzAb', // Base58 private key (raw 32-byte key encoded as base58)
      publicKey: 'A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb', // Base58 public key identifier (human-readable with type prefixes)
      amount: '1.000000000', 
      feePercent: '100' 
    }],
    [{ to: 'wallet_receiver_bob', amount: '1.000000000', memo: 'Example payment' }],
    { 
      baseFeeId: '$ZRA+0000',
      baseFee: '0.001',  // User-friendly amount (0.001 ZRA)
      contractFeeId: '$ZRA+0000',
      contractFee: '0.0005'  // User-friendly amount (0.0005 ZRA)
    },
    'SDK example transfer'
  );

  console.log('Sending CoinTXN via gRPC (Connect)...');
  console.log('Endpoint:', endpoint);
  console.log('Contract ID:', coinTxn.contractId);
  console.log('Inputs:', coinTxn.inputTransfers.length, 'Outputs:', coinTxn.outputTransfers.length);
  
  if (coinTxn.base) {
    console.log('Base fee amount (smallest units):', coinTxn.base.feeAmount);
  }
  if (coinTxn.contractFeeAmount) {
    console.log('Contract fee amount (smallest units):', coinTxn.contractFeeAmount);
  }

  try {
    await sendCoinTXN(coinTxn, { endpoint });
    console.log('✅ CoinTXN submitted successfully');
  } catch (err) {
    console.error('❌ Submission failed');
    console.error(err?.rawMessage || err?.message || err);
    process.exitCode = 1;
  }
}

main();


