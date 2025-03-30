import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

interface CompressedMintNFTAttributes {
  id: number;
  signature: string;
  mint: string;
  tokenStandard: string;
  mintAuthority: string;
  owner: string;
  metadata: object;
  merkleTree: string;
  leafIndex: number;
  slot: number;
  blockTime: number;

  programId: string;
  innerInstructions: object[];
  accounts: string[];
  data: string;
  feePayer: string;
  collection: string;
  collectionVerified: boolean;
  creators: object[];
  royalties: number;
  name: string;
  symbol: string;
  uri: string;
  txFee: number;
  sellerFeeBasisPoints: number;
  treeAuthority: string;
  compressionProgram: string;
  assetId: string;
  compressedNFTMetadata: object;
  canopyDepth: number;
  proofPath: string[];
  accountData: object[];
  description: string;
  events: object;
  fee: number;
  instructions: object[];
  nativeTransfers: object[];
  source: string;
  timestamp: number;
  tokenTransfers: object[];
  transactionError: string | null;
  type: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompressedMintNFTInput extends Optional<CompressedMintNFTAttributes, 'id'> {}
export interface CompressedMintNFTOutput extends Required<CompressedMintNFTAttributes> {}

class CompressedMintNFTModel extends Model<CompressedMintNFTAttributes, CompressedMintNFTInput> implements CompressedMintNFTAttributes {
  public id!: number;
  public signature!: string;
  public mint!: string;
  public tokenStandard!: string;
  public mintAuthority!: string;
  public owner!: string;
  public metadata!: object;
  public merkleTree!: string;
  public leafIndex!: number;
  public slot!: number;
  public blockTime!: number;

  public programId!: string;
  public innerInstructions!: object[];
  public accounts!: string[];
  public data!: string;
  public feePayer!: string;
  public collection!: string;
  public collectionVerified!: boolean;
  public creators!: object[];
  public royalties!: number;
  public name!: string;
  public symbol!: string;
  public uri!: string;
  public txFee!: number;
  public sellerFeeBasisPoints!: number;
  public treeAuthority!: string;
  public compressionProgram!: string;
  public assetId!: string;
  public compressedNFTMetadata!: object;
  public canopyDepth!: number;
  public proofPath!: string[];
  public accountData!: object[];
  public description!: string;
  public events!: object;
  public fee!: number;
  public instructions!: object[];
  public nativeTransfers!: object[];
  public source!: string;
  public timestamp!: number;
  public tokenTransfers!: object[];
  public transactionError!: string | null;
  public type!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export interface CompressedMintNFTModelStatic {
  new(): CompressedMintNFTModel;
  initialize(sequelize: Sequelize): void;
}

export function initialize(sequelize: Sequelize): void {
  CompressedMintNFTModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      signature: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      mint: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tokenStandard: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mintAuthority: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      owner: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      merkleTree: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      leafIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      slot: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      blockTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Additional fields
      programId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      innerInstructions: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      accounts: {
        type: DataTypes.JSONB, // Store as JSON array
        allowNull: true,
      },
      data: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      feePayer: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      collection: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      collectionVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      creators: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      royalties: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      symbol: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      uri: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      txFee: {
        type: DataTypes.DECIMAL(20, 9),
        allowNull: true,
      },
      sellerFeeBasisPoints: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      treeAuthority: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      compressionProgram: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      assetId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      compressedNFTMetadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      canopyDepth: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      proofPath: {
        type: DataTypes.JSONB, // Store as JSON array
        allowNull: true,
      },
      accountData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      events: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      fee: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      instructions: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      nativeTransfers: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      source: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      timestamp: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tokenTransfers: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      transactionError: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'compressed_nft_mints',
      timestamps: true,
    }
  );
}

export const CompressedMintNFT = CompressedMintNFTModel as unknown as CompressedMintNFTModelStatic;
CompressedMintNFT.initialize = initialize; 