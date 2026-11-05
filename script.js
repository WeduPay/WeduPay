const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const waitlistForm = document.querySelector("#waitlist-form");
const waitlistFields = document.querySelector("#waitlist-fields");
const formStatus = document.querySelector("#form-status");
const signInForm = document.querySelector("#sign-in-form");
let submitting = false;

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    menuToggle.setAttribute("aria-label", expanded ? "Open navigation" : "Close navigation");
    navigation.classList.toggle("is-open", !expanded);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement && window.matchMedia("(max-width: 760px)").matches) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      navigation.classList.remove("is-open");
    }
  });
}

if (waitlistForm && waitlistFields && formStatus) {
  function showFormStatus(message, type = "error") {
    formStatus.textContent = message;
    formStatus.dataset.type = type;
    formStatus.hidden = false;
  }

  function selectedAudience() {
    return waitlistForm.querySelector('input[name="audience"]:checked')?.value || "student";
  }

  function renderFields(audience) {
    const template = document.querySelector(`#${audience}-fields`);
    if (!template) {
      return;
    }

    waitlistFields.replaceChildren(template.content.cloneNode(true));
  }

  document.querySelectorAll('input[name="audience"]').forEach((input) => {
    input.addEventListener("change", () => {
      renderFields(input.value);
      formStatus.hidden = true;
    });
  });

  function setLoading(loading) {
    const button = waitlistForm.querySelector('button[type="submit"]');
    button.disabled = loading;
    button.classList.toggle("is-loading", loading);
    submitting = loading;
  }

  waitlistForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatus.hidden = true;

    if (submitting) {
      return;
    }
    if (!waitlistForm.reportValidity()) {
      return;
    }

    const formData = new FormData(waitlistForm);
    const payload = {
      audience: selectedAudience(),
      consent: formData.get("consent") === "on",
      website: String(formData.get("website") || ""),
    };
    for (const [key, value] of formData.entries()) {
      if (key !== "audience" && key !== "consent" && key !== "website") {
        payload[key] = String(value).trim();
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        showFormStatus(result.error || "The waitlist is not open yet. Your information was not saved. Please try again later.");
        return;
      }

      waitlistForm.reset();
      renderFields("student");
      document.querySelector('input[name="audience"][value="student"]').checked = true;
      showFormStatus(result.message || "Thank you. Your interest has been recorded.", "success");
    } catch (error) {
      console.error("Waitlist submission failed.", error);
      showFormStatus("We couldn't connect to the waitlist. Your information was not confirmed as saved. Please try again later.");
    } finally {
      setLoading(false);
    }
  });

  renderFields("student");
}

if (signInForm) {
  signInForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = document.querySelector("#sign-in-status");
    const enteredNumber = document.querySelector("#sign-in-phone").value.replace(/\D/g, "");
    const demoNumber = "12025550147";

    if (enteredNumber === demoNumber) {
      window.location.assign("/dashboard.html?demo=1");
      return;
    }

    status.textContent = "That number isn't the fictional demo number shown above. No sign-in was performed, and nothing was sent or saved.";
    status.dataset.type = "error";
    status.hidden = false;
  });
}

const currentYear = document.querySelector("#current-year");
if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}
