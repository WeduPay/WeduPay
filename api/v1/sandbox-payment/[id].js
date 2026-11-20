const {
  isUuid,
  send,
  supabaseConfiguration,
  supabaseRequest,
} = require("../../../lib/sandbox-payment");

module.exports = async (request, response) => {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return send(response, 405, { error: "Method not allowed." });
  }

  if (process.env.PAYMENTS_SANDBOX_ENABLED !== "true" || !supabaseConfiguration()) {
    return send(response, 503, { error: "The sandbox is unavailable." });
  }
  const id = request.query.id;
  if (!isUuid(id)) return send(response, 400, { error: "Invalid demo reference." });

  const origin = request.headers.origin;
  if (origin && origin !== process.env.PAYMENTS_SANDBOX_ALLOWED_ORIGIN) {
    return send(response, 403, { error: "This sandbox request is not allowed." });
  }

  try {
    const purgeResult = await supabaseRequest("rpc/purge_expired_sandbox_payment_previews", { method: "POST" });
    if (!purgeResult.ok) {
      console.error("Expired sandbox preview cleanup failed.", { status: purgeResult.status });
      return send(response, 503, { error: "The demo record could not be loaded." });
    }

    const query = `sandbox_payment_previews?id=eq.${encodeURIComponent(id)}&select=id,merchant_id,country,provider,amount,currency,status,created_at,expires_at`;
    const result = await supabaseRequest(query);
    if (!result.ok) {
      console.error("Sandbox preview lookup failed.", { status: result.status });
      return send(response, 503, { error: "The demo record could not be loaded." });
    }
    const rows = await result.json();
    const preview = Array.isArray(rows) ? rows[0] : null;
    if (!preview || new Date(preview.expires_at).getTime() <= Date.now()) {
      return send(response, 404, { error: "This demo record has expired or does not exist." });
    }

    const eventResult = await supabaseRequest(
      `sandbox_payment_preview_events?preview_id=eq.${encodeURIComponent(id)}&select=event_type,event_status,created_at&order=created_at.asc`,
    );
    if (!eventResult.ok) {
      console.error("Sandbox preview event lookup failed.", { status: eventResult.status });
      return send(response, 503, { error: "The demo timeline could not be loaded." });
    }
    const events = await eventResult.json();
    return send(response, 200, {
      id: preview.id,
      environment: "DEMONSTRATION",
      status: preview.status,
      merchantId: preview.merchant_id,
      country: preview.country,
      provider: preview.provider,
      amount: preview.amount,
      currency: preview.currency,
      createdAt: preview.created_at,
      expiresAt: preview.expires_at,
      events: events.map((event) => ({
        type: event.event_type,
        status: event.event_status,
        createdAt: event.created_at,
      })),
      fundMovement: "NOT_PERFORMED",
    });
  } catch (error) {
    console.error("Sandbox preview lookup failed.", error);
    return send(response, 503, { error: "The demo record is temporarily unavailable." });
  }
};
