(() => {
  "use strict";

  const WHATSAPP_NUMBER = "2347083251232";
  const FREE_LAGOS_THRESHOLD = 50000;
  const PROMO_CODES = {
    YINKAEL5: { percent: 5, label: "5% Off" },
    WHOLESALE10: { percent: 10, label: "10% Wholesale" }
  };

  // Auto-normalize products: support both old options and new admin dashboard retailPrice/wholesalePrice fields
  const rawProducts = Array.isArray(window.YINKAEL_PRODUCTS)
    ? window.YINKAEL_PRODUCTS
    : [];

  let products = rawProducts.map(p => {
    if (!p.options && (p.retailPrice !== undefined || p.wholesalePrice !== undefined)) {
      const opts = [];
      if (Number(p.retailPrice) > 0) {
        opts.push({ label: "Retail", price: Number(p.retailPrice) || 0, minQty: 1, kind: "retail" });
      }
      if (Number(p.wholesalePrice) > 0) {
        opts.push({ label: "Wholesale (Min 2)", price: Number(p.wholesalePrice) || 0, minQty: p.wholesaleMinQty || 2, kind: "wholesale" });
      }
      return { ...p, options: opts };
    }
    return p;
  });

  let appliedPromo = null;

  const $ = (selector) => document.querySelector(selector);

  const state = {
    audience: "All",
    category: "All",
    search: "",
    sort: "featured",
    activeProductId: null,
    cart: loadCart()
  };

  const productGrid = $("#productGrid");
  const productModal = $("#productModal");
  const cartBackdrop = $("#cartBackdrop");

  const money = (amount) => new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem("yinkael-cart-v1")) || [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem("yinkael-cart-v1", JSON.stringify(state.cart));
    updateCartCount();
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function optimizeImageUrl(url, width = 500) {
    if (!url || typeof url !== "string") return "";
    if (url.includes("res.cloudinary.com") && url.includes("/upload/") && !url.includes("f_auto")) {
      return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
    }
    return url;
  }

  function productById(id) {
    return products.find(product => product.id === id);
  }

  function getOption(product, optionLabel) {
    return (product.options || []).find(
      option => option.label === optionLabel
    );
  }

  function placeholderMarkup(product) {
    const initials = (product.name || "Y")
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word[0])
      .join("");

    return `
      <div class="image-placeholder">
        <span>${escapeHTML(initials)}</span>
        <small>YINKAEL COLLECTION</small>
      </div>`;
  }

  function imageMarkup(product, extraClass = "", priority = "lazy") {
    const optimizedUrl = optimizeImageUrl(product.image, 500);

    if (!optimizedUrl) {
      return placeholderMarkup(product);
    }

    const highPriority = priority === "eager";

    return `
      <img
        class="product-photo ${extraClass}"
        src="${escapeHTML(optimizedUrl)}"
        alt="${escapeHTML(product.name)}"
        loading="${highPriority ? "eager" : "lazy"}"
        decoding="async"
        fetchpriority="${highPriority ? "high" : "low"}"
      >`;
  }

  function startingPrice(product) {
    const prices = (product.options || [])
      .map(option => Number(option.price))
      .filter(price => price > 0);

    return prices.length
      ? `From ${money(Math.min(...prices))}`
      : "Price to be confirmed";
  }

  function filteredProducts() {
    let list = products.filter(product => {
      const audienceMatch =
        state.audience === "All" ||
        product.audience === state.audience ||
        product.audience === "Unisex";

      const categoryMatch =
        state.category === "All" ||
        product.category === state.category;

      const text = `
        ${product.name || ""}
        ${product.category || ""}
        ${product.audience || ""}
        ${product.description || ""}
      `.toLowerCase();

      return audienceMatch &&
        categoryMatch &&
        text.includes(state.search.toLowerCase());
    });

    if (state.sort === "name") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    if (
      state.sort === "price-low" ||
      state.sort === "price-high"
    ) {
      list.sort((a, b) => {
        const pa = Math.min(
          ...(a.options || []).map(o => Number(o.price) || Infinity)
        );

        const pb = Math.min(
          ...(b.options || []).map(o => Number(o.price) || Infinity)
        );

        return state.sort === "price-low"
          ? pa - pb
          : pb - pa;
      });
    }

    return list;
  }

  function renderProducts() {
    const list = filteredProducts();

    const summaryEl = $("#resultSummary");
    if (summaryEl) {
      summaryEl.textContent = `${list.length} ${list.length === 1 ? "item" : "items"} shown`;
    }

    if (!list.length) {
      productGrid.innerHTML = `
        <div class="empty-state">
          <h3>No products found</h3>
          <p>Try another search or category.</p>
        </div>`;
      return;
    }

    productGrid.innerHTML = list.map((product, index) => {
      const canBuy = (product.options || [])
        .some(option => Number(option.price) > 0);

      const imagePriority = index < 6 ? "eager" : "lazy";

      return `
        <article class="product-card">
          <button
            class="product-image-button"
            type="button"
            data-view-product="${escapeHTML(product.id)}"
            aria-label="View ${escapeHTML(product.name)}">
            <div class="product-image">
              ${imageMarkup(product, "", imagePriority)}
              <span class="quick-view-tag">
                QUICK VIEW ↗
              </span>
            </div>
          </button>

          <div class="product-card-info">
            <p class="product-category">
              ${escapeHTML(product.audience || "Fashion")}
              ·
              ${escapeHTML(product.category || "Collection")}
            </p>

            <button
              class="product-name-button"
              type="button"
              data-view-product="${escapeHTML(product.id)}">
              ${escapeHTML(product.name)}
            </button>

            <p class="product-price">
              ${startingPrice(product)}
            </p>

            <button
              class="button button-outline full-width"
              type="button"
              data-view-product="${escapeHTML(product.id)}">
              ${canBuy ? "View product" : "View details"}
            </button>
          </div>
        </article>`;
    }).join("");
  }

  function setFilter({ audience, category } = {}) {
    if (audience) state.audience = audience;
    if (category) state.category = category;

    document.querySelectorAll(".category-chip").forEach(button => {
      const activeAudience = button.dataset.audience || null;
      const activeCategory = button.dataset.category || null;

      button.classList.toggle(
        "active",
        (activeAudience &&
          activeAudience === state.audience &&
          state.category === "All") ||
        (activeCategory &&
          activeCategory === state.category)
      );
    });

    renderProducts();
  }

  function openProduct(id) {
    const product = productById(id);
    if (!product) return;

    state.activeProductId = id;

    $("#modalCategory").textContent =
      `${product.audience || "Collection"} · ${product.category || "Fashion"}`;

    $("#modalProductName").textContent = product.name;

    $("#modalDescription").textContent =
      product.description || "";

    $("#modalImage").innerHTML =
      imageMarkup(product, "", "eager");

    const options = product.options || [];

    $("#purchaseOption").innerHTML = options.length
      ? options.map(option => `
          <option value="${escapeHTML(option.label)}">
            ${escapeHTML(option.label)}
            —
            ${Number(option.price) > 0
              ? money(option.price)
              : "Price pending"}
          </option>
        `).join("")
      : `<option value="">Pricing not available yet</option>`;

    $("#modalPrice").textContent = startingPrice(product);
    $("#modalQuantity").value = options[0]?.minQty || 1;
    $("#modalQuantity").min = options[0]?.minQty || 1;

    updateOptionHint();

    $("#modalAddToCart").disabled =
      !options.some(option => Number(option.price) > 0);

    productModal.classList.add("open");
    productModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function closeProduct() {
    productModal.classList.remove("open");
    productModal.setAttribute("aria-hidden", "true");

    if (!cartBackdrop.classList.contains("open")) {
      document.body.classList.remove("no-scroll");
    }
  }

  function currentProduct() {
    return productById(state.activeProductId);
  }

  function updateOptionHint() {
    const product = currentProduct();
    const option = product &&
      getOption(product, $("#purchaseOption").value);

    if (!option) {
      $("#optionHint").textContent =
        "Product prices will appear once inventory is added.";
      return;
    }

    $("#modalQuantity").min = option.minQty || 1;

    if (
      Number($("#modalQuantity").value) <
      (option.minQty || 1)
    ) {
      $("#modalQuantity").value = option.minQty || 1;
    }

    $("#optionHint").textContent =
      option.kind === "wholesale"
        ? `Wholesale minimum: ${option.minQty || 2}.`
        : `Minimum quantity: ${option.minQty || 1}.`;
  }

  function addActiveProductToCart() {
    const product = currentProduct();
    if (!product) return;

    const option = getOption(
      product,
      $("#purchaseOption").value
    );

    if (!option || !(Number(option.price) > 0)) return;

    const minQty = Number(option.minQty) || 1;
    const quantity = Math.max(
      minQty,
      Math.floor(Number($("#modalQuantity").value) || minQty)
    );

    const existing = state.cart.find(item =>
      item.productId === product.id &&
      item.optionLabel === option.label
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      state.cart.push({
        productId: product.id,
        optionLabel: option.label,
        quantity
      });
    }

    saveCart();
    closeProduct();
    renderCart();
    showToast("Added to your shopping bag");
  }

  function updateCartCount() {
    const countEl = $("#cartCount");
    if (countEl) {
      countEl.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    }
  }

  function cartLine(item) {
    const product = productById(item.productId);
    const option = product &&
      getOption(product, item.optionLabel);

    if (!product || !option) return null;

    return {
      item,
      product,
      option,
      subtotal: Number(option.price) * item.quantity
    };
  }

  function getDiscountAmount(subtotal) {
    if (!appliedPromo || subtotal <= 0) return 0;
    return Math.round((subtotal * appliedPromo.percent) / 100);
  }

  function updateCartSummaryUI(subtotal, totalItemsCount) {
    const bagPill = $("#drawerBagCount");
    if (bagPill) bagPill.textContent = totalItemsCount;

    const progressFill = $("#deliveryProgressFill");
    const progressMsg = $("#deliveryProgressMsg");
    const deliveryNote = $("#cartDeliveryNote");

    const pct = Math.min(100, (subtotal / FREE_LAGOS_THRESHOLD) * 100);
    if (progressFill) progressFill.style.width = `${pct}%`;

    const remaining = Math.max(0, FREE_LAGOS_THRESHOLD - subtotal);
    if (progressMsg) {
      if (subtotal === 0) {
        progressMsg.innerHTML = `Add <strong>${money(FREE_LAGOS_THRESHOLD)}</strong> for <strong>Free Lagos Delivery</strong>`;
      } else if (remaining > 0) {
        progressMsg.innerHTML = `Add <strong>${money(remaining)}</strong> more for <strong>Free Lagos Delivery</strong>`;
      } else {
        progressMsg.innerHTML = `🎉 You unlocked <strong>Free Delivery within Lagos!</strong>`;
      }
    }

    if (deliveryNote) {
      deliveryNote.textContent =
        subtotal >= FREE_LAGOS_THRESHOLD
          ? "FREE (Lagos) / Confirmed on WhatsApp"
          : "Confirmed via WhatsApp";
    }

    const discount = getDiscountAmount(subtotal);
    const finalTotal = Math.max(0, subtotal - discount);

    const subtotalEl = $("#cartSubtotal");
    if (subtotalEl) subtotalEl.textContent = money(subtotal);

    const discountRow = $("#promoDiscountRow");
    const promoTag = $("#promoTag");
    const discountAmountEl = $("#cartDiscountAmount");

    if (discountRow && promoTag && discountAmountEl) {
      if (discount > 0 && appliedPromo) {
        discountRow.style.display = "flex";
        promoTag.textContent = appliedPromo.code;
        discountAmountEl.textContent = `-${money(discount)}`;
      } else {
        discountRow.style.display = "none";
      }
    }

    $("#cartTotal").textContent = money(finalTotal);
  }

  function showDeliveryStep() {
    if (!state.cart.length) return;
    $("#cartItems").style.display = "none";
    $("#cartFooter").style.display = "none";
    $("#checkoutStepPanel")?.classList.add("open");
  }

  function showBagStep() {
    $("#checkoutStepPanel")?.classList.remove("open");
    $("#cartItems").style.display = "";
    $("#cartFooter").style.display = "";
  }

  function renderCart() {
    state.cart = state.cart.filter(item => cartLine(item));
    saveCart();

    const lines = state.cart.map(cartLine).filter(Boolean);

    if (!lines.length) {
      showBagStep();
      $("#cartItems").innerHTML = `
        <div class="empty-state">
          <div class="empty-cart-icon">♡</div>
          <h3>Your bag is empty</h3>
          <p>When you add products, they'll appear here.</p>
        </div>`;
    } else {
      $("#cartItems").innerHTML = lines.map(({
        item,
        product,
        option,
        subtotal
      }) => {
        const thumbUrl = optimizeImageUrl(product.image, 150);
        return `
        <article class="cart-item">
          <div class="cart-thumb">
            ${thumbUrl
              ? `<img src="${escapeHTML(thumbUrl)}" alt="" loading="lazy" decoding="async">`
              : `<span>${escapeHTML(product.name.slice(0, 1))}</span>`}
          </div>

          <div class="cart-item-main">
            <strong>${escapeHTML(product.name)}</strong>
            <small>
              ${escapeHTML(option.label)} · ${money(option.price)} each
            </small>

            <div class="cart-item-actions">
              <div class="quantity-control compact">
                <button
                  type="button"
                  data-cart-change="-1"
                  data-id="${escapeHTML(product.id)}"
                  data-option="${escapeHTML(option.label)}"
                  aria-label="Decrease quantity">−</button>
                <span>${item.quantity}</span>
                <button
                  type="button"
                  data-cart-change="1"
                  data-id="${escapeHTML(product.id)}"
                  data-option="${escapeHTML(option.label)}"
                  aria-label="Increase quantity">+</button>
              </div>

              <button
                class="remove-link"
                type="button"
                data-remove="${escapeHTML(product.id)}"
                data-option="${escapeHTML(option.label)}">
                Remove
              </button>
            </div>
          </div>

          <strong class="cart-line-total">
            ${money(subtotal)}
          </strong>
        </article>
      `;
      }).join("");
    }

    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const totalCount = lines.reduce((sum, line) => sum + line.item.quantity, 0);

    updateCartSummaryUI(subtotal, totalCount);
    $("#checkoutBtn").disabled = !lines.length;
  }

  function openCart() {
    showBagStep();
    renderCart();
    cartBackdrop.classList.add("open");
    cartBackdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function closeCart() {
    cartBackdrop.classList.remove("open");
    cartBackdrop.setAttribute("aria-hidden", "true");
    showBagStep();

    if (!productModal.classList.contains("open")) {
      document.body.classList.remove("no-scroll");
    }
  }

  function checkoutWhatsApp(event) {
    if (event) event.preventDefault();

    const lines = state.cart.map(cartLine).filter(Boolean);
    if (!lines.length) return;

    const name = ($("#orderName")?.value || "").trim();
    const phone = ($("#orderPhone")?.value || "").trim();
    const stateName = ($("#orderState")?.value || "").trim();
    const city = ($("#orderCity")?.value || "").trim();
    const address = ($("#orderAddress")?.value || "").trim();
    const landmark = ($("#orderLandmark")?.value || "").trim();
    const notes = ($("#orderNotes")?.value || "").trim();

    if (!name || !phone || !stateName || !city || !address) {
      showToast("Please fill in your name, phone, state, city, and address.");
      return;
    }

    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const discount = getDiscountAmount(subtotal);
    const finalTotal = Math.max(0, subtotal - discount);

    const messageLines = [
      "Hello YINKAEL INT'L CLOTHINGS, I would like to place an order:",
      "",
      "*ORDER ITEMS:*",
      ...lines.map(({ item, product, option, subtotal: lineSub }) =>
        `• ${product.name} — ${option.label} x ${item.quantity} = ${money(lineSub)}`
      ),
      "",
      `Subtotal: ${money(subtotal)}`,
      ...(discount > 0 && appliedPromo
        ? [`Promo (${appliedPromo.code}): -${money(discount)}`]
        : []),
      `*Estimated Total: ${money(finalTotal)}*`,
      "",
      "*DELIVERY DETAILS:*",
      `Name: ${name}`,
      `Phone: ${phone}`,
      `State: ${stateName}`,
      `City/Area: ${city}`,
      `Address: ${address}`,
      ...(landmark ? [`Landmark: ${landmark}`] : []),
      ...(notes ? [`Notes: ${notes}`] : []),
      "",
      "Please confirm item availability, delivery fee, and payment details."
    ];

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageLines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    window.setTimeout(
      () => toast.classList.remove("show"),
      2200
    );
  }

  function moveProduct(direction) {
    const list = filteredProducts();
    const index = list.findIndex(
      product => product.id === state.activeProductId
    );

    if (!list.length) return;

    const nextIndex =
      (index + direction + list.length) % list.length;

    openProduct(list[nextIndex].id);
  }

  // EVENT LISTENERS
  document.addEventListener("click", event => {
    const viewButton = event.target.closest("[data-view-product]");
    if (viewButton) {
      openProduct(viewButton.dataset.viewProduct);
    }

    const audienceButton = event.target.closest("[data-audience]");
    if (audienceButton) {
      state.category = "All";
      setFilter({ audience: audienceButton.dataset.audience });
      $("#shop")?.scrollIntoView({ behavior: "smooth" });
    }

    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) {
      state.audience = "All";
      setFilter({ category: categoryButton.dataset.category });
      $("#shop")?.scrollIntoView({ behavior: "smooth" });
    }

    const changeButton = event.target.closest("[data-cart-change]");
    if (changeButton) {
      const item = state.cart.find(row =>
        row.productId === changeButton.dataset.id &&
        row.optionLabel === changeButton.dataset.option
      );

      if (item) {
        const product = productById(item.productId);
        const option = getOption(product, item.optionLabel);

        item.quantity = Math.max(
          Number(option.minQty) || 1,
          item.quantity + Number(changeButton.dataset.cartChange)
        );

        saveCart();
        renderCart();
      }
    }

    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) {
      state.cart = state.cart.filter(row =>
        !(
          row.productId === removeButton.dataset.remove &&
          row.optionLabel === removeButton.dataset.option
        )
      );

      saveCart();
      renderCart();
    }
  });

  const searchInput = $("#searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", event => {
      state.search = event.target.value.trim();
      renderProducts();
    });
  }

  const sortSelect = $("#sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", event => {
      state.sort = event.target.value;
      renderProducts();
    });
  }

  const purchaseOption = $("#purchaseOption");
  if (purchaseOption) {
    purchaseOption.addEventListener("change", updateOptionHint);
  }

  const qtyMinus = $("#modalQtyMinus");
  if (qtyMinus) {
    qtyMinus.addEventListener("click", () => {
      const min = Number($("#modalQuantity").min) || 1;
      $("#modalQuantity").value = Math.max(
        min,
        Number($("#modalQuantity").value) - 1
      );
    });
  }

  const qtyPlus = $("#modalQtyPlus");
  if (qtyPlus) {
    qtyPlus.addEventListener("click", () => {
      $("#modalQuantity").value = Math.max(
        1,
        Number($("#modalQuantity").value) + 1
      );
    });
  }

  const addToCartBtn = $("#modalAddToCart");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", addActiveProductToCart);
  }

  const closeModalBtn = $("#closeProductModal");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeProduct);
  }

  const prevProductBtn = $("#prevProduct");
  if (prevProductBtn) {
    prevProductBtn.addEventListener("click", () => moveProduct(-1));
  }

  const nextProductBtn = $("#nextProduct");
  if (nextProductBtn) {
    nextProductBtn.addEventListener("click", () => moveProduct(1));
  }

  const openCartBtn = $("#openCartBtn");
  if (openCartBtn) {
    openCartBtn.addEventListener("click", openCart);
  }

  const closeCartBtn = $("#closeCartBtn");
  if (closeCartBtn) {
    closeCartBtn.addEventListener("click", closeCart);
  }

  if (cartBackdrop) {
    cartBackdrop.addEventListener("click", event => {
      if (event.target === cartBackdrop) {
        closeCart();
      }
    });
  }

  const checkoutBtn = $("#checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", showDeliveryStep);
  }

  const backToBagBtn = $("#backToBagBtn");
  if (backToBagBtn) {
    backToBagBtn.addEventListener("click", showBagStep);
  }

  const whatsappOrderForm = $("#whatsappOrderForm");
  if (whatsappOrderForm) {
    whatsappOrderForm.addEventListener("submit", checkoutWhatsApp);
  }

  const applyPromoBtn = $("#applyPromoBtn");
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener("click", () => {
      const code = ($("#promoCodeInput")?.value || "").trim().toUpperCase();
      const statusEl = $("#promoStatus");
      if (!code) {
        if (statusEl) statusEl.textContent = "Enter a promo code first.";
        return;
      }
      if (!PROMO_CODES[code]) {
        appliedPromo = null;
        if (statusEl) {
          statusEl.style.color = "#9a6a4d";
          statusEl.textContent = "Invalid promo code.";
        }
        renderCart();
        return;
      }
      appliedPromo = { code, ...PROMO_CODES[code] };
      if (statusEl) {
        statusEl.style.color = "#2c7a4b";
        statusEl.textContent = `✓ Code "${code}" applied (${PROMO_CODES[code].label})`;
      }
      renderCart();
    });
  }

  const wholesaleWhatsApp = $("#wholesaleWhatsApp");
  if (wholesaleWhatsApp) {
    wholesaleWhatsApp.addEventListener("click", event => {
      event.preventDefault();
      const message =
        "Hello YINKAEL INT'L CLOTHINGS, please send me information about your wholesale prices, bundle options, and nationwide delivery.";
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    });
  }

  const mobileMenuBtn = $("#mobileMenuBtn");
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      const nav = $("#mainNav");
      if (!nav) return;
      const expanded = nav.classList.toggle("nav-open");
      mobileMenuBtn.setAttribute("aria-expanded", String(expanded));
    });
  }

  const mainNav = $("#mainNav");
  if (mainNav) {
    mainNav.addEventListener("click", event => {
      if (event.target.closest("a")) {
        mainNav.classList.remove("nav-open");
        mobileMenuBtn?.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeProduct();
      closeCart();
    }

    if (
      productModal &&
      productModal.classList.contains("open") &&
      event.key === "ArrowRight"
    ) {
      moveProduct(1);
    }

    if (
      productModal &&
      productModal.classList.contains("open") &&
      event.key === "ArrowLeft"
    ) {
      moveProduct(-1);
    }
  });

  // TOUCH SWIPE
  let touchStartX = 0;
  if (productModal) {
    productModal.addEventListener(
      "touchstart",
      event => {
        touchStartX = event.changedTouches[0].screenX;
      },
      { passive: true }
    );

    productModal.addEventListener(
      "touchend",
      event => {
        const delta = event.changedTouches[0].screenX - touchStartX;
        if (Math.abs(delta) > 70) {
          moveProduct(delta < 0 ? 1 : -1);
        }
      },
      { passive: true }
    );
  }

  // Expose refresh hook for live Firestore products with auto-normalization
  window.renderYinkaelStore = () => {
    const updatedRaw = Array.isArray(window.YINKAEL_PRODUCTS) ? window.YINKAEL_PRODUCTS : [];
    products = updatedRaw.map(p => {
      if (!p.options && (p.retailPrice !== undefined || p.wholesalePrice !== undefined)) {
        const opts = [];
        if (Number(p.retailPrice) > 0) {
          opts.push({ label: "Retail", price: Number(p.retailPrice) || 0, minQty: 1, kind: "retail" });
        }
        if (Number(p.wholesalePrice) > 0) {
          opts.push({ label: "Wholesale (Min 2)", price: Number(p.wholesalePrice) || 0, minQty: p.wholesaleMinQty || 2, kind: "wholesale" });
        }
        return { ...p, options: opts };
      }
      return p;
    });

    renderProducts();
    renderCart();
    updateCartCount();
  };

  // INITIALIZE
  const yearEl = $("#year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  renderProducts();
  renderCart();
  updateCartCount();
})();
