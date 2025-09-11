/**
 * Transaction Module - CoinTXN
 */

import {
  CoinTXNSchema as CoinTXN,
  InputTransfersSchema as InputTransfers,
  OutputTransfersSchema as OutputTransfers,
  BaseTXNSchema as BaseTXN
} from '../../proto/generated/txn_pb.js';
import { create } from '@bufbuild/protobuf';
import { TXNService } from '../../proto/generated/txn_pb.js';
import {
  toSmallestUnits,
  validateAmountBalance,
  Decimal
} from '../shared/amount-utils.js';

/**
 * @typedef {Object} FeeConfig
 * @property {string} baseFeeId - Base fee instrument (e.g., '$ZRA+0000')
 * @property {string} [contractFeeId] - Contract fee instrument (defaults to baseFeeId)
 * @property {Decimal|string|number} [baseFee] - Base fee amount in user-friendly units (will be converted to smallest units)
 * @property {Decimal|string|number} [contractFee] - Contract fee amount in user-friendly units (will be converted to smallest units)
 */

/**
 * Create a CoinTXN with inputs and outputs using exact decimal arithmetic
 * @param {Array} inputs - Array of input objects {from: string, amount: Decimal|string|number, feePercent?: string}
 * @param {Array} outputs - Array of output objects {to: string, amount: Decimal|string|number, memo?: string}
 * @param {FeeConfig} feeConfig - Fee configuration object with the following properties:
 *   - baseFeeId (string, REQUIRED): The fee instrument ID (e.g., '$ZRA+0000')
 *   - contractFeeId (string, optional): Contract fee instrument, defaults to baseFeeId if not provided
 *   - baseFee (Decimal|string|number, optional): Base fee amount in user-friendly units (converted to smallest units)
 *   - contractFee (Decimal|string|number, optional): Contract fee amount in user-friendly units (converted to smallest units)
 * @param {string} [baseMemo] - Base memo for the transaction (optional)
 * @returns {proto.zera_txn.CoinTXN}
 */
export function createCoinTXN(inputs, outputs, feeConfig = { baseFeeId: '$ZRA+0000' }, baseMemo = '') {
  if (!Array.isArray(inputs) || !Array.isArray(outputs)) {
    throw new Error('Inputs and outputs must be arrays');
  }
  if (inputs.length === 0 || outputs.length === 0) {
    throw new Error('Must have at least one input and one output');
  }

  const {
    baseFeeId = '$ZRA+0000',
    baseFee,
    contractFeeId,
    contractFee
  } = feeConfig;

  // Validate input/output balance (convert to smallest units)
  const inputAmountsInSmallestUnits = inputs.map(i => toSmallestUnits(i.amount, baseFeeId));
  const outputAmountsInSmallestUnits = outputs.map(o => toSmallestUnits(o.amount, baseFeeId));
  validateAmountBalance(inputAmountsInSmallestUnits, outputAmountsInSmallestUnits);

  // Create input transfers
  const inputTransfers = inputs.map((input, index) => {
    const finalAmount = toSmallestUnits(input.amount, baseFeeId);
    const feePercent = input.feePercent !== undefined ? input.feePercent : '100';
    const scaledFeePercent = new Decimal(feePercent).mul(1000000).toNumber();
    return create(InputTransfers, {
      walletAddress: new Uint8Array(Buffer.from(input.from, 'utf8')),
      index,
      amount: finalAmount,
      feePercent: scaledFeePercent
    });
  });

  // Validate fee percent sum == 100,000,000
  const totalFeePercent = inputTransfers.reduce((sum, t) => new Decimal(sum).add(t.feePercent).toNumber(), 0);
  if (totalFeePercent !== 100000000) {
    throw new Error(`Fee percentages must sum to exactly 100% (100,000,000). Current sum: ${totalFeePercent}`);
  }

  // Create output transfers
  const outputTransfers = outputs.map(output => {
    const finalAmount = toSmallestUnits(output.amount, baseFeeId);
    const data = {
      walletAddress: new Uint8Array(Buffer.from(output.to, 'utf8')),
      amount: finalAmount
    };
    if (output.memo && output.memo.trim() !== '') {
      data.memo = output.memo;
    }
    return create(OutputTransfers, data);
  });

  const coinTxnData = {
    contractId: baseFeeId,
    contractFeeId,
    inputTransfers,
    outputTransfers
  };
  if (contractFee !== undefined) {
    coinTxnData.contractFeeAmount = toSmallestUnits(contractFee, contractFeeId);
  }
  if ((baseFee !== undefined && baseFee !== null && baseFee !== '') || (typeof baseMemo === 'string' && baseMemo.trim() !== '')) {
    const baseData = {};
    if (baseFee !== undefined && baseFee !== null && baseFee !== '') {
      baseData.feeAmount = toSmallestUnits(baseFee, baseFeeId);
      baseData.feeId = baseFeeId;
    }
    if (typeof baseMemo === 'string' && baseMemo.trim() !== '') {
      baseData.memo = baseMemo;
    }
    coinTxnData.base = create(BaseTXN, baseData);
  }

  return create(CoinTXN, coinTxnData);
}

/**
 * Send a CoinTXN via gRPC using Connect client
 * @param {object} coinTxnInput - CoinTXN protobuf message or plain object
 * @param {object} [grpcConfig]
 * @param {string} [grpcConfig.endpoint] - 'http://host:50052' or 'host:50052'
 * @param {string} [grpcConfig.host='routing.zeravision.ca']
 * @param {number} [grpcConfig.port=50052]
 * @param {('http'|'https')} [grpcConfig.protocol='http']
 * @param {object} [grpcConfig.nodeOptions]
 * @returns {Promise<void>}
 */
export async function sendCoinTXN(coinTxnInput, grpcConfig = {}) {
  const {
    endpoint,
    host = 'routing.zeravision.ca',
    port = 50052,
    protocol = 'http',
    nodeOptions
  } = grpcConfig;

  const resolved = endpoint ?? `${host}:${port}`;
  const baseUrl = resolved.startsWith('http') ? resolved : `${protocol}://${resolved}`;

  const coinTxnMessage = coinTxnInput?.$typeName === 'zera_txn.CoinTXN'
    ? coinTxnInput
    : create(CoinTXN, coinTxnInput ?? {});

  const { createPromiseClient } = await import('@connectrpc/connect');
  const { createGrpcTransport } = await import('@connectrpc/connect-node');
  const transport = createGrpcTransport({ baseUrl, nodeOptions });
  const client = createPromiseClient(TXNService, transport);
  await client.coin(coinTxnMessage);
}


