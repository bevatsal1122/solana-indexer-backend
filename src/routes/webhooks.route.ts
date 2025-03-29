import express, { Router, Request, Response } from "express";
import { TransactionType, WebhookType, Address, TxnStatus, Helius } from "helius-sdk";

const helius = new Helius("fdfd8c30-b1fd-4121-adec-94623d6ba124");

const router: Router = express.Router();

// POST /webhooks/logs/:eventType
router.post("/logs/:eventType", (req: Request, res: Response) => {
  const body = req.body;
  const headers = req.headers;
  console.log(body);
  console.log(headers);

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    body: body,
    headers: headers,
  });
});

// Just for admin purpose and testing
router.post("/create", (req: Request, res: Response) => {
  helius.createWebhook({
    accountAddresses: [
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    ],
    authHeader: "bevats15",
    webhookURL: "https://solana-indexer-backend.onrender.com/api/webhooks",
    webhookType: WebhookType.RAW_DEVNET,
    transactionTypes: [
      TransactionType.NFT_BID,
      TransactionType.NFT_SALE,
      TransactionType.NFT_MINT
    ],
    txnStatus: TxnStatus.SUCCESS,
    
  });

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
