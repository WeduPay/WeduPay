const dashboardView = document.querySelector("#dashboard-view");
const merchantRegistry = window.WeduPayMerchants || [];
const paymentOptions = window.WeduPayPaymentOptions || { providersByCountry: {}, currenciesByCountry: {} };
const previewBanner = document.querySelector("#dashboard-preview-banner");
if (new URLSearchParams(window.location.search).get("demo") === "1") {
  const message = createElement("p");
  message.append(createElement("strong", "", "Fictional demo session. "));
  message.append(document.createTextNode("The sample number was accepted only to preview this dashboard; no phone verification or real sign-in occurred. No number was sent or saved."));
  previewBanner.replaceChildren(createElement("span", "", "i"), message);
}
function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function pageHeading(eyebrow, title, description) {
  const header = createElement("header", "dashboard-page-heading");
  header.append(createElement("p", "dashboard-eyebrow", eyebrow));
  header.append(createElement("h1", "", title));
  header.append(createElement("p", "dashboard-page-description", description));
  return header;
}

function previewCallout(message) {
  return `<div class="dashboard-callout"><span aria-hidden="true">i</span><p>${message}</p></div>`;
}

function merchantCard(merchant) {
  const icon = merchant.group === "education" ? "E" : merchant.group === "digital" ? "D" : "S";
  const action = merchant.enabled
    ? `<a class="dashboard-card-action" href="#pay/${merchant.id}">${merchant.action}<span aria-hidden="true">→</span></a>`
    : `<span class="dashboard-card-action is-disabled">${merchant.action}</span>`;

  return `<article class="merchant-card">
    <div class="merchant-card-top"><span class="merchant-icon" aria-hidden="true">${icon}</span><span class="merchant-status">${merchant.status}</span></div>
    <p class="merchant-category">${merchant.category}</p>
    <h3>${merchant.name}</h3>
    <p class="merchant-description">${merchant.description}</p>
    <p class="merchant-region">Country availability not established</p>
    ${action}
  </article>`;
}

function merchantsFor(group) {
  return merchantRegistry.filter((merchant) => !group || merchant.group === group);
}

function merchantDirectory(group) {
  const title = group === "education" ? "Education payments"
    : group === "digital" ? "Digital services"
    : group === "ecommerce" ? "E-commerce"
    : "Merchant directory";
  const description = group === "education"
    ? "Explore the proposed tuition payment use case. No institution is connected to WeduPay."
    : group === "digital"
      ? "These subscription services are concepts for future consideration, not active payment routes."
      : group === "ecommerce"
        ? "Explore potential future online shopping payment routes. No checkout integrations are active."
        : "Browse the proposed merchant ecosystem. All entries are explicitly marked with their current development status.";
  const grid = merchantsFor(group).map(merchantCard).join("");
  return `${pageHeading("Discover", title, description).outerHTML}
    ${previewCallout("Merchant names are shown for planning only; they do not imply endorsement, an agreement, or an active integration.")}
    <div class="merchant-grid">${grid}</div>`;
}

function overview() {
  const education = merchantRegistry.find((merchant) => merchant.id === "byu-pathway");
  return `${pageHeading("Overview", "Welcome to WeduPay", "What would you like to explore today?").outerHTML}
    <section class="dashboard-welcome-panel">
      <div><p class="dashboard-eyebrow">A simpler way to access digital payments</p><h2>Your mobile money.<br><span>More connected.</span></h2><p>We’re building a bridge between African mobile money and global digital payments, starting with education.</p><a class="dashboard-primary-link" href="#education">Explore education payments <span aria-hidden="true">→</span></a></div>
      <div class="welcome-visual" aria-hidden="true"><div class="welcome-orbit orbit-a"></div><div class="welcome-orbit orbit-b"></div><div class="welcome-phone"><span>W</span><i></i><i></i><b>••••</b></div><div class="welcome-node node-wallet">Mobile money</div><div class="welcome-node node-study">Education</div></div>
    </section>
    <div class="dashboard-action-grid">
      <a class="dashboard-action-card" href="#education"><span class="action-card-icon">▤</span><strong>Education Payments</strong><small>Explore the tuition flow preview</small><span class="action-arrow">→</span></a>
      <a class="dashboard-action-card" href="#merchants"><span class="action-card-icon">◈</span><strong>Browse Merchants</strong><small>Explore planned merchant routes</small><span class="action-arrow">→</span></a>
      <a class="dashboard-action-card" href="#digital"><span class="action-card-icon">◉</span><strong>Digital Services</strong><small>See concepts for future services</small><span class="action-arrow">→</span></a>
      <a class="dashboard-action-card" href="#ecommerce"><span class="action-card-icon">▦</span><strong>Explore E-commerce</strong><small>See planned shopping routes</small><span class="action-arrow">→</span></a>
    </div>
    <div class="dashboard-section-heading"><div><p class="dashboard-eyebrow">Your account</p><h2>Dashboard at a glance</h2></div></div>
    <div class="dashboard-summary-grid">
      <article class="dashboard-summary-card"><span>Recent transactions</span><strong>—</strong><small>No transaction history</small></article>
      <article class="dashboard-summary-card"><span>Saved payment methods</span><strong>—</strong><small>No methods connected</small></article>
      <article class="dashboard-summary-card"><span>Payment channels</span><strong>0 live</strong><small>Integrations not active</small></article>
      <article class="dashboard-summary-card"><span>Payment activity</span><strong>—</strong><small>No activity to show</small></article>
    </div>
    <div class="dashboard-section-heading merchant-section-heading"><div><p class="dashboard-eyebrow">First use case</p><h2>Starting with education</h2></div><a href="#education">View education <span aria-hidden="true">→</span></a></div>
    <div class="merchant-grid">${merchantCard(education)}</div>`;
}

function emptyPage(route) {
  if (route === "transactions") {
    return `${pageHeading("Activity", "Transactions", "A future account would show payment activity and status updates here.").outerHTML}
      <div class="empty-state"><span class="empty-state-icon">↗</span><h2>No transactions yet</h2><p>There is no payment history to show. WeduPay is still developing its payment infrastructure; no payments can be made from this preview.</p></div>`;
  }
  if (route === "payment-methods") {
    return `${pageHeading("Your preferences", "Payment methods", "Future payment options would be connected through authorised mobile money providers.").outerHTML}
      ${previewCallout("WeduPay does not hold a wallet or funds. No provider is connected, and payment details cannot be saved in this preview.")}
      <div class="empty-state"><span class="empty-state-icon">◌</span><h2>No payment methods connected</h2><p>Mobile money provider connections are being explored. Nothing is connected or ready for payment.</p></div>`;
  }
  if (route === "profile") {
    return `${pageHeading("Your account", "Profile & settings", "Account management will be available when WeduPay authentication is implemented.").outerHTML}
      <div class="empty-state"><span class="empty-state-icon">○</span><h2>No customer profile</h2><p>This public dashboard preview has no signed-in user. No name, email, phone number, or preferences are stored.</p><a class="dashboard-outline-link" href="/sign-in.html">Open phone sign-in preview</a></div>`;
  }
  return `${pageHeading("We’re here to help", "Help & support", "WeduPay is in development. Reach out through the early-interest form while we prepare the service.").outerHTML}
    <div class="dashboard-help-grid">
      <article class="dashboard-help-card"><span class="action-card-icon">?</span><h2>About this preview</h2><p>Explore the proposed customer experience. No account, merchant integration, or mobile-money provider connection is active.</p></article>
      <article class="dashboard-help-card"><span class="action-card-icon">✉</span><h2>Get in touch</h2><p>Join the waitlist to share your interest. Do not send PINs, passwords, or payment credentials.</p><a class="dashboard-outline-link" href="/#waitlist">Visit the early access waitlist</a></article>
    </div>`;
}

function paymentForm(merchant) {
  const form = document.createElement("form");
  form.className = "payment-preview-form";
  form.id = "payment-preview-form";
  form.innerHTML = `<label for="payment-country">Your country</label>
    <select id="payment-country" name="country" required>
      <option value="">Select a country</option>
      <option>Zimbabwe</option><option>Zambia</option><option>Malawi</option><option>Mozambique</option>
    </select>
    <label for="student-reference">Student reference</label>
    <input id="student-reference" name="reference" type="text" maxlength="80" autocomplete="off" placeholder="Enter a demo reference" required>
    <p class="payment-field-note">This stays in your browser and is not sent to WeduPay. Do not enter a password or login credentials.</p>
    <label for="payment-amount">Intended payment amount</label>
    <input id="payment-amount" name="amount" type="number" min="0.01" max="1000000" step="0.01" inputmode="decimal" placeholder="0.00" required>
    <label for="payment-currency">Currency</label>
    <select id="payment-currency" name="currency" required disabled><option value="">Select country first</option></select>
    <label for="payment-provider">Mobile money provider</label>
    <select id="payment-provider" name="provider" required disabled><option value="">Select country first</option></select>
    <label for="payment-phone">Registered phone number</label>
    <input id="payment-phone" name="phone" type="tel" inputmode="tel" maxlength="32" autocomplete="off" placeholder="Provider-registered number" required>
    <p class="payment-field-note">Choose explicitly. WeduPay does not infer a wallet from your number. Provider names are examples only and are not connected. The sandbox stores a time-limited demo record and random reference, not your phone number or student reference.</p>
    <button class="dashboard-primary-link" type="submit">Create demo preview <span aria-hidden="true">→</span></button>
    <p class="payment-form-status" id="payment-form-status" role="status" aria-live="polite" hidden></p>`;
  form.dataset.merchant = merchant.id;
  form.addEventListener("input", () => {
    delete form.dataset.idempotencyKey;
  });
  return form;
}

function paymentPreview(merchant) {
  const screen = document.createElement("div");
  screen.append(pageHeading("Payment journey · Preview", `Explore ${merchant.name}`, "This is a non-submitting concept preview. It does not contact a merchant or mobile money provider."));
  screen.insertAdjacentHTML("beforeend", previewCallout("No payment will be initiated. Fees and exchange rates are not available, and no payment provider is connected."));
  const grid = createElement("div", "payment-preview-grid");
  const panel = createElement("section", "payment-preview-panel");
  panel.append(createElement("p", "dashboard-eyebrow", "Step 1 of 2"));
  panel.append(createElement("h2", "", "Enter demo payment details"));
  panel.append(createElement("p", "payment-panel-intro", "Fields are used only to preview the proposed review step in this browser."));
  panel.append(paymentForm(merchant));
  const side = createElement("aside", "payment-info-panel");
  side.append(createElement("span", "payment-info-icon", "▤"));
  side.append(createElement("h2", "", "Tuition payment concept"));
  side.append(createElement("p", "", "This preview records a demonstration request only. It never contacts a provider, asks for a PIN, moves funds, or confirms a merchant payment."));
  side.append(createElement("p", "payment-info-warning", "Do not enter real account passwords, PINs, or sensitive information."));
  grid.append(panel, side);
  screen.append(grid);
  return screen;
}

function showReview(details, merchant, preview) {
  dashboardView.replaceChildren();
  const back = createElement("a", "dashboard-back-link", "← Edit demo details");
  back.href = `#pay/${merchant.id}`;
  dashboardView.append(back);
  dashboardView.append(pageHeading("Payment journey · Demonstration", "Demo request created", "This is a demonstration record, not a payment. Nothing was sent to a merchant or provider."));
  dashboardView.insertAdjacentHTML("beforeend", previewCallout("DEMONSTRATION ONLY. No payment instruction was submitted, no provider authorisation was requested, and no funds moved. Fees and exchange rates are not calculated."));
  const review = createElement("section", "payment-review-card");
  review.append(createElement("p", "dashboard-eyebrow", "DEMONSTRATION · No real payment"));
  review.append(createElement("h2", "", merchant.name));
  const demoReference = createElement("p", "sandbox-demo-reference", `Demo reference: ${preview.id}`);
  review.append(demoReference);
  const rows = [
    ["Student reference", details.reference],
    ["Country", details.country],
    ["Amount entered", `${details.amount} ${details.currency}`],
    ["Provider selected", details.provider],
    ["Registered phone number", details.phone],
    ["Request status", "Preview created — no payment started"],
    ["Provider instruction", "Not sent"],
    ["Customer authorisation", "Not requested"],
    ["Customer debit", "Not performed"],
    ["Merchant payment", "Not confirmed"],
    ["Settlement", "Not initiated"],
  ];
  const list = createElement("dl", "payment-review-list");
  for (const [label, value] of rows) {
    const row = createElement("div", "payment-review-row");
    row.append(createElement("dt", "", label), createElement("dd", "", value));
    list.append(row);
  }
  review.append(list);
  const warning = createElement("p", "payment-form-status");
  warning.setAttribute("role", "status");
  warning.textContent = "The demo record expires after seven days and is purged on a later sandbox request. No provider integration is active. The phone number and student reference shown above were not sent to or stored by the sandbox API.";
  review.append(warning);
  dashboardView.append(review);
  const journey = createElement("section", "sandbox-journey");
  journey.append(createElement("h2", "", "Fund movement journey"));
  journey.append(createElement("p", "sandbox-journey-note", "WeduPay coordinates a future payment flow; it does not hold customer funds. No fund movement has occurred in this demonstration."));
  const createdEvent = preview.events?.find((item) => item.type === "DEMO_PREVIEW_CREATED");
  const stages = [
    ["Demo preview record created", createdEvent ? "SIMULATED · NOT A PAYMENT" : "NOT RECORDED"],
    ["Instruction submitted to provider", "NOT PERFORMED"],
    ["Customer authorisation", "NOT PERFORMED"],
    ["Provider debit confirmation", "NOT PERFORMED"],
    ["Merchant payment confirmation", "NOT PERFORMED"],
    ["Merchant settlement", "NOT PERFORMED"],
  ];
  const timeline = createElement("ol", "sandbox-journey-list");
  stages.forEach(([label, status], index) => {
    const item = createElement("li", index === 0 ? "is-demo-event" : "is-not-performed");
    item.append(createElement("span", "journey-step-dot", ""));
    const content = createElement("div", "journey-step-content");
    content.append(createElement("strong", "", label));
    content.append(createElement("small", "", status));
    item.append(content);
    timeline.append(item);
  });
  journey.append(timeline);
  if (createdEvent?.createdAt) {
    journey.append(createElement("p", "sandbox-journey-timestamp", `Demo record created ${new Date(createdEvent.createdAt).toLocaleString()}. This timestamp applies only to the demonstration record.`));
  }
  dashboardView.append(journey);
}

function pageForRoute(route) {
  if (route === "overview") return overview();
  if (route === "merchants") return merchantDirectory();
  if (route === "education") return merchantDirectory("education");
  if (route === "digital") return merchantDirectory("digital");
  if (route === "ecommerce") return merchantDirectory("ecommerce");
  if (["transactions", "payment-methods", "profile", "help"].includes(route)) return emptyPage(route);
  return overview();
}

function currentRoute() {
  const route = window.location.hash.replace(/^#/, "") || "overview";
  const aliases = {
    "merchant-directory": "merchants",
    "digital-services": "digital",
    "e-commerce": "ecommerce",
  };
  return aliases[route] || route;
}

function renderDashboard() {
  const route = currentRoute();
  const activeRoute = route.startsWith("pay/") ? "education" : route;
  document.querySelectorAll(".dashboard-nav a").forEach((link) => {
    const active = link.dataset.route === activeRoute;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  if (route.startsWith("pay/")) {
    const merchant = merchantRegistry.find((item) => item.id === route.slice(4));
    if (merchant?.enabled) dashboardView.replaceChildren(paymentPreview(merchant));
    else dashboardView.innerHTML = pageForRoute("education");
  } else {
    dashboardView.innerHTML = pageForRoute(route);
  }
  document.querySelector("#dashboard-sidebar").classList.remove("is-open");
  document.querySelector("#dashboard-menu-toggle").setAttribute("aria-expanded", "false");
}

window.addEventListener("hashchange", renderDashboard);
renderDashboard();

document.querySelector("#dashboard-menu-toggle").addEventListener("click", (event) => {
  const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
  event.currentTarget.setAttribute("aria-expanded", String(!expanded));
  document.querySelector("#dashboard-sidebar").classList.toggle("is-open", !expanded);
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const merchantLink = target.closest('a[href^="#pay/"]');
  if (merchantLink) {
    event.preventDefault();
    window.location.hash = merchantLink.getAttribute("href").slice(1);
    return;
  }
  const routeLink = target.closest(".dashboard-nav a");
  if (routeLink && window.matchMedia("(max-width: 760px)").matches) {
    document.querySelector("#dashboard-sidebar").classList.remove("is-open");
    document.querySelector("#dashboard-menu-toggle").setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "payment-country") {
    const providerSelect = document.querySelector("#payment-provider");
    providerSelect.replaceChildren(new Option("Select a provider example", ""));
    (paymentOptions.providersByCountry[event.target.value] || []).forEach((provider) => {
      providerSelect.add(new Option(provider, provider));
    });
    providerSelect.disabled = !event.target.value;

    const currencySelect = document.querySelector("#payment-currency");
    currencySelect.replaceChildren(new Option("Select currency", ""));
    (paymentOptions.currenciesByCountry[event.target.value] || []).forEach((currency) => {
      currencySelect.add(new Option(currency, currency));
    });
    currencySelect.disabled = !event.target.value;
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id !== "payment-preview-form") return;
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const amount = String(data.get("amount")).trim();
  const status = document.querySelector("#payment-form-status");
  if (!String(data.get("reference")).trim() || !String(data.get("phone")).trim()) {
    status.textContent = "Enter the required reference and registered phone number.";
    status.hidden = false;
    return;
  }
  if (!/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    status.textContent = "Enter an amount between 0.01 and 1,000,000.";
    status.hidden = false;
    return;
  }
  const merchant = merchantRegistry.find((item) => item.id === form.dataset.merchant && item.enabled);
  if (!merchant) return;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Creating demo preview…";
  status.hidden = true;
  try {
    const response = await fetch("/api/v1/sandbox-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Idempotency-Key": form.dataset.idempotencyKey || (form.dataset.idempotencyKey = crypto.randomUUID()),
      },
      body: JSON.stringify({
        merchantId: merchant.id,
        country: String(data.get("country")),
        amount,
        currency: String(data.get("currency")),
        provider: String(data.get("provider")),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "The sandbox is unavailable. No demo record or payment was created.");
    }
    const lookupResponse = await fetch(`/api/v1/sandbox-payment/${encodeURIComponent(result.id)}`, {
      headers: { Accept: "application/json" },
    });
    const persistedPreview = await lookupResponse.json().catch(() => ({}));
    if (!lookupResponse.ok) {
      throw new Error(persistedPreview.error || "The demo record was created but could not be loaded. No payment was initiated.");
    }
    showReview({
      country: persistedPreview.country,
      reference: String(data.get("reference")).trim(),
      amount: String(persistedPreview.amount),
      currency: persistedPreview.currency,
      provider: persistedPreview.provider,
      phone: String(data.get("phone")).trim(),
    }, merchant, persistedPreview);
  } catch (error) {
    console.error("Sandbox preview request failed.", error);
    status.textContent = `${error.message || "The sandbox is unavailable."} No payment was initiated, and your phone number and student reference were not sent.`;
    status.hidden = false;
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.innerHTML = 'Create demo preview <span aria-hidden="true">→</span>';
    }
  }
});
