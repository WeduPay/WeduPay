const {
  checkOriginAndRateLimit,
  isUuid,
  readBody,
  send,
  supabaseConfiguration,
  supabaseRequest,
  validateInput,
} = require("../../lib/sandbox-payment");

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return send(response, 405, { error: "Method not allowed." });
  }

  if (process.env.PAYMENTS_SANDBOX_ENABLED !== "true") {
    return send(response, 503, { error: "The sandbox is disabled. No demo record or payment was created." });
  }

  const contentLength = Number(request.headers["content-length"] || 0);
  if (contentLength > 4_000) {
    return send(response, 413, { error: "The demo request is too large." });
  }

  const input = readBody(request);
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Buffer.byteLength(JSON.stringify(input), "utf8") > 4_000) {
    return send(response, 400, { error: "Please check the demo details and try again." });
  }

  if (!await checkOriginAndRateLimit(request, response)) return;

  const data = validateInput(input);
  const idempotencyKey = request.headers["idempotency-key"];
  if (!data || !isUuid(idempotencyKey)) {
    return send(response, 400, {
      error: "Choose an available demo merchant, country, currency, and provider, and try again.",
    });
  }

  if (!supabaseConfiguration()) {
    return send(response, 503, { error: "The sandbox database is not configured. No demo record was created." });
  }
  try {
    const result = await supabaseRequest("rpc/create_sandbox_payment_preview", {
      method: "POST",
      body: JSON.stringify({
        p_idempotency_key: idempotencyKey,
        p_merchant_id: data.merchantId,
        p_country: data.country,
        p_amount: data.amount,
        p_currency: data.currency,
        p_provider: data.provider,
      }),
    });
    if (!result.ok) {
      const errorText = await result.text();
      console.error("Sandbox preview creation failed.", {
        status: result.status,
        response: errorText.slice(0, 300),
      });
      return send(response, 503, { error: "The sandbox could not create a demo record. No payment was initiated." });
    }

    const rows = await result.json();
    const preview = Array.isArray(rows) ? rows[0] : null;
    if (!preview || !isUuid(preview.id)) {
      console.error("Sandbox preview RPC returned an invalid response.");
      return send(response, 503, { error: "The sandbox response was invalid. No payment was initiated." });
    }
    return send(response, 201, {
      id: preview.id,
      environment: "DEMONSTRATION",
      status: "PREVIEW_ONLY",
      createdAt: preview.created_at,
      expiresAt: preview.expires_at,
    });
  } catch (error) {
    console.error("Sandbox preview request failed.", error);
    return send(response, 503, { error: "The sandbox is temporarily unavailable. No payment was initiated." });
  }
};
