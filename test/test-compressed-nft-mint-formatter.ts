import fs from 'fs';
import path from 'path';
import { formatCompressedMintNFTData } from '../src/lib/formatters';

// Load sample compressed NFT mint data
const compressedNftMintDataPath = path.join(__dirname, 'COMPRESSED_MINT_NFT.JSON');
const sampleData = JSON.parse(fs.readFileSync(compressedNftMintDataPath, 'utf8'));

// Format the data
const formattedData = formatCompressedMintNFTData(sampleData);

// Print important fields to verify they are correctly populated
console.log('Compressed NFT Mint Data Formatted:');
console.log('--------------------------');
console.log('Signature:', formattedData.signature);
console.log('AssetId:', formattedData.assetId);
console.log('Mint:', formattedData.mint);
console.log('Token Standard:', formattedData.tokenStandard);
console.log('Mint Authority:', formattedData.mintAuthority);
console.log('Owner:', formattedData.owner);
console.log('Name:', formattedData.name);
console.log('Symbol:', formattedData.symbol);
console.log('URI:', formattedData.uri);
console.log('Creators:', formattedData.creators ? 'Present (' + formattedData.creators.length + ' creators)' : 'Empty');
console.log('Collection:', formattedData.collection);
console.log('Collection Verified:', formattedData.collectionVerified);
console.log('Merkle Tree:', formattedData.merkleTree);
console.log('Leaf Index:', formattedData.leafIndex);
console.log('Tree Authority:', formattedData.treeAuthority);
console.log('Program ID:', formattedData.programId);
console.log('Compression Program:', formattedData.compressionProgram);
console.log('--------------------------');

// Output compressed event for analysis
console.log('\nCompressed Events:');
if (sampleData.events && sampleData.events.compressed) {
  console.log(`Found ${sampleData.events.compressed.length} compressed events`);
  if (sampleData.events.compressed.length > 0) {
    const firstEvent = sampleData.events.compressed[0];
    console.log('Asset ID:', firstEvent.assetId);
    console.log('Leaf Index:', firstEvent.leafIndex);
    console.log('Tree ID:', firstEvent.treeId);
    console.log('New Leaf Owner:', firstEvent.newLeafOwner);
    console.log('Metadata:', JSON.stringify(firstEvent.metadata, null, 2).slice(0, 200) + '...');
  }
}
console.log('--------------------------'); 