import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

interface NFTMintAttributes {
  id: number;
  signature: string;
  mint: string;
  tokenStandard: string;
  mintAuthority: string;
  owner: string;
  metadata: object;
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
  description: string;
  events: object;
  fee: number;
  nativeTransfers: object[];
  source: string;
  timestamp: number;
  tokenTransfers: object[];
  transactionError: string | null;
  type: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NFTMintInput extends Optional<NFTMintAttributes, 'id'> {}
export interface NFTMintOutput extends Required<NFTMintAttributes> {}

class NFTMintModel extends Model<NFTMintAttributes, NFTMintInput> implements NFTMintAttributes {
  public id!: number;
  public signature!: string;
  public mint!: string;
  public tokenStandard!: string;
  public mintAuthority!: string;
  public owner!: string;
  public metadata!: object;
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
  public description!: string;
  public events!: object;
  public fee!: number;
  public nativeTransfers!: object[];
  public source!: string;
  public timestamp!: number;
  public tokenTransfers!: object[];
  public transactionError!: string | null;
  public type!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export interface NFTMintModelStatic {
  new(): NFTMintModel;
  initialize(sequelize: Sequelize): void;
}

export function initialize(sequelize: Sequelize): void {
  NFTMintModel.init(
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
      tableName: 'nft_mints',
      timestamps: true,
    }
  );
}

export const NFTMint = NFTMintModel as unknown as NFTMintModelStatic;
NFTMint.initialize = initialize;