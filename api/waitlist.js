const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedCountries = new Set(["Zimbabwe", "South Africa", "Malawi", "Zambia", "Mozambique", "Other"]);
const businessTypes = new Set(["E-commerce", "Education", "Digital services", "Retail", "Other"]);
const institutionInterests = new Set([
  "Tuition collection options",
  "Student payment support",
  "Technical or partnership discussion",
  "Other",
]);
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

function readText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, maxLength);
}

function validEmail(value) {
  return value.length <= 254 && emailPattern.test(value);
}

function validateSubmission(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const audience = input.audience;
  const email = readText(input.email, 254).toLowerCase();
  const country = readText(input.country, 80);
  if (!["student", "merchant", "institution"].includes(audience) ||
      input.consent !== true || !validEmail(email) || !allowedCountries.has(country)) {
    return null;
  }

  const base = { audience, email, country };
  if (audience === "student") {
    const fullName = readText(input.fullName, 120);
    const phone = readText(input.phone, 32);
    if (!fullName || !phone || !/^\+?[0-9 ()-]{7,32}$/.test(phone)) {
      return null;
    }
    return {
      ...base,
      contact_name: fullName,
      details: { phone },
    };
  }

  if (audience === "merchant") {
    const businessName = readText(input.businessName, 160);
    const contactPerson = readText(input.contactPerson, 120);
    const businessType = readText(input.businessType, 80);
    if (!businessName || !contactPerson || !businessTypes.has(businessType)) {
      return null;
    }
    return {
      ...base,
      contact_name: contactPerson,
      details: { business_name: businessName, business_type: businessType },
    };
  }

  const institutionName = readText(input.institutionName, 160);
  const contactPerson = readText(input.contactPerson, 120);
  const interest = readText(input.interest, 100);
  if (!institutionName || !contactPerson || !institutionInterests.has(interest)) {
    return null;
  }
  return {
    ...base,
    contact_name: contactPerson,
    details: { institution_name: institutionName, interest },
  };
}

async function applyRateLimit(request, ip) {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    throw new Error("Waitlist rate limiting is not configured.");
  }

  const key = `wedupay:waitlist:${ip}`;
  const result = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["EVAL", rateLimitScript, 1, key, 600]),
  });
  if (!result.ok) {
    throw new Error("Waitlist rate limiting is unavailable.");
  }
  const data = await result.json();
  const count = Number(data.result);
  if (!Number.isFinite(count)) {
    throw new Error("Waitlist rate limiting returned an invalid response.");
  }
  return count <= 8;
}

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return send(response, 405, { error: "Method not allowed." });
  }

  if (process.env.WAITLIST_ENABLED !== "true") {
    return send(response, 503, {
      error: "The waitlist is not open yet. Your information was not saved.",
    });
  }

  const allowedOrigin = process.env.WAITLIST_ALLOWED_ORIGIN;
  const origin = request.headers.origin;
  if (!allowedOrigin || !origin || origin !== allowedOrigin) {
    return send(response, 403, { error: "This request is not allowed." });
  }

  const contentLength = Number(request.headers["content-length"] || 0);
  if (contentLength > 10_000) {
    return send(response, 413, { error: "The submitted form is too large." });
  }

  let input = request.body;
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      return send(response, 400, { error: "Please check the form and try again." });
    }
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return send(response, 400, { error: "Please check the form and try again." });
  }
  if (Buffer.byteLength(JSON.stringify(input), "utf8") > 10_000) {
    return send(response, 413, { error: "The submitted form is too large." });
  }

  if (readText(input.website, 200)) {
    return send(response, 200, { message: "Thank you. Your interest has been recorded." });
  }

  const forwardedFor = request.headers["x-forwarded-for"];
  const ip = typeof forwardedFor === "string"
    ? forwardedFor.split(",").map((value) => value.trim()).filter(Boolean).pop()
    : "";
  if (!ip) {
    return send(response, 503, { error: "The waitlist is temporarily unavailable. Please try again later." });
  }

  try {
    const withinLimit = await applyRateLimit(request, ip);
    if (!withinLimit) {
      return send(response, 429, { error: "Too many submissions. Please wait a few minutes and try again." });
    }
  } catch (error) {
    console.error("Waitlist rate-limit check failed.", error);
    return send(response, 503, { error: "The waitlist is temporarily unavailable. Please try again later." });
  }

  const submission = validateSubmission(input);
  if (!submission) {
    return send(response, 400, { error: "Please check the required fields and consent, then try again." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return send(response, 503, { error: "The waitlist is not configured yet. Your information was not saved." });
  }

  try {
    const databaseResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/waitlist?on_conflict=email,audience`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=minimal",
        },
        body: JSON.stringify({
          ...submission,
          consent_at: new Date().toISOString(),
        }),
      },
    );

    if (!databaseResponse.ok) {
      const errorText = await databaseResponse.text();
      console.error("Waitlist database insert failed.", {
        status: databaseResponse.status,
        response: errorText.slice(0, 500),
      });
      return send(response, 503, { error: "We couldn't save your interest just now. Please try again later." });
    }

    return send(response, 201, { message: "Thank you. Your interest has been recorded." });
  } catch (error) {
    console.error("Waitlist database request failed.", error);
    return send(response, 503, { error: "We couldn't save your interest just now. Please try again later." });
  }
};
