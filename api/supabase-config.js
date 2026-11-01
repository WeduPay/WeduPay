module.exports = (request, response) => {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    return response.status(503).json({
      error: "Sign-in isn't configured yet. Please check back soon.",
    });
  }

  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json({ url, anonKey });
};
