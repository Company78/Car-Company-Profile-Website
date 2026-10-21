/* ============================================================
   GROCERY WAREHOUSE — RECEIVING DASHBOARD
   ✅ Auto-Completed receiving
   ✅ No Edit/Cancel in Receiving Records
   ✅ Latest PO/Receiving first
   ✅ QOH updates ONLY on completed receiving
   ✅ Products: Search + Category filter
   ✅ Suppliers: Search + Carries product filter
   ✅ Receiving Records: Search + Date + Status + Clear
============================================================ */

const baseApiUrl = "http://localhost/grocery_warehouse/receiving_api.php";

const getStoredUser = () => {
    const raw = sessionStorage.getItem("user");
    try {
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
};

const currentUser = getStoredUser();

const RECEIVING_ROLE_IDS = [1, 5];

const isReceivingUser = (u) => {
    if (!u) return false;
    const role = String(u.RoleName || "").toLowerCase().replace(/[^a-z]/g, "");
    return RECEIVING_ROLE_IDS.includes(Number(u.RoleID)) ||
        role.includes("receiv") ||
        role === "admin" ||
        role === "administrator";
};

if (!isReceivingUser(currentUser)) {
    sessionStorage.removeItem("user");
    window.location.replace("login.html");
}

const callApi = async (operation, payload = {}) => {
    const user = getStoredUser();

    const body = {
        ...payload,
        LoggedInUserID: user ? user.UserID : null
    };

    const formData = new FormData();
    formData.append("operation", operation);
    formData.append("json", JSON.stringify(body));

    try {
        const res = await axios({
            url: baseApiUrl,
            method: "POST",
            data: formData
        });
        return res.data;
    } catch (error) {
        console.error("API ERROR:", error);
        return {
            success: false,
            message: error?.response?.data?.message || "Unable to connect to the server.",
            data: []
        };
    }
};

let STATUSES_CACHE = [];
let SUPPLIERS_CACHE = [];
let CATEGORIES_CACHE = [];
let PRODUCTS_CACHE = [];
let AISLES_CACHE = [];
let SHELVES_CACHE = [];

const valueOf = (id) => (document.getElementById(id) || {}).value || "";

const esc = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

const statusBadge = (val) => {
    const map = {
        Active: "badge-green",
        Inactive: "badge-gray",
        Pending: "badge-amber",
        Approved: "badge-green",
        Completed: "badge-green",
        Cancelled: "badge-gray",
        Rejected: "badge-red",
        Draft: "badge-gray",
        Received: "badge-green"
    };
    return `<span class="badge ${map[val] || "badge-gray"}">${esc(val ?? "-")}</span>`;
};

const isPOReceived = (name) =>
    ["completed", "received"].includes(String(name || "").trim().toLowerCase());

const varianceBadge = (variance) => {
    const v = Number(variance);
    if (v === 0) return `<span class="badge badge-green">Match</span>`;
    if (v > 0) return `<span class="badge badge-amber">+${v} Excess</span>`;
    return `<span class="badge badge-red">${v} Short</span>`;
};

const emptyRow = (colspan, message) =>
    `<tr><td colspan="${colspan}" class="empty-row">${esc(message)}</td></tr>`;

const loadingRow = (colspan) =>
    `<tr><td colspan="${colspan}" class="empty-row">Loading...</td></tr>`;

const setCount = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = count === 0 ? "" : `${count} record${count === 1 ? "" : "s"} found`;
};

const fillSelect = (id, rows, valueKey, labelKey, allLabel) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = `<option value="">${esc(allLabel)}</option>` +
        rows.map(r => `<option value="${esc(r[valueKey])}">${esc(r[labelKey])}</option>`).join("");
};

const logout = async () => {
    await callApi("logout");
    sessionStorage.removeItem("user");
    window.location.href = "login.html";
};

/* ============================================================
   SECTION SWITCHING
============================================================ */

const sectionTitles = {
    "section-dashboard": "Dashboard",
    "section-product": "Products",
    "section-supplier": "Suppliers",
    "section-storage-location": "Storage Location",
    "section-expected-po": "Expected Purchase Orders",
    "section-receivings": "Receiving Records"
};

function switchSection(targetId) {
    document.querySelectorAll(".page-section").forEach(el =>
        el.classList.remove("active-section")
    );

    const target = document.getElementById(targetId);
    if (!target) return;

    target.classList.add("active-section");

    document.querySelectorAll(".nav-link").forEach(el =>
        el.classList.remove("active")
    );

    const nav = document.querySelector(`.nav-link[data-target="${targetId}"]`);
    if (nav) nav.classList.add("active");

    const title = document.getElementById("page-title");
    if (title) title.textContent = sectionTitles[targetId] || "";

    closeSidebar();

    if (targetId === "section-dashboard") {
        loadDashboard();
        requestAnimationFrame(() => handleDashboardResize());
    }
    else if (targetId === "section-product") loadProducts();
    else if (targetId === "section-supplier") loadSuppliers();
    else if (targetId === "section-storage-location") loadStorageLocationTables();
    else if (targetId === "section-expected-po") loadExpectedPOs();
    else if (targetId === "section-receivings") loadReceivings();
}

function goToSection(targetId) {
    const nav = document.querySelector(`.nav-link[data-target="${targetId}"]`);
    if (nav) nav.click();
    else switchSection(targetId);
}

function openOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("open");
}

function closeOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("open");
}

/* ============================================================
   ALERT MODAL
============================================================ */

let alertResolver = null;

const ALERT_ICONS = { error: "✕", warning: "!", success: "✓", info: "i" };
const ALERT_TITLES = { error: "Error", warning: "Please check", success: "Success", info: "Notice" };

function showAlert(message, options = {}) {
    const type = ALERT_ICONS[options.type] ? options.type : "info";

    if (alertResolver) {
        const prev = alertResolver;
        alertResolver = null;
        prev();
    }

    const titleEl = document.getElementById("alert-modal-title");
    const msgEl = document.getElementById("alert-modal-message");
    const iconEl = document.getElementById("alert-modal-icon");

    if (titleEl) titleEl.textContent = options.title || ALERT_TITLES[type];
    if (msgEl) msgEl.textContent = message || "Something went wrong.";
    if (iconEl) {
        iconEl.className = `msgm-icon ${type}`;
        iconEl.textContent = ALERT_ICONS[type];
    }

    openOverlay("alert-modal-overlay");

    const okBtn = document.getElementById("btn-alert-ok");
    if (okBtn) okBtn.focus();

    return new Promise(resolve => { alertResolver = resolve; });
}

function closeAlertModal() {
    closeOverlay("alert-modal-overlay");
    const resolve = alertResolver;
    alertResolver = null;
    if (resolve) resolve();
}

/* ============================================================
   DASHBOARD
============================================================ */

let chartRecvStatus = null;
let chartProductsCategory = null;

const doughnutCenterTextPlugin = {
    id: "doughnutCenterText",
    afterDraw(chart, _args, pluginOptions) {
        if (!pluginOptions || !pluginOptions.enabled) return;
        const { ctx, chartArea } = chart;
        if (!chartArea) return;

        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle = "#052E16";
        ctx.font = "800 26px system-ui, -apple-system, sans-serif";
        ctx.fillText(String(pluginOptions.value ?? ""), centerX, centerY - 11);

        ctx.fillStyle = "#166534";
        ctx.font = "700 11px system-ui, -apple-system, sans-serif";
        ctx.fillText(pluginOptions.label || "", centerX, centerY + 13);

        ctx.restore();
    }
};

async function loadDashboard() {
    let res;
    try {
        res = await callApi("getReceivingDashboardStats");
    } catch (err) {
        console.error("loadDashboard request failed:", err);
        res = null;
    }

    if (!res || !res.success) {
        console.error("Dashboard stats error:", res?.message || "No response");
        ["stat-expected", "stat-today", "stat-pending", "stat-products", "stat-suppliers"]
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = "0";
            });
        const poBody = document.getElementById("tbl-dashboard-po");
        if (poBody) poBody.innerHTML = emptyRow(4, res?.message || "Unable to load dashboard.");
        return;
    }

    const s = res.data || {};

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val ?? 0;
    };

    setText("stat-expected", s.expectedDeliveries ?? 0);
    setText("stat-today", s.receivingsToday ?? 0);
    setText("stat-pending", s.pendingReceivings ?? 0);
    setText("stat-products", s.totalProducts ?? 0);
    setText("stat-suppliers", (SUPPLIERS_CACHE && SUPPLIERS_CACHE.length) || 0);

    const poBody = document.getElementById("tbl-dashboard-po");
    if (poBody) {
        poBody.innerHTML = (s.expectedPOs || []).map(r => `
            <tr>
                <td>#${esc(r.PO_ID)}</td>
                <td>${esc(r.SupplierName)}</td>
                <td>${esc(r.Expected_Date || "—")}</td>
                <td>${statusBadge(r.StatusName)}</td>
            </tr>
        `).join("") || emptyRow(4, "No expected deliveries.");
    }

    try {
        await loadDashboardCharts();
    } catch (err) {
        console.error("Charts error:", err);
    }
}

async function loadDashboardCharts() {
    const [recvRes, prodRes] = await Promise.all([
        callApi("getReceivings", {}).catch(() => ({ success: false, data: [] })),
        callApi("getProductsForReceiving", { search: "" }).catch(() => ({ success: false, data: [] }))
    ]);

    const receivings = (recvRes && recvRes.data) || [];
    const products = (prodRes && prodRes.data) || [];

    const recentBody = document.getElementById("tbl-dashboard-recv");
    if (recentBody) {
        const sorted = receivings.slice().sort((a, b) =>
            Number(b.ReceivingID) - Number(a.ReceivingID)
        );
        recentBody.innerHTML = sorted.slice(0, 8).map(r => `
            <tr>
                <td>#${esc(r.ReceivingID)}</td>
                <td>${esc(r.SupplierName)}</td>
                <td>${esc(r.ReceivingDate)}</td>
                <td>${statusBadge(r.StatusName)}</td>
            </tr>
        `).join("") || emptyRow(4, "No receivings yet.");
    }

    if (typeof Chart === "undefined") return;

    const statusCounts = {};
    receivings.forEach(r => {
        const name = r.StatusName || "Unknown";
        statusCounts[name] = (statusCounts[name] || 0) + 1;
    });

    const statusColorMap = {
        "Completed": "#0E9F6E", "Approved": "#0E9F6E", "Received": "#0E9F6E",
        "Pending": "#D97706", "For Review": "#D97706", "Submitted": "#D97706",
        "Cancelled": "#DC2626", "Canceled": "#DC2626", "Rejected": "#DC2626",
        "Draft": "#9CA3AF"
    };

    const statusLabels = Object.keys(statusCounts);
    const statusValues = statusLabels.map(k => statusCounts[k]);
    const statusColors = statusLabels.map(s => statusColorMap[s] || "#9CA3AF");

    if (chartRecvStatus) { chartRecvStatus.destroy(); chartRecvStatus = null; }

    const ctx1 = document.getElementById("chart-recv-status");
    if (ctx1) {
        chartRecvStatus = new Chart(ctx1, {
            type: "doughnut",
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusValues,
                    backgroundColor: statusColors,
                    borderColor: "#FFFFFF",
                    borderWidth: 3,
                    hoverOffset: 6
                }]
            },
            plugins: [doughnutCenterTextPlugin],
            options: {
                responsive: true, maintainAspectRatio: false, resizeDelay: 100,
                cutout: "68%",
                plugins: {
                    legend: {
                        position: (c) => c.chart.width < 340 ? "bottom" : "right",
                        labels: {
                            boxWidth: 10, boxHeight: 10,
                            usePointStyle: true, pointStyle: "circle",
                            padding: 14, color: "#052E16",
                            font: { size: 12, weight: "600" },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: `${label}    ${data.datasets[0].data[i]}`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].backgroundColor[i],
                                    lineWidth: 0, hidden: false, index: i
                                }));
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: "#12331F", titleColor: "#FFFFFF",
                        bodyColor: "#FFFFFF", padding: 10, cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: (c) => {
                                const total = c.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? Math.round((c.parsed / total) * 100) : 0;
                                return `${c.label}: ${c.parsed} (${pct}%)`;
                            }
                        }
                    },
                    doughnutCenterText: {
                        enabled: true,
                        value: receivings.length,
                        label: "TOTAL RECEIVINGS"
                    }
                }
            }
        });
    }

    const categoryCounts = {};
    products.forEach(p => {
        const cat = p.CategoryName || "Uncategorized";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 6);

    const subtitle = document.getElementById("chartCategorySubtitle");
    if (subtitle) subtitle.textContent = `Top ${top.length} of ${sorted.length} categories`;

    if (chartProductsCategory) { chartProductsCategory.destroy(); chartProductsCategory = null; }

    const ctx2 = document.getElementById("chart-products-category");
    if (ctx2) {
        chartProductsCategory = new Chart(ctx2, {
            type: "bar",
            data: {
                labels: top.map(([name]) => name),
                datasets: [{
                    label: "Products",
                    data: top.map(([, count]) => count),
                    backgroundColor: "#0E9F6E",
                    hoverBackgroundColor: "#047857",
                    borderRadius: 8,
                    borderSkipped: false,
                    maxBarThickness: 48
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, resizeDelay: 100,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "#12331F", titleColor: "#FFFFFF",
                        bodyColor: "#FFFFFF", padding: 10, cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: (c) => `${c.parsed.y} product${c.parsed.y === 1 ? "" : "s"}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0, color: "#166534", font: { size: 11, weight: "600" } },
                        grid: { color: "rgba(166, 221, 187, 0.5)", drawBorder: false }
                    },
                    x: {
                        ticks: { color: "#166534", font: { size: 11, weight: "600" } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    setupChartResizeObserver();
    window.removeEventListener("resize", handleDashboardResize);
    window.addEventListener("resize", handleDashboardResize);
}

let dashboardResizeTimer = null;
let dashboardResizeObserver = null;

function setupChartResizeObserver() {
    if (!("ResizeObserver" in window)) return;
    if (dashboardResizeObserver) {
        dashboardResizeObserver.disconnect();
        dashboardResizeObserver = null;
    }
    const section = document.getElementById("section-dashboard");
    if (!section) return;
    dashboardResizeObserver = new ResizeObserver(() => handleDashboardResize());
    dashboardResizeObserver.observe(section);
}

function handleDashboardResize() {
    if (dashboardResizeTimer) clearTimeout(dashboardResizeTimer);
    dashboardResizeTimer = setTimeout(() => {
        if (chartRecvStatus) chartRecvStatus.resize();
        if (chartProductsCategory) chartProductsCategory.resize();
    }, 150);
}

/* ============================================================
   PRODUCTS — Search + Category filter
============================================================ */

async function ensureCategoriesCache() {
    if (!CATEGORIES_CACHE.length) {
        const res = await callApi("getCategoriesForReceiving");
        if (res.success) CATEGORIES_CACHE = res.data || [];
    }
    return CATEGORIES_CACHE;
}

async function ensureProductsCache() {
    if (!PRODUCTS_CACHE.length) {
        const res = await callApi("getProductsForReceiving", { search: "" });
        if (res.success) PRODUCTS_CACHE = res.data || [];
    }
    return PRODUCTS_CACHE;
}

async function loadProducts() {
    const tbody = document.getElementById("tbl-product");
    if (!tbody) return;

    const search = valueOf("search-product").trim();
    const categoryID = valueOf("filter-product-category");

    await ensureCategoriesCache();
    fillSelect("filter-product-category", CATEGORIES_CACHE, "CategoryID", "CategoryName", "All categories");
    const catSel = document.getElementById("filter-product-category");
    if (catSel) catSel.value = categoryID;

    tbody.innerHTML = loadingRow(6);

    const res = await callApi("getProductsForReceiving", { search });

    if (!res.success) {
        tbody.innerHTML = emptyRow(6, res.message);
        setCount("products-count", 0);
        return;
    }

    let rows = res.data || [];
    if (categoryID) rows = rows.filter(r => String(r.CategoryID) === String(categoryID));

    setCount("products-count", rows.length);

    tbody.innerHTML = rows.map(r => {
        const onHand = Number(r.OnHand ?? 0);
        const minStock = Number(r.MinStockLevel ?? 0);
        const cls = onHand <= minStock ? "badge-red" : "badge-green";

        return `
            <tr>
                <td>${esc(r.ProductName)}</td>
                <td>${esc(r.Barcode)}</td>
                <td>${esc(r.CategoryName)}</td>
                <td>${esc(r.UnitSymbol || r.UnitName)}</td>
                <td class="num"><span class="badge ${cls}">${esc(onHand)}</span></td>
                <td>
                    ${r.AisleCode
                        ? `${esc(r.AisleCode)} / ${esc(r.ShelfCode)} / ${esc(r.BinCode)}`
                        : esc(r.BinCode)}
                </td>
            </tr>
        `;
    }).join("") || emptyRow(6, "No products found.");
}

function clearProductFilters() {
    const s = document.getElementById("search-product");
    const c = document.getElementById("filter-product-category");
    if (s) s.value = "";
    if (c) c.value = "";
    loadProducts();
}

/* ============================================================
   SUPPLIERS — Search + Carries product filter
============================================================ */

async function loadSuppliers() {
    const tbody = document.getElementById("tbl-supplier");
    if (!tbody) return;

    const search = valueOf("search-supplier").trim();
    const productID = valueOf("filter-supplier-product");

    await ensureProductsCache();
    fillSelect("filter-supplier-product", PRODUCTS_CACHE, "ProductID", "ProductName", "All products");
    const prodSel = document.getElementById("filter-supplier-product");
    if (prodSel) prodSel.value = productID;

    tbody.innerHTML = loadingRow(5);

    const res = await callApi("getSuppliersForReceiving", { search });

    if (!res.success) {
        tbody.innerHTML = emptyRow(5, res.message);
        setCount("suppliers-count", 0);
        return;
    }

    let rows = res.data || [];

    if (productID) {
        const checks = await Promise.all(rows.map(async (s) => {
            const r = await callApi("getSupplierProductsForReceiving", { SupplierID: s.SupplierID });
            const lines = (r && r.success && r.data) || [];
            return lines.some(l => String(l.ProductID) === String(productID)) ? s : null;
        }));
        rows = checks.filter(Boolean);
    }

    setCount("suppliers-count", rows.length);

    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>${esc(r.SupplierName)}</td>
            <td>${esc(r.ContactPerson)}</td>
            <td>${esc(r.Phone)}</td>
            <td>${esc(r.Email)}</td>
            <td>${esc(r.Address)}</td>
        </tr>
    `).join("") || emptyRow(5, "No suppliers found.");
}

function clearSupplierFilters() {
    const s = document.getElementById("search-supplier");
    const p = document.getElementById("filter-supplier-product");
    if (s) s.value = "";
    if (p) p.value = "";
    loadSuppliers();
}

/* ============================================================
   STORAGE LOCATION — Tabs + Search + Filters
============================================================ */

async function ensureAislesCache() {
    if (!AISLES_CACHE.length) {
        const res = await callApi("getAislesForReceiving");
        if (res.success) AISLES_CACHE = res.data || [];
    }
    return AISLES_CACHE;
}

async function ensureShelvesCache() {
    if (!SHELVES_CACHE.length) {
        const res = await callApi("getShelvesForReceiving");
        if (res.success) SHELVES_CACHE = res.data || [];
    }
    return SHELVES_CACHE;
}

async function loadAisles() {
    const tbody = document.getElementById("tbl-aisle");
    if (!tbody) return;

    const search = valueOf("search-aisles").trim();
    tbody.innerHTML = loadingRow(1);

    const res = await callApi("getAislesForReceiving", { search });
    if (!res.success) {
        tbody.innerHTML = emptyRow(1, res.message);
        setCount("aisles-count", 0);
        return;
    }

    const rows = res.data || [];
    setCount("aisles-count", rows.length);

    tbody.innerHTML = rows.map(a =>
        `<tr><td>${esc(a.AisleCode)}</td></tr>`
    ).join("") || emptyRow(1, "No aisles.");
}

function clearAisleFilters() {
    const s = document.getElementById("search-aisles");
    if (s) s.value = "";
    loadAisles();
}

async function loadShelves() {
    const tbody = document.getElementById("tbl-shelf");
    if (!tbody) return;

    const search  = valueOf("search-shelves").trim();
    const aisleID = valueOf("filter-shelves-aisle");

    await ensureAislesCache();
    fillSelect("filter-shelves-aisle", AISLES_CACHE, "AisleID", "AisleCode", "All aisles");
    const aisleSel = document.getElementById("filter-shelves-aisle");
    if (aisleSel) aisleSel.value = aisleID;

    tbody.innerHTML = loadingRow(2);

    const res = await callApi("getShelvesForReceiving", { search });
    if (!res.success) {
        tbody.innerHTML = emptyRow(2, res.message);
        setCount("shelves-count", 0);
        return;
    }

    let rows = res.data || [];
    if (aisleID) rows = rows.filter(s => String(s.AisleID) === String(aisleID));

    setCount("shelves-count", rows.length);

    tbody.innerHTML = rows.map(s => `
        <tr>
            <td>${esc(s.AisleCode || "—")}</td>
            <td>${esc(s.ShelfCode)}</td>
        </tr>
    `).join("") || emptyRow(2, "No shelves.");
}

function clearShelfFilters() {
    const s = document.getElementById("search-shelves");
    const a = document.getElementById("filter-shelves-aisle");
    if (s) s.value = "";
    if (a) a.value = "";
    loadShelves();
}

async function loadBins() {
    const tbody = document.getElementById("tbl-bin");
    if (!tbody) return;

    const search  = valueOf("search-bins").trim();
    const aisleID = valueOf("filter-bins-aisle");
    const shelfID = valueOf("filter-bins-shelf");

    await ensureAislesCache();
    await ensureShelvesCache();

    fillSelect("filter-bins-aisle", AISLES_CACHE, "AisleID", "AisleCode", "All aisles");
    const aisleSel = document.getElementById("filter-bins-aisle");
    if (aisleSel) aisleSel.value = aisleID;

    const shelfSel = document.getElementById("filter-bins-shelf");
    if (shelfSel) {
        const shelfOptions = aisleID
            ? SHELVES_CACHE.filter(s => String(s.AisleID) === String(aisleID))
            : SHELVES_CACHE;

        shelfSel.innerHTML = `<option value="">All shelves</option>` +
            shelfOptions.map(s =>
                `<option value="${esc(s.ShelfID)}">${esc((s.AisleCode || "") + " / " + (s.ShelfCode || ""))}</option>`
            ).join("");

        shelfSel.value = shelfOptions.some(s => String(s.ShelfID) === String(shelfID)) ? shelfID : "";
    }

    tbody.innerHTML = loadingRow(3);

    const res = await callApi("getBinsForReceiving", { search });
    if (!res.success) {
        tbody.innerHTML = emptyRow(3, res.message);
        setCount("bins-count", 0);
        return;
    }

    let rows = res.data || [];
    if (aisleID) rows = rows.filter(b => String(b.AisleID) === String(aisleID));
    if (shelfSel && shelfSel.value) rows = rows.filter(b => String(b.ShelfID) === String(shelfSel.value));

    setCount("bins-count", rows.length);

    tbody.innerHTML = rows.map(b => `
        <tr>
            <td>${esc(b.AisleCode || "—")}</td>
            <td>${esc(b.ShelfCode || "—")}</td>
            <td>${esc(b.BinCode)}</td>
        </tr>
    `).join("") || emptyRow(3, "No bins.");
}

function clearBinFilters() {
    ["search-bins", "filter-bins-aisle", "filter-bins-shelf"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    loadBins();
}

function loadStorageLocationTables() {
    loadAisles();
    loadShelves();
    loadBins();
}

function wireStorageTabs() {
    const section = document.getElementById("section-storage-location");
    if (!section) return;

    section.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            section.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            section.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active-tab"));

            btn.classList.add("active");
            const panel = document.getElementById(btn.dataset.tab);
            if (panel) panel.classList.add("active-tab");
        });
    });
}

function wireStorageFilters() {
    const debounced = (id, fn) => {
        const el = document.getElementById(id);
        if (!el) return;
        let t = null;
        el.addEventListener("input", () => {
            clearTimeout(t);
            t = setTimeout(fn, 300);
        });
    };

    debounced("search-aisles", loadAisles);
    debounced("search-shelves", loadShelves);
    debounced("search-bins", loadBins);

    const onChange = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", fn);
    };

    onChange("filter-shelves-aisle", loadShelves);
    onChange("filter-bins-aisle", loadBins);
    onChange("filter-bins-shelf", loadBins);
}

/* ============================================================
   EXPECTED POs + RECEIVING RECORDS
============================================================ */

async function loadExpectedPOs(search) {
    search = search ?? valueOf("search-po");
    const tbody = document.getElementById("tbl-expected-po");
    tbody.innerHTML = loadingRow(7);

    const res = await callApi("getExpectedPurchaseOrders", { search });

    if (!res.success) {
        tbody.innerHTML = emptyRow(7, res.message);
        return;
    }

    const rows = (res.data || []).slice().sort((a, b) =>
        Number(b.PO_ID) - Number(a.PO_ID)
    );

    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>#${esc(r.PO_ID)}</td>
            <td>${esc(r.PO_Date)}</td>
            <td>${esc(r.Expected_Date || "—")}</td>
            <td>${esc(r.SupplierName)}</td>
            <td>${esc(r.UserName)}</td>
            <td>${statusBadge(r.StatusName)}</td>
            <td>
                ${isPOReceived(r.StatusName)
                    ? `<span class="badge badge-green">✔ Received</span>`
                    : `<button class="btn-icon" title="Receive this PO"
                        onclick="openReceivingFormFromPO(${Number(r.PO_ID)})">
                        📥 Receive
                       </button>`}
            </td>
        </tr>
    `).join("") || emptyRow(7, "No expected POs.");
}

async function loadReceivings(search, dateFilter, statusFilter) {
    search       = search       ?? valueOf("search-recv");
    dateFilter   = dateFilter   ?? valueOf("filter-recv-date");
    statusFilter = statusFilter ?? valueOf("filter-recv-status");

    const tbody = document.getElementById("tbl-recv");
    tbody.innerHTML = loadingRow(7);

    const res = await callApi("getReceivings", {
        search,
        date: dateFilter,
        status: statusFilter
    });

    if (!res.success) {
        tbody.innerHTML = emptyRow(7, res.message);
        setCount("recv-count", 0);
        return;
    }

    const rows = (res.data || []).slice().sort((a, b) =>
        Number(b.ReceivingID) - Number(a.ReceivingID)
    );

    setCount("recv-count", rows.length);

    tbody.innerHTML = rows.map(r => `
        <tr>
            <td>#${esc(r.ReceivingID)}</td>
            <td>${esc(r.ReceivingDate)}</td>
            <td>${esc(r.SupplierName)}</td>
            <td>${esc(r.UserName)}</td>
            <td>${esc(r.PO_Reference || "—")}</td>
            <td>${statusBadge(r.StatusName)}</td>
            <td>
                <button class="btn-icon" title="See details"
                    onclick="viewReceiving(${Number(r.ReceivingID)})">👁 View</button>
            </td>
        </tr>
    `).join("") || emptyRow(7, "No receiving records.");
}

function clearReceivingFilters() {
    ["search-recv", "filter-recv-date", "filter-recv-status"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    loadReceivings("", "", "");
}

async function loadStatusesCache() {
    if (STATUSES_CACHE.length) return STATUSES_CACHE;
    const res = await callApi("getStatusesForReceiving");
    if (res.success) STATUSES_CACHE = res.data || [];
    return STATUSES_CACHE;
}

async function loadSuppliersCache() {
    if (SUPPLIERS_CACHE.length) return SUPPLIERS_CACHE;
    const res = await callApi("getSuppliersForReceiving");
    if (res.success) SUPPLIERS_CACHE = res.data || [];
    return SUPPLIERS_CACHE;
}

/* ============================================================
   RECEIVING FORM — SAFE VERSION (with null checks)
============================================================ */

let currentReceivedLines = [];

async function openReceivingFormFromPO(poId) {

    currentReceivedLines = [];

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
        else console.warn("⚠ Missing element:", id);
    };
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
        else console.warn("⚠ Missing element:", id);
    };
    const setHTML = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
        else console.warn("⚠ Missing element:", id);
    };
    const setData = (id, key, val) => {
        const el = document.getElementById(id);
        if (el) el.dataset[key] = val;
    };
    const setDate = (id, date) => {
        const el = document.getElementById(id);
        if (el) el.valueAsDate = date;
        else console.warn("⚠ Missing element:", id);
    };

    setText("receiving-modal-title", "Receive Purchase Order #" + poId);

    await loadStatusesCache();
    await loadSuppliersCache();

    setVal("recv-supplier", "");
    setData("recv-supplier", "supplierId", "");
    setVal("recv-po-ref", "");
    setDate("recv-date", new Date());
    setVal("recv-received-by",
        `${currentUser.FirstName || ""} ${currentUser.LastName || ""}`.trim()
        || currentUser.UserName
        || "Receiving Staff"
    );

    setHTML("recv-lines-body", loadingRow(5));

    openOverlay("receiving-modal-overlay");

    const poList = await callApi("getExpectedPurchaseOrders");
    const po = (poList.data || []).find(p => String(p.PO_ID) === String(poId));

    if (po) {
        setVal("recv-supplier", po.SupplierName || "");
        setData("recv-supplier", "supplierId", po.SupplierID ?? "");
        setVal("recv-po-ref", `PO #${po.PO_ID} — ${po.SupplierName}`);
    }

    const res = await callApi("getPurchaseOrderLines", { PO_ID: poId });

    if (res.success && res.data && res.data.length) {
        res.data.forEach(line => {
            currentReceivedLines.push({
                ProductID: line.ProductID,
                ProductName: line.ProductName,
                OrderedQty: Number(line.OrderedQuantity || 0),
                ReceivedQty: Number(line.OrderedQuantity || 0),
                CostPrice: Number(line.CostPrice || 0)
            });
        });
        renderReceivingLines();
    } else {
        setHTML("recv-lines-body", emptyRow(5, "No PO lines found for this PO."));
    }

    setData("recv-po-ref", "poId", poId);
}

function closeReceivingForm() {
    closeOverlay("receiving-modal-overlay");
}

function renderReceivingLines() {
    const tbody = document.getElementById("recv-lines-body");

    if (!tbody) {
        console.error("❌ recv-lines-body element not found! Check your receiving.html");
        return;
    }

    if (!currentReceivedLines.length) {
        tbody.innerHTML = emptyRow(5, "No lines.");
        return;
    }

    tbody.innerHTML = currentReceivedLines.map((line, i) => {
        const variance = (line.ReceivedQty || 0) - (line.OrderedQty || 0);
        const hasOrdered = line.OrderedQty > 0;

        return `
            <tr>
                <td><input type="text" value="${esc(line.ProductName)}" readonly></td>
                <td><input type="number" value="${line.OrderedQty}" readonly></td>
                <td>
                    <input type="number" min="0" value="${line.ReceivedQty}"
                        oninput="updateLine(${i}, 'ReceivedQty', this.value)">
                </td>
                <td><input type="number" step="0.01" value="${line.CostPrice}" readonly></td>
                <td style="text-align:center;">
                    ${hasOrdered
                        ? varianceBadge(variance)
                        : `<span class="badge badge-gray">—</span>`}
                </td>
            </tr>
        `;
    }).join("");
}

function updateLine(idx, field, value) {
    if (!currentReceivedLines[idx]) return;
    if (field === "ReceivedQty") {
        currentReceivedLines[idx][field] = Number(value) || 0;
    }
    const tbody = document.getElementById("recv-lines-body");
    if (!tbody) return;
    const row = tbody.children[idx];
    if (row && row.children[4]) {
        const line = currentReceivedLines[idx];
        if (line.OrderedQty > 0) {
            const variance = (line.ReceivedQty || 0) - (line.OrderedQty || 0);
            row.children[4].innerHTML = varianceBadge(variance);
        } else {
            row.children[4].innerHTML = `<span class="badge badge-gray">—</span>`;
        }
    }
}

async function saveReceiving() {
    const date = document.getElementById("recv-date").value;
    const poRefEl = document.getElementById("recv-po-ref");
    const poId = poRefEl ? poRefEl.dataset.poId || "" : "";
    const receivedBy = currentUser.UserID;

    if (!date) {
        return showAlert("Receiving date is required.", { type: "warning" });
    }

    if (!currentReceivedLines.length) {
        return showAlert("No lines to save.", { type: "warning" });
    }

    for (let i = 0; i < currentReceivedLines.length; i++) {
        const line = currentReceivedLines[i];
        if (!line.ProductID) {
            return showAlert(`Line ${i + 1}: Missing product.`, { type: "warning" });
        }
        if (line.ReceivedQty < 0) {
            return showAlert(`Line ${i + 1}: Received quantity cannot be negative.`, { type: "warning" });
        }
    }

    if (!currentReceivedLines.some(l => l.ReceivedQty > 0)) {
        return showAlert("At least one line must have a received quantity greater than 0.", { type: "warning" });
    }

    const supplierNameEl = document.getElementById("recv-supplier");
    const supplierName = supplierNameEl ? supplierNameEl.value : "";
    const formSupplierId = supplierNameEl ? supplierNameEl.dataset.supplierId : "";

    const supplierMatch = SUPPLIERS_CACHE.find(s => s.SupplierName === supplierName);
    const supplierID = formSupplierId
        ? Number(formSupplierId)
        : (supplierMatch ? supplierMatch.SupplierID : null);

    if (!supplierID) {
        return showAlert("Supplier could not be determined for this receiving.", { type: "error" });
    }

    const payload = {
        SupplierID: supplierID,
        ReceivingDate: date,
        PO_Reference: poId || null,
        ReceivedByUserID: receivedBy,
        Lines: currentReceivedLines.map(l => ({
            ProductID: l.ProductID,
            OrderedQty: l.OrderedQty,
            ReceivedQuantity: l.ReceivedQty,
            CostPrice: l.CostPrice
        }))
    };

    const saveBtn = document.getElementById("btn-save-receiving");
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
    }

    const res = await callApi("insertReceiving", payload);

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save receiving";
    }

    if (!res.success) {
        await showAlert(res.message || "Failed to save receiving.", { type: "error" });
        return;
    }

    await showAlert("Receiving saved and marked as Completed.", { type: "success" });

    closeReceivingForm();

    PRODUCTS_CACHE = [];   // refresh On Hand sa sunod

    loadReceivings();
    loadDashboard();
    loadExpectedPOs();
}

/* ============================================================
   VIEW RECEIVING
============================================================ */

async function viewReceiving(id) {
    const body = document.getElementById("view-receiving-body");
    if (!body) return;

    body.innerHTML = `<p class="modal-loading">Loading...</p>`;
    openOverlay("view-receiving-modal-overlay");

    const res = await callApi("getReceivingById", { ReceivingID: id });

    if (!res.success || !res.data) {
        body.innerHTML = `<p class="empty-row">${esc(res.message)}</p>`;
        return;
    }

    const r = res.data;

    const lines = (r.lines || []).map(l => {
        let varianceHtml = `<span class="badge badge-gray">—</span>`;
        if (l.OrderedQty && l.OrderedQty > 0) {
            varianceHtml = varianceBadge((l.ReceivedQty || 0) - (l.OrderedQty || 0));
        }
        return `
            <tr>
                <td>${esc(l.ProductName)}</td>
                <td class="num">${l.OrderedQty && l.OrderedQty > 0 ? esc(l.OrderedQty) : "—"}</td>
                <td class="num">${esc(l.ReceivedQty)}</td>
                <td class="num">${esc(l.CostPrice)}</td>
                <td style="text-align:center;">${varianceHtml}</td>
            </tr>
        `;
    }).join("");

    body.innerHTML = `
        <div class="detail-card">
            <div class="detail-grid">
                <div><span class="detail-label">Receiving ID</span>
                     <span class="detail-value">#${esc(r.ReceivingID)}</span></div>
                <div><span class="detail-label">Date</span>
                     <span class="detail-value">${esc(r.ReceivingDate)}</span></div>
                <div><span class="detail-label">Supplier</span>
                     <span class="detail-value">${esc(r.SupplierName)}</span></div>
                <div><span class="detail-label">Received by</span>
                     <span class="detail-value">${esc(r.UserName)}</span></div>
                <div><span class="detail-label">PO reference</span>
                     <span class="detail-value">${esc(r.PO_Reference ? "PO #" + r.PO_Reference : "—")}</span></div>
                <div><span class="detail-label">Status</span>
                     <span class="detail-value">${statusBadge(r.StatusName)}</span></div>
            </div>
        </div>

        <div class="detail-section">
            <h4>Items received</h4>
            <table class="line-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th class="num">Ordered</th>
                        <th class="num">Received</th>
                        <th class="num">Cost</th>
                        <th style="text-align:center;">Variance</th>
                    </tr>
                </thead>
                <tbody>${lines || emptyRow(5, "No lines")}</tbody>
            </table>
        </div>
    `;
}

function closeViewReceiving() {
    closeOverlay("view-receiving-modal-overlay");
}

/* ============================================================
   CONFIRM MODAL
============================================================ */

let confirmCallback = null;

function openConfirmModal(message, warning, callback, options = {}) {
    document.getElementById("confirm-modal-title").textContent = options.title || "Confirm Action";
    document.getElementById("confirm-modal-message").textContent = message;
    document.getElementById("confirm-modal-warning").textContent = warning || "";
    document.getElementById("btn-confirm-action").textContent = options.confirmLabel || "Confirm";
    confirmCallback = callback;
    openOverlay("confirm-modal-overlay");
}

function closeConfirmModal() {
    closeOverlay("confirm-modal-overlay");
    confirmCallback = null;
}

/* ============================================================
   SIDEBAR + PROFILE MENU
============================================================ */

function openSidebar() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar) sidebar.classList.add("sidebar-open");
    if (backdrop) backdrop.classList.add("open");
}

function closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar) sidebar.classList.remove("sidebar-open");
    if (backdrop) backdrop.classList.remove("open");
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    if (sidebar.classList.contains("sidebar-open")) closeSidebar();
    else openSidebar();
}

function closeProfileMenu() {
    const profile = document.getElementById("sidebar-profile");
    const trigger = document.getElementById("sidebar-profile-trigger");
    if (profile) profile.classList.remove("menu-open");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
}

function toggleProfileMenu() {
    const profile = document.getElementById("sidebar-profile");
    const trigger = document.getElementById("sidebar-profile-trigger");
    if (!profile || !trigger) return;
    const isOpen = profile.classList.toggle("menu-open");
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function confirmLogout() {
    closeProfileMenu();
    openConfirmModal(
        "Are you sure you want to log out?",
        "You will need to sign in again to access the receiving panel.",
        () => logout(),
        { title: "Log Out", confirmLabel: "Log Out" }
    );
}

function wireSidebar() {
    const hamburger = document.getElementById("hamburger-btn");
    if (hamburger) {
        hamburger.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) backdrop.addEventListener("click", closeSidebar);

    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebarEl = document.getElementById("sidebar");

    if (sidebarToggle && sidebarEl) {
        if (localStorage.getItem("receivingSidebarCollapsed") === "true") {
            sidebarEl.classList.add("collapsed");
            sidebarToggle.setAttribute("title", "Expand sidebar");
        }

        sidebarToggle.addEventListener("click", () => {
            sidebarEl.classList.toggle("collapsed");
            const isCollapsed = sidebarEl.classList.contains("collapsed");
            sidebarToggle.setAttribute("title", isCollapsed ? "Expand sidebar" : "Collapse sidebar");
            localStorage.setItem("receivingSidebarCollapsed", isCollapsed ? "true" : "false");
            closeProfileMenu();
            handleDashboardResize();
            setTimeout(() => {
                if (chartRecvStatus) chartRecvStatus.resize();
                if (chartProductsCategory) chartProductsCategory.resize();
            }, 300);
        });
    }
}

function wireProfileMenu() {
    const trigger = document.getElementById("sidebar-profile-trigger");
    const profileEl = document.getElementById("sidebar-profile");
    const logoutBtn = document.getElementById("btn-logout");

    if (trigger) {
        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleProfileMenu();
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            confirmLogout();
        });
    }

    document.addEventListener("click", (e) => {
        if (profileEl && !profileEl.contains(e.target)) closeProfileMenu();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeProfileMenu();
    });
}

/* ============================================================
   SEARCH + FILTERS
============================================================ */

function setupSearches() {
    const debounced = (el, fn) => {
        if (!el) return;
        let t = null;
        el.addEventListener("input", () => {
            clearTimeout(t);
            t = setTimeout(fn, 300);
        });
    };

    // Products
    debounced(document.getElementById("search-product"), () => loadProducts());
    const prodCat = document.getElementById("filter-product-category");
    if (prodCat) prodCat.addEventListener("change", () => loadProducts());

    // Suppliers
    debounced(document.getElementById("search-supplier"), () => loadSuppliers());
    const supProd = document.getElementById("filter-supplier-product");
    if (supProd) supProd.addEventListener("change", () => loadSuppliers());

    // Expected POs
    const poSearch = document.getElementById("search-po");
    debounced(poSearch, () => loadExpectedPOs(poSearch.value));

    // Receiving Records
    const recvSearch = document.getElementById("search-recv");
    const recvDate = document.getElementById("filter-recv-date");
    const recvStatus = document.getElementById("filter-recv-status");

    const applyRecvFilters = () => {
        loadReceivings(
            recvSearch ? recvSearch.value || "" : "",
            recvDate ? recvDate.value || "" : "",
            recvStatus ? recvStatus.value || "" : ""
        );
    };

    debounced(recvSearch, applyRecvFilters);
    if (recvDate) recvDate.addEventListener("change", applyRecvFilters);
    if (recvStatus) recvStatus.addEventListener("change", applyRecvFilters);
}

async function loadReceivingFilterStatuses() {
    const sel = document.getElementById("filter-recv-status");
    if (!sel) return;

    await loadStatusesCache();

    sel.innerHTML = `<option value="">All statuses</option>` +
        STATUSES_CACHE.map(s => `
            <option value="${s.StatusID}">${esc(s.StatusName)}</option>
        `).join("");
}

/* ============================================================
   INIT
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
    if (!isReceivingUser(currentUser)) return;

    const displayName = currentUser.FirstName || currentUser.UserName || "Receiving Staff";
    const fullName = currentUser.FirstName
        ? `${currentUser.FirstName} ${currentUser.LastName || ""}`.trim()
        : (currentUser.UserName || "Receiving Staff");

    const welcome = document.getElementById("welcome-text");
    if (welcome) welcome.textContent = `Welcome, ${displayName}`;

    const profileName = document.getElementById("sidebar-profile-name");
    if (profileName) profileName.textContent = fullName;

    const profileRole = document.getElementById("sidebar-profile-role");
    if (profileRole) profileRole.textContent = currentUser.RoleName || "Receiving Staff";

    const profileAvatar = document.getElementById("sidebar-profile-avatar");
    if (profileAvatar) profileAvatar.textContent = fullName.charAt(0).toUpperCase() || "R";

    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => switchSection(link.dataset.target));
    });

    wireSidebar();
    wireProfileMenu();

    const saveBtn = document.getElementById("btn-save-receiving");
    if (saveBtn) saveBtn.addEventListener("click", saveReceiving);

    const confirmBtn = document.getElementById("btn-confirm-action");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", () => {
            const cb = confirmCallback;
            closeConfirmModal();
            if (cb) cb();
        });
    }

    ["receiving-modal-overlay", "view-receiving-modal-overlay", "confirm-modal-overlay", "alert-modal-overlay"]
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("click", e => {
                    if (e.target.id !== id) return;
                    if (id === "alert-modal-overlay") closeAlertModal();
                    else closeOverlay(id);
                });
            }
        });

    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        const alertEl = document.getElementById("alert-modal-overlay");
        if (alertEl && alertEl.classList.contains("open")) closeAlertModal();
    });

    setupSearches();
    wireStorageTabs();
    wireStorageFilters();

    await loadStatusesCache();
    await loadSuppliersCache();
    await loadReceivingFilterStatuses();

    loadDashboard();
});