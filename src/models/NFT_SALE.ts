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
        type: DataTypes.JSONB, // Store as JSON array
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