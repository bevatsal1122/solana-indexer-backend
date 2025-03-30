import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

interface NFTListingAttributes {
  id: number;
  signature: string;
  mint: string;
  seller: string;
  marketplace: string;
  price: number;
  currency: string;
  auctionHouse: string;
  slot: number;
  blockTime: number;

  programId: string;
  innerInstructions: object[];
  accounts: string[];
  data: string;
  feePayer: string;
  metadata: object;
  tokenSize: number;
  expiry: number;
  listingTime: number;
  listingState: string;
  tokenAccount: string;
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
  accountData: object[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NFTListingInput extends Optional<NFTListingAttributes, 'id'> {}
export interface NFTListingOutput extends Required<NFTListingAttributes> {}

class NFTListingModel extends Model<NFTListingAttributes, NFTListingInput> implements NFTListingAttributes {
  public id!: number;
  public signature!: string;
  public mint!: string;
  public seller!: string;
  public marketplace!: string;
  public price!: number;
  public currency!: string;
  public auctionHouse!: string;
  public slot!: number;
  public blockTime!: number;

  public programId!: string;
  public innerInstructions!: object[];
  public accounts!: string[];
  public data!: string;
  public feePayer!: string;
  public metadata!: object;
  public tokenSize!: number;
  public expiry!: number;
  public listingTime!: number;
  public listingState!: string;
  public tokenAccount!: string;
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
  public accountData!: object[];
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export interface NFTListingModelStatic {
  new(): NFTListingModel;
  initialize(sequelize: Sequelize): void;
}

export function initialize(sequelize: Sequelize): void {
  NFTListingModel.init(
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
      seller: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      marketplace: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(20, 9),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      auctionHouse: {
        type: DataTypes.STRING,
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
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      tokenSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      expiry: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      listingTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      listingState: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tokenAccount: {
        type: DataTypes.STRING,
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
      accountData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'nft_listings',
      timestamps: true,
    }
  );
}

export const NFTListing = NFTListingModel as unknown as NFTListingModelStatic;
NFTListing.initialize = initialize; 