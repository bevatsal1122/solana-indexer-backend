import fs from 'fs';
import path from 'path';
import { formatNFTListingData } from '../src/lib/formatters';

// Load sample NFT listing data
const nftListingDataPath = path.join(__dirname, 'NFT_LISTING.JSON');
const sampleData = JSON.parse(fs.readFileSync(nftListingDataPath, 'utf8'));

// Format the data
const formattedData = formatNFTListingData(sampleData);

// Print important fields to verify they are correctly populated
console.log('NFT Listing Data Formatted:');
console.log('--------------------------');
console.log('Mint:', formattedData.mint);
console.log('Seller:', formattedData.seller);
console.log('Price:', formattedData.price, 'SOL');
console.log('Program ID:', formattedData.programId);
console.log('Inner Instructions:', formattedData.innerInstructions.length > 0 ? 'Present' : 'Empty');
console.log('Metadata:', JSON.stringify(formattedData.metadata, null, 2));
console.log('Token Standard:', formattedData.metadata.tokenStandard);
console.log('Sale Type:', formattedData.metadata.saleType);
console.log('Token ID:', formattedData.metadata.tokenIdentifier);
console.log('--------------------------'); 