const copyButtons = document.querySelectorAll("[data-copy-code]");
const toast = document.querySelector("[data-toast]");
const code = "VIZZINI-2B-1880";
const helpModal = document.querySelector("[data-help-modal]");
const openHelp = document.querySelector("[data-open-help]");
const closeHelp = document.querySelector("[data-close-help]");
const invalidToken = document.querySelector("[data-invalid-token]");
const inviteCard = document.querySelector("[data-invite-card]");
const langButtons = document.querySelectorAll("[data-lang]");

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("Codice copiato");
    } catch {
      showToast(code);
    }
  });
});

openHelp?.addEventListener("click", () => {
  helpModal.hidden = false;
});

closeHelp?.addEventListener("click", () => {
  helpModal.hidden = true;
});

helpModal?.addEventListener("click", (event) => {
  if (event.target === helpModal) {
    helpModal.hidden = true;
  }
});

if (inviteCard) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token === "scaduto" || token === "invalid") {
    invalidToken.hidden = false;
    inviteCard.querySelector("form")?.setAttribute("hidden", "");
  }
}

const savedLanguage = localStorage.getItem("teacher-language") || "it";
langButtons.forEach((button) => {
  button.classList.toggle("is-active", button.dataset.lang === savedLanguage);
  button.addEventListener("click", () => {
    localStorage.setItem("teacher-language", button.dataset.lang);
    langButtons.forEach((item) => item.classList.toggle("is-active", item === button));
  });
});
