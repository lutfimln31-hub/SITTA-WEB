/* eslint-disable no-undef, no-unused-vars */
// --- AUTHENTICATION & SESSION ---
const currentPage = window.location.pathname.split("/").pop();
const isLoginPage = currentPage === "index.html" || currentPage === "" || currentPage === "index";

if (!isLoginPage) {
  if (sessionStorage.getItem("isLoggedIn") !== "true") {
    alert("Akses Ditolak! Anda harus login terlebih dahulu.");
    window.location.replace("index.html");
  }
} else {
  if (sessionStorage.getItem("isLoggedIn") === "true") {
    window.location.replace("dashboard.html");
  }
}

// --- GLOBAL DATA & STATE ---
let cart = JSON.parse(localStorage.getItem("sitta_cart")) || [];

// Seed localStorage ONLY on first visit (never overwrite existing data)
if (!localStorage.getItem("sitta_history_initialized")) {
  if (typeof dataHistory !== 'undefined') {
    localStorage.setItem("sitta_history", JSON.stringify(dataHistory));
  }
  localStorage.setItem("sitta_history_initialized", "true");
}
if (!localStorage.getItem("sitta_stock_initialized")) {
  if (typeof dataBahanAjar !== 'undefined') {
    localStorage.setItem("sitta_stock", JSON.stringify(dataBahanAjar));
  }
  localStorage.setItem("sitta_stock_initialized", "true");
}

let historyStore = JSON.parse(localStorage.getItem("sitta_history")) || [];
let stockStore = JSON.parse(localStorage.getItem("sitta_stock")) || [];
let currentStockView = 'grid';

// --- GLOBAL DOM CONTENT LOADED ---
document.addEventListener("DOMContentLoaded", () => {
  setupCommonUI();
  updateCartBadge();
  
  if (document.getElementById("greeting")) renderDashboard();
  if (document.getElementById("historyTableBody")) renderHistoryTable();
  if (document.getElementById("stokGrid")) renderStockGrid();
  
  setupTracking();

  // Realtime Clock
  const clockElement = document.getElementById("realtimeClock");
  if (clockElement) {
    const updateClock = () => {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const dateString = now.toLocaleDateString('id-ID', options);
      const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";
      clockElement.innerHTML = `<i class="far fa-calendar-alt"></i> ${dateString} <span style="margin-left:15px;"><i class="far fa-clock"></i> ${timeString}</span>`;
    };
    updateClock();
    setInterval(updateClock, 1000);
  }
});

// --- COMMON UI SETUP ---
function setupCommonUI() {
  // Logout Handler
  document.querySelectorAll('a').forEach(a => {
    if (a.textContent.trim().toLowerCase().includes('logout') || a.textContent.trim().toLowerCase().includes('keluar')) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('isLoggedIn');
        window.location.replace("index.html");
      });
    }
  });

  // Login Form Validation
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim().toLowerCase();
      const pass = document.getElementById("password").value.trim();
      
      if (typeof dataPengguna === 'undefined') {
        console.error("Data pengguna tidak ditemukan!");
        alert("Terjadi kesalahan sistem: Data pengguna tidak dapat dimuat.");
        return;
      }

      const user = dataPengguna.find(u => u.email.toLowerCase() === email && u.password === pass);

      if (user) {
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userName", user.nama);
        sessionStorage.setItem("userRole", user.role);
        window.location.replace("dashboard.html");
      } else {
        const errorMsg = "Email atau password yang Anda masukkan salah!";
        alert(errorMsg);
        console.warn(`Gagal login: ${email}`);
      }
    });
  }

  // Modal Handlers
  const closes = document.querySelectorAll(".close");
  closes.forEach(el => {
    el.addEventListener("click", () => {
      const modal = el.closest(".modal");
      if (modal) {
        modal.classList.remove("show");
        setTimeout(() => modal.style.display = "none", 300);
      }
    });
  });

  // Dropdown Click Toggle (ONLY ON CLICK)
  const dropdowns = document.querySelectorAll(".dropdown");
  dropdowns.forEach(dd => {
    const link = dd.querySelector("a");
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // Stop from closing immediately
      dd.classList.toggle("show");
    });
  });

  // Close dropdown when clicking outside
  window.addEventListener("click", (e) => {
    dropdowns.forEach(dd => {
      if (!dd.contains(e.target)) {
        dd.classList.remove("show");
      }
    });
  });
}

// --- DASHBOARD LOGIC ---
function renderDashboard() {
  const userName = sessionStorage.getItem("userName") || "Rina Wulandari";
  const greetingEl = document.getElementById("greeting");
  if (greetingEl) greetingEl.innerText = `Selamat Datang, ${userName}`;

  // Update Stats
  const statStok = document.getElementById("statTotalStok");
  if (statStok) statStok.innerText = stockStore.reduce((acc, curr) => acc + curr.stok, 0).toLocaleString('id-ID');
  
  const statSelesai = document.getElementById("statDOSelesai");
  if (statSelesai) statSelesai.innerText = historyStore.filter(h => h.status === 'Selesai').length;
  
  const statProses = document.getElementById("statDOProses");
  if (statProses) statProses.innerText = historyStore.filter(h => h.status === 'Proses').length;
  
  const statLimit = document.getElementById("statStokLimit");
  if (statLimit) statLimit.innerText = stockStore.filter(b => b.stok < (b.limit * 0.2)).length;

  // Recent Activity Table
  const tableBody = document.getElementById("recentActivityTable");
  if (tableBody) {
    let html = "";
    historyStore.slice(0, 5).forEach(h => {
      const statusClass = h.status === 'Selesai' ? 'badge-success' : 'badge-warning';
      html += `
        <tr>
          <td><strong>${h.id}</strong></td>
          <td>${h.tanggal}</td>
          <td>${h.pengguna}</td>
          <td>${h.bahanAjar}</td>
          <td><span class="badge ${statusClass}">${h.status}</span></td>
        </tr>
      `;
    });
    tableBody.innerHTML = html;
  }

  // Stock List Dashboard (Progress Bars)
  const stockList = document.getElementById("stockListDashboard");
  if (stockList) {
    let stockHtml = "";
    stockStore.slice(0, 5).forEach(b => {
      const percent = Math.min((b.stok / b.limit) * 100, 100);
      const color = percent < 20 ? '#ef4444' : percent < 50 ? '#f59e0b' : '#3b82f6';
      stockHtml += `
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 5px;">
            <span>${b.namaBarang}</span>
            <span>${b.stok} <small style="color: var(--text-muted);">/ ${b.limit}</small></span>
          </div>
          <div class="progress-container" style="height: 6px;">
            <div class="progress-bar" style="width: ${percent}%; background: ${color};"></div>
          </div>
        </div>
      `;
    });
    stockList.innerHTML = stockHtml;
  }

  // User Activity List
  const userList = document.getElementById("userActivityList");
  if (userList) {
    let userHtml = "";
    const userStats = {};
    historyStore.forEach(h => {
      userStats[h.pengguna] = (userStats[h.pengguna] || 0) + h.jumlah;
    });
    Object.keys(userStats).sort((a,b) => userStats[b] - userStats[a]).slice(0, 4).forEach(user => {
      const val = userStats[user];
      const maxVal = Math.max(...Object.values(userStats), 1);
      const percent = (val / maxVal) * 100;
      userHtml += `
        <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
              <span>${user}</span>
              <strong>${val} eks</strong>
            </div>
            <div class="progress-container" style="height: 6px;">
              <div class="progress-bar" style="width: ${percent}%; background: #10b981;"></div>
            </div>
          </div>
        </div>
      `;
    });
    userList.innerHTML = userHtml;
  }
}

// --- HISTORY TABLE LOGIC ---
function renderHistoryTable() {
  const tableBody = document.getElementById("historyTableBody");
  const searchInput = document.getElementById("historySearch");
  const statusFilter = document.getElementById("statusFilter");
  const dateFilter = document.getElementById("dateFilter");
  const resetBtn = document.getElementById("resetFilterBtn");
  const exportBtn = document.getElementById("exportCsvBtn");

  const filterAndRender = () => {
    if (!tableBody) return;
    const q = searchInput ? searchInput.value.toLowerCase() : "";
    const status = statusFilter ? statusFilter.value : "Semua";
    const date = dateFilter ? dateFilter.value : "";

    const filtered = historyStore.filter(h => {
      const matchSearch = h.pengguna.toLowerCase().includes(q) || h.bahanAjar.toLowerCase().includes(q) || h.id.toLowerCase().includes(q) || h.do.includes(q);
      const matchStatus = status === "Semua" || h.status === status;
      const matchDate = !date || h.tanggal === date;
      return matchSearch && matchStatus && matchDate;
    });

    let html = "";
    filtered.forEach(h => {
      const statusClass = h.status === 'Selesai' ? 'badge-success' : 'badge-warning';
      html += `
        <tr>
          <td><strong>${h.id}</strong></td>
          <td>${h.tanggal}</td>
          <td><code>${h.do}</code><br><small style="color:var(--primary)">${h.resi || '-'}</small></td>
          <td>${h.bill || '-'}</td>
          <td>${h.pengguna}</td>
          <td>${h.bahanAjar}</td>
          <td>${h.jumlah} eks</td>
          <td><span class="badge ${statusClass}">${h.status}</span></td>
          <td><a href="tracking.html?do=${h.do}" style="color: var(--primary); font-weight: 700; text-decoration: none;">Detail</a></td>
        </tr>
      `;
    });
    tableBody.innerHTML = html || '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">Tidak ada data yang ditemukan.</td></tr>';
    
    if (document.getElementById("showingCount")) document.getElementById("showingCount").innerText = filtered.length;
    if (document.getElementById("totalCount")) document.getElementById("totalCount").innerText = historyStore.length;
  };

  if (searchInput) {
    searchInput.addEventListener("input", filterAndRender);
    statusFilter.addEventListener("change", filterAndRender);
    dateFilter.addEventListener("change", filterAndRender);
    resetBtn.addEventListener("click", () => {
      searchInput.value = "";
      statusFilter.value = "Semua";
      dateFilter.value = "";
      filterAndRender();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportToCSV(historyStore, "Histori_Transaksi_SITTA.csv");
    });
  }

  filterAndRender();
}

// --- STOCK GRID & TABLE LOGIC ---
function renderStockGrid() {
  const container = document.getElementById("stokGrid");
  const searchInput = document.getElementById("searchInput");
  const typeFilter = document.getElementById("typeFilter");
  const viewBtns = document.querySelectorAll(".view-btn");

  const filterAndRender = () => {
    if (!container) return;
    const q = searchInput ? searchInput.value.toLowerCase() : "";
    const type = typeFilter ? typeFilter.value : "Semua";

    const filtered = stockStore.filter(b => {
      const matchSearch = b.namaBarang.toLowerCase().includes(q) || b.kodeBarang.toLowerCase().includes(q);
      const matchType = type === "Semua" || b.jenisBarang === type;
      return matchSearch && matchType;
    });

    if (currentStockView === 'grid') {
      container.style.display = "grid";
      container.style.gridTemplateColumns = "repeat(auto-fill, minmax(280px, 1fr))";
      let html = "";
      filtered.forEach((b) => {
        const percent = (b.stok / b.limit) * 100;
        const statusClass = percent < 20 ? 'badge-danger' : percent < 50 ? 'badge-warning' : 'badge-success';
        const barColor = percent < 20 ? '#ef4444' : percent < 50 ? '#f59e0b' : '#3b82f6';
        const coverUrl = b.cover || 'img/placeholder.jpg';

        html += `
          <div class="stock-card" style="animation: fadeIn 0.3s ease forwards; position: relative;">
            <div style="height: 180px; overflow: hidden; background: #000; position: relative;">
              <img src="${coverUrl}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.7;" onerror="this.src='https://via.placeholder.com/200x300?text=No+Cover'">
              <div style="position: absolute; bottom: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between;">
                 <span class="badge ${statusClass}" style="font-size: 10px;">${b.jenisBarang}</span>
              </div>
              <!-- Tombol Hapus -->  
              <button onclick="openDeleteConfirm('${b.kodeBarang}')" title="Hapus Bahan Ajar"
                style="position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(239,68,68,0.85); color: white; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; backdrop-filter: blur(4px);"
                onmouseover="this.style.transform='scale(1.15)'; this.style.background='rgba(239,68,68,1)'"
                onmouseout="this.style.transform='scale(1)'; this.style.background='rgba(239,68,68,0.85)'">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            <div style="padding: 15px;">
              <h4 style="color: var(--secondary); font-size: 11px; margin-bottom: 5px;">${b.kodeBarang}</h4>
              <h3 style="font-size: 16px; margin-bottom: 15px; height: 40px; overflow: hidden;">${b.namaBarang}</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
                <span style="color: var(--text-muted);">Edisi ${b.edisi}</span>
                <span style="font-weight: 700; color: ${barColor}">${b.stok} eks</span>
              </div>
              <div class="progress-container" style="height: 6px; margin-bottom: 15px;">
                <div class="progress-bar" style="width: ${percent}%; background: ${barColor}"></div>
              </div>
              <button onclick="addToCart('${b.kodeBarang}')" class="btn" style="width: 100%; padding: 10px; font-size: 13px; background: var(--primary);">
                <i class="fas fa-cart-plus"></i> Tambah ke Keranjang
              </button>
            </div>
          </div>
        `;
      });
      container.innerHTML = html || '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Tidak ada data.</p>';
    } else {
      container.style.display = "block";
      let tableHtml = `
        <div class="table-wrapper" style="margin-top: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
          <table>
            <thead>
              <tr>
                <th>Cover</th>
                <th>Kode</th>
                <th>Nama Bahan Ajar</th>
                <th>Edisi</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
      `;
      filtered.forEach(b => {
        const percent = (b.stok / b.limit) * 100;
        const statusClass = percent < 20 ? 'badge-danger' : percent < 50 ? 'badge-warning' : 'badge-success';
        const coverUrl = b.cover || 'img/placeholder.jpg';
        tableHtml += `
          <tr>
            <td style="width: 60px;"><img src="${coverUrl}" style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://via.placeholder.com/40x50?text=x'"></td>
            <td><code>${b.kodeBarang}</code></td>
            <td style="font-weight: 600;">${b.namaBarang}</td>
            <td>${b.edisi}</td>
            <td><strong>${b.stok}</strong></td>
            <td><span class="badge ${statusClass}">${percent < 20 ? 'Limit' : 'Aman'}</span></td>
            <td style="display:flex; gap:6px;">
              <button onclick="addToCart('${b.kodeBarang}')" class="btn btn-small" style="padding: 8px;" title="Tambah ke keranjang"><i class="fas fa-cart-plus"></i></button>
              <button onclick="openDeleteConfirm('${b.kodeBarang}')" class="btn btn-small" style="padding: 8px; background: var(--danger);" title="Hapus"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `;
      });
      tableHtml += `</tbody></table></div>`;
      container.innerHTML = tableHtml;
    }
  };

  if (viewBtns) {
    viewBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        viewBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentStockView = btn.getAttribute("data-view");
        filterAndRender();
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterAndRender);
    typeFilter.addEventListener("change", filterAndRender);
  }

  // Tombol Tambah Stok → buka modal
  const addStokBtn = document.getElementById("addStokBtn");
  const addModal = document.getElementById("addModal");
  if (addStokBtn && addModal) {
    addStokBtn.addEventListener("click", () => {
      // Reset cover preview setiap buka modal
      const prev = document.getElementById("coverPreview");
      const fname = document.getElementById("coverFileName");
      const urlIn = document.getElementById("coverUrl");
      const fileIn = document.getElementById("coverFile");
      if (prev) prev.src = "https://via.placeholder.com/90x120/1e293b/64748b?text=No+Cover";
      if (fname) fname.textContent = "Belum ada file dipilih";
      if (urlIn) urlIn.value = "";
      if (fileIn) fileIn.value = "";
      window._coverBase64 = null;
      addModal.style.display = "flex";
      setTimeout(() => addModal.classList.add("show"), 10);
    });
  }

  // Cover: upload file → konversi base64
  const coverFileInput = document.getElementById("coverFile");
  if (coverFileInput) {
    coverFileInput.addEventListener("change", () => {
      const file = coverFileInput.files[0];
      if (!file) return;
      const fname = document.getElementById("coverFileName");
      if (fname) fname.textContent = file.name;
      // Bersihkan URL input
      const urlIn = document.getElementById("coverUrl");
      if (urlIn) urlIn.value = "";

      const reader = new FileReader();
      reader.onload = (ev) => {
        window._coverBase64 = ev.target.result;
        const prev = document.getElementById("coverPreview");
        if (prev) prev.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Cover: URL input → live preview
  const coverUrlInput = document.getElementById("coverUrl");
  if (coverUrlInput) {
    coverUrlInput.addEventListener("input", () => {
      const val = coverUrlInput.value.trim();
      if (!val) return;
      // Bersihkan file pilihan
      window._coverBase64 = null;
      const fname = document.getElementById("coverFileName");
      if (fname) fname.textContent = "Belum ada file dipilih";
      const fileIn = document.getElementById("coverFile");
      if (fileIn) fileIn.value = "";
      // Preview
      const prev = document.getElementById("coverPreview");
      if (prev) {
        prev.onerror = () => { prev.src = "https://via.placeholder.com/90x120/1e293b/64748b?text=Error"; };
        prev.src = val;
      }
    });
  }

  const addForm = document.getElementById("addForm");
  if (addForm) {
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      // Tentukan cover: prioritaskan file upload (base64), lalu URL
      const urlVal = (document.getElementById("coverUrl")?.value || "").trim();
      const cover = window._coverBase64 || urlVal || "img/placeholder.jpg";

      const newItem = {
        kodeLokasi: document.getElementById("lokasi").value,
        kodeBarang: document.getElementById("kode").value,
        namaBarang: document.getElementById("nama").value,
        jenisBarang: document.getElementById("jenis").value,
        edisi: document.getElementById("edisi").value,
        stok: parseInt(document.getElementById("stok").value),
        limit: 1000,
        cover: cover
      };
      stockStore.unshift(newItem);
      localStorage.setItem("sitta_stock", JSON.stringify(stockStore));
      filterAndRender();
      addForm.reset();
      window._coverBase64 = null;
      // Tutup addModal secara spesifik
      if (addModal) {
        addModal.classList.remove("show");
        setTimeout(() => addModal.style.display = "none", 300);
      }
      showToast("Bahan ajar baru berhasil ditambahkan!");
    });
  }

  // --- HAPUS BUKU ---
  const deleteModal = document.getElementById("deleteModal");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  let _deleteTargetKode = null;

  window.openDeleteConfirm = (kode) => {
    _deleteTargetKode = kode;
    const item = stockStore.find(b => b.kodeBarang === kode);
    const msgEl = document.getElementById("deleteModalMsg");
    if (item && msgEl) msgEl.textContent = `"${item.namaBarang}" (${kode}) akan dihapus dari sistem secara permanen.`;
    if (deleteModal) {
      deleteModal.style.display = "flex";
      setTimeout(() => deleteModal.classList.add("show"), 10);
    }
  };

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", () => {
      if (!_deleteTargetKode) return;
      stockStore = stockStore.filter(b => b.kodeBarang !== _deleteTargetKode);
      localStorage.setItem("sitta_stock", JSON.stringify(stockStore));
      filterAndRender();
      if (deleteModal) {
        deleteModal.classList.remove("show");
        setTimeout(() => deleteModal.style.display = "none", 300);
      }
      showToast("Bahan ajar berhasil dihapus.");
      _deleteTargetKode = null;
    });
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", () => {
      if (deleteModal) {
        deleteModal.classList.remove("show");
        setTimeout(() => deleteModal.style.display = "none", 300);
      }
      _deleteTargetKode = null;
    });
  }

  filterAndRender();
}

// --- CART LOGIC ---
function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (badge) {
    const total = cart.reduce((acc, item) => acc + item.qty, 0);
    badge.innerText = total;
    badge.style.display = total > 0 ? "flex" : "none";
  }
}

function addToCart(kode) {
  const item = stockStore.find(b => b.kodeBarang === kode);
  if (!item) return;

  if (item.stok < 1) {
    alert("Maaf, stok barang ini sedang kosong!");
    return;
  }

  const inCart = cart.find(c => c.kode === kode);
  if (inCart) {
    inCart.qty++;
  } else {
    cart.push({ kode: item.kodeBarang, nama: item.namaBarang, qty: 1, price: 150000 });
  }

  localStorage.setItem("sitta_cart", JSON.stringify(cart));
  updateCartBadge();
  showToast(`Berhasil menambahkan ${item.namaBarang}`);
}

function showToast(msg) {
  let toast = document.querySelector(".sitta-toast");
  if (toast) toast.remove();
  
  toast = document.createElement("div");
  toast.className = "sitta-toast success";
  toast.style.cssText = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; padding: 12px 25px; background: var(--success); color: white; border-radius: 30px; box-shadow: var(--shadow-lg); animation: slideUp 0.3s ease; display: flex; align-items: center;";
  toast.innerHTML = `<i class="fas fa-check-circle" style="margin-right: 10px;"></i> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function openCart() {
  const modal = document.getElementById("cartModal");
  if (!modal) return;
  renderCartItems();
  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("show"), 10);
}

function renderCartItems() {
  const list = document.getElementById("cartList");
  const totalEl = document.getElementById("cartTotal");
  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fas fa-shopping-basket" style="font-size: 40px; margin-bottom: 15px; opacity: 0.3;"></i><p>Keranjang masih kosong.</p></div>`;
    totalEl.innerText = "Rp 0";
    return;
  }

  let html = "";
  let total = 0;
  cart.forEach((item, idx) => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02); margin-bottom: 10px; border-radius: 8px;">
        <div style="flex: 1;">
          <h4 style="margin: 0; font-size: 14px; color: var(--secondary);">${item.kode}</h4>
          <p style="margin: 3px 0; font-size: 13px; font-weight: 500;">${item.nama}</p>
          <div style="font-size: 12px; color: var(--text-muted);">Rp ${item.price.toLocaleString()} x ${item.qty}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button onclick="changeQty(${idx}, -1)" class="btn btn-small" style="padding: 5px 12px; background: var(--surface); border: 1px solid var(--border);">-</button>
          <span style="font-weight: 700; min-width: 20px; text-align: center;">${item.qty}</span>
          <button onclick="changeQty(${idx}, 1)" class="btn btn-small" style="padding: 5px 12px; background: var(--surface); border: 1px solid var(--border);">+</button>
          <button onclick="removeFromCart(${idx})" style="color: var(--danger); background: none; border: none; cursor: pointer; margin-left: 10px; font-size: 16px;"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
  totalEl.innerText = `Rp ${total.toLocaleString()}`;
}

window.changeQty = (idx, delta) => {
  cart[idx].qty += delta;
  if (cart[idx].qty < 1) cart[idx].qty = 1;
  localStorage.setItem("sitta_cart", JSON.stringify(cart));
  renderCartItems();
  updateCartBadge();
};

window.removeFromCart = (idx) => {
  cart.splice(idx, 1);
  localStorage.setItem("sitta_cart", JSON.stringify(cart));
  renderCartItems();
  updateCartBadge();
};

window.checkout = () => {
  if (cart.length === 0) return;

  const trxId = "TRX-" + Math.floor(Math.random() * 100000);
  const doId = "DO-" + (2026000000 + Math.floor(Math.random() * 10000));
  const billId = "BILL-" + Math.floor(Math.random() * 90000 + 10000);
  const resiId = "RESI-UT" + Math.floor(Math.random() * 900000 + 100000);
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const userName = sessionStorage.getItem("userName") || "Rina Wulandari";

  // Create Receipt Content
  let itemsHtml = "";
  let total = 0;
  cart.forEach(item => {
    const sub = item.price * item.qty;
    total += sub;
    itemsHtml += `
      <div class="receipt-item">
        <span>${item.nama} x${item.qty}</span>
        <span>Rp ${sub.toLocaleString()}</span>
      </div>
    `;

    // Deduct Stock
    const stockItem = stockStore.find(b => b.kodeBarang === item.kode);
    if (stockItem) {
      stockItem.stok -= item.qty;
      if (stockItem.stok < 0) stockItem.stok = 0;
    }

    // Add to History Store
    historyStore.unshift({
      id: trxId,
      tanggal: dateStr,
      do: doId,
      bill: billId,
      resi: resiId,
      pengguna: userName,
      bahanAjar: item.nama,
      jumlah: item.qty,
      status: "Proses"
    });
  });

  const receiptHtml = `
    <div class="receipt-paper">
      <div class="receipt-header" style="margin-bottom: 10px;">
        <h3 style="margin: 0; color: #000; font-size: 16px;">SITTA UNIVERSITAS TERBUKA</h3>
        <p style="font-size: 9px; margin: 3px 0;">Sistem Informasi Transaksi & Tracking Bahan Ajar</p>
        <p style="font-size: 11px; font-weight: bold; margin-top: 5px; border-top: 1px solid #000; padding-top: 5px;">STRUK PENGIRIMAN RESMI</p>
      </div>
      <div style="font-size: 11px; margin-bottom: 10px; line-height: 1.4;">
        <div style="display: flex; justify-content: space-between;"><span>ID TRX:</span> <strong>${trxId}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>NO. DO:</span> <strong>${doId}</strong></div>
        <div style="display: flex; justify-content: space-between; color: #d32f2f;"><span>NO. BILLING:</span> <strong>${billId}</strong></div>
        <div style="display: flex; justify-content: space-between; color: #1976d2;"><span>NO. RESI:</span> <strong>${resiId}</strong></div>
        <div style="display: flex; justify-content: space-between; border-top: 1px dashed #ccc; margin-top: 5px; padding-top: 5px;"><span>TANGGAL:</span> <span>${dateStr}</span></div>
        <div style="display: flex; justify-content: space-between;"><span>PETUGAS:</span> <span>${userName}</span></div>
      </div>
      <div style="border-top: 1px solid #000; padding-top: 8px;">
        ${itemsHtml}
      </div>
      <div class="receipt-total" style="font-size: 16px; margin-top: 10px;">
        <span>TOTAL:</span>
        <span>Rp ${total.toLocaleString()}</span>
      </div>
      <div class="receipt-footer">
        <p style="font-weight: bold;">BARANG DALAM PROSES KIRIM</p>
        <p>Silakan pantau nomor resi di menu Tracking.</p>
        <p style="margin-top: 8px; font-size: 9px; opacity: 0.7;">Waktu: ${new Date().toLocaleString()}</p>
      </div>
    </div>
  `;

  // Update Persistence
  localStorage.setItem("sitta_history", JSON.stringify(historyStore));
  localStorage.setItem("sitta_stock", JSON.stringify(stockStore));
  
  // Refresh UI
  if (typeof renderStockGrid === 'function' && document.getElementById("stokGrid")) renderStockGrid();
  if (typeof renderDashboard === 'function' && document.getElementById("greeting")) renderDashboard();
  
  // Show Receipt Modal
  const receiptModal = document.getElementById("receiptModal");
  const receiptContent = document.getElementById("receiptContent");
  if (receiptModal && receiptContent) {
    receiptContent.innerHTML = receiptHtml;
    receiptModal.style.display = "flex";
    setTimeout(() => receiptModal.classList.add("show"), 10);
  }

  // Clear Cart
  cart = [];
  localStorage.setItem("sitta_cart", JSON.stringify(cart));
  
  // Close Cart Modal
  const modal = document.getElementById("cartModal");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => modal.style.display = "none", 300);
  }
  
  updateCartBadge();
};

// --- TRACKING LOGIC ---
function setupTracking() {
  const searchBtn = document.getElementById("searchDO");
  const doInput = document.getElementById("doNumber");
  const resultDiv = document.getElementById("trackingResult");
  const billingListDiv = document.getElementById("billingList");

  if (searchBtn) {
    // Auto-search from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const doParam = urlParams.get('do');
    if (doParam && doInput) {
      doInput.value = doParam;
      setTimeout(() => searchBtn.click(), 100);
    }

    searchBtn.addEventListener("click", () => {
      const doVal = doInput.value.trim();
      if (!doVal) return;
      
      // Search in static dataTracking first
      let data = (typeof dataTracking !== 'undefined') ? dataTracking[doVal] : null;

      // If not found, search in dynamic historyStore
      if (!data) {
        const histItem = historyStore.find(h => h.do === doVal);
        if (histItem) {
          const isSelesai = histItem.status === 'Selesai';
          const steps = [
            { waktu: histItem.tanggal + " 08:00", keterangan: "Pesanan Diterima & Diverifikasi" },
            { waktu: histItem.tanggal + " 10:30", keterangan: "Dokumen Billing Dicetak (" + histItem.bill + ")" },
            { waktu: histItem.tanggal + " 14:00", keterangan: "Bahan Ajar Sedang Dikemas di Gudang" }
          ];

          if (isSelesai) {
            steps.push({ waktu: histItem.tanggal + " 17:00", keterangan: "Paket Telah Diterima oleh Customer (Selesai)" });
          }

          data = {
            nomorDO: histItem.do,
            nama: histItem.pengguna,
            status: histItem.status,
            ekspedisi: "SITTA Logistics",
            tanggalKirim: histItem.tanggal,
            total: "Rp " + (histItem.jumlah * 150000).toLocaleString(),
            perjalanan: steps
          };
        }
      }

      if (!data) {
        resultDiv.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger); background: var(--surface); border-radius: 16px; border: 1px solid var(--border);"><i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 15px;"></i><p>Nomor DO tidak ditemukan!</p></div>`;
        return;
      }

      let timelineHtml = "";
      data.perjalanan.forEach((p, idx) => {
        const isActive = idx === data.perjalanan.length - 1 ? "active" : "";
        timelineHtml += `
          <div class="timeline-item ${isActive}" style="display: flex; gap: 20px; margin-bottom: 20px; position: relative;">
            <div style="width: 40px; height: 40px; background: rgba(45, 106, 79, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--primary); ${isActive ? 'background: var(--primary); color: white;' : 'background: var(--surface); border: 2px solid var(--border);'}; margin-top: 5px; position: relative; z-index: 2; box-shadow: ${isActive ? '0 0 10px var(--primary)' : 'none'};"><i class="fas fa-check"></i></div>
            <div style="flex: 1;">
              <div style="font-size: 12px; color: var(--text-muted);">${p.waktu}</div>
              <div style="color: var(--text-main); font-weight: 600;">${p.keterangan}</div>
            </div>
          </div>
        `;
      });

      resultDiv.innerHTML = `
        <div class="card" style="animation: slideUp 0.4s ease; background: var(--surface); border: 1px solid var(--border); padding: 25px; border-radius: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid var(--border); padding-bottom: 15px;">
            <div>
              <h4 style="color: var(--secondary); margin-bottom: 5px; font-size: 12px;">NO. DO: ${data.nomorDO}</h4>
              <h2 style="margin: 0; font-size: 22px;">${data.nama}</h2>
            </div>
            <span class="badge badge-info" style="font-size: 12px; padding: 6px 12px;">${data.status}</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; border: 1px solid var(--border);">
            <div><span style="display: block; font-size: 10px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px;">Ekspedisi</span><strong>${data.ekspedisi}</strong></div>
            <div><span style="display: block; font-size: 10px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px;">Tanggal</span><strong>${data.tanggalKirim}</strong></div>
            <div><span style="display: block; font-size: 10px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px;">Total</span><strong>${data.total}</strong></div>
          </div>
          <h3 style="font-size: 16px; margin-bottom: 25px;"><i class="fas fa-route" style="margin-right: 10px; color: var(--primary);"></i> Riwayat Perjalanan</h3>
          <div style="padding-left: 5px; position: relative;">
            <div style="position: absolute; left: 5px; top: 10px; bottom: 20px; width: 2px; background: var(--border); z-index: 1;"></div>
            ${timelineHtml}
          </div>
        </div>
      `;
    });
  }

  if (billingListDiv) {
    let billingHtml = "";
    historyStore.slice(0, 10).forEach(h => {
      billingHtml += `
        <div style="padding: 12px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: 0.2s; background: rgba(255,255,255,0.02);" 
             onclick="document.getElementById('doNumber').value='${h.do}'; document.getElementById('searchDO').click();"
             onmouseover="this.style.borderColor='var(--primary)'; this.style.background='rgba(59, 130, 246, 0.05)'"
             onmouseout="this.style.borderColor='var(--border)'; this.style.background='rgba(255,255,255,0.02)'">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <div style="font-weight: 700; color: var(--secondary); font-size: 14px;">${h.do}</div>
              <div style="font-size: 12px; color: var(--text-main); margin: 3px 0;">${h.pengguna}</div>
            </div>
            <span class="badge ${h.status === 'Selesai' ? 'badge-success' : 'badge-warning'}" style="font-size: 9px; padding: 2px 6px;">${h.status}</span>
          </div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 5px; display: flex; justify-content: space-between;">
             <span>${h.tanggal}</span>
             <span style="color: var(--primary); font-weight: 600;">${h.bill}</span>
          </div>
        </div>
      `;
    });
    billingListDiv.innerHTML = billingHtml;
  }
}

// --- UTILS ---
function exportToCSV(data, filename) {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(obj => {
    return Object.values(obj).map(v => `"${v}"`).join(",");
  }).join("\n");
  const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
