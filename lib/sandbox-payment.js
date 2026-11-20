const { merchants, providersByCountry, currenciesByCountry } = require("../merchant-registry");

const rateLimitScript = `
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
  return count
`;

function send(response, status, body) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  return response.status(status).json(body);
}

function readBody(request) {
  if (typeof request.body === "string") {
    try {
      return JSON.parse(request.body);
    } catch {
      return null;
    }
  }
  return request.body;
}

function isUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validateInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const merchantId = typeof input.merchantId === "string" ? input.merchantId : "";
  const country = typeof input.country === "string" ? input.country : "";
  const amount = typeof input.amount === "string" ? input.amount : "";
  const currency = typeof input.currency === "string" ? input.currency : "";
  const provider = typeof input.provider === "string" ? input.provider : "";
  const merchant = merchants.find((item) => item.id === merchantId && item.id === "byu-pathway");

  if (!merchant ||
      !(providersByCountry[country] || []).includes(provider) ||
      !(currenciesByCountry[country] || []).includes(currency) ||
      !/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(amount) ||
      Number(amount) <= 0 ||
      Number(amount) > 1_000_000) {
    return null;
  }

  return { merchantId, country, amount, currency, provider };
}

async function checkOriginAndRateLimit(request, response) {
  const allowedOrigin = process.env.PAYMENTS_SANDBOX_ALLOWED_ORIGIN;
  if (!allowedOrigin || request.headers.origin !== allowedOrigin) {
    send(response, 403, { error: "This sandbox request is not allowed." });
    return false;
  }

  const forwardedFor = request.headers["x-forwarded-for"];
  const ip = typeof forwardedFor === "string"
    ? forwardedFor.split(",").map((value) => value.trim()).filter(Boolean).pop()
    : "";
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!ip || !redisUrl || !redisToken) {
    send(response, 503, { error: "The sandbox is not configured. No demo record was created." });
    return false;
  }

  try {
    const result = await fetch(redisUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["EVAL", rateLimitScript, 1, `wedupay:sandbox:${ip}`, 600]),
    });
    if (!result.ok) throw new Error("Sandbox rate limiter unavailable.");
    const data = await result.json();
    const count = Number(data.result);
    if (!Number.isFinite(count)) throw new Error("Invalid sandbox rate-limit response.");
    if (count > 12) {
      send(response, 429, { error: "Too many demo requests. Please wait before trying again." });
      return false;
    }
    return true;
  } catch (error) {
    console.error("Sandbox rate-limit check failed.", error);
    send(response, 503, { error: "The sandbox is temporarily unavailable. No demo record was created." });
    return false;
  }
}

function supabaseConfiguration() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

async function supabaseRequest(path, options = {}) {
  const config = supabaseConfiguration();
  if (!config) throw new Error("The sandbox database is not configured.");
  return fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });
}

module.exports = {
  checkOriginAndRateLimit,
  isUuid,
  readBody,
  send,
  supabaseConfiguration,
  supabaseRequest,
  validateInput,
};
