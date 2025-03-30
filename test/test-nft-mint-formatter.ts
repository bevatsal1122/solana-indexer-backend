import fs from 'fs';
import path from 'path';
import { formatNFTMintData } from '../src/lib/formatters';

// Load sample NFT mint data
const nftMintDataPath = path.join(__dirname, 'NFT_MINT.JSON');
const sampleData = JSON.parse(fs.readFileSync(nftMintDataPath, 'utf8'));

// Format the data
const formattedData = formatNFTMintData(sampleData);

// Print important fields to verify they are correctly populated
console.log('NFT Mint Data Formatted:');
console.log('--------------------------');
console.log('Mint:', formattedData.mint);
console.log('Token Standard:', formattedData.tokenStandard);
console.log('Mint Authority:', formattedData.mintAuthority);
console.log('Owner:', formattedData.owner);
console.log('Metadata:', JSON.stringify(formattedData.metadata, null, 2).slice(0, 200) + '...');
console.log('Name:', formattedData.name);
console.log('Symbol:', formattedData.symbol);
console.log('URI:', formattedData.uri);
console.log('Creators:', formattedData.creators ? 'Present (' + formattedData.creators.length + ' creators)' : 'Empty');
console.log('Program ID:', formattedData.programId);
console.log('Inner Instructions:', formattedData.innerInstructions.length > 0 ? 'Present' : 'Empty');
console.log('--------------------------');

// Add analysis of token transfers and instructions
console.log('\nToken Transfers:');
console.log(JSON.stringify(sampleData.tokenTransfers, null, 2));

console.log('\nToken Metadata Instruction Analysis:');
const metaplexInstructions = sampleData.instructions.filter((i: any) => 
  i.programId === 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);
console.log(`Found ${metaplexInstructions.length} Metaplex instructions`);

// Check instruction data which often contains name, symbol, URI
if (metaplexInstructions.length > 0) {
  const metadataInstruction = metaplexInstructions[0];
  console.log(`Metadata instruction data length: ${metadataInstruction.data.length}`);
  
  // Look at inner instructions which might have mint details
  if (metadataInstruction.innerInstructions && metadataInstruction.innerInstructions.length > 0) {
    console.log(`Inner instructions: ${metadataInstruction.innerInstructions.length}`);
  }
} 