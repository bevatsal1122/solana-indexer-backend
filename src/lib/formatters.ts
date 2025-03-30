/**
 * Formatters for different types of webhook data coming from Helius
 * These functions map the raw webhook data to the appropriate database model schema
 */

// Define interface for instruction type
interface Instruction {
  programId?: string;
  accounts?: string[];
  data?: string;
  innerInstructions?: any[];
}

/**
 * Format NFT Sale data from webhook
 * @param webhookData Raw webhook data from Helius
 */
export const formatNFTSaleData = (webhookData: any) => {
  // Extract essential NFT sale information from the webhook data
  const { 
    signature, 
    slot, 
    source, 
    timestamp, 
    type, 
    description, 
    accountData, 
    fee,
    events,
    feePayer,
    instructions = [] as Instruction[],
    nativeTransfers,
    tokenTransfers,
    transactionError
  } = webhookData;

  // Extract NFT-specific information from events.nft
  const nftEvent = events?.nft || {};
  const { 
    seller, 
    buyer, 
    amount, 
    nfts = [], 
    saleType = "",
    source: marketplaceSource 
  } = nftEvent;

  // Get first NFT if available
  const nftInfo = nfts && nfts.length > 0 ? nfts[0] : {};
  const mint = nftInfo.mint || "";
  const tokenStandard = nftInfo.tokenStandard || "";

  // Extract programId from the first instruction if available
  const programId = instructions && instructions.length > 0 
    ? instructions[0].programId || "" 
    : "";

  // Extract innerInstructions from instructions
  const innerInstructions = instructions && instructions.length > 0
    ? instructions.flatMap((instr: Instruction) => instr.innerInstructions || [])
    : [];

  // Extract accounts from instructions
  const accounts = instructions && instructions.length > 0
    ? instructions.flatMap((instr: Instruction) => instr.accounts || [])
    : [];

  // Extract data from instructions
  const data = instructions && instructions.length > 0
    ? instructions[0].data || ""
    : "";

  // Prepare metadata object with available info
  const metadata = {
    ...(nftInfo.metadata || {}),
    nftInfo,
    tokenStandard
  };
  
  // Format the data according to the NFTSale model structure
  return {
    signature,
    mint,
    seller: seller || "",
    buyer: buyer || "",
    marketplace: marketplaceSource || source || "",
    price: amount ? amount / 1_000_000_000 : 0, // Convert lamports to SOL
    currency: "SOL", // Default to SOL for now
    auctionHouse: "",
    slot,
    blockTime: timestamp,
    tokenStandard,
    feePayer: feePayer || "",
    description,
    accountData: accountData || [],
    events: events || {},
    fee,
    instructions: instructions || [],
    nativeTransfers: nativeTransfers || [],
    source,
    timestamp,
    tokenTransfers: tokenTransfers || [],
    transactionError,
    type,
    saleType,
    // Extract fields from instructions
    programId,
    innerInstructions,
    accounts,
    data,
    metadata,
    txFee: fee ? fee / 1_000_000_000 : 0,
    royaltyFee: nftEvent.royaltyFee ? nftEvent.royaltyFee / 1_000_000_000 : 0,
    marketplaceFee: nftEvent.marketplaceFee ? nftEvent.marketplaceFee / 1_000_000_000 : 0,
  };
};

/**
 * Format NFT Mint data from webhook
 * @param webhookData Raw webhook data from Helius
 */
export const formatNFTMintData = (webhookData: any) => {
  // Extract essential data from the webhook
  const { 
    signature, 
    slot, 
    source, 
    timestamp, 
    type, 
    description, 
    fee,
    events,
    feePayer,
    instructions = [] as Instruction[],
    nativeTransfers,
    tokenTransfers,
    transactionError,
    accountData = []
  } = webhookData;

  // Extract NFT-specific information
  const nftEvent = events?.nft || {};
  
  // Extract mint details from the nft event or token transfers
  let mint = '';
  let tokenStandard = '';
  let owner = '';
  let name = '';
  let symbol = '';
  let uri = '';
  let metadata: Record<string, any> = {};
  let mintAuthority = '';
  let creators: any[] = [];
  let collection = '';
  let collectionVerified = false;
  let royalties = 0;
  let sellerFeeBasisPoints = 0;

  // First try to get mint from nft event
  if (nftEvent.nfts && nftEvent.nfts.length > 0) {
    mint = nftEvent.nfts[0].mint || '';
    tokenStandard = nftEvent.nfts[0].tokenStandard || '';
  } else if (nftEvent.mint) {
    mint = nftEvent.mint;
    tokenStandard = nftEvent.tokenStandard || 'NonFungible';
  } 
  
  // If mint is still empty, try token transfers
  if (!mint && tokenTransfers && tokenTransfers.length > 0) {
    mint = tokenTransfers[0].mint || '';
    tokenStandard = tokenTransfers[0].tokenStandard || 'NonFungible';
  }

  // Extract owner from nft event or token transfers
  if (nftEvent.owner) {
    owner = nftEvent.owner;
  } else if (tokenTransfers && tokenTransfers.length > 0 && tokenTransfers[0].toUserAccount) {
    owner = tokenTransfers[0].toUserAccount;
  } else if (nftEvent.buyer) {
    owner = nftEvent.buyer;
  }

  // Extract metadata from nft event
  if (nftEvent.metadata) {
    metadata = nftEvent.metadata;
    
    // Extract name, symbol, uri from metadata
    if (metadata.name) name = metadata.name;
    if (metadata.symbol) symbol = metadata.symbol;
    if (metadata.uri) uri = metadata.uri;
  }

  // If name, symbol, uri are not in metadata, try direct properties in nftEvent
  if (!name && nftEvent.name) name = nftEvent.name;
  if (!symbol && nftEvent.symbol) symbol = nftEvent.symbol;
  if (!uri && nftEvent.uri) uri = nftEvent.uri;

  // Extract creators from nft event
  if (nftEvent.creators && Array.isArray(nftEvent.creators)) {
    creators = nftEvent.creators;
  } else if (metadata && metadata.creators && Array.isArray(metadata.creators)) {
    creators = metadata.creators;
  }

  // If creator information is still empty, try to infer from transaction and accounts
  if ((!creators || creators.length === 0) && feePayer) {
    // In most Metaplex NFT mints, the fee payer is the primary creator
    creators = [{
      address: feePayer,
      share: 100,
      verified: true
    }];
  }

  // Also check if any of the innerInstructions references a program like Token Metadata program
  // which might indicate creator accounts
  const allInnerInstructions = instructions.flatMap((instr: Instruction) => instr.innerInstructions || []);
  if (allInnerInstructions.length > 0) {
    // Look for token create instructions which might have creator info
    const tokenCreateInstructions = allInnerInstructions.filter((inner: any) => 
      inner.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' && 
      inner.accounts && 
      inner.accounts.length >= 3
    );
    
    if (tokenCreateInstructions.length > 0 && (!creators || creators.length === 0)) {
      // These accounts might include creators
      const potentialCreatorAddresses = tokenCreateInstructions.flatMap((instr: any) => instr.accounts || []);
      
      // Convert addresses to unique creators
      const uniqueAddresses = [...new Set(potentialCreatorAddresses)] as string[];
      if (uniqueAddresses.length > 0) {
        // Filter out known system addresses
        const systemAddresses = [
          'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
          '11111111111111111111111111111111'
        ];
        
        const filteredAddresses = uniqueAddresses.filter(address => 
          !systemAddresses.includes(address) && address !== mint
        );
        
        if (filteredAddresses.length > 0 && (!creators || creators.length === 0)) {
          // These might be creators - with the first one being primary
          creators = filteredAddresses.map((addr, index) => ({
            address: addr,
            share: index === 0 ? 100 : 0,
            verified: index === 0
          }));
        }
      }
    }
  }

  // Extract collection info
  if (nftEvent.collection) {
    collection = nftEvent.collection;
    collectionVerified = nftEvent.collectionVerified || false;
  } else if (metadata && metadata.collection) {
    collection = typeof metadata.collection === 'string' 
      ? metadata.collection 
      : metadata.collection.name || metadata.collection.key || '';
    collectionVerified = metadata.collectionVerified || false;
  }

  // Extract royalties and seller fee basis points
  if (nftEvent.royalties !== undefined) {
    royalties = nftEvent.royalties;
  } else if (metadata && metadata.seller_fee_basis_points !== undefined) {
    sellerFeeBasisPoints = metadata.seller_fee_basis_points;
    royalties = sellerFeeBasisPoints / 100; // Convert basis points to percentage
  }

  // Extract mint authority from token transfers or instructions
  // In NFT mint transactions, typically the feePayer is also the mint authority
  mintAuthority = feePayer;

  // In Metaplex NFT mints, the mint authority might be set in a token transfer
  if (accountData && accountData.length > 0) {
    // Look for the token account with both mint and mintAuthority
    const mintAccounts = accountData.filter((acc: any) => acc.account === mint);
    if (mintAccounts.length > 0) {
      // The account that's paying for the mint is typically the mint authority
      mintAuthority = feePayer;
    }
  }

  // Extract additional information from the events
  if (events.setAuthority && events.setAuthority.length > 0) {
    events.setAuthority.forEach((authEvent: any) => {
      if (authEvent.account === mint) {
        mintAuthority = authEvent.from || mintAuthority;
      }
    });
  }

  // Look at the instruction data to extract programId and metadata
  const metaplexInstructions = instructions.filter((instr: Instruction) => 
    instr.programId === 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );

  // For Metaplex NFT mints, extract detailed information
  if (metaplexInstructions.length > 0) {
    // The primary Metaplex instruction contains the create metadata instruction
    // which has name, symbol, and URI in its data
    const metadataInstruction = metaplexInstructions[0];
    
    // Try to extract the data parameter which often has the metadata encoded
    if (metadataInstruction.data && metadataInstruction.data.length > 50) {
      // The metaplex data is encoded, but we can try to extract common patterns
      // For example, the name, symbol, and URI might be present as UTF-8 strings
      try {
        // Convert base64 or hex data to string and look for name/symbol patterns
        const dataStr = metadataInstruction.data;
        
        // Metaplex NFT data often contains these fields in sequence
        // Look for pattern matches in the instruction data
        if (!name && dataStr.includes('name')) {
          // Extract name from data string if possible
          const nameMatch = /name[^\w]+([a-zA-Z0-9_\s]+)/i.exec(dataStr);
          if (nameMatch && nameMatch[1]) {
            name = nameMatch[1].trim();
          }
        }
        
        if (!symbol && dataStr.includes('symbol')) {
          // Extract symbol from data string if possible
          const symbolMatch = /symbol[^\w]+([a-zA-Z0-9_\s]+)/i.exec(dataStr);
          if (symbolMatch && symbolMatch[1]) {
            symbol = symbolMatch[1].trim();
          }
        }
        
        if (!uri && dataStr.includes('uri')) {
          // Extract URI from data string if possible
          const uriMatch = /uri[^\w]+(https?:\/\/[^\s"]+)/i.exec(dataStr);
          if (uriMatch && uriMatch[1]) {
            uri = uriMatch[1].trim();
          } else {
            // Try a broader pattern for URI/URL extraction
            const urlMatch = /(https?:\/\/[^\s"]+)/i.exec(dataStr);
            if (urlMatch && urlMatch[1]) {
              uri = urlMatch[1].trim();
            }
          }
        }
      } catch (error) {
        // Silent catch - just continue with other extraction methods
      }
    }
    
    // Try to extract name, symbol from the description if not found elsewhere
    if (!name && description) {
      // NFT descriptions often include the NFT name in formats like "User minted NFT_NAME for X SOL"
      const nameMatch = description.match(/minted\s+([^#\s]+)/i);
      if (nameMatch && nameMatch[1]) {
        name = nameMatch[1].trim();
      }
      
      // Also look for # format which might indicate collection name
      const tokenIdMatch = description.match(/#(\d+)/);
      if (tokenIdMatch && tokenIdMatch[1]) {
        // If we found a token ID and no name yet, use it to build a name
        if (!name) {
          name = `Token #${tokenIdMatch[1]}`;
        }
        
        // If no symbol, try to extract it from before the # in the description
        if (!symbol) {
          const collectionMatch = description.match(/minted\s+([^#\s]+)\s+#\d+/i);
          if (collectionMatch && collectionMatch[1]) {
            symbol = collectionMatch[1].trim();
          }
        }
      }
    }
    
    // If we still don't have a name but have a mint, use a shortened version
    if (!name && mint) {
      name = `NFT ${mint.slice(0, 8)}`;
    }
    
    // If we still don't have a symbol but have a name, derive it
    if (!symbol && name) {
      // Convert name to uppercase abbreviation for symbol
      const words = name.split(/\s+/);
      if (words.length > 1) {
        // Use first letter of each word
        symbol = words.map(word => word[0].toUpperCase()).join('');
      } else {
        // Or use the first 3-4 letters
        symbol = name.slice(0, Math.min(4, name.length)).toUpperCase();
      }
    }
    
    // If URI is still missing, check if it might be stored on-chain
    // Many Metaplex NFTs store metadata on Arweave or IPFS
    if (!uri) {
      // Try to construct a generic URI based on mint (common pattern)
      if (mint) {
        // Check for token transfers that might indicate this is an Arweave-based NFT
        const isMetaplexStandard = 
          metaplexInstructions.length > 0 && 
          instructions.some((instr: Instruction) => instr.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
          
        if (isMetaplexStandard) {
          // For standard Metaplex NFTs, construct a typical Arweave URI
          uri = `https://arweave.net/${mint}`;
        }
      }
    }
    
    // The accounts in the 4th instruction typically contain mint authority/owner info
    // and the 3rd instruction often contains important metadata
    const mainInstr = instructions.length >= 4 ? instructions[3] : metaplexInstructions[0];
    
    if (mainInstr && mainInstr.accounts && mainInstr.accounts.length > 0) {
      // First account is often the fee payer/mint authority
      if (!mintAuthority && mainInstr.accounts[0]) {
        mintAuthority = mainInstr.accounts[0];
      }
      
      // Look for inner instructions with token mint operations
      if (mainInstr.innerInstructions && mainInstr.innerInstructions.length > 0) {
        const tokenInnerInstrs = mainInstr.innerInstructions.filter((inner: any) => 
          inner.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        );
        
        if (tokenInnerInstrs.length > 0) {
          // These often show the mint authority and owner relationships
          tokenInnerInstrs.forEach((tokenInstr: any) => {
            if (tokenInstr.accounts && tokenInstr.accounts.length >= 3) {
              if (!mintAuthority) mintAuthority = tokenInstr.accounts[1] || '';
              if (!owner) owner = tokenInstr.accounts[2] || '';
            }
          });
        }
      }
    }
  }

  // Extract programId from the first Metaplex instruction if available,
  // or fall back to the first instruction
  const programId = metaplexInstructions.length > 0
    ? metaplexInstructions[0].programId || ""
    : instructions && instructions.length > 0 
      ? instructions[0].programId || "" 
      : "";

  // Extract all innerInstructions from all instructions
  const innerInstructions = instructions && instructions.length > 0
    ? instructions.flatMap((instr: Instruction) => instr.innerInstructions || [])
    : [];

  // Extract all accounts from all instructions
  const accounts = instructions && instructions.length > 0
    ? instructions.flatMap((instr: Instruction) => instr.accounts || [])
    : [];

  // Extract data from the first Metaplex instruction or fall back to first instruction
  const data = metaplexInstructions.length > 0
    ? metaplexInstructions[0].data || ""
    : instructions && instructions.length > 0
      ? instructions[0].data || ""
      : "";

  // Enrich the metadata with additional information
  const enrichedMetadata = {
    ...metadata,
    tokenStandard,
    source,
    mintedAt: timestamp,
    mintAuthority,
    owner,
    // Add token identifier from description if available
    tokenIdentifier: description?.match(/#\d+/)?.[0] || '',
  };
  
  // Format the data according to the NFTMint model structure
  return {
    signature,
    mint: mint || "",
    tokenStandard: tokenStandard || "NonFungible",
    mintAuthority: mintAuthority || feePayer || "",
    owner: owner || "",
    metadata: enrichedMetadata,
    slot,
    blockTime: timestamp,
    feePayer: feePayer || "",
    collection: collection || "",
    collectionVerified: collectionVerified || false,
    creators: creators || [],
    royalties: royalties || 0,
    name: name || "",
    symbol: symbol || "",
    uri: uri || "",
    txFee: fee ? fee / 1_000_000_000 : 0, // Convert lamports to SOL
    sellerFeeBasisPoints: sellerFeeBasisPoints || 0,
    description: description || "",
    events: events || {},
    fee,
    nativeTransfers: nativeTransfers || [],
    source: source || "",
    timestamp,
    tokenTransfers: tokenTransfers || [],
    transactionError,
    type,
    // Better extracted fields
    programId,
    innerInstructions,
    accounts,
    data,
  };
};

/**
 * Format NFT Listing data from webhook
 * @param webhookData Raw webhook data from Helius
 */
export const formatNFTListingData = (webhookData: any) => {
  // Extract essential data from the webhook
  const { 
    signature, 
    slot, 
    source, 
    timestamp, 
    type, 
    description, 
    accountData, 
    fee,
    events,
    feePayer,
    instructions = [] as Instruction[],
    nativeTransfers,
    tokenTransfers,
    transactionError
  } = webhookData;

  // Extract NFT listing specific information
  const nftEvent = events?.nft || {};
  const { 
    seller, 
    price, 
    nfts = [],
    tokenAccount,
    auctionHouse,
    marketplace,
    saleType,
    tokenSize,
    amount
  } = nftEvent;

  // Get mint from nfts array first, then from the direct mint property
  let mint = '';
  let tokenStandard = '';
  
  if (nfts && nfts.length > 0) {
    mint = nfts[0].mint || '';
    tokenStandard = nfts[0].tokenStandard || '';
  } else if (nftEvent.mint) {
    mint = nftEvent.mint;
  } else {
    // If mint is still empty, try to extract from description or instruction accounts
    if (description && description.includes('#')) {
      // Try to find the mint in instructions.accounts
      const possibleMints = instructions.flatMap((instr: Instruction) => instr.accounts || []);
      // Simple heuristic: in NFT listings, the mint is often mentioned after a collection name
      const matches = description.match(/#\d+/);
      if (matches && matches.length > 0) {
        const tokenNumber = matches[0];
        console.log(`Found token number in description: ${tokenNumber}`);
      }
    }
    
    // If we have instructions data, look for the mint in the accounts list
    // In MAGIC_EDEN listings, the mint is typically the 5th account in the main instruction
    if (instructions && instructions.length > 0 && instructions[2] && instructions[2].accounts && instructions[2].accounts.length > 5) {
      // In the NFT_LISTING.JSON example, the mint is at index 4 in the main instruction
      mint = instructions[2].accounts[4] || '';
    }
  }

  // Extract programId from the main instruction if available
  // For NFT listings, typically the 3rd instruction contains the listing data
  const programId = instructions && instructions.length > 2
    ? instructions[2].programId || ""
    : instructions && instructions.length > 0 
      ? instructions[0].programId || "" 
      : "";

  // For NFT listings, extract innerInstructions properly
  // In many NFT listing transactions, innerInstructions may be empty arrays
  // but we want to preserve them for analysis
  const innerInstructions = instructions
    .filter((instr: Instruction) => instr.innerInstructions && Array.isArray(instr.innerInstructions))
    .flatMap((instr: Instruction) => instr.innerInstructions || []);

  // Extract all accounts from all instructions
  const accounts = instructions
    .filter((instr: Instruction) => instr.accounts && Array.isArray(instr.accounts))
    .flatMap((instr: Instruction) => instr.accounts || []);

  // Extract data from the main instruction (usually the 3rd one for listings)
  const data = instructions && instructions.length > 2
    ? instructions[2].data || ""
    : instructions && instructions.length > 0
      ? instructions[0].data || ""
      : "";

  // Build rich metadata from the available information
  const metadata: Record<string, any> = {
    tokenStandard,
    source,
    saleType: saleType || '',
    listingProgram: programId,
    listedAt: timestamp,
    // If we have a description, try to extract token name/number
    tokenIdentifier: description?.match(/#\d+/)?.[0] || '',
  };
  
  // Add any available NFT metadata from the event
  if (nftEvent.metadata) {
    metadata.nftMetadata = nftEvent.metadata;
  }
  
  // If we have accountData, add token information 
  if (accountData && accountData.length > 0) {
    const tokenAccounts = accountData.filter((acc: any) => 
      acc.tokenBalanceChanges && acc.tokenBalanceChanges.length > 0
    );
    
    if (tokenAccounts.length > 0) {
      metadata.tokenAccounts = tokenAccounts;
    }
  }
  
  // Format the data according to the NFTListing model structure
  return {
    signature,
    mint,
    seller: seller || "",
    marketplace: marketplace || source || "",
    price: amount ? amount / 1_000_000_000 : price ? price / 1_000_000_000 : 0, // First try amount, then price
    currency: "SOL", // Default to SOL for now
    auctionHouse: auctionHouse || "",
    slot,
    blockTime: timestamp,
    feePayer: feePayer || "",
    metadata,
    tokenSize: tokenSize || 1,
    expiry: nftEvent.expiry || 0,
    listingTime: timestamp,
    listingState: "active",
    tokenAccount: tokenAccount || "",
    description: description || "",
    accountData: accountData || [],
    events: events || {},
    fee,
    instructions: instructions || [],
    nativeTransfers: nativeTransfers || [],
    source: source || "",
    timestamp,
    tokenTransfers: tokenTransfers || [],
    transactionError,
    type,
    // Better extracted fields
    programId,
    innerInstructions,
    accounts,
    data,
  };
};

/**
 * Format Compressed NFT Mint data from webhook
 * @param webhookData Raw webhook data from Helius
 */
export const formatCompressedMintNFTData = (webhookData: any) => {
  // Extract essential data from the webhook
  const { 
    signature, 
    slot, 
    source, 
    timestamp, 
    type, 
    description, 
    accountData, 
    fee,
    events,
    feePayer,
    instructions = [] as Instruction[],
    nativeTransfers,
    tokenTransfers,
    transactionError
  } = webhookData;

  // Extract compressed NFT event - for compressed NFTs, this data is in events.compressed array
  const compressedEvents = events?.compressed || [];
  const compressedEvent = compressedEvents.length > 0 ? compressedEvents[0] : {};
  
  // Extract key fields from the compressed event
  let assetId = '';
  let mintAuthority = '';
  let owner = '';
  let leafIndex = 0;
  let treeId = '';
  let merkleTree = '';
  let treeAuthority = '';
  let compressionProgram = '';
  let tokenStandard = 'NonFungible';
  let name = '';
  let symbol = '';
  let uri = '';
  let mint = '';
  let creators: any[] = [];
  let collection = '';
  let collectionVerified = false;
  let sellerFeeBasisPoints = 0;
  let royalties = 0;
  let metadata: Record<string, any> = {};
  let compressedNFTMetadata: Record<string, any> = {};

  // Handle compressed event data structure
  if (compressedEvent) {
    // Most important fields from compressedEvent
    assetId = compressedEvent.assetId || '';
    leafIndex = compressedEvent.leafIndex || 0;
    treeId = compressedEvent.treeId || '';
    merkleTree = compressedEvent.treeId || ''; // In compressed NFTs, treeId is the merkle tree
    treeAuthority = compressedEvent.treeDelegate || '';
    
    // Owner is usually in newLeafOwner
    owner = compressedEvent.newLeafOwner || '';
    
    // Mint authority is typically the tree delegate
    mintAuthority = compressedEvent.treeDelegate || feePayer || '';
    
    // For compressed NFTs, we use assetId as the mint identification
    mint = assetId || '';
    
    // Extract rich metadata if available
    if (compressedEvent.metadata) {
      metadata = compressedEvent.metadata;
      compressedNFTMetadata = compressedEvent.metadata;
      
      // Extract specific fields from metadata
      name = metadata.name || '';
      symbol = metadata.symbol || '';
      uri = metadata.uri || '';
      tokenStandard = metadata.tokenStandard || 'NonFungible';
      sellerFeeBasisPoints = metadata.sellerFeeBasisPoints || 0;
      royalties = sellerFeeBasisPoints / 100; // Convert basis points to percentage
      
      // Extract creator information
      if (metadata.creators && Array.isArray(metadata.creators)) {
        creators = metadata.creators;
      }
      
      // Extract collection information
      if (metadata.collection) {
        collection = metadata.collection.key || metadata.collection || '';
        collectionVerified = metadata.collection.verified || false;
      }
    }
  }

  // Extract programId from the Bubblegum program instruction if available
  // Bubblegum is commonly used for compressed NFTs
  // Look specifically for the instruction with the most accounts, which is typically the main mint
  const mainInstruction = instructions.length >= 3 ? instructions[2] : instructions[0];
  const programId = mainInstruction ? mainInstruction.programId || "" : "";
  
  // Extract compression program from the inner instructions if available
  // Look for specific compression program IDs
  const compressionProgramIds = [
    'cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK', // Known compression program
    'noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV'  // No-op program often used with Bubblegum
  ];
  
  if (mainInstruction && mainInstruction.innerInstructions && mainInstruction.innerInstructions.length > 0) {
    const compressionInstrs = mainInstruction.innerInstructions.filter((instr: any) => 
      compressionProgramIds.includes(instr.programId)
    );
    
    if (compressionInstrs.length > 0) {
      compressionProgram = compressionInstrs[0].programId;
    }
  }
  
  // If compressionProgram is still empty, look at all instructions
  if (!compressionProgram) {
    for (const instr of instructions) {
      if (instr.programId && compressionProgramIds.includes(instr.programId)) {
        compressionProgram = instr.programId;
        break;
      }
      
      // Also check inner instructions
      if (instr.innerInstructions) {
        for (const innerInstr of instr.innerInstructions) {
          if (innerInstr.programId && compressionProgramIds.includes(innerInstr.programId)) {
            compressionProgram = innerInstr.programId;
            break;
          }
        }
        if (compressionProgram) break;
      }
    }
  }

  // Fallback: if mintAuthority is still empty, use feePayer
  if (!mintAuthority && feePayer) {
    mintAuthority = feePayer;
  }
  
  // Extract innerInstructions from instructions
  const innerInstructions = instructions && instructions.length > 0
    ? instructions.flatMap((instr: Instruction) => instr.innerInstructions || [])
    : [];

  // Extract accounts from instructions
  const accounts = instructions && instructions.length > 0
    ? instructions.flatMap((instr: Instruction) => instr.accounts || [])
    : [];

  // Extract data from main instruction
  const data = mainInstruction ? mainInstruction.data || "" : "";
  
  // Enrich the metadata with additional information
  const enrichedMetadata = {
    ...metadata,
    assetId,
    tokenStandard,
    source,
    mintedAt: timestamp,
    mintAuthority,
    owner,
    leafIndex,
    treeId,
    merkleTree,
    // Add token identifier from description if available
    tokenIdentifier: description?.match(/#\d+/)?.[0] || '',
  };
  
  // Format the data according to the CompressedMintNFT model structure
  return {
    signature,
    // For compressed NFTs, the mint is typically the assetId
    mint: mint || assetId || "",
    tokenStandard: tokenStandard || "NonFungible",
    mintAuthority: mintAuthority || feePayer || "",
    owner: owner || "",
    metadata: enrichedMetadata,
    merkleTree: merkleTree || treeId || "",
    leafIndex: leafIndex || 0,
    slot,
    blockTime: timestamp,
    feePayer: feePayer || "",
    collection: collection || "",
    collectionVerified: collectionVerified || false,
    creators: creators || [],
    royalties: royalties || 0,
    name: name || "",
    symbol: symbol || "",
    uri: uri || "",
    txFee: fee ? fee / 1_000_000_000 : 0, // Convert lamports to SOL
    sellerFeeBasisPoints: sellerFeeBasisPoints || 0,
    treeAuthority: treeAuthority || "",
    compressionProgram: compressionProgram || "",
    assetId: assetId || "",
    compressedNFTMetadata: compressedNFTMetadata || metadata || {},
    canopyDepth: compressedEvent.canopyDepth || 0,
    proofPath: compressedEvent.proofPath || [],
    accountData: accountData || [],
    description: description || "",
    events: events || {},
    fee,
    instructions: instructions || [],
    nativeTransfers: nativeTransfers || [],
    source: source || "",
    timestamp,
    tokenTransfers: tokenTransfers || [],
    transactionError,
    type,
    // Better extracted fields
    programId,
    innerInstructions,
    accounts,
    data,
  };
};

