(function () {
  const cfg = COFFEE_CONFIG;
  const cart = new Map();

  const menuGrid = document.getElementById("menu-grid");
  const orderTotalEl = document.getElementById("order-total");
  const orderForm = document.getElementById("order-form");
  const orderSection = document.getElementById("order-section");
  const paymentSection = document.getElementById("payment-section");
  const paymentStep = document.getElementById("payment-step");
  const successStep = document.getElementById("success-step");
  const formStatus = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");
  const paymentAmountEl = document.getElementById("payment-amount");
  const paymentPhoneDisplayEl = document.getElementById("payment-phone-display");
  const payBitLink = document.getElementById("pay-bit");
  const payPayboxLink = document.getElementById("pay-paybox");
  const copyPaymentBtn = document.getElementById("copy-payment");
  const paymentStatus = document.getElementById("payment-status");
  const backToOrderBtn = document.getElementById("back-to-order");
  const newOrderBtn = document.getElementById("new-order");

  let pendingOrder = null;
  let lastPaymentDetails = null;
  let orderSubmitted = false;
  let orderSubmitting = false;

  function formatCurrency(amount) {
    return `₪${amount}`;
  }

  function buildPaymentDetails(total, customerName) {
    return {
      total,
      phone: cfg.paymentPhoneDisplay,
      customerName,
      clipboardText: `תשלום קפה בכרם: ${formatCurrency(total)} ל-${cfg.paymentPhoneDisplay}${customerName ? ` – ${customerName}` : ""}`,
      bitUrl: cfg.bitPaymentLink,
      payboxUrl: cfg.payboxPaymentLink,
    };
  }

  function getCartLines() {
    const lines = [];
    for (const item of cfg.menu) {
      const qty = cart.get(item.id) || 0;
      if (qty > 0) {
        lines.push({ ...item, qty, lineTotal: item.price * qty });
      }
    }
    return lines;
  }

  function getTotal() {
    return getCartLines().reduce((sum, line) => sum + line.lineTotal, 0);
  }

  function formatOrderSummary() {
    return getCartLines()
      .map((line) => `${line.name} x${line.qty} (₪${line.lineTotal})`)
      .join("\n");
  }

  function updateTotalDisplay() {
    orderTotalEl.textContent = `סה״כ: ${formatCurrency(getTotal())}`;
  }

  function setQty(itemId, delta) {
    const current = cart.get(itemId) || 0;
    const next = Math.max(0, current + delta);
    if (next === 0) {
      cart.delete(itemId);
    } else {
      cart.set(itemId, next);
    }
    const qtyEl = menuGrid.querySelector(`[data-qty-for="${itemId}"]`);
    if (qtyEl) {
      qtyEl.textContent = String(next);
    }
    updateTotalDisplay();
  }

  function renderMenu() {
    menuGrid.innerHTML = cfg.menu
      .map(
        (item) => `
      <div class="menu-item" data-id="${item.id}">
        <div class="menu-item__info">
          <div class="menu-item__name">${item.name}</div>
          <div class="menu-item__price">${formatCurrency(item.price)}</div>
        </div>
        <div class="qty-control">
          <button type="button" class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="הפחת ${item.name}">−</button>
          <span class="qty-value" data-qty-for="${item.id}">0</span>
          <button type="button" class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="הוסף ${item.name}">+</button>
        </div>
      </div>`
      )
      .join("");

    menuGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".qty-btn");
      if (!btn) {
        return;
      }
      const delta = btn.dataset.action === "inc" ? 1 : -1;
      setQty(btn.dataset.id, delta);
    });
  }

  function showToast(message) {
    let toast = document.querySelector(".payment-toast");
    if (!toast) {
      toast = document.createElement("p");
      toast.className = "payment-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    window.setTimeout(() => toast.classList.remove("visible"), 2500);
  }

  async function copyPaymentDetails(details) {
    try {
      await navigator.clipboard.writeText(details.clipboardText);
      showToast("פרטי התשלום הועתקו");
      return true;
    } catch {
      showToast("לא הצלחנו להעתיק – העתיקו ידנית");
      return false;
    }
  }

  function showPaymentScreen(order) {
    pendingOrder = order;
    lastPaymentDetails = buildPaymentDetails(order.total, order.name);

    paymentAmountEl.textContent = formatCurrency(order.total);
    paymentPhoneDisplayEl.textContent = cfg.paymentPhoneDisplay;
    payBitLink.href = lastPaymentDetails.bitUrl;
    payBitLink.setAttribute("aria-label", `פתיחת Bit לתשלום ${formatCurrency(order.total)}`);
    payBitLink.textContent = `Bit – ${formatCurrency(order.total)}`;
    payPayboxLink.href = lastPaymentDetails.payboxUrl;
    payPayboxLink.setAttribute("aria-label", `פתיחת Paybox לתשלום ${formatCurrency(order.total)}`);
    payPayboxLink.textContent = `Paybox – ${formatCurrency(order.total)}`;

    paymentStatus.textContent = "";
    paymentStatus.classList.remove("error");
    orderSubmitted = false;
    orderSubmitting = false;
    setPaymentLinksDisabled(false);
    paymentStep.hidden = false;
    successStep.hidden = true;

    orderSection.hidden = true;
    paymentSection.hidden = false;
    paymentSection.scrollIntoView({ behavior: "smooth" });
  }

  function showSuccessScreen() {
    paymentStep.hidden = true;
    successStep.hidden = false;
    paymentSection.scrollIntoView({ behavior: "smooth" });
  }

  function setPaymentLinksDisabled(disabled) {
    payBitLink.setAttribute("aria-disabled", String(disabled));
    payPayboxLink.setAttribute("aria-disabled", String(disabled));
    if (disabled) {
      payBitLink.classList.add("disabled");
      payPayboxLink.classList.add("disabled");
    } else {
      payBitLink.classList.remove("disabled");
      payPayboxLink.classList.remove("disabled");
    }
  }

  async function submitOrderToEmail(order, paymentMethod) {
    const web3 = cfg.web3forms;
    if (!web3?.apiKey) {
      return { ok: false, skipped: true };
    }

    const message = [
      `שם: ${order.name}`,
      `טלפון: ${order.phone}`,
      "",
      "הזמנה:",
      order.summary,
      "",
      `סה״כ: ${formatCurrency(order.total)}`,
      order.notes ? `\nהערות: ${order.notes}` : "",
      "",
      `אמצעי תשלום: ${paymentMethod}`,
    ]
      .filter(Boolean)
      .join("\n");

    const body = new FormData();
    body.append("access_key", web3.apiKey);
    body.append("subject", web3.subject);
    body.append("from_name", web3.fromName);
    body.append("name", order.name);
    body.append("phone", order.phone);
    body.append("message", message);
    body.append("botcheck", "");

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
    });

    const result = await response.json();
    return { ok: response.ok && result.success, skipped: false };
  }

  function resetOrder() {
    cart.clear();
    pendingOrder = null;
    lastPaymentDetails = null;
    orderSubmitted = false;
    orderSubmitting = false;
    menuGrid.querySelectorAll("[data-qty-for]").forEach((el) => {
      el.textContent = "0";
    });
    updateTotalDisplay();
    orderForm.reset();
    formStatus.textContent = "";
    formStatus.classList.remove("error");
    paymentStatus.textContent = "";
    paymentStatus.classList.remove("error");
    setPaymentLinksDisabled(false);
    paymentStep.hidden = false;
    successStep.hidden = true;
    paymentSection.hidden = true;
    orderSection.hidden = false;
    orderSection.scrollIntoView({ behavior: "smooth" });
  }

  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    formStatus.textContent = "";
    formStatus.classList.remove("error");

    const name = document.getElementById("customer-name").value.trim();
    const phone = document.getElementById("customer-phone").value.trim();
    const notes = document.getElementById("order-notes").value.trim();
    const total = getTotal();

    if (total <= 0) {
      formStatus.textContent = "בחרו לפחות פריט אחד";
      formStatus.classList.add("error");
      return;
    }

    if (!name || !phone) {
      formStatus.textContent = "מלאו שם וטלפון";
      formStatus.classList.add("error");
      return;
    }

    showPaymentScreen({
      name,
      phone,
      notes,
      total,
      summary: formatOrderSummary(),
    });
  });

  async function handlePaymentLinkClick(paymentMethod) {
    if (!pendingOrder || orderSubmitted || orderSubmitting) {
      return;
    }

    orderSubmitting = true;
    paymentStatus.textContent = "";
    paymentStatus.classList.remove("error");
    setPaymentLinksDisabled(true);
    paymentStatus.textContent = "שולח הזמנה...";

    try {
      const result = await submitOrderToEmail(pendingOrder, paymentMethod);
      if (!result.skipped && !result.ok) {
        orderSubmitting = false;
        setPaymentLinksDisabled(false);
        paymentStatus.textContent = "שגיאה בשליחה – נסו שוב";
        paymentStatus.classList.add("error");
        return;
      }

      orderSubmitted = true;
      orderSubmitting = false;
      showSuccessScreen();
      paymentStatus.textContent = "";
    } catch {
      orderSubmitting = false;
      setPaymentLinksDisabled(false);
      paymentStatus.textContent = "שגיאה בשליחה – נסו שוב";
      paymentStatus.classList.add("error");
    }
  }

  function onPaymentLinkClick(e, paymentMethod) {
    if (orderSubmitted || orderSubmitting) {
      e.preventDefault();
      return;
    }
    handlePaymentLinkClick(paymentMethod);
  }

  payBitLink.addEventListener("click", (e) => {
    onPaymentLinkClick(e, "Bit");
  });

  payPayboxLink.addEventListener("click", (e) => {
    onPaymentLinkClick(e, "Paybox");
  });

  copyPaymentBtn.addEventListener("click", () => {
    if (lastPaymentDetails) {
      copyPaymentDetails(lastPaymentDetails);
    }
  });

  backToOrderBtn.addEventListener("click", () => {
    paymentSection.hidden = true;
    orderSection.hidden = false;
    orderSection.scrollIntoView({ behavior: "smooth" });
  });

  newOrderBtn.addEventListener("click", resetOrder);

  renderMenu();
  updateTotalDisplay();
  paymentPhoneDisplayEl.textContent = cfg.paymentPhoneDisplay;
})();
