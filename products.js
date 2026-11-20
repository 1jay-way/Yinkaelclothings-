/*
  PRODUCT CATALOGUE
  Add the client's real products here when the product list and prices are ready.

  Example product:
  {
    id: "mens-shirt-001",
    name: "Classic Men's Shirt",
    audience: "Men",                 // Men, Women, Children, Unisex
    category: "Clothing",            // Clothing, Shoes, Bags, Accessories, Fragrance
    description: "A short product description.",
    image: "images/mens-shirt-001.webp",
    options: [
      { label: "Piece", price: 15000, minQty: 1, kind: "retail" },
      { label: "Bundle", price: 120000, minQty: 2, kind: "wholesale" }
    ]
  }

  IMPORTANT:
  - "price" is the price for ONE selected option (one piece, one dozen, or one bundle).
  - For wholesale, set minQty: 2 to enforce the business's minimum of two bundles.
  - Do not put a dozen price under "Piece"; create a separate option labelled "Dozen".
  - The sample products below intentionally have empty options until the client confirms prices.
*/
window.YINKAEL_PRODUCTS = [
   { id: "sample-001", name: "Men's Clothing", audience: "Men", category: "Clothing", description: "Product description and available sizes will be added when the inventory is supplied.", image: "", options: [] },
   { id: "sample-002", name: "Women's Clothing", audience: "Women", category: "Clothing", description: "Product description and available sizes will be added when the inventory is supplied.", image: "", options: [] },
   { id: "sample-003", name: "Children's Wear", audience: "Children", category: "Clothing", description: "Product description and available sizes will be added when the inventory is supplied.", image: "", options: [] },
   { id: "sample-004", name: "Shoes", audience: "Unisex", category: "Shoes", description: "Product description and available sizes will be added when the inventory is supplied.", image: "", options: [] },
   { id: "sample-005", name: "Bags & Accessories", audience: "Unisex", category: "Accessories", description: "Product description and available colours will be added when the inventory is supplied.", image: "", options: [] },
   { id: "sample-006", name: "Perfumes & Fragrances", audience: "Unisex", category: "Fragrance", description: "Product details and bottle sizes will be added when the inventory is supplied.", image: "", options: [] }
];

/* Price-on-request storefront presentation. Prices remain available to the private
   checkout logic, but are never shown on the public product cards or product viewer. */
(() => {
  const number = "2347083251232";
  const icon = '<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.08 0C5.55 0 .24 5.31.24 11.84c0 2.09.55 4.13 1.6 5.94L.14 24l6.36-1.67a11.8 11.8 0 0 0 5.58 1.41h.01c6.53 0 11.84-5.31 11.84-11.84 0-3.17-1.23-6.15-3.43-8.4ZM12.1 21.7h-.01a9.82 9.82 0 0 1-5.01-1.37l-.36-.21-3.77.99 1.01-3.67-.23-.38a9.82 9.82 0 1 1 8.37 4.64Zm5.39-7.37c-.29-.15-1.72-.85-1.99-.95-.27-.1-.46-.15-.65.15-.19.29-.75.95-.92 1.14-.17.19-.34.22-.63.07-.29-.15-1.23-.45-2.34-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.19-.29.29-.49.1-.19.05-.36-.02-.51-.07-.15-.65-1.58-.89-2.16-.24-.57-.48-.49-.65-.5h-.55c-.19 0-.51.07-.78.36-.27.29-1.02 1-1.02 2.43s1.04 2.82 1.19 3.01c.15.19 2.05 3.13 4.97 4.39.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.12.56-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.19-.56-.34Z"/></svg>';
  const escape = value => String(value || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const dm = name => `https://wa.me/${number}?text=${encodeURIComponent(`Hello YINKAEL INT'L CLOTHINGS, I would like to know the price of ${name}.` )}`;
  const styles = document.createElement("style");
  styles.textContent = `.product-price .dm-price-link,.modal-dm-price{display:inline-flex;align-items:center;gap:7px;color:#2a9d57;font-weight:700;text-decoration:none}.dm-price-link:hover,.modal-dm-price:hover{text-decoration:underline}.dm-price-link svg,.modal-dm-price svg{width:18px;height:18px;fill:currentColor}.modal-price,#purchaseOption,.modal-info .field-label[for="purchaseOption"],.quantity-row,#optionHint,#modalAddToCart{display:none!important}.modal-dm-price{margin:13px 0;font-size:13px}`;
  document.head.appendChild(styles);
  function apply() {
    document.querySelectorAll(".product-price").forEach(el => {
      if (el.dataset.dmReady) return;
      const card = el.closest(".product-card");
      const name = card?.querySelector(".product-name-button")?.textContent.trim() || "this product";
      el.dataset.dmReady = "true";
      el.innerHTML = `<a class="dm-price-link" href="${dm(name)}" target="_blank" rel="noopener" aria-label="DM on WhatsApp for the price of ${escape(name)}">${icon}<span>DM for price</span></a>`;
    });
    const modalName = document.querySelector("#modalProductName")?.textContent.trim();
    const description = document.querySelector("#modalDescription");
    if (modalName && description && !document.querySelector(".modal-dm-price")) {
      description.insertAdjacentHTML("afterend", `<a class="modal-dm-price" href="${dm(modalName)}" target="_blank" rel="noopener">${icon}<span>DM for price on WhatsApp</span></a>`);
    }
    document.querySelectorAll("#sortSelect option").forEach(option => { if (/price/i.test(option.textContent)) option.remove(); });
  }
  new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", apply);
  apply();
})();
