const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

const LU2_ORIGIN = "https://www.lookmovie2.to";
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

exports.lu2Proxy = onRequest({ region: "us-central1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const incomingPath = req.originalUrl || req.url || "/";
    const targetPath = incomingPath.replace(/^\/lu2-api/, "") || "/";
    const targetUrl = new URL(targetPath, LU2_ORIGIN);

    const forwardHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const headerName = key.toLowerCase();
      if (HOP_BY_HOP_HEADERS.has(headerName) || typeof value === "undefined") {
        continue;
      }
      forwardHeaders[key] = Array.isArray(value) ? value.join(",") : String(value);
    }

    forwardHeaders["accept-encoding"] = "identity";

    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      redirect: "follow",
    });

    res.status(upstreamResponse.status);
    upstreamResponse.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const body = Buffer.from(await upstreamResponse.arrayBuffer());
    res.send(body);
  } catch (error) {
    logger.error("LU2 proxy failed", error);
    res.status(502).json({ error: "Failed to fetch LU2 upstream" });
  }
});
