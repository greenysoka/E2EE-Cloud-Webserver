async function sha256Hex(message) {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function setHint(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
  el.classList.toggle("error", isError);
}

async function handleUnlock() {
  const form = document.getElementById("unlock-form");
  if (!form) return;
  const passwordInput = document.getElementById("password");
  const errorEl = document.getElementById("unlock-error");
  const root = document.getElementById("unlock-root");
  const totpField = document.getElementById("totp-field");
  const totpInput = document.getElementById("totp-code");
  const totpSetup = document.getElementById("totp-setup");
  const totpSecret = document.getElementById("totp-secret");
  const totpQr = document.getElementById("totp-qr");
  const cta = document.getElementById("unlock-cta");

  const setupMode = root?.dataset.setup === "true";
  let stage = setupMode ? "init" : "login";

  const showSetupUI = (secret, qrData, message) => {
    if (totpField) totpField.hidden = false;
    if (totpSetup) totpSetup.hidden = false;
    if (totpSecret) totpSecret.textContent = secret || "";
    if (totpQr) totpQr.src = qrData || `/totp/qr?ts=${Date.now()}`;
    if (totpInput) totpInput.value = "";
    if (cta) cta.textContent = "Verify & Enter";
    if (message) {
      setHint(errorEl, message);
    } else {
      setHint(errorEl, "Scan the QR and enter your 6-digit code.");
    }
    stage = "confirm";
  };

  const showLoginUI = () => {
    if (totpField) totpField.hidden = false;
    if (totpSetup) totpSetup.hidden = true;
    if (cta) cta.textContent = "Unlock";
  };

  if (!setupMode) {
    showLoginUI();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = passwordInput.value.trim();
    if (!password) {
      setHint(errorEl, "Enter your password.", true);
      return;
    }
    if (stage !== "init") {
      const code = totpInput?.value.trim() || "";
      if (!code) {
        setHint(errorEl, "Enter your authenticator code.", true);
        return;
      }
    }
    setHint(errorEl, stage === "init" ? "Preparing 2FA setup..." : "Unlocking...");
    try {
      const hpw = await sha256Hex(password);
      const totp = totpInput?.value.trim() || "";
      const body = stage === "init" ? { hpw, client_time: Date.now() } : { hpw, totp, client_time: Date.now() };
      const res = await fetch("/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (payload.setup) {
        showSetupUI(payload.totp_secret, payload.totp_qr, payload.message);
        return;
      }
      if (!res.ok || !payload.ok) {
        let msg = payload.error || "Unlock failed";
        if (payload.drift_sec !== undefined && payload.drift_sec !== null) {
          msg += ` (Clock drift ~${payload.drift_sec}s)`;
        }
        setHint(errorEl, msg, true);
        return;
      }
      window.location.href = "/";
    } catch (err) {
      setHint(errorEl, "Unlock failed. Try again.", true);
    }
  });
}

function setupDropZone() {
  const dropZone = document.getElementById("drop-zone");
  const input = document.getElementById("file-input");
  const statusEl = document.getElementById("upload-status");
  if (!dropZone || !input) return;

  const uploadFile = async (file) => {
    if (!file) return;
    setHint(statusEl, `Encrypting and uploading ${file.name}...`);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/upload", { method: "POST", body: formData });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        setHint(statusEl, payload.error || "Upload failed", true);
        return;
      }
      setHint(statusEl, "Upload complete.");
      window.location.reload();
    } catch (err) {
      setHint(statusEl, "Upload failed. Try again.", true);
    }
  };

  dropZone.addEventListener("click", (event) => {
    if (event.target === input) return;
    input.click();
  });
  input.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  input.addEventListener("change", () => {
    if (input.files && input.files[0]) {
      uploadFile(input.files[0]);
      input.value = "";
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.remove("is-dragging");
    });
  });

  dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  });
}

function setupLockButton() {
  const lockBtn = document.getElementById("lock-btn");
  if (!lockBtn) return;
  lockBtn.addEventListener("click", async () => {
    await fetch("/logout", { method: "POST" });
    window.location.href = "/unlock";
  });
}

function setupFilters() {
  const list = document.getElementById("file-list");
  if (!list) return;
  const cards = Array.from(list.querySelectorAll(".file-card"));
  const searchInput = document.getElementById("file-search");
  const dateFilter = document.getElementById("date-filter");
  const sizeFilter = document.getElementById("size-filter");
  const sortBy = document.getElementById("sort-by");
  const noResults = document.getElementById("no-results");

  const getUploadedTime = (card) => {
    const raw = card.dataset.uploaded || "";
    const ts = Date.parse(raw);
    return Number.isNaN(ts) ? 0 : ts;
  };

  const getSizeBytes = (card) => {
    const raw = card.dataset.size || "0";
    const size = Number.parseInt(raw, 10);
    return Number.isNaN(size) ? 0 : size;
  };

  const matchDate = (card, filter) => {
    if (filter === "all") return true;
    const now = Date.now();
    const uploaded = getUploadedTime(card);
    if (!uploaded) return false;
    let windowMs = 0;
    if (filter === "24h") windowMs = 24 * 60 * 60 * 1000;
    if (filter === "7d") windowMs = 7 * 24 * 60 * 60 * 1000;
    if (filter === "30d") windowMs = 30 * 24 * 60 * 60 * 1000;
    return uploaded >= now - windowMs;
  };

  const matchSize = (card, filter) => {
    if (filter === "all") return true;
    const mb = getSizeBytes(card) / (1024 * 1024);
    if (filter === "lt1") return mb < 1;
    if (filter === "1to10") return mb >= 1 && mb <= 10;
    if (filter === "10to100") return mb > 10 && mb <= 100;
    if (filter === "gt100") return mb > 100;
    return true;
  };

  const applyFilters = () => {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const dateValue = dateFilter?.value || "all";
    const sizeValue = sizeFilter?.value || "all";
    const sortValue = sortBy?.value || "newest";
    const visible = [];

    cards.forEach((card) => {
      const name = `${card.dataset.displayName || ""} ${card.dataset.fileName || ""}`.toLowerCase();
      const matchesQuery = !query || name.includes(query);
      const matchesDate = matchDate(card, dateValue);
      const matchesSize = matchSize(card, sizeValue);
      const shouldShow = matchesQuery && matchesDate && matchesSize;
      card.style.display = shouldShow ? "" : "none";
      if (shouldShow) {
        visible.push(card);
      }
    });

    const sorted = visible.sort((a, b) => {
      if (sortValue === "largest") return getSizeBytes(b) - getSizeBytes(a);
      if (sortValue === "smallest") return getSizeBytes(a) - getSizeBytes(b);
      if (sortValue === "oldest") return getUploadedTime(a) - getUploadedTime(b);
      return getUploadedTime(b) - getUploadedTime(a);
    });

    const hidden = cards.filter((card) => !visible.includes(card));
    [...sorted, ...hidden].forEach((card) => list.appendChild(card));

    if (noResults) {
      noResults.hidden = visible.length !== 0;
    }
  };

  [searchInput, dateFilter, sizeFilter, sortBy].forEach((control) => {
    if (!control) return;
    const eventName = control === searchInput ? "input" : "change";
    control.addEventListener(eventName, applyFilters);
  });

  applyFilters();
}

function setupDeleteModal() {
  const modal = document.getElementById("delete-modal");
  if (!modal) return;
  const message = document.getElementById("delete-message");
  const confirmBtn = document.getElementById("confirm-delete");
  const cancelBtn = document.getElementById("cancel-delete");
  let pendingId = null;

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    pendingId = null;
  };

  const openModal = (fileId, name) => {
    pendingId = fileId;
    if (message) {
      message.textContent = `Are you sure you want to delete ${name}? This cannot be undone.`;
    }
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const card = event.target.closest(".file-card");
      if (!card) return;
      const fileId = card.dataset.fileId;
      const name = card.dataset.displayName || card.dataset.fileName || "this file";
      openModal(fileId, name);
    });
  });

  modal.addEventListener("click", (event) => {
    if (event.target.dataset.close === "true") {
      closeModal();
    }
  });

  cancelBtn?.addEventListener("click", closeModal);

  confirmBtn?.addEventListener("click", async () => {
    if (!pendingId) return;
    try {
      const res = await fetch(`/files/${pendingId}`, { method: "DELETE" });
      if (!res.ok) {
        setHint(document.getElementById("upload-status"), "Delete failed.", true);
      }
    } catch (err) {
      setHint(document.getElementById("upload-status"), "Delete failed.", true);
    }
    closeModal();
    window.location.reload();
  });
}

handleUnlock();
setupDropZone();
setupLockButton();
setupFilters();
setupDeleteModal();
