/**
 * Centralized Protobuf Imports
 * 
 * This file provides a single import point for all protobuf-related types and enums.
 * This eliminates the need for long relative import paths throughout the codebase.
 */

// Import and re-export all enums from generated protobuf files
import {
  TRANSACTION_TYPE,
  TXN_STATUS,
  CONTRACT_FEE_TYPE,
  GOVERNANCE_TYPE,
  CONTRACT_TYPE,
  LANGUAGE,
  PROPOSAL_PERIOD,
  VARIABLE_TYPE
} from '../../../proto/generated/txn_pb.js';

export {
  TRANSACTION_TYPE,
  TXN_STATUS,
  CONTRACT_FEE_TYPE,
  GOVERNANCE_TYPE,
  CONTRACT_TYPE,
  LANGUAGE,
  PROPOSAL_PERIOD,
  VARIABLE_TYPE
};

// Re-export commonly used protobuf schemas
export {
  CoinTXNSchema as CoinTXN,
  MintTXNSchema as MintTXN,
  ItemizedMintTXNSchema as ItemizedMintTXN,
  InstrumentContractSchema as InstrumentContract,
  GovernanceVoteSchema as GovernanceVote,
  GovernanceProposalSchema as GovernanceProposal,
  SmartContractTXNSchema as SmartContractTXN,
  SmartContractExecuteTXNSchema as SmartContractExecuteTXN,
  SmartContractInstantiateTXNSchema as SmartContractInstantiateTXN,
  SelfCurrencyEquivSchema as SelfCurrencyEquiv,
  AuthorizedCurrencyEquivSchema as AuthorizedCurrencyEquiv,
  ExpenseRatioTXNSchema as ExpenseRatioTXN,
  NFTTXNSchema as NFTTXN,
  ContractUpdateTXNSchema as ContractUpdateTXN,
  FoundationTXNSchema as FoundationTXN,
  DelegatedTXNSchema as DelegatedTXN,
  QuashTXNSchema as QuashTXN,
  FastQuorumTXNSchema as FastQuorumTXN,
  RevokeTXNSchema as RevokeTXN,
  ComplianceTXNSchema as ComplianceTXN,
  BurnSBTTXNSchema as BurnSBTTXN,
  AllowanceTXNSchema as AllowanceTXN,
  BaseTXNSchema as BaseTXN,
  TransferAuthenticationSchema as TransferAuthentication,
  PublicKeySchema as PublicKey
} from '../../../proto/generated/txn_pb.js';

// Re-export protobuf utilities
export { toBinary, create } from '@bufbuild/protobuf';

// Type definitions for better TypeScript support
export type TransactionType = typeof TRANSACTION_TYPE;
export type TxnStatus = typeof TXN_STATUS;
export type ContractFeeType = typeof CONTRACT_FEE_TYPE;
export type GovernanceType = typeof GOVERNANCE_TYPE;
export type ContractType = typeof CONTRACT_TYPE;
export type Language = typeof LANGUAGE;
export type ProposalPeriod = typeof PROPOSAL_PERIOD;
export type VariableType = typeof VARIABLE_TYPE;
