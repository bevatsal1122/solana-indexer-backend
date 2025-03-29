import { Sequelize } from 'sequelize';
import { NFTMint } from './NFT_MINT';
import { NFTListing } from './NFT_LISTING';
import { NFTSale } from './NFT_SALE';
import { CompressedMintNFT } from './COMPRESSED_MINT_NFT';

// Models need to be initialized with a Sequelize instance
// This function will be called explicitly when needed (in routes)
export const initializeModels = (sequelize: Sequelize): void => {
  NFTMint.initialize(sequelize);
  NFTListing.initialize(sequelize);
  NFTSale.initialize(sequelize);
  CompressedMintNFT.initialize(sequelize);
};

export {
  NFTMint,
  NFTListing,
  NFTSale,
  CompressedMintNFT
}; 