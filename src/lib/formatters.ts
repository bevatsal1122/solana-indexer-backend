/**
 * Formatters for different types of webhook data coming from Helius
 * These functions map the raw webhook data to the appropriate database model schema
 */

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

  const nftEvent = events?.nft || {};
  const { 
    seller, 
    buyer, 
    amount, 
    nfts = [], 
    saleType = "",
    source: marketplaceSource 
  } = nftEvent;

  const nftInfo = nfts && nfts.length > 0 ? nfts[0] : {};
  const mint = nftInfo.mint || "";
  const tokenStandard = nftInfo.tokenStandard || "";

  const programId = instructions && instructions.length > 0 
    ? instructions[0].programId || "" 
    : "";

  const innerInstructions = instructions && instructions.length > 0
    ? instructions.flatMap((instr: Instruction) => instr.innerInstructions || [])
    : [];

  const accounts = instructions && instructions.length > 0
    ? instructions.flatMap((instr: Instruction) => instr.accounts || [])
    : [];

  const data = instructions && instructions.length > 0
    ? instructions[0].data || ""
    : "";

  const metadata = {
    ...(nftInfo.metadata || {}),
    nftInfo,
    tokenStandard
  };
  
  return {
    signature,
    mint,
    seller: seller || "",
    buyer: buyer || "",
    marketplace: marketplaceSource || source || "",
    price: amount ? amount / 1_000_000_000 : 0,
    currency: "SOL",
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

  const nftEvent = events?.nft || {};
  
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

  if (nftEvent.nfts && nftEvent.nfts.length > 0) {
    mint = nftEvent.nfts[0].mint || '';
    tokenStandard = nftEvent.nfts[0].tokenStandard || '';
  } else if (nftEvent.mint) {
    mint = nftEvent.mint;
    tokenStandard = nftEvent.tokenStandard || 'NonFungible';
  } 
  
  if (!mint && tokenTransfers && tokenTransfers.length > 0) {
    mint = tokenTransfers[0].mint || '';
    tokenStandard = tokenTransfers[0].tokenStandard || 'NonFungible';
  }

  if (nftEvent.owner) {
    owner = nftEvent.owner;
  } else if (tokenTransfers && tokenTransfers.length > 0 && tokenTransfers[0].toUserAccount) {
    owner = tokenTransfers[0].toUserAccount;
  } else if (nftEvent.buyer) {
    owner = nftEvent.buyer;
  }

  if (nftEvent.metadata) {
    metadata = nftEvent.metadata;
    
    if (metadata.name) name = metadata.name;
    if (metadata.symbol) symbol = metadata.symbol;
    if (metadata.uri) uri = metadata.uri;
  }

  if (!name && nftEvent.name) name = nftEvent.name;
  if (!symbol && nftEvent.symbol) symbol = nftEvent.symbol;
  if (!uri && nftEvent.uri) uri = nftEvent.uri;

  if (nftEvent.creators && Array.isArray(nftEvent.creators)) {
    creators = nftEvent.creators;
  } else if (metadata && metadata.creators && Array.isArray(metadata.creators)) {
    creators = metadata.creators;
  }

  if ((!creators || creators.length === 0) && feePayer) {
    creators = [{
      address: feePayer,
      share: 100,
      verified: true
    }];
  }
  
  const allInnerInstructions = instructions.flatMap((instr: Instruction) => instr.innerInstructions || []);
  if (allInnerInstructions.length > 0) {
    const tokenCreateInstructions = allInnerInstructions.filter((inner: any) => 
      inner.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' && 
      inner.accounts && 
      inner.accounts.length >= 3
    );
    
    if (tokenCreateInstructions.length > 0 && (!creators || creators.length === 0)) {
      const potentialCreatorAddresses = tokenCreateInstructions.flatMap((instr: any) => instr.accounts || []);
      
      const uniqueAddresses = [...new Set(potentialCreatorAddresses)] as string[];
      if (uniqueAddresses.length > 0) {
        const systemAddresses = [
          'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
          '11111111111111111111111111111111'
        ];
        
        const filteredAddresses = uniqueAddresses.filter(address => 
          !systemAddresses.includes(address) && address !== mint
        );
        
        if (filteredAddresses.length > 0 && (!creators || creators.length === 0)) {
          creators = filteredAddresses.map((addr, index) => ({
            address: addr,
            share: index === 0 ? 100 : 0,
            verified: index === 0
          }));
        }
      }
    }
  }

  if (nftEvent.collection) {
    collection = nftEvent.collection;
    collectionVerified = nftEvent.collectionVerified || false;
  } else if (metadata && metadata.collection) {
    collection = typeof metadata.collection === 'string' 
      ? metadata.collection 
      : metadata.collection.name || metadata.collection.key || '';
    collectionVerified = metadata.collectionVerified || false;
  }

  if (nftEvent.royalties !== undefined) {
    royalties = nftEvent.royalties;
  } else if (metadata && metadata.seller_fee_basis_points !== undefined) {
    sellerFeeBasisPoints = metadata.seller_fee_basis_points;
    royalties = sellerFeeBasisPoints / 100; // Convert basis points to percentage
  }

  mintAuthority = feePayer;

  // In Metaplex NFT mints, the mint authority might be set in a token transfer
  if (accountData && accountData.length > 0) {
    // Look for the token account with both mint and mintAuthority
    const mintAccounts = accountData.filter((acc: any) => acc.account === mint);
    if (mintAccounts.length > 0) {
      mintAuthority = feePayer;
    }
  }

  if (events.setAuthority && events.setAuthority.length > 0) {
    events.setAuthority.forEach((authEvent: any) => {
      if (authEvent.account === mint) {
        mintAuthority = authEvent.from || mintAuthority;
      }
    });
  }

  const metaplexInstructions = instructions.filter((instr: Instruction) => 
    instr.programId === 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );

  if (metaplexInstructions.length > 0) {
    const metadataInstruction = metaplexInstructions[0];
    
    if (metadataInstruction.data && metadataInstruction.data.length > 50) {
      try {
        const dataStr = metadataInstruction.data;
        
        // Look for pattern matches in the instruction data
        if (!name && dataStr.includes('name')) {
          const nameMatch = /name[^\w]+([a-zA-Z0-9_\s]+)/i.exec(dataStr);
          if (nameMatch && nameMatch[1]) {
            name = nameMatch[1].trim();
          }
        }
        
        if (!symbol && dataStr.includes('symbol')) {
          const symbolMatch = /symbol[^\w]+([a-zA-Z0-9_\s]+)/i.exec(dataStr);
          if (symbolMatch && symbolMatch[1]) {
            symbol = symbolMatch[1].trim();
          }
        }
        
        if (!uri && dataStr.includes('uri')) {
          const uriMatch = /uri[^\w]+(https?:\/\/[^\s"]+)/i.exec(dataStr);
          if (uriMatch && uriMatch[1]) {
            uri = uriMatch[1].trim();
          } else {
            const urlMatch = /(https?:\/\/[^\s"]+)/i.exec(dataStr);
            if (urlMatch && urlMatch[1]) {
              uri = urlMatch[1].trim();
            }
          }
        }
      } catch (error) {
        // Silent catch
      }
    }
    
    if (!name && description) {
      // NFT descriptions often include the NFT name in formats like "User minted NFT_NAME for X SOL"
      const nameMatch = description.match(/minted\s+([^#\s]+)/i);
      if (nameMatch && nameMatch[1]) {
        name = nameMatch[1].trim();
      }
      
      const tokenIdMatch = description.match(/#(\d+)/);
      if (tokenIdMatch && tokenIdMatch[1]) {
        if (!name) {
          name = `Token #${tokenIdMatch[1]}`;
        }
        
        if (!symbol) {
          const collectionMatch = description.match(/minted\s+([^#\s]+)\s+#\d+/i);
          if (collectionMatch && collectionMatch[1]) {
            symbol = collectionMatch[1].trim();
          }
        }
      }
    }
    
    if (!name && mint) {
      name = `NFT ${mint.slice(0, 8)}`;
    }
    
    if (!symbol && name) {
      const words = name.split(/\s+/);
      if (words.length > 1) {
        symbol = words.map(word => word[0].toUpperCase()).join('');
      } else {
        symbol = name.slice(0, Math.min(4, name.length)).toUpperCase();
      }
    }
    
    // If URI is still missing, check if it might be stored on-chain
    // Many Metaplex NFTs store metadata on Arweave or IPFS
    if (!uri) {
      if (mint) {
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

  const programId = metaplexInstructions.length > 0
    ? metaplexInstructions[0].programId || ""
    : instructions && instructions.length > 0 
      ? instructions[0].programId || "" 
      : "";

  const innerInstructions = instructions && instructions.length > 0
    ? instructions.flatMap((instr: Instruction) => instr.innerInstructions || [])
    : [];

  const accounts = instructions && instructions.length > 0
    ? instructions.flatMap((instr: Instruction) => instr.accounts || [])
    : [];

  const data = metaplexInstructions.length > 0
    ? metaplexInstructions[0].data || ""
    : instructions && instructions.length > 0
      ? instructions[0].data || ""
      : "";

  const enrichedMetadata = {
    ...metadata,
    tokenStandard,
    source,
    mintedAt: timestamp,
    mintAuthority,
    owner,
    tokenIdentifier: description?.match(/#\d+/)?.[0] || '',
  };
  
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
    txFee: fee ? fee / 1_000_000_000 : 0,
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

  let mint = '';
  let tokenStandard = '';
  
  if (nfts && nfts.length > 0) {
    mint = nfts[0].mint || '';
    tokenStandard = nfts[0].tokenStandard || '';
  } else if (nftEvent.mint) {
    mint = nftEvent.mint;
  } else {
    if (description && description.includes('#')) {
      const possibleMints = instructions.flatMap((instr: Instruction) => instr.accounts || []);
      const matches = description.match(/#\d+/);
      if (matches && matches.length > 0) {
        const tokenNumber = matches[0];
        console.log(`Found token number in description: ${tokenNumber}`);
      }
    }
    
    // If we have instructions data, look for the mint in the accounts list
    // In MAGIC_EDEN listings, the mint is typically the 5th account in the main instruction
    if (instructions && instructions.length > 0 && instructions[2] && instructions[2].accounts && instructions[2].accounts.length > 5) {
      mint = instructions[2].accounts[4] || '';
    }
  }

  const programId = instructions && instructions.length > 2
    ? instructions[2].programId || ""
    : instructions && instructions.length > 0 
      ? instructions[0].programId || "" 
      : "";

  const innerInstructions = instructions
    .filter((instr: Instruction) => instr.innerInstructions && Array.isArray(instr.innerInstructions))
    .flatMap((instr: Instruction) => instr.innerInstructions || []);

  const accounts = instructions
    .filter((instr: Instruction) => instr.accounts && Array.isArray(instr.accounts))
    .flatMap((instr: Instruction) => instr.accounts || []);
  
  const data = instructions && instructions.length > 2
    ? instructions[2].data || ""
    : instructions && instructions.length > 0
      ? instructions[0].data || ""
      : "";
  
  const metadata: Record<string, any> = {
    tokenStandard,
    source,
    saleType: saleType || '',
    listingProgram: programId,
    listedAt: timestamp,
    tokenIdentifier: description?.match(/#\d+/)?.[0] || '',
  };
  
  if (nftEvent.metadata) {
    metadata.nftMetadata = nftEvent.metadata;
  }
  
  if (accountData && accountData.length > 0) {
    const tokenAccounts = accountData.filter((acc: any) => 
      acc.tokenBalanceChanges && acc.tokenBalanceChanges.length > 0
    );
    
    if (tokenAccounts.length > 0) {
      metadata.tokenAccounts = tokenAccounts;
    }
  }
  
  return {
    signature,
    mint,
    seller: seller || "",
    marketplace: marketplace || source || "",
    price: amount ? amount / 1_000_000_000 : price ? price / 1_000_000_000 : 0, // First try amount, then price
    currency: "SOL",
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

  if (compressedEvent) {
    assetId = compressedEvent.assetId || '';
    leafIndex = compressedEvent.leafIndex || 0;
    treeId = compressedEvent.treeId || '';
    merkleTree = compressedEvent.treeId || '';
    treeAuthority = compressedEvent.treeDelegate || '';
    
    // Owner is usually in newLeafOwner
    owner = compressedEvent.newLeafOwner || '';
    
    // Mint authority is typically the tree delegate
    mintAuthority = compressedEvent.treeDelegate || feePayer || '';
    
    // For compressed NFTs, we use assetId as the mint identification
    mint = assetId || '';
    
    if (compressedEvent.metadata) {
      metadata = compressedEvent.metadata;
      compressedNFTMetadata = compressedEvent.metadata;
      
      name = metadata.name || '';
      symbol = metadata.symbol || '';
      uri = metadata.uri || '';
      tokenStandard = metadata.tokenStandard || 'NonFungible';
      sellerFeeBasisPoints = metadata.sellerFeeBasisPoints || 0;
      royalties = sellerFeeBasisPoints / 100;
      
      if (metadata.creators && Array.isArray(metadata.creators)) {
        creators = metadata.creators;
      }
      
      if (metadata.collection) {
        collection = metadata.collection.key || metadata.collection || '';
        collectionVerified = metadata.collection.verified || false;
      }
    }
  }

  const mainInstruction = instructions.length >= 3 ? instructions[2] : instructions[0];
  const programId = mainInstruction ? mainInstruction.programId || "" : "";
  
  const compressionProgramIds = [
    'cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK',
    'noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV'
  ];
  
  if (mainInstruction && mainInstruction.innerInstructions && mainInstruction.innerInstructions.length > 0) {
    const compressionInstrs = mainInstruction.innerInstructions.filter((instr: any) => 
      compressionProgramIds.includes(instr.programId)
    );
    
    if (compressionInstrs.length > 0) {
      compressionProgram = compressionInstrs[0].programId;
    }
  }
  
  if (!compressionProgram) {
    for (const instr of instructions) {
      if (instr.programId && compressionProgramIds.includes(instr.programId)) {
        compressionProgram = instr.programId;
        break;
      }
      
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

  if (!mintAuthority && feePayer) {
    mintAuthority = feePayer;
  }
  
  const innerInstructions = instructions && instructions.length > 0
    ? instructions.flatMap((instr: Instruction) => instr.innerInstructions || [])
    : [];

  const accounts = instructions && instructions.length > 0
    ? instructions.flatMap((instr: Instruction) => instr.accounts || [])
    : [];

  const data = mainInstruction ? mainInstruction.data || "" : "";
  
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
    tokenIdentifier: description?.match(/#\d+/)?.[0] || '',
  };
  
  return {
    signature,
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
    txFee: fee ? fee / 1_000_000_000 : 0,
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
    programId,
    innerInstructions,
    accounts,
    data,
  };
};
