const baseApiUrl = "http://localhost/grocery_warehouse/releasing_api.php";

// RoleID 1 = Administrator, 8 = Releasing Staff
const RELEASING_ROLE_IDS = [1, 8];

let currentUser = null;
let confirmCallback = null;
let releaseProductsCache = [];
let processReleaseId = null;
let viewReleaseId = null;

/* ============================================================
   SESSION
============================================================ */

function loadSession() {
    try {
        const raw = sessionStorage.getItem("user");
        if (!raw) { window.location.replace("login.html"); return false; }

        currentUser = JSON.parse(raw);
        if (!currentUser || !currentUser.UserID) {
            window.location.replace("login.html");
            return false;
        }

        const roleName = String(currentUser.RoleName || "").toLowerCase().replace(/[^a-z]/g, "");
        const allowed =
            RELEASING_ROLE_IDS.includes(Number(currentUser.RoleID)) ||
            roleName.includes("releas") ||
            roleName === "admin" ||
            roleName === "administrator";

        if (!allowed) {
            sessionStorage.removeItem("user");
            window.location.replace("login.html");
            return false;
        }

        const name = ((currentUser.FirstName || "") + " " + (currentUser.LastName || "")).trim();
        const displayName = name || currentUser.UserName || "Releasing";

        const topbarName = document.getElementById("topbar-username");
        if (topbarName) topbarName.textContent = "Welcome, " + displayName;

        const profileName = document.getElementById("sidebar-profile-name");
        if (profileName) profileName.textContent = displayName;

        const profileRole = document.getElementById("sidebar-profile-role");
        if (profileRole) profileRole.textContent = currentUser.RoleName || "Releasing Staff";

        const profileAvatar = document.getElementById("sidebar-profile-avatar");
        if (profileAvatar) {
            profileAvatar.textContent = displayName.trim().charAt(0).toUpperCase() || "R";
        }

        return true;
    } catch (err) {
        console.error("Session error:", err);
        window.location.replace("login.html");
        return false;
    }
}

/* ============================================================
   API
============================================================ */

async function apiCall(operation, payload = {}) {

    const body = {
        ...payload,
        LoggedInUserID: currentUser ? currentUser.UserID : 0
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
        if (!res.data || typeof res.data !== "object") {
            console.error("Non-JSON response from server:", res.data);
            return {
                success: false,
                message: "Server returned invalid response: " + String(res.data).replace(/<[^>]*>/g, " ").trim().slice(0, 300),
                data: []
            };
        }
        return res.data;
    } catch (error) {
        console.error("API ERROR:", operation, error);
        return {
            success: false,
            message: error?.response?.data?.message || "Unable to connect to the server.",
            data: []
        };
    }
}

/* ============================================================
   HELPERS
============================================================ */

function esc(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function money(value) {
    const number = Number(value || 0);
    return "₱" + number.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function today() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
}

function statusBadge(value) {
    const map = {
        Approved: "badge-amber",
        Completed: "badge-green",
        Pending: "badge-gray",
        Rejected: "badge-red",
        Cancelled: "badge-gray"
    };
    return `<span class="badge ${map[value] || "badge-gray"}">${esc(value || "—")}</span>`;
}

function setCount(id, count) {
    const el = document.getElementById(id);
    if (el) el.textContent = count === 0 ? "" : `${count} record${count === 1 ? "" : "s"} found`;
}

function debounce(element, handler) {
    if (!element) return;
    let timer = null;
    element.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(handler, 300);
    });
}

/* ============================================================
   CATEGORY FILTER HELPERS
============================================================ */

let categoriesCache = [];

async function ensureCategoriesCache() {
    if (categoriesCache.length === 0) {
        const res = await apiCall("getCategories");
        console.log("getCategories:", res);
        if (res && res.success) {
            categoriesCache = res.data || [];
        } else {
            console.error("getCategories failed:", res && res.message);
        }
    }
    return categoriesCache;
}

function populateCategorySelectOnce(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel || sel.options.length > 1 || categoriesCache.length === 0) return;
    sel.innerHTML = `<option value="">All categories</option>` +
        categoriesCache.map(c =>
            `<option value="${esc(c.CategoryID)}">${esc(c.CategoryName)}</option>`
        ).join("");
}

/* ============================================================
   NAVIGATION
============================================================ */

const sectionTitles = {
    "dashboard-section": "Dashboard",
    "releases-section": "Stock Releases",
    "product-section": "Products",
    "stock-section": "Current Stock",
    "locations-section": "Storage Location"
};

function setActiveSection(sectionId) {
    document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active-section"));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add("active-section");

    document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
    const btn = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
    if (btn) btn.classList.add("active");

    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.textContent = sectionTitles[sectionId] || "";

    closeSidebar();
}

function wireNavigation() {
    document.querySelectorAll(".nav-link").forEach(btn => {
        btn.addEventListener("click", () => {
            const sectionId = btn.getAttribute("data-section");
            setActiveSection(sectionId);

            if (sectionId === "dashboard-section") loadDashboard();
            if (sectionId === "releases-section") loadReleases();
            if (sectionId === "product-section") loadProducts();
            if (sectionId === "stock-section") loadStock();
            if (sectionId === "locations-section") loadStorageLocationTables();
        });
    });
}

function goToSection(sectionId) {
    const navBtn = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
    if (navBtn) navBtn.click();
}

function wireTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active-tab"));
            btn.classList.add("active");
            const panel = document.getElementById(btn.dataset.tab);
            if (panel) panel.classList.add("active-tab");
        });
    });
}

/* ============================================================
   DASHBOARD
============================================================ */

let chartReleaseStatus = null;
let chartTopProducts = null;

const doughnutCenterTextPlugin = {
    id: "doughnutCenterText",
    afterDraw(chart, _args, opts) {
        if (!opts || !opts.enabled) return;
        const { ctx, chartArea } = chart;
        if (!chartArea) return;

        const cx = (chartArea.left + chartArea.right) / 2;
        const cy = (chartArea.top + chartArea.bottom) / 2;

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle = "#052E16";
        ctx.font = "800 26px system-ui, -apple-system, sans-serif";
        ctx.fillText(String(opts.value ?? ""), cx, cy - 11);

        ctx.fillStyle = "#166534";
        ctx.font = "700 11px system-ui, -apple-system, sans-serif";
        ctx.fillText(opts.label || "", cx, cy + 13);

        ctx.restore();
    }
};

async function loadDashboard() {
    const res = await apiCall("getDashboardStats");
    if (!res || !res.success) { console.warn("Dashboard:", res ? res.message : "no response"); return; }

    const d = res.data || {};
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setText("stat-toprocess", d.toProcessCount ?? 0);
    setText("stat-completed", d.completedCount ?? 0);
    setText("stat-products", d.totalProducts ?? 0);
    setText("stat-lowstock", d.lowStockCount ?? 0);

    const lowBody = document.getElementById("dashboard-lowstock");
    if (lowBody) {
        const rows = d.lowStockItems || [];
        lowBody.innerHTML = rows.length
            ? rows.map(r => `
                <tr>
                    <td>${esc(r.ProductName)}</td>
                    <td class="num stock-low">${esc(r.OnHand)}</td>
                    <td class="num">${esc(r.MinStockLevel)}</td>
                </tr>`).join("")
            : `<tr><td colspan="3" class="empty-row">No low stock items.</td></tr>`;
    }

    const completedBody = document.getElementById("dashboard-completed");
    if (completedBody) {
        const rows = d.recentCompleted || [];
        completedBody.innerHTML = rows.length
            ? rows.map(r => `
                <tr>
                    <td>#${esc(r.ReleaseID)}</td>
                    <td>${esc(r.ReleaseDate || "—")}</td>
                    <td>${esc(r.ReleasedBy || "—")}</td>
                    <td>${statusBadge(r.StatusName)}</td>
                </tr>`).join("")
            : `<tr><td colspan="4" class="empty-row">No completed releases yet.</td></tr>`;
    }

    try {
        renderDashboardCharts(d);
    } catch (err) {
        console.error("Charts error:", err);
    }
}

function renderDashboardCharts(d) {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js not loaded — skipping charts.");
        return;
    }

    const tooltipBase = {
        backgroundColor: "#12331F",
        titleColor: "#FFFFFF",
        bodyColor: "#FFFFFF",
        padding: 10,
        cornerRadius: 8,
        displayColors: false
    };

    /* ---------- CHART 1: Top Released Products (Bar) ---------- */

    const top = d.topProducts || [];
    const subtitle = document.getElementById("chartTopSubtitle");
    if (subtitle) subtitle.textContent = `Top ${top.length} by quantity released`;

    if (chartTopProducts) { chartTopProducts.destroy(); chartTopProducts = null; }

    const ctx1 = document.getElementById("chart-top-products");
    if (ctx1) {
        chartTopProducts = new Chart(ctx1, {
            type: "bar",
            data: {
                labels: top.map(t => t.ProductName),
                datasets: [{
                    label: "Qty Released",
                    data: top.map(t => Number(t.Qty)),
                    backgroundColor: "#0E9F6E",
                    hoverBackgroundColor: "#047857",
                    borderRadius: 8,
                    borderSkipped: false,
                    maxBarThickness: 48
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                resizeDelay: 100,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...tooltipBase,
                        callbacks: { label: (c) => `${c.parsed.y} released` }
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

    /* ---------- CHART 2: Releases by Status (Doughnut) ---------- */

    const breakdown = d.statusBreakdown || [];
    const total = breakdown.reduce((sum, r) => sum + Number(r.Total), 0);

    const colorMap = {
        pending: "#6B7280",
        approved: "#D97706",
        completed: "#0E9F6E",
        rejected: "#DC2626",
        cancelled: "#9CA3AF"
    };

    const statusLabels = breakdown.map(r => r.StatusName);
    const statusValues = breakdown.map(r => Number(r.Total));
    const statusColors = breakdown.map(r => colorMap[String(r.StatusName).toLowerCase()] || "#3B82F6");

    if (chartReleaseStatus) { chartReleaseStatus.destroy(); chartReleaseStatus = null; }

    const ctx2 = document.getElementById("chart-release-status");
    if (ctx2) {
        chartReleaseStatus = new Chart(ctx2, {
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
                responsive: true,
                maintainAspectRatio: false,
                resizeDelay: 100,
                cutout: "68%",
                plugins: {
                    legend: {
                        position: "right",
                        labels: {
                            boxWidth: 10,
                            boxHeight: 10,
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 14,
                            color: "#052E16",
                            font: { size: 12, weight: "600" },
                            generateLabels: (chart) => {
                                const ds = chart.data.datasets[0];
                                return chart.data.labels.map((label, i) => ({
                                    text: `${label}    ${ds.data[i]}`,
                                    fillStyle: ds.backgroundColor[i],
                                    strokeStyle: ds.backgroundColor[i],
                                    lineWidth: 0,
                                    hidden: false,
                                    index: i
                                }));
                            }
                        }
                    },
                    tooltip: {
                        ...tooltipBase,
                        callbacks: {
                            label: (c) => {
                                const pct = total > 0 ? Math.round((c.parsed / total) * 100) : 0;
                                return `${c.label}: ${c.parsed} (${pct}%)`;
                            }
                        }
                    },
                    doughnutCenterText: { enabled: true, value: total, label: "TOTAL RELEASES" }
                }
            }
        });
    }
}

/* ============================================================
   STOCK RELEASES LIST
============================================================ */

async function loadReleaseStatuses() {
    const sel = document.getElementById("filter-releases-status");
    if (!sel) return;

    const res = await apiCall("getStatuses");
    const rows = (res && res.success && res.data) || [];

    sel.innerHTML = `<option value="">All Statuses</option>` +
        rows.map(s => `<option value="${esc(s.StatusID)}">${esc(s.StatusName)}</option>`).join("");
}

async function loadReleases() {
    const tbody = document.getElementById("releases-tbody");
    if (!tbody) return;

    const search = (document.getElementById("search-releases") || {}).value || "";
    const statusID = (document.getElementById("filter-releases-status") || {}).value || "";
    const dateFrom = (document.getElementById("filter-releases-from") || {}).value || "";
    const dateTo = (document.getElementById("filter-releases-to") || {}).value || "";

    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Loading…</td></tr>`;

    const res = await apiCall("getStockReleases", {
        search: search.trim(),
        Status_ID: statusID,
        dateFrom,
        dateTo
    });

    if (!res || !res.success) {
        setCount("releases-count", 0);
        tbody.innerHTML = `<tr><td colspan="6" class="empty-row">${esc((res && res.message) || "Failed to load.")}</td></tr>`;
        return;
    }

    const rows = res.data || [];
    setCount("releases-count", rows.length);

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No stock releases found.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(r => {
        const status = String(r.StatusName || "").toLowerCase();
        let actionBtn = "";

        if (status === "approved") {
            actionBtn = `<button class="btn-icon" onclick="openProcessModal(${r.ReleaseID})">Process</button>`;
        } else {
            actionBtn = `<button class="btn-icon" onclick="openViewReleaseModal(${r.ReleaseID})">View</button>`;
        }

        if (status === "completed") {
            actionBtn += `<button class="btn-icon" onclick="printRelease(${r.ReleaseID})">Print</button>`;
        }

        return `
            <tr>
                <td>#${esc(r.ReleaseID)}</td>
                <td>${esc(r.ReleasedBy || "—")}</td>
                <td>${esc(r.ReleaseDate || "—")}</td>
                <td class="num">${esc(r.ItemCount)}</td>
                <td>${statusBadge(r.StatusName)}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    }).join("");
}

function clearReleaseFilters() {
    ["search-releases", "filter-releases-status", "filter-releases-from", "filter-releases-to"]
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    loadReleases();
}

/* ============================================================
   MODAL HELPERS
============================================================ */

function openModal(id) { const el = document.getElementById(id); if (el) el.classList.add("open"); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove("open"); }

/* ============================================================
   MESSAGE MODAL
============================================================ */

let alertResolver = null;

const ALERT_ICONS = {
    error: "✕",
    warning: "!",
    success: "✓",
    info: "i"
};

const ALERT_TITLES = {
    error: "Error",
    warning: "Please check",
    success: "Success",
    info: "Notice"
};

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

    openModal("alert-modal-overlay");

    const okBtn = document.getElementById("btn-alert-ok");
    if (okBtn) okBtn.focus();

    return new Promise(resolve => {
        alertResolver = resolve;
    });
}

function closeAlertModal() {

    closeModal("alert-modal-overlay");

    const resolve = alertResolver;
    alertResolver = null;

    if (resolve) resolve();
}

/* ============================================================
   NEW STOCK RELEASE MODAL
============================================================ */

async function openNewReleaseModal() {
    const res = await apiCall("getInventoryQuantities", { search: "" });
    releaseProductsCache = (res && res.success && res.data) || [];

    if (!releaseProductsCache.length) {
        await showAlert("No products available to release.", { type: "info" });
        return;
    }

    document.getElementById("new-release-date").value = today();
    document.getElementById("new-release-lines-body").innerHTML = "";

    const totalBox = document.getElementById("new-release-grand-total");
    if (totalBox) totalBox.textContent = "₱0.00";

    addNewReleaseLine();
    openModal("new-release-modal-overlay");
}

function closeNewReleaseModal() {
    closeModal("new-release-modal-overlay");
    document.getElementById("new-release-lines-body").innerHTML = "";

    const totalBox = document.getElementById("new-release-grand-total");
    if (totalBox) totalBox.textContent = "₱0.00";
}

function addNewReleaseLine() {
    const tbody = document.getElementById("new-release-lines-body");
    if (!tbody) return;

    const options = releaseProductsCache.map(p =>
        `<option value="${esc(p.ProductID)}">${esc(p.ProductName)}</option>`
    ).join("");

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>
            <select class="nr-product" style="width:100%;">
                <option value="">Select product…</option>
                ${options}
            </select>
        </td>
        <td class="nr-location">—</td>
        <td class="nr-unit">—</td>
        <td class="num nr-onhand">—</td>
        <td class="num">
            <input type="number" class="nr-price" min="0" step="0.01" value="0"
                   style="width:100%;" title="Selling price (auto +20% from cost)">
        </td>
        <td class="num">
            <input type="number" class="nr-qty" min="1" step="1" value="1" style="width:100%;">
        </td>
        <td class="num nr-total">₱0.00</td>
        <td class="availability-cell">—</td>
        <td><button type="button" class="btn-icon nr-remove">Remove</button></td>
    `;

    tr.querySelector(".nr-product").addEventListener("change", () => updateNewReleaseRow(tr));
    tr.querySelector(".nr-price").addEventListener("input", () => {
        tr.dataset.autoFilled = "no";
        updateNewReleaseRow(tr);
    });
    tr.querySelector(".nr-qty").addEventListener("input", () => updateNewReleaseRow(tr));
    tr.querySelector(".nr-remove").addEventListener("click", () => {
        if (tbody.children.length > 1) tr.remove();
        recalcNewReleaseTotal();
    });

    tbody.appendChild(tr);
    recalcNewReleaseTotal();
}

function updateNewReleaseRow(tr) {
    const pid = tr.querySelector(".nr-product").value;
    const qtyInput = tr.querySelector(".nr-qty");
    const priceInput = tr.querySelector(".nr-price");
    const totalCell = tr.querySelector(".nr-total");
    const cell = tr.querySelector(".availability-cell");

    tr.classList.remove("release-row-short");

    const product = releaseProductsCache.find(p => String(p.ProductID) === String(pid));

    if (!product) {
        tr.querySelector(".nr-location").textContent = "—";
        tr.querySelector(".nr-unit").textContent = "—";
        tr.querySelector(".nr-onhand").textContent = "—";
        if (tr.dataset.autoFilled !== "no") priceInput.value = "0";
        totalCell.textContent = money(0);
        cell.innerHTML = "—";
        recalcNewReleaseTotal();
        return;
    }

    const onHand = Number(product.OnHandQuantity ?? 0);
    const costPrice = Number(product.CostPrice ?? 0);

    tr.querySelector(".nr-location").textContent = product.BinCode || "—";
    tr.querySelector(".nr-unit").textContent = product.UnitName || "—";
    tr.querySelector(".nr-onhand").textContent = onHand;

    if (tr.dataset.autoFilled !== "no") {
        const autoPrice = (costPrice * 1.20).toFixed(2);
        priceInput.value = autoPrice;
        tr.dataset.autoFilled = "yes";
    }

    const qty = Number(qtyInput.value || 0);
    const price = Number(priceInput.value || 0);

    totalCell.textContent = money(qty * price);

    if (qtyInput.value === "" || isNaN(qty) || qty <= 0) {
        cell.innerHTML = `<span class="availability-short">Enter a quantity</span>`;
        tr.classList.add("release-row-short");
        recalcNewReleaseTotal();
        return;
    }

    if (qty > onHand) {
        cell.innerHTML = `<span class="availability-short">Insufficient stock</span>`;
        tr.classList.add("release-row-short");
        recalcNewReleaseTotal();
        return;
    }

    cell.innerHTML = `<span class="availability-ok">Available</span>`;
    recalcNewReleaseTotal();
}

function recalcNewReleaseTotal() {
    let grandTotal = 0;

    document.querySelectorAll("#new-release-lines-body tr").forEach(tr => {
        const qty = Number(tr.querySelector(".nr-qty")?.value || 0);
        const price = Number(tr.querySelector(".nr-price")?.value || 0);
        const total = qty * price;

        const totalCell = tr.querySelector(".nr-total");
        if (totalCell) totalCell.textContent = money(total);

        grandTotal += total;
    });

    const box = document.getElementById("new-release-grand-total");
    if (box) box.textContent = money(grandTotal);
}

function collectNewReleaseLines() {
    const lines = [];
    let valid = true;
    let hasShortage = false;
    let duplicate = false;
    const seen = new Set();

    document.querySelectorAll("#new-release-lines-body tr").forEach(tr => {
        const productID = tr.querySelector(".nr-product").value;
        const qty = parseInt(tr.querySelector(".nr-qty").value, 10);
        const sellingPrice = parseFloat(tr.querySelector(".nr-price").value) || 0;

        if (!productID || !qty || qty <= 0) { valid = false; return; }

        if (seen.has(productID)) duplicate = true;
        seen.add(productID);

        if (tr.classList.contains("release-row-short")) hasShortage = true;

        lines.push({
            ProductID: productID,
            Quantity: qty,
            SellingPrice: sellingPrice
        });
    });

    return { lines, valid, hasShortage, duplicate };
}

async function submitNewRelease() {
    const releaseDate = document.getElementById("new-release-date").value;
    if (!releaseDate) {
        await showAlert("Please set the release date.", { type: "warning" });
        return;
    }

    const { lines, valid, hasShortage, duplicate } = collectNewReleaseLines();

    if (!valid || !lines.length) {
        await showAlert("Please select a product and a valid quantity for every line.", { type: "warning" });
        return;
    }

    if (duplicate) {
        await showAlert(
            "The same product is selected more than once. Please combine them into one line.",
            { type: "warning" }
        );
        return;
    }

    if (hasShortage) {
        await showAlert(
            "Please resolve the quantities flagged in red before releasing.",
            { type: "warning", title: "Insufficient Stock" }
        );
        return;
    }

    openConfirmModal(
        "Release these products now?",
        {
            title: "Confirm Release",
            warning: "",
            confirmLabel: "Release",
            onConfirm: async () => {
                const res = await apiCall("createStockRelease", {
                    ReleaseDate: releaseDate,
                    lines
                });

                if (!res.success) {
                    await showAlert(res.message || "Failed to submit stock release.", { type: "error" });
                    return;
                }

                closeNewReleaseModal();
                loadReleases();
                loadDashboard();

                await showAlert(
                    res.message || "Stock release completed.",
                    { type: "success" }
                );
            }
        }
    );
}

/* ============================================================
   PROCESS RELEASE MODAL
============================================================ */

function closeProcessModal() {
    closeModal("process-modal-overlay");
    processReleaseId = null;
}

async function openProcessModal(releaseId) {
    processReleaseId = releaseId;
    document.getElementById("process-modal-title").textContent = `Process Stock Release #${releaseId}`;
    const body = document.getElementById("process-modal-body");
    body.innerHTML = `<p class="modal-loading">Loading…</p>`;
    openModal("process-modal-overlay");

    const res = await apiCall("getStockRelease", { ReleaseID: releaseId });

    if (!res || !res.success || !res.data) {
        body.innerHTML = `<p class="field-hint">${esc((res && res.message) || "Failed to load release.")}</p>`;
        return;
    }

    const d = res.data;
    const lines = d.lines || [];

    body.innerHTML = `
        <div class="form-group" style="max-width:240px;">
            <label for="process-release-date">Release Date *</label>
            <input type="date" id="process-release-date" value="${esc(d.ReleaseDate || today())}">
        </div>

        <div class="release-table-wrap">
            <table class="line-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Location</th>
                        <th>Unit</th>
                        <th class="num">Available</th>
                        <th class="num">Selling Price</th>
                        <th class="num">Qty To Release</th>
                        <th class="num">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${lines.map(l => {
                        const avail = Number(l.OnHand || 0) + Number(l.QuantityReleased || 0);
                        const price = Number(l.SellingPrice ?? 0);
                        const qty = Number(l.QuantityReleased ?? 0);
                        const total = price * qty;
                        return `
                            <tr data-line="${esc(l.Stock_Release_Line_ID)}" data-avail="${avail}">
                                <td>${esc(l.ProductName)}</td>
                                <td>${esc(l.BinCode || "—")}</td>
                                <td>${esc(l.UnitName || "—")}</td>
                                <td class="num">${avail}</td>
                                <td class="num">
                                    <input type="number" class="pr-price" min="0" step="0.01"
                                           value="${price.toFixed(2)}" style="width:100%;">
                                </td>
                                <td class="num">
                                    <input type="number" class="pr-qty" min="0" step="1"
                                           value="${esc(qty)}" style="width:100%;">
                                </td>
                                <td class="num pr-total">${money(total)}</td>
                            </tr>`;
                    }).join("") || `<tr><td colspan="7" class="empty-row">No lines.</td></tr>`}
                </tbody>
            </table>
        </div>
    `;

    document.querySelectorAll("#process-modal-body tr[data-line]").forEach(tr => {
        const qtyInput = tr.querySelector(".pr-qty");
        const priceInput = tr.querySelector(".pr-price");
        const totalCell = tr.querySelector(".pr-total");

        const update = () => {
            const qty = Number(qtyInput.value || 0);
            const price = Number(priceInput.value || 0);
            totalCell.textContent = money(qty * price);
        };

        qtyInput.addEventListener("input", update);
        priceInput.addEventListener("input", update);
    });
}

function collectProcessLines() {
    const lines = [];
    let over = false;

    document.querySelectorAll("#process-modal-body tbody tr[data-line]").forEach(tr => {
        const qty = parseInt(tr.querySelector(".pr-qty").value, 10) || 0;
        const priceInput = tr.querySelector(".pr-price");
        const price = priceInput ? parseFloat(priceInput.value) || 0 : 0;

        if (qty > Number(tr.dataset.avail)) over = true;
        lines.push({
            Stock_Release_Line_ID: tr.dataset.line,
            QuantityReleased: qty,
            SellingPrice: price
        });
    });

    return { lines, over };
}

async function submitProcess(markCompleted) {
    const dateEl = document.getElementById("process-release-date");
    const releaseDate = dateEl ? dateEl.value : "";

    if (!releaseDate) {
        await showAlert("Please set the release date.", { type: "warning" });
        return;
    }

    const { lines, over } = collectProcessLines();

    if (!lines.length) {
        await showAlert("No lines to process.", { type: "warning" });
        return;
    }

    if (over) {
        await showAlert("A quantity is more than the available stock.", { type: "warning", title: "Insufficient Stock" });
        return;
    }


    const res = await apiCall("processStockRelease", {
        ReleaseID: processReleaseId,
        ReleaseDate: releaseDate,
        lines,
        markCompleted
    });

    if (!res.success) {
        await showAlert(res.message || "Failed.", { type: "error" });
        return;
    }

    if (markCompleted) closeProcessModal();
    loadReleases();
    loadDashboard();

    await showAlert(
        res.message || (markCompleted ? "Release marked as completed." : "Progress saved."),
        { type: "success" }
    );
}

function saveReleaseProgress() { submitProcess(false); }

function markReleaseCompleted() {
    openConfirmModal("Mark this release as completed?", {
        title: "Complete Release",
        warning: "",
        confirmLabel: "Complete",
        onConfirm: () => submitProcess(true)
    });
}

/* ============================================================
   VIEW (READ-ONLY) RELEASE MODAL
============================================================ */

async function openViewReleaseModal(releaseId) {
    viewReleaseId = releaseId;

    document.getElementById("view-release-modal-title").textContent = `Stock Release #${releaseId}`;
    const body = document.getElementById("view-release-modal-body");
    body.innerHTML = `<p class="modal-loading">Loading…</p>`;

    const printBtn = document.getElementById("btn-print-view");
    if (printBtn) printBtn.style.display = "none";

    openModal("view-release-modal-overlay");

    const res = await apiCall("getStockRelease", { ReleaseID: releaseId });

    if (!res || !res.success || !res.data) {
        body.innerHTML = `<p class="field-hint">${esc((res && res.message) || "Failed to load release.")}</p>`;
        return;
    }

    const d = res.data;
    const lines = d.lines || [];

    if (printBtn) {
        printBtn.style.display =
            String(d.StatusName || "").toLowerCase() === "completed" ? "" : "none";
    }

    let grandTotal = 0;

    const linesHtml = lines.map(l => {
        const price = Number(l.SellingPrice ?? 0);
        const qty = Number(l.QuantityReleased ?? 0);
        const total = price * qty;
        grandTotal += total;

        return `
            <tr>
                <td>${esc(l.ProductName)}</td>
                <td>${esc(l.UnitName || "—")}</td>
                <td class="num">${esc(qty)}</td>
                <td class="num">${money(price)}</td>
                <td class="num">${money(total)}</td>
            </tr>
        `;
    }).join("") || `<tr><td colspan="5" class="empty-row">No lines.</td></tr>`;

    body.innerHTML = `
        <div class="detail-grid">
            <div><span class="detail-label">Released By</span><span class="detail-value">${esc(d.ReleasedBy || "—")}</span></div>
            <div><span class="detail-label">Release Date</span><span class="detail-value">${esc(d.ReleaseDate || "—")}</span></div>
            <div><span class="detail-label">Status</span><span class="detail-value">${statusBadge(d.StatusName)}</span></div>
        </div>

        <table class="line-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Unit</th>
                    <th class="num">Qty Released</th>
                    <th class="num">Selling Price</th>
                    <th class="num">Total</th>
                </tr>
            </thead>
            <tbody>${linesHtml}</tbody>
            <tfoot>
                <tr>
                    <th colspan="4" style="text-align:right;">Grand Total</th>
                    <th class="num" style="color:#052E16; font-size:14px;">${money(grandTotal)}</th>
                </tr>
            </tfoot>
        </table>
    `;
}

function closeViewReleaseModal() {
    closeModal("view-release-modal-overlay");
}

/* ============================================================
   PRINT RELEASE SLIP
============================================================ */

async function printRelease(releaseId) {
    if (!releaseId) return;

    const res = await apiCall("getStockRelease", { ReleaseID: releaseId });

    if (!res || !res.success || !res.data) {
        await showAlert((res && res.message) || "Failed to load release for printing.", { type: "error" });
        return;
    }

    const d = res.data;
    const lines = (d.lines || []).filter(l => Number(l.QuantityReleased || 0) > 0);

    let grandTotal = 0;
    let totalQty = 0;

    const rowsHtml = lines.map((l, i) => {
        const qty = Number(l.QuantityReleased || 0);
        const price = Number(l.SellingPrice || 0);
        const total = qty * price;
        grandTotal += total;
        totalQty += qty;

        return `
            <tr>
                <td class="c">${i + 1}</td>
                <td>${esc(l.ProductName)}</td>
                <td class="c">${esc(l.UnitName || "—")}</td>
                <td class="r">${esc(qty)}</td>
                <td class="r">${money(price)}</td>
                <td class="r">${money(total)}</td>
            </tr>
        `;
    }).join("") || `<tr><td colspan="6" class="c">No items.</td></tr>`;

    const printedAt = new Date().toLocaleString("en-PH");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Release Slip #${esc(releaseId)}</title>
<style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; margin: 0; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px; }
    .header h1 { margin: 0; font-size: 20px; }
    .header h2 { margin: 4px 0 0; font-size: 14px; font-weight: normal; letter-spacing: 1px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 14px; }
    .meta div { line-height: 1.7; }
    .meta b { display: inline-block; min-width: 90px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 6px 8px; }
    th { background: #eee; font-size: 11px; text-transform: uppercase; }
    td.c, th.c { text-align: center; }
    td.r, th.r { text-align: right; }
    tfoot td { font-weight: bold; background: #f7f7f7; }
    .sign { display: flex; justify-content: space-between; gap: 30px; margin-top: 60px; }
    .sign div { flex: 1; text-align: center; }
    .sign .line { border-top: 1px solid #000; padding-top: 4px; margin-top: 40px; }
    .foot { margin-top: 30px; font-size: 10px; color: #555; text-align: center; }
</style>
</head>
<body>
    <div class="header">
        <h1>Grocery Warehouse</h1>
        <h2>STOCK RELEASE SLIP</h2>
    </div>

    <div class="meta">
        <div>
            <div><b>Release No.:</b> #${esc(releaseId)}</div>
            <div><b>Release Date:</b> ${esc(d.ReleaseDate || "—")}</div>
        </div>
        <div>
            <div><b>Released By:</b> ${esc(d.ReleasedBy || "—")}</div>
            <div><b>Status:</b> ${esc(d.StatusName || "—")}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th class="c" style="width:40px;">#</th>
                <th>Product</th>
                <th class="c" style="width:70px;">Unit</th>
                <th class="r" style="width:70px;">Qty</th>
                <th class="r" style="width:100px;">Price</th>
                <th class="r" style="width:110px;">Total</th>
            </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot>
            <tr>
                <td colspan="3" class="r">TOTAL</td>
                <td class="r">${esc(totalQty)}</td>
                <td></td>
                <td class="r">${money(grandTotal)}</td>
            </tr>
        </tfoot>
    </table>

    <div class="sign">
        <div><div class="line">Released By</div></div>
        <div><div class="line">Received By</div></div>
    </div>

    <div class="foot">Printed on ${esc(printedAt)}</div>
</body>
</html>`;

    const old = document.getElementById("print-frame");
    if (old) old.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "print-frame";
    iframe.style.cssText = "position:fixed; right:0; bottom:0; width:0; height:0; border:0;";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 300);
}

/* ============================================================
   PRODUCTS (search + category filter)
============================================================ */

async function loadProducts() {
    const tbody = document.getElementById("product-tbody");
    if (!tbody) return;

    const search = (document.getElementById("search-product") || {}).value || "";
    const categoryID = (document.getElementById("filter-product-category") || {}).value || "";

    await ensureCategoriesCache();
    populateCategorySelectOnce("filter-product-category");

    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Loading…</td></tr>`;

    const res = await apiCall("getProducts", {
        search: search.trim(),
        CategoryID: categoryID
    });

    if (!res || !res.success) {
        setCount("product-count", 0);
        tbody.innerHTML = `<tr><td colspan="7" class="empty-row">${esc((res && res.message) || "Failed to load.")}</td></tr>`;
        return;
    }

    const rows = res.data || [];
    setCount("product-count", rows.length);

    tbody.innerHTML = rows.length
        ? rows.map(p => `
            <tr>
                <td>${esc(p.Barcode)}</td>
                <td>${esc(p.ProductName)}</td>
                <td>${esc(p.CategoryName || "—")}</td>
                <td>${esc(p.UnitName || "—")}</td>
                <td class="num ${Number(p.OnHand) <= Number(p.MinStockLevel) ? "stock-low" : "stock-ok"}">${esc(p.OnHand)}</td>
                <td class="num">${esc(p.MinStockLevel)}</td>
                <td>${esc(p.BinCode || "—")}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="7" class="empty-row">No products found.</td></tr>`;
}

function clearProductFilters() {
    const s = document.getElementById("search-product");
    const c = document.getElementById("filter-product-category");
    if (s) s.value = "";
    if (c) c.value = "";
    loadProducts();
}

/* ============================================================
   CURRENT STOCK (search + category filter)
============================================================ */

async function loadStock() {
    const tbody = document.getElementById("stock-tbody");
    if (!tbody) return;

    const search = (document.getElementById("search-stock") || {}).value || "";
    const categoryID = (document.getElementById("filter-stock-category") || {}).value || "";

    await ensureCategoriesCache();
    populateCategorySelectOnce("filter-stock-category");

    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Loading…</td></tr>`;

    const res = await apiCall("getInventoryQuantities", {
        search: search.trim(),
        CategoryID: categoryID
    });

    if (!res || !res.success) {
        setCount("stock-count", 0);
        tbody.innerHTML = `<tr><td colspan="6" class="empty-row">${esc((res && res.message) || "Failed to load.")}</td></tr>`;
        return;
    }

    const rows = res.data || [];
    setCount("stock-count", rows.length);

    tbody.innerHTML = rows.length
        ? rows.map(r => `
            <tr>
                <td>${esc(r.ProductName)}</td>
                <td>${esc(r.CategoryName || "—")}</td>
                <td>${esc(r.BinCode || "—")}</td>
                <td>${esc(r.UnitName || "—")}</td>
                <td class="num ${Number(r.OnHandQuantity) <= Number(r.MinStockLevel) ? "stock-low" : "stock-ok"}">${esc(r.OnHandQuantity)}</td>
                <td class="num">${esc(r.MinStockLevel)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="6" class="empty-row">No stock data.</td></tr>`;
}

function clearStockFilters() {
    const s = document.getElementById("search-stock");
    const c = document.getElementById("filter-stock-category");
    if (s) s.value = "";
    if (c) c.value = "";
    loadStock();
}

/* ============================================================
   LOCATIONS — with search + filters (copied from admin)
============================================================ */

let storageAisles = [];
let storageShelves = [];

const STORAGE_KEYS = ["aisle", "shelf", "bin"];

function storageVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
}

function setStorageCount(key, n) {
    if (!STORAGE_KEYS.includes(key)) return;
    const el = document.getElementById(key + "-count");
    if (el) el.textContent = n === 0 ? "" : `${n} record${n === 1 ? "" : "s"} found`;
}

function renderAisleSelect(id, label) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = `<option value="">${esc(label)}</option>` +
        storageAisles.map(a =>
            `<option value="${esc(a.AisleID)}">${esc(a.AisleCode)}</option>`
        ).join("");
    sel.value = storageAisles.some(a => String(a.AisleID) === current) ? current : "";
}

function refreshBinShelfOptions() {
    const sel = document.getElementById("filter-bin-shelf");
    if (!sel) return;
    const aisle = storageVal("filter-bin-aisle");
    const current = sel.value;

    const list = aisle
        ? storageShelves.filter(s => String(s.AisleID) === aisle)
        : storageShelves;

    sel.innerHTML = `<option value="">All shelves</option>` +
        list.map(s =>
            `<option value="${esc(s.ShelfID)}">${esc((s.AisleCode || "") + " / " + (s.ShelfCode || ""))}</option>`
        ).join("");

    sel.value = list.some(s => String(s.ShelfID) === current) ? current : "";
}

async function fillStorageFilters() {
    const [a, s] = await Promise.all([
        apiCall("getAisles", { search: "" }),
        apiCall("getShelves", { search: "" })
    ]);

    storageAisles  = (a && a.success && a.data) || [];
    storageShelves = (s && s.success && s.data) || [];

    renderAisleSelect("filter-shelf-aisle", "All aisles");
    renderAisleSelect("filter-bin-aisle", "All aisles");
    refreshBinShelfOptions();
}

async function loadAisles() {
    const tbody = document.getElementById("aisles-tbody");
    if (!tbody) return;

    const search = storageVal("search-aisle");

    tbody.innerHTML = `<tr><td class="empty-row">Loading…</td></tr>`;

    const res = await apiCall("getAisles", { search: search.trim() });
    const rows = (res && res.success && res.data) || [];

    setStorageCount("aisle", rows.length);

    tbody.innerHTML = rows.length
        ? rows.map(a => `<tr><td>${esc(a.AisleCode)}</td></tr>`).join("")
        : `<tr><td class="empty-row">No aisles found.</td></tr>`;
}

async function loadShelves() {
    const tbody = document.getElementById("shelves-tbody");
    if (!tbody) return;

    const search = storageVal("search-shelf");
    const aisleID = storageVal("filter-shelf-aisle");

    tbody.innerHTML = `<tr><td colspan="2" class="empty-row">Loading…</td></tr>`;

    const res = await apiCall("getShelves", {
        search: search.trim(),
        AisleID: aisleID
    });
    const rows = (res && res.success && res.data) || [];

    setStorageCount("shelf", rows.length);

    tbody.innerHTML = rows.length
        ? rows.map(s => `
            <tr>
                <td>${esc(s.AisleCode || "—")}</td>
                <td>${esc(s.ShelfCode)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="2" class="empty-row">No shelves found.</td></tr>`;
}

async function loadBins() {
    const tbody = document.getElementById("bins-tbody");
    if (!tbody) return;

    const search = storageVal("search-bin");
    const aisleID = storageVal("filter-bin-aisle");
    const shelfID = storageVal("filter-bin-shelf");

    tbody.innerHTML = `<tr><td colspan="3" class="empty-row">Loading…</td></tr>`;

    const res = await apiCall("getBins", {
        search: search.trim(),
        AisleID: aisleID,
        ShelfID: shelfID
    });
    const rows = (res && res.success && res.data) || [];

    setStorageCount("bin", rows.length);

    tbody.innerHTML = rows.length
        ? rows.map(b => `
            <tr>
                <td>${esc(b.AisleCode || "—")}</td>
                <td>${esc(b.ShelfCode || "—")}</td>
                <td>${esc(b.BinCode)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="3" class="empty-row">No bins found.</td></tr>`;
}

async function loadStorageLocationTables() {
    await fillStorageFilters();
    loadAisles();
    loadShelves();
    loadBins();
}

function clearStorageFilters(key) {
    const ids = {
        aisle: ["search-aisle"],
        shelf: ["search-shelf", "filter-shelf-aisle"],
        bin:   ["search-bin", "filter-bin-aisle", "filter-bin-shelf"]
    }[key] || [];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    if (key === "bin") refreshBinShelfOptions();

    if (key === "aisle") loadAisles();
    if (key === "shelf") loadShelves();
    if (key === "bin")   loadBins();
}

function wireStorageFilters() {
    const searchAisle = document.getElementById("search-aisle");
    const searchShelf = document.getElementById("search-shelf");
    const searchBin   = document.getElementById("search-bin");

    const shelfAisle = document.getElementById("filter-shelf-aisle");
    const binAisle   = document.getElementById("filter-bin-aisle");
    const binShelf   = document.getElementById("filter-bin-shelf");

    debounce(searchAisle, loadAisles);
    debounce(searchShelf, loadShelves);
    debounce(searchBin,   loadBins);

    if (shelfAisle) shelfAisle.addEventListener("change", loadShelves);

    if (binAisle) binAisle.addEventListener("change", () => {
        refreshBinShelfOptions();
        loadBins();
    });

    if (binShelf) binShelf.addEventListener("change", loadBins);
}

/* ============================================================
   CONFIRM MODAL
============================================================ */

function openConfirmModal(message, { title = "Confirm Action", warning = "", confirmLabel = "Confirm", onConfirm = null } = {}) {
    document.getElementById("confirm-modal-title").textContent = title;
    document.getElementById("confirm-modal-message").textContent = message;
    document.getElementById("confirm-modal-warning").textContent = warning;

    const btn = document.getElementById("btn-confirm-action");
    btn.textContent = confirmLabel;

    confirmCallback = onConfirm;
    openModal("confirm-modal-overlay");
}

function closeConfirmModal() {
    closeModal("confirm-modal-overlay");
    confirmCallback = null;
}

/* ============================================================
   LOGOUT
============================================================ */

async function logout() {
    try { await apiCall("logout"); } catch (err) { console.error(err); }
    sessionStorage.removeItem("user");
    window.location.replace("login.html");
}

function confirmLogout() {
    closeProfileMenu();
    openConfirmModal(
        "Are you sure you want to log out?",
        {
            title: "Log Out",
            warning: "You will need to sign in again to access the releasing panel.",
            confirmLabel: "Log Out",
            onConfirm: () => logout()
        }
    );
}

/* ============================================================
   SIDEBAR
============================================================ */

function openSidebar() {
    document.getElementById("sidebar")?.classList.add("sidebar-open");
    document.getElementById("sidebar-backdrop")?.classList.add("open");
}
function closeSidebar() {
    document.getElementById("sidebar")?.classList.remove("sidebar-open");
    document.getElementById("sidebar-backdrop")?.classList.remove("open");
}
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    sidebar.classList.contains("sidebar-open") ? closeSidebar() : openSidebar();
}

function wireSidebarToggle() {
    const hamburger = document.getElementById("hamburger-btn");
    if (hamburger) hamburger.addEventListener("click", (e) => { e.stopPropagation(); toggleSidebar(); });

    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) backdrop.addEventListener("click", closeSidebar);

    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebarEl = document.getElementById("sidebar");

    if (sidebarToggle && sidebarEl) {
        if (localStorage.getItem("releasingSidebarCollapsed") === "true") {
            sidebarEl.classList.add("collapsed");
            sidebarToggle.setAttribute("title", "Expand sidebar");
        }

        sidebarToggle.addEventListener("click", () => {
            sidebarEl.classList.toggle("collapsed");
            const isCollapsed = sidebarEl.classList.contains("collapsed");
            sidebarToggle.setAttribute("title", isCollapsed ? "Expand sidebar" : "Collapse sidebar");
            localStorage.setItem("releasingSidebarCollapsed", isCollapsed ? "true" : "false");
            closeProfileMenu();

            setTimeout(() => {
                if (chartTopProducts) chartTopProducts.resize();
                if (chartReleaseStatus) chartReleaseStatus.resize();
            }, 300);
        });
    }
}

function closeProfileMenu() {
    document.getElementById("sidebar-profile")?.classList.remove("menu-open");
    document.getElementById("sidebar-profile-trigger")?.setAttribute("aria-expanded", "false");
}
function toggleProfileMenu() {
    const profile = document.getElementById("sidebar-profile");
    const trigger = document.getElementById("sidebar-profile-trigger");
    if (!profile || !trigger) return;
    const isOpen = profile.classList.toggle("menu-open");
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function wireProfileMenu() {
    const trigger = document.getElementById("sidebar-profile-trigger");
    const profileEl = document.getElementById("sidebar-profile");
    const logoutBtn = document.getElementById("btn-logout");

    if (trigger) trigger.addEventListener("click", (e) => { e.stopPropagation(); toggleProfileMenu(); });
    if (logoutBtn) logoutBtn.addEventListener("click", (e) => { e.stopPropagation(); confirmLogout(); });

    document.addEventListener("click", (e) => {
        if (profileEl && !profileEl.contains(e.target)) closeProfileMenu();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeProfileMenu(); });
}

/* ============================================================
   INIT
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    if (!loadSession()) return;

    wireNavigation();
    wireTabs();
    wireSidebarToggle();
    wireProfileMenu();
    wireStorageFilters();

    debounce(document.getElementById("search-releases"), loadReleases);
    debounce(document.getElementById("search-product"), loadProducts);
    debounce(document.getElementById("search-stock"), loadStock);

    ["filter-releases-from", "filter-releases-to", "filter-releases-status"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", loadReleases);
    });

    [
        "view-release-modal-overlay",
        "confirm-modal-overlay",
        "new-release-modal-overlay",
        "process-modal-overlay",
        "alert-modal-overlay"
    ].forEach(id => {
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.addEventListener("click", e => {
                if (e.target.id === id) {
                    if (id === "confirm-modal-overlay") closeConfirmModal();
                    else if (id === "process-modal-overlay") closeProcessModal();
                    else if (id === "alert-modal-overlay") closeAlertModal();
                    else closeModal(id);
                }
            });
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        const alertEl = document.getElementById("alert-modal-overlay");
        if (alertEl && alertEl.classList.contains("open")) closeAlertModal();
    });

    const confirmBtn = document.getElementById("btn-confirm-action");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", () => {
            const cb = confirmCallback;
            closeConfirmModal();
            if (cb) cb();
        });
    }

    /* Category filter listeners */
    const prodCat = document.getElementById("filter-product-category");
    if (prodCat) prodCat.addEventListener("change", loadProducts);

    const stockCat = document.getElementById("filter-stock-category");
    if (stockCat) stockCat.addEventListener("change", loadStock);

    loadReleaseStatuses();
    loadDashboard();
});