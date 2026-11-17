// ==========================================
// YINKAEL INT'L CLOTHINGS - ADMIN SYSTEM
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  setPersistence, 
  browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// ==========================================
// INITIALIZE FIREBASE
// ==========================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// CLOUDINARY CONFIGURATION
// ==========================================
const CLOUDINARY_CLOUD_NAME = "Xjhfkov6"; 
const CLOUDINARY_UPLOAD_PRESET = "Yinkael_products";


// ==========================================
// DOM ELEMENTS
// ==========================================
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Dashboard Elements
const adminProductList = document.getElementById("adminProductList");
const totalProductsCount = document.getElementById("totalProductsCount");
const resultCountBadge = document.getElementById("resultCountBadge");
const adminSearchInput = document.getElementById("adminSearchInput");
const productModal = document.getElementById("productModal");
const openAddModalBtn = document.getElementById("openAddModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const productForm = document.getElementById("productForm");
const modalTitle = document.getElementById("modalTitle");
const productIdInput = document.getElementById("productId");
const imageFileInput = document.getElementById("imageFile");
const productImageInput = document.getElementById("productImage");
const uploadProgress = document.getElementById("uploadProgress");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const toast = document.getElementById("toast");

let allProducts = [];

// ==========================================
// TOAST NOTIFICATION HELPER
// ==========================================
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ==========================================
// ADMIN LOGIN
// ==========================================
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginError.style.display = "none";
    loginError.textContent = "";
    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in...";

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Login error:", error);
      let message = "Incorrect email or password.";
      if (error.code === "auth/invalid-email") message = "Please enter a valid email address.";
      else if (error.code === "auth/too-many-requests") message = "Too many attempts. Try again later.";
      
      loginError.textContent = message;
      loginError.style.display = "block";
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign In to Dashboard";
    }
  });
}

// ==========================================
// PROTECT ADMIN DASHBOARD & LOAD DATA
// ==========================================
if (window.location.pathname.endsWith("dashboard.html")) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.replace("login.html");
    } else {
      initDashboard();
    }
  });
}

// ==========================================
// LOGOUT
// ==========================================
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Logout error:", error);
    }
  });
}

// ==========================================
// DASHBOARD INITIALIZATION & FIRESTORE REAL-TIME LISTENER
// ==========================================
function initDashboard() {
  if (!adminProductList) return;

  // Real-time listener for products collection
  onSnapshot(collection(db, "products"), (snapshot) => {
    allProducts = [];
    snapshot.forEach((docSnap) => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderProducts(allProducts);
    updateStats(allProducts);
  }, (error) => {
    console.error("Error loading products:", error);
    adminProductList.innerHTML = `<div class="empty-state">Error loading inventory from database.</div>`;
  });
}

// ==========================================
// RENDER PRODUCTS
// ==========================================
function renderProducts(products) {
  if (products.length === 0) {
    adminProductList.innerHTML = `<div class="empty-state">No products found in inventory. Click "+ Add New Product" to begin.</div>`;
    if (resultCountBadge) resultCountBadge.textContent = "0 items";
    return;
  }

  if (resultCountBadge) resultCountBadge.textContent = `${products.length} item${products.length > 1 ? 's' : ''}`;

  adminProductList.innerHTML = products.map(prod => `
    <div class="admin-product-item">
      <div class="admin-product-info">
        <div class="admin-product-thumb">
          ${prod.image ? `<img src="${prod.image}" alt="${prod.name}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">` : 'YK'}
        </div>
        <div class="admin-product-details">
          <h3>${escapeHtml(prod.name)}</h3>
          <p>${escapeHtml(prod.category)} • ${escapeHtml(prod.audience)}</p>
        </div>
      </div>
      <div class="admin-product-prices">
        <div>Retail: ₦${Number(prod.retailPrice || 0).toLocaleString()}</div>
        <div style="font-size:0.8rem; color:#666;">Wholesale: ₦${Number(prod.wholesalePrice || 0).toLocaleString()}</div>
      </div>
      <div class="admin-product-buttons">
        <button type="button" class="btn btn-outline-light btn-sm" style="color:var(--color-black); border-color:var(--color-border);" onclick="window.editProduct('${prod.id}')">Edit</button>
        <button type="button" class="btn btn-danger btn-sm" onclick="window.deleteProduct('${prod.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function updateStats(products) {
  if (totalProductsCount) totalProductsCount.textContent = products.length;
}

// ==========================================
// SEARCH FILTER
// ==========================================
if (adminSearchInput) {
  adminSearchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.category.toLowerCase().includes(term) || 
      p.audience.toLowerCase().includes(term)
    );
    renderProducts(filtered);
  });
}

// ==========================================
// MODAL CONTROLS
// ==========================================
if (openAddModalBtn) {
  openAddModalBtn.addEventListener("click", () => {
    modalTitle.textContent = "Add New Product";
    productIdInput.value = "";
    productForm.reset();
    imagePreviewContainer.style.display = "none";
    productModal.classList.add("open");
  });
}

function closeModal() {
  productModal.classList.remove("open");
  productForm.reset();
  imagePreviewContainer.style.display = "none";
}

if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

// ==========================================
// CLOUDINARY IMAGE UPLOAD & PREVIEW
// ==========================================
if (imageFileInput) {
  imageFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      imagePreview.src = event.target.result;
      imagePreviewContainer.style.display = "block";
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    uploadProgress.style.display = "block";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data.secure_url) {
        productImageInput.value = data.secure_url;
        showToast("Image uploaded successfully!");
      } else {
        alert("Image upload failed. Please try again or paste image URL.");
      }
    } catch (err) {
      console.error("Cloudinary error:", err);
      alert("Network error uploading image.");
    } finally {
      uploadProgress.style.display = "none";
    }
  });
}

// Preview when URL is typed manually
if (productImageInput) {
  productImageInput.addEventListener("input", (e) => {
    const url = e.target.value.trim();
    if (url) {
      imagePreview.src = url;
      imagePreviewContainer.style.display = "block";
    } else {
      imagePreviewContainer.style.display = "none";
    }
  });
}

// ==========================================
// SAVE PRODUCT (CREATE / UPDATE)
// ==========================================
if (productForm) {
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = productIdInput.value;
    const productData = {
      name: document.getElementById("productName").value.trim(),
      audience: document.getElementById("productAudience").value,
      category: document.getElementById("productCategory").value,
      description: document.getElementById("productDescription").value.trim(),
      retailPrice: Number(document.getElementById("retailPrice").value) || 0,
      wholesalePrice: Number(document.getElementById("wholesalePrice").value) || 0,
      wholesaleMinQty: 2,
      image: productImageInput.value.trim(),
      updatedAt: serverTimestamp()
    };

    try {
      if (id) {
        // Update existing
        await updateDoc(doc(db, "products", id), productData);
        showToast("Product updated successfully!");
      } else {
        // Create new
        productData.createdAt = serverTimestamp();
        await addDoc(collection(db, "products"), productData);
        showToast("Product added successfully!");
      }
      closeModal();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product. Check permissions.");
    }
  });
}


window.editProduct = function(id) {
  const prod = allProducts.find(p => p.id === id);
  if (!prod) return;

  modalTitle.textContent = "Edit Product";
  productIdInput.value = prod.id;
  document.getElementById("productName").value = prod.name || "";
  document.getElementById("productAudience").value = prod.audience || "Men";
  document.getElementById("productCategory").value = prod.category || "Clothing";
  document.getElementById("productDescription").value = prod.description || "";
  document.getElementById("retailPrice").value = prod.retailPrice || "";
  document.getElementById("wholesalePrice").value = prod.wholesalePrice || "";
  productImageInput.value = prod.image || "";

  if (prod.image) {
    imagePreview.src = prod.image;
    imagePreviewContainer.style.display = "block";
  } else {
    imagePreviewContainer.style.display = "none";
  }

  productModal.classList.add("open");
};

window.deleteProduct = async function(id) {
  if (confirm("Are you sure you want to delete this product from inventory?")) {
    try {
      await deleteDoc(doc(db, "products", id));
      showToast("Product deleted successfully.");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product.");
    }
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
