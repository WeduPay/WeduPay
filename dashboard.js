const dashboardView = document.querySelector("#dashboard-view");
const merchantRegistry = window.WeduPayMerchants || [];
const previewBanner = document.querySelector("#dashboard-preview-banner");
if (new URLSearchParams(window.location.search).get("demo") === "1") {
  const message = createElement("p");
  message.append(createElement("strong", "", "Fictional demo session. "));
  message.append(document.createTextNode("The sample number was accepted only to preview this dashboard; no phone verification or real sign-in occurred. No number was sent or saved."));
  previewBanner.replaceChildren(createElement("span", "", "i"), message);
}
const countryProviders = {
  Zimbabwe: ["EcoCash", "InnBucks", "Mukuru Wallet", "OMari"],
  Zambia: ["MTN MoMo", "Airtel Money", "Zamtel Kwacha"],
  Malawi: ["Airtel Money", "TNM Mpamba"],
  Mozambique: ["M-Pesa", "e-Mola", "Mkesh"],
};

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
    <p class="payment-field-note">Do not enter your password or any account login credentials. This preview does not send or save the reference.</p>
    <label for="payment-amount">Intended payment amount</label>
    <input id="payment-amount" name="amount" type="number" min="0.01" max="1000000" step="0.01" inputmode="decimal" placeholder="0.00" required>
    <label for="payment-currency">Currency</label>
    <select id="payment-currency" name="currency" required><option value="">Select currency</option><option>USD</option><option>ZWL</option><option>ZMW</option><option>MWK</option><option>MZN</option><option>ZAR</option></select>
    <label for="payment-provider">Mobile money provider</label>
    <select id="payment-provider" name="provider" required disabled><option value="">Select country first</option></select>
    <label for="payment-phone">Registered phone number</label>
    <input id="payment-phone" name="phone" type="tel" inputmode="tel" maxlength="32" autocomplete="off" placeholder="Provider-registered number" required>
    <p class="payment-field-note">Choose your provider explicitly. WeduPay does not infer a wallet from your number. The provider list contains examples only; no option is connected.</p>
    <button class="dashboard-primary-link" type="submit">Review demo details <span aria-hidden="true">→</span></button>
    <p class="payment-form-status" id="payment-form-status" role="status" aria-live="polite" hidden></p>`;
  form.dataset.merchant = merchant.id;
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
  side.append(createElement("p", "", "The future service would require verified merchant requirements and an authorised provider integration before accepting a payment."));
  side.append(createElement("p", "payment-info-warning", "Do not enter real account passwords, PINs, or sensitive information."));
  grid.append(panel, side);
  screen.append(grid);
  return screen;
}

function showReview(details, merchant) {
  dashboardView.replaceChildren();
  const back = createElement("a", "dashboard-back-link", "← Edit demo details");
  back.href = `#pay/${merchant.id}`;
  dashboardView.append(back);
  dashboardView.append(pageHeading("Payment journey · Preview", "Review payment details", "This review is local to your browser. Nothing has been submitted."));
  dashboardView.insertAdjacentHTML("beforeend", previewCallout("Fees: not available. Exchange rate: not available. Total payable cannot be calculated. No provider authorisation is available."));
  const review = createElement("section", "payment-review-card");
  review.append(createElement("p", "dashboard-eyebrow", "Demo review only"));
  review.append(createElement("h2", "", merchant.name));
  const rows = [
    ["Student reference", details.reference],
    ["Country", details.country],
    ["Amount entered", `${details.amount} ${details.currency}`],
    ["Provider selected", details.provider],
    ["Registered phone number", details.phone],
    ["Fees", "Not calculated"],
    ["Exchange rate", "Not available"],
    ["Total payable", "Not calculated"],
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
  warning.textContent = "No payment will be made. WeduPay has no active provider integration and cannot authorise this payment.";
  review.append(warning);
  dashboardView.append(review);
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
  if (event.target.id !== "payment-country") return;
  const providerSelect = document.querySelector("#payment-provider");
  providerSelect.replaceChildren(new Option("Select a provider example", ""));
  (countryProviders[event.target.value] || []).forEach((provider) => {
    providerSelect.add(new Option(provider, provider));
  });
  providerSelect.disabled = !event.target.value;
});

document.addEventListener("submit", (event) => {
  if (event.target.id !== "payment-preview-form") return;
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const amount = Number(data.get("amount"));
  const status = document.querySelector("#payment-form-status");
  if (!String(data.get("reference")).trim() || !String(data.get("phone")).trim()) {
    status.textContent = "Enter the required reference and registered phone number.";
    status.hidden = false;
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    status.textContent = "Enter an amount between 0.01 and 1,000,000.";
    status.hidden = false;
    return;
  }
  const merchant = merchantRegistry.find((item) => item.id === form.dataset.merchant && item.enabled);
  if (!merchant) return;
  showReview({
    country: String(data.get("country")),
    reference: String(data.get("reference")).trim(),
    amount: amount.toFixed(2),
    currency: String(data.get("currency")),
    provider: String(data.get("provider")),
    phone: String(data.get("phone")).trim(),
  }, merchant);
});
