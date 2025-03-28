import express, { Router, Request, Response } from "express";

const router: Router = express.Router();

// POST /api/webhooks
router.post("/", (req: Request, res: Response) => {
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

export default router;
