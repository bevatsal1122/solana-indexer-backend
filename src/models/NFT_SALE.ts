import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

interface NFTSaleAttributes {
  id: number;
  signature: string;
  mint: string;
  seller: string;
  buyer: string;
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
  tokenStandard: string;
  metadata: object;
  feePayer: string;
  txFee: number;
  royaltyFee: number;
  marketplaceFee: number;
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
  saleType: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NFTSaleInput extends Optional<NFTSaleAttributes, 'id'> {}
export interface NFTSaleOutput extends Required<NFTSaleAttributes> {}

class NFTSaleModel extends Model<NFTSaleAttributes, NFTSaleInput> implements NFTSaleAttributes {
  public id!: number;
  public signature!: string;
  public mint!: string;
  public seller!: string;
  public buyer!: string;
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
  public tokenStandard!: string;
  public metadata!: object;
  public feePayer!: string;
  public txFee!: number;
  public royaltyFee!: number;
  public marketplaceFee!: number;
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
  public saleType!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export interface NFTSaleModelStatic {
  new(): NFTSaleModel;
  initialize(sequelize: Sequelize): void;
}

export function initialize(sequelize: Sequelize): void {
  NFTSaleModel.init(
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
      buyer: {
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
      programId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      innerInstructions: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      accounts: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      data: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tokenStandard: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      feePayer: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      txFee: {
        type: DataTypes.DECIMAL(20, 9),
        allowNull: true,
      },
      royaltyFee: {
        type: DataTypes.DECIMAL(20, 9),
        allowNull: true,
      },
      marketplaceFee: {
        type: DataTypes.DECIMAL(20, 9),
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
      saleType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'nft_sales',
      timestamps: true,
    }
  );
}

export const NFTSale = NFTSaleModel as unknown as NFTSaleModelStatic;
NFTSale.initialize = initialize; 