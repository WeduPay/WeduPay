const authMessage = document.querySelector("#auth-message");
const authTitle = document.querySelector("#auth-title");
const authSubtitle = document.querySelector("#auth-subtitle");
const authForms = {
  login: document.querySelector("#sign-in-form"),
  signup: document.querySelector("#create-account-form"),
  forgot: document.querySelector("#forgot-password-form"),
  recovery: document.querySelector("#update-password-form"),
};
const signedInState = document.querySelector("#signed-in-state");
const rememberMe = document.querySelector("#remember-me");
const signupCredentials = document.querySelector(".signup-credentials");
const signupVerification = document.querySelector(".signup-verification");
const recoveryVerification = document.querySelector(".recovery-verification");
const recoveryPassword = document.querySelector(".recovery-password");
const authLabels = {
  login: ["Sign in to your account", "Pay online with the wallet you already use."],
  signup: ["Create your WeduPay account", "Get started with your mobile number."],
  forgot: ["Reset your password", "We'll text you a secure verification code."],
  recovery: ["Choose a new password", "Verify your phone number to reset your password."],
};
let mode = new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "login";
let supabaseClient;
let sessionSubscription;
let isSubmitting = false;
let pendingSignupPhone = "";
let pendingRecoveryPhone = "";
let recoveryPhoneVerified = false;

function showMessage(message, type = "error") {
  authMessage.textContent = message;
  authMessage.dataset.type = type;
  authMessage.hidden = false;
}

function clearMessage() {
  authMessage.hidden = true;
  authMessage.textContent = "";
  delete authMessage.dataset.type;
}

function setMode(nextMode) {
  if (!authForms[nextMode]) {
    return;
  }

  mode = nextMode;
  clearMessage();
  authTitle.textContent = authLabels[mode][0];
  authSubtitle.textContent = authLabels[mode][1];
  Object.entries(authForms).forEach(([name, form]) => {
    form.hidden = name !== mode;
  });
  if (mode === "signup") {
    signupCredentials.hidden = false;
    signupVerification.hidden = true;
  }
  if (mode === "recovery") {
    recoveryPhoneVerified = false;
    recoveryVerification.hidden = false;
    recoveryPassword.hidden = true;
  }
  signedInState.hidden = true;
  const query = mode === "signup" ? "?mode=signup" : "";
  window.history.replaceState({}, "", `${window.location.pathname}${query}`);
}

function setSubmitting(form, submitting) {
  form.querySelectorAll('button[type="submit"]').forEach((submitButton) => {
    submitButton.disabled = submitting;
    submitButton.classList.toggle("is-loading", submitting);
  });
  isSubmitting = submitting;
}

function getPhone(form) {
  const input = form.querySelector('input[name="phone"]');
  const countryCode = form.querySelector('select[name="country-code"]')?.value || "";
  if (!input) {
    return "";
  }

  const entered = input.value.trim();
  if (!entered) {
    return "";
  }

  const digits = entered.replace(/\D/g, "");
  const fullNumber = entered.startsWith("+")
    ? `+${digits}`
    : `${countryCode}${digits.replace(/^0+/, "")}`;
  const subscriberDigits = fullNumber.slice(1);
  return /^\+\d{8,15}$/.test(fullNumber) && subscriberDigits[0] !== "0" ? fullNumber : "";
}

function isValidPassword(password) {
  return password.length >= 8;
}

function showSignedInState(phone) {
  Object.values(authForms).forEach((form) => {
    form.hidden = true;
  });
  signedInState.hidden = false;
  authTitle.textContent = "Welcome to WeduPay";
  authSubtitle.textContent = "You’re signed in to your account.";
  document.querySelector("#signed-in-phone").textContent = phone;
  clearMessage();
}

function getAuthStorage() {
  return {
    getItem(key) {
      const storage = rememberMe.checked ? window.localStorage : window.sessionStorage;
      return storage.getItem(key);
    },
    setItem(key, value) {
      const storage = rememberMe.checked ? window.localStorage : window.sessionStorage;
      const otherStorage = rememberMe.checked ? window.sessionStorage : window.localStorage;
      otherStorage.removeItem(key);
      storage.setItem(key, value);
    },
    removeItem(key) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    },
  };
}

async function loadSupabase() {
  if (!window.supabase?.createClient) {
    showMessage("The sign-in service couldn't load. Check your internet connection and try again.");
    return;
  }

  try {
    const response = await fetch("/api/supabase-config", {
      headers: { Accept: "application/json" },
    });
    const config = await response.json();

    if (!response.ok) {
      showMessage(config.error || "Sign-in isn't configured yet. Please check back soon.");
      return;
    }

    if (!config.url || !config.anonKey) {
      showMessage("Sign-in isn't configured yet. Please check back soon.");
      return;
    }

    supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: getAuthStorage(),
      },
    });

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      throw error;
    }

    if (data.session && mode !== "recovery") {
      showSignedInState(data.session.user.phone || "");
    }

    const { data: subscription } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && mode === "login" && session) {
        showSignedInState(session.user.phone || "");
      }
    });
    sessionSubscription = subscription.subscription;
  } catch (error) {
    console.error("Unable to initialize Supabase authentication.", error);
    showMessage("We couldn't connect to sign-in. Please try again in a moment.");
  }
}

authForms.login.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!supabaseClient || isSubmitting) {
    showMessage("Sign-in isn't ready yet. Please try again in a moment.");
    return;
  }

  const phone = getPhone(authForms.login);
  const password = String(new FormData(authForms.login).get("password") || "");
  if (!phone) {
    showMessage("Enter a valid phone number. Choose your country code and enter your mobile number.");
    return;
  }
  if (!password) {
    showMessage("Enter your password to sign in.");
    return;
  }

  setSubmitting(authForms.login, true);
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ phone, password });
    if (error) {
      showMessage("We couldn't sign you in with those details. Check your phone number and password and try again.");
      return;
    }

    authForms.login.querySelector('[name="password"]').value = "";
    showSignedInState(data.user.phone || phone);
  } catch (error) {
    console.error("Supabase sign-in request failed.", error);
    showMessage("Sign-in couldn't be completed. Please try again.");
  } finally {
    setSubmitting(authForms.login, false);
  }
});

authForms.signup.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!supabaseClient || isSubmitting) {
    showMessage("Account creation isn't ready yet. Please try again in a moment.");
    return;
  }

  setSubmitting(authForms.signup, true);
  try {
    if (!signupCredentials.hidden) {
      const formData = new FormData(authForms.signup);
      const phone = getPhone(authForms.signup);
      const password = String(formData.get("password") || "");
      const confirmation = String(formData.get("confirm-password") || "");
      if (!phone) {
        showMessage("Enter a valid phone number. Choose your country code and enter your mobile number.");
        return;
      }
      if (!isValidPassword(password)) {
        showMessage("Choose a password with at least 8 characters.");
        return;
      }
      if (password !== confirmation) {
        showMessage("The passwords don't match. Please check them and try again.");
        return;
      }

      const { data, error } = await supabaseClient.auth.signUp({
        phone,
        password,
        options: { channel: "sms" },
      });
      if (error) {
        showMessage("We couldn't create your account. Please check your phone number and try again.");
        return;
      }

      authForms.signup.querySelector('[name="password"]').value = "";
      authForms.signup.querySelector('[name="confirm-password"]').value = "";
      if (data.session) {
        showSignedInState(data.user.phone || phone);
        return;
      }

      pendingSignupPhone = phone;
      document.querySelector("#signup-phone-display").textContent = phone;
      signupCredentials.hidden = true;
      signupVerification.hidden = false;
      showMessage("We sent a verification code by SMS. Enter it below to finish creating your account.", "success");
      return;
    }

    const code = String(new FormData(authForms.signup).get("signup-code") || "").trim();
    if (!code) {
      showMessage("Enter the verification code sent to your phone.");
      return;
    }

    const { data, error } = await supabaseClient.auth.verifyOtp({
      phone: pendingSignupPhone,
      token: code,
      type: "sms",
    });
    if (error) {
      showMessage("We couldn't verify that code. Check it and try again.");
      return;
    }

    showSignedInState(data.user.phone || pendingSignupPhone);
  } catch (error) {
    console.error("Supabase account creation request failed.", error);
    showMessage("Account creation couldn't be completed. Please try again.");
  } finally {
    setSubmitting(authForms.signup, false);
  }
});

authForms.forgot.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!supabaseClient || isSubmitting) {
    showMessage("Password reset isn't ready yet. Please try again in a moment.");
    return;
  }

  const phone = getPhone(authForms.forgot);
  if (!phone) {
    showMessage("Enter a valid phone number. Choose your country code and enter your mobile number.");
    return;
  }

  setSubmitting(authForms.forgot, true);
  try {
    const { error } = await supabaseClient.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false },
    });
    if (error) {
      showMessage("We couldn't send a verification code. Check the phone number and try again.");
      return;
    }

    pendingRecoveryPhone = phone;
    setMode("recovery");
    document.querySelector("#recovery-phone-display").textContent = phone;
    showMessage("We sent a verification code by SMS. Enter it below to reset your password.", "success");
  } catch (error) {
    console.error("Supabase password reset request failed.", error);
    showMessage("Password reset couldn't be completed. Please try again.");
  } finally {
    setSubmitting(authForms.forgot, false);
  }
});

authForms.recovery.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!supabaseClient || isSubmitting) {
    showMessage("Password reset isn't ready yet. Please try again in a moment.");
    return;
  }

  setSubmitting(authForms.recovery, true);
  try {
    if (!recoveryPhoneVerified) {
      const code = String(new FormData(authForms.recovery).get("code") || "").trim();
      if (!pendingRecoveryPhone || !code) {
        showMessage("Enter the verification code sent to your phone.");
        return;
      }

      const { error } = await supabaseClient.auth.verifyOtp({
        phone: pendingRecoveryPhone,
        token: code,
        type: "sms",
      });
      if (error) {
        showMessage("We couldn't verify that code. Check it and try again.");
        return;
      }

      recoveryPhoneVerified = true;
      recoveryVerification.hidden = true;
      recoveryPassword.hidden = false;
      document.querySelector("#recovery-code").value = "";
      showMessage("Your phone number is verified. Choose a new password.", "success");
      return;
    }

    const formData = new FormData(authForms.recovery);
    const password = String(formData.get("password") || "");
    const confirmation = String(formData.get("confirm-password") || "");
    if (!isValidPassword(password)) {
      showMessage("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      showMessage("The passwords don't match. Please check them and try again.");
      return;
    }

    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) {
      showMessage("Your phone is verified, but we couldn't update your password. Please try again.");
      return;
    }

    authForms.recovery.querySelector('[name="password"]').value = "";
    authForms.recovery.querySelector('[name="confirm-password"]').value = "";
    showSignedInState(pendingRecoveryPhone);
    pendingRecoveryPhone = "";
  } catch (error) {
    console.error("Supabase password update request failed.", error);
    showMessage("Your password couldn't be updated. Please try again.");
  } finally {
    setSubmitting(authForms.recovery, false);
  }
});

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
  });
});

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.passwordToggle);
    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";
    button.setAttribute("aria-pressed", String(showPassword));
    button.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
    button.textContent = showPassword ? "Hide" : "Show";
  });
});

document.querySelector("#sign-out-button").addEventListener("click", async () => {
  if (!supabaseClient) {
    return;
  }

  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      throw error;
    }

    setMode("login");
    showMessage("You have been signed out.", "success");
  } catch (error) {
    console.error("Supabase sign-out request failed.", error);
    showMessage("We couldn't sign you out. Please try again.");
  }
});

window.addEventListener("pagehide", () => {
  sessionSubscription?.unsubscribe();
});

setMode(mode);
loadSupabase();
