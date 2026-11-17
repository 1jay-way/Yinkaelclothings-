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
