/* ============================================================
   MANAGER DASHBOARD — FULL JS
   Uses axios + operation + JSON
============================================================ */

const baseApiUrl = "http://localhost/grocery_warehouse/api_manager.php";

let currentUser     = null;
let productsCache   = [];
let statusesCache   = [];
let categoriesCache = [];
let aislesCache     = [];
let shelvesCache    = [];
let confirmCallback = null;
let lastConnectionAlert = 0;

/* ============================================================
   SESSION / API
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

        const role = String(currentUser.RoleName || "").toLowerCase().trim();
        const allowed = ["warehouse manager", "manager", "warehouse"];

        if (!allowed.includes(role)) {
            if (role === "admin" || role === "administrator") {
                window.location.replace("admin.html");
            } else if (role === "inventory staff" || role === "inventory") {
                window.location.replace("inventory.html");
            } else if (role === "receiving staff" || role === "receiving") {
                window.location.replace("receiving_dashboard.html");
            } else if (role === "releasing staff" || role === "releasing") {
                window.location.replace("releasing.html");
            } else if (role === "purchasing staff" || role === "purchasing") {
                window.location.replace("purchasing.html");
            } else {
                sessionStorage.removeItem("user");
                window.location.replace("login.html");
            }
            return false;
        }

        const name = ((currentUser.FirstName || "") + " " + (currentUser.LastName || "")).trim();
        const displayName = name || currentUser.UserName || "Manager";

        const topbarName = document.getElementById("topbar-username");
        if (topbarName) topbarName.textContent = "Welcome, " + displayName;

        const profileName = document.getElementById("sidebar-profile-name");
        if (profileName) profileName.textContent = displayName;

        const profileRole = document.getElementById("sidebar-profile-role");
        if (profileRole) profileRole.textContent = currentUser.RoleName || "Warehouse Manager";

        const profileAvatar = document.getElementById("sidebar-profile-avatar");
        if (profileAvatar) {
            profileAvatar.textContent = displayName.trim().charAt(0).toUpperCase() || "M";
        }

        return true;
    } catch (err) {
        console.error("Session error:", err);
        window.location.replace("login.html");
        return false;
    }
}

async function apiCall(operation, payload = {}) {
    const body = Object.assign(
        { operation, LoggedInUserID: currentUser ? currentUser.UserID : 0 },
        payload
    );

    try {
        const res = await axios.post(baseApiUrl, body, {
            headers: { "Content-Type": "application/json" }
        });

        let data = res.data;

        if (typeof data === "string") {
            const start = data.indexOf('{"success"');
            if (start >= 0) {
                try { data = JSON.parse(data.slice(start)); } catch (e) { /* ignore */ }
            }
        }

        if (!data || typeof data !== "object") {
            console.error("Invalid server response for", operation, ":", res.data);
            return {
                success: false,
                message: "Invalid server response (" + operation + "). Check the Console (F12).",
                data: []
            };
        }

        if (data.success === false) {
            console.warn("API returned error for", operation, ":", data.message);
        }

        return data;

    } catch (error) {
        console.error("API ERROR:", operation, error);

        const message = (error && error.response && error.response.data && error.response.data.message)
            || "Unable to connect to the server.";

        const now = Date.now();
        if (now - lastConnectionAlert > 8000) {
            lastConnectionAlert = now;
            showAlert(message, "Connection Error");
        }

        return { success: false, message, data: [] };
    }
}

/* ============================================================
   NAVIGATION / MODAL / HELPERS
============================================================ */

const sectionAliases = {
    "po-section":          { section: "transactions-section", tab: "tab-tx-po"   },
    "receivings-section":  { section: "transactions-section", tab: "tab-tx-recv" },
    "releases-section":    { section: "transactions-section", tab: "tab-tx-rel"  },
    "returns-section":     { section: "transactions-section", tab: "tab-tx-sret" },
    "adjustments-section": { section: "transactions-section", tab: "tab-tx-adj"  },
    "prets-section":       { section: "transactions-section", tab: "tab-tx-pret" }
};

const tabLoaders = {
    "tab-tx-po":   () => loadPurchaseOrders(),
    "tab-tx-pret": () => loadPurchaseReturns(),
    "tab-tx-recv": () => loadReceivings(),
    "tab-tx-rel":  () => loadReleases(),
    "tab-tx-sret": () => loadReturns(),
    "tab-tx-adj":  () => loadAdjustments()
};

function setActiveSection(sectionId, title) {
    document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active-section"));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add("active-section");

    document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
    const btn = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
    if (btn) btn.classList.add("active");

    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.textContent = title;

    closeSidebar();

    if (sectionId === "dashboard-section") {
        requestAnimationFrame(() => handleDashboardResize());
    }
}

function goToSection(sectionId, tabId = null) {
    const alias = sectionAliases[sectionId];
    if (alias) {
        sectionId = alias.section;
        tabId = tabId || alias.tab;
    }

    const navBtn = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
    if (navBtn) navBtn.click();

    if (tabId) {
        requestAnimationFrame(() => {
            const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
            if (tabBtn) tabBtn.click();
        });
    }
}

function openModal(id)  { const el = document.getElementById(id); if (el) el.classList.add("open"); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove("open"); }

/* askConfirm with dynamic button color */
function askConfirm(message, onYes, options = {}) {
    const msg = document.getElementById("confirm-message");
    if (msg) msg.textContent = message;

    /* Dynamic button color and label */
    const btn = document.getElementById("btn-confirm-yes");
    if (btn) {
        const color = options.confirmColor || "red";
        const label = options.confirmLabel || "Confirm";

        btn.textContent = label;
        btn.classList.remove("btn-danger", "btn-primary", "btn-approve");

        if (color === "green") {
            btn.classList.add("btn-approve");
        } else if (color === "primary") {
            btn.classList.add("btn-primary");
        } else {
            btn.classList.add("btn-danger");
        }
    }

    confirmCallback = onYes;
    openModal("confirm-modal-overlay");
}

function showAlert(message, title = "Notice") {
    const titleEl = document.getElementById("alert-modal-title");
    const msgEl   = document.getElementById("alert-message");

    if (titleEl) titleEl.textContent = title;
    if (msgEl)   msgEl.textContent   = message;

    openModal("alert-modal-overlay");
}

function fmtDate(value) {
    if (!value) return "—";

    const text = String(value);
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(text);

    const d = dateOnly ? new Date(text + "T00:00:00") : new Date(text.replace(" ", "T"));
    if (isNaN(d)) return text;

    return dateOnly ? d.toLocaleDateString() : d.toLocaleString();
}

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function statusBadge(value) {
    const status = String(value || "").toLowerCase().trim();

    const map = {
        "approved":   "badge-green",
        "completed":  "badge-green",
        "active":     "badge-green",
        "received":   "badge-green",
        "released":   "badge-green",
        "pending":    "badge-amber",
        "for review": "badge-amber",
        "submitted":  "badge-amber",
        "draft":      "badge-gray",
        "cancelled":  "badge-gray",
        "canceled":   "badge-gray",
        "rejected":   "badge-red"
    };

    const cls = map[status] || "badge-gray";
    return `<span class="badge ${cls}">${escapeHtml(value || "—")}</span>`;
}

function isPendingName(name) {
    return ["pending", "for review", "submitted", "draft", ""]
        .includes(String(name || "").toLowerCase().trim());
}

function setCount(id, count) {
    const el = document.getElementById(id);
    if (el) el.textContent = count === 0 ? "" : `${count} record${count === 1 ? "" : "s"} found`;
}

/* ---------- Action button helpers ---------- */
const ICON_EYE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const ICON_REVIEW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

function viewBtn(onclick)   { return `<button class="btn-icon" onclick="${onclick}">${ICON_EYE} View</button>`; }
function reviewBtn(onclick) { return `<button class="btn-icon" onclick="${onclick}">${ICON_REVIEW} Review</button>`; }

function rowsOrError(res, tbody, cols, countId) {
    if (!res || !res.success) {
        tbody.innerHTML = `<tr><td colspan="${cols}" class="empty-row" style="color:#991B1B;">
            ${escapeHtml((res && res.message) || "Failed to load.")}
        </td></tr>`;
        setCount(countId, 0);
        return null;
    }
    return Array.isArray(res.data) ? res.data : [];
}

function showScriptError(tbody, cols, label, err) {
    console.error(label + ":", err);
    tbody.innerHTML = `<tr><td colspan="${cols}" class="empty-row" style="color:#991B1B;">
        Script error: ${escapeHtml(err && err.message ? err.message : String(err))}
    </td></tr>`;
}

function wrapTables() {
    document.querySelectorAll(".content table.data-table").forEach(t => {
        if (t.parentElement.classList.contains("table-wrap")) return;
        const wrap = document.createElement("div");
        wrap.className = "table-wrap";
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
    });
}

/* ============================================================
   SHARED FILTER HELPERS
============================================================ */

function fillSelect(id, rows, valueKey, labelKey, allLabel = "All") {
    const sel = document.getElementById(id);
    if (!sel) return;

    const opts = rows
        .map(r => `<option value="${r[valueKey]}">${escapeHtml(r[labelKey])}</option>`)
        .join("");

    sel.innerHTML = `<option value="">${escapeHtml(allLabel)}</option>` + opts;
}

async function ensureCategoriesCache() {
    if (categoriesCache.length === 0) {
        const res = await apiCall("getCategories");
        if (res && res.success) categoriesCache = res.data || [];
    }
    return categoriesCache;
}

async function ensureProductsCache() {
    if (productsCache.length === 0) {
        const res = await apiCall("getProducts");
        if (res && res.success) productsCache = res.data || [];
    }
    return productsCache;
}

async function ensureAislesCache() {
    if (aislesCache.length === 0) {
        const res = await apiCall("getAisles");
        if (res && res.success) aislesCache = res.data || [];
    }
    return aislesCache;
}

async function ensureShelvesCache() {
    if (shelvesCache.length === 0) {
        const res = await apiCall("getShelves");
        if (res && res.success) shelvesCache = res.data || [];
    }
    return shelvesCache;
}

function populateProductSelectOnce(selectId, allLabel = "All products") {
    const sel = document.getElementById(selectId);
    if (!sel || sel.options.length > 1) return;
    fillSelect(selectId, productsCache, "ProductID", "ProductName", allLabel);
}

function populateCategorySelectOnce(selectId, allLabel = "All categories") {
    const sel = document.getElementById(selectId);
    if (!sel || sel.options.length > 1) return;
    fillSelect(selectId, categoriesCache, "CategoryID", "CategoryName", allLabel);
}

function categoryNameFromID(categoryID) {
    if (!categoryID) return "";
    const match = categoriesCache.find(c => String(c.CategoryID) === String(categoryID));
    return match ? match.CategoryName : "";
}

function buildProductCategoryLookup() {
    const map = {};
    productsCache.forEach(p => {
        map[String(p.ProductName || "").toLowerCase().trim()] = p.CategoryName || "";
    });
    return map;
}

/* ============================================================
   PRINT
============================================================ */

function printReportTable(tableId, title) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const generatedAt = new Date().toLocaleString();
    const generatedBy = currentUser
        ? ((currentUser.FirstName || "") + " " + (currentUser.LastName || "")).trim() || currentUser.UserName
        : "";

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${escapeHtml(title)}</title>
            <style>
                * { box-sizing: border-box; }
                body {
                    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
                    color: #0F2419;
                    padding: 32px;
                    margin: 0;
                }
                .print-header {
                    display: flex; align-items: baseline; justify-content: space-between;
                    border-bottom: 2px solid #12331F;
                    padding-bottom: 10px; margin-bottom: 6px;
                }
                .print-header h1 { font-size: 18px; margin: 0; }
                .print-brand { font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.04em; }
                .print-meta { font-size: 11.5px; color: #555; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
                th, td { border: 1px solid #ccc; padding: 7px 10px; text-align: left; }
                th { background: #E4F6EC; text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; color: #166534; }
                tbody tr:nth-child(even) td { background: #FAFEFB; }
                .badge { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 10.5px; font-weight: 700; }
                .badge-green { background: #DCFCE7; color: #166534; }
                .badge-amber { background: #FEF3C7; color: #92400E; }
                .badge-red   { background: #FEE2E2; color: #991B1B; }
                .badge-gray  { background: #E5E7EB; color: #374151; }
                .empty-row { display: none; }
                .print-footer { margin-top: 22px; font-size: 10.5px; color: #888; text-align: right; }
                @page { margin: 16mm; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>${escapeHtml(title)}</h1>
                <span class="print-brand">Grocery Warehouse Management System</span>
            </div>
            <div class="print-meta">
                Printed ${escapeHtml(generatedAt)}${generatedBy ? " by " + escapeHtml(generatedBy) : ""}
            </div>
            ${table.outerHTML}
            <div class="print-footer">End of report</div>
        </body>
        </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = () => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    setTimeout(() => {
        const w = iframe.contentWindow;
        if (!w) { cleanup(); return; }
        w.onafterprint = cleanup;
        w.focus();
        w.print();
        setTimeout(cleanup, 60000);
    }, 300);
}

/* ============================================================
   TRANSACTION DETAILS MODAL — with UPDATE STATUS
============================================================ */

const dmNum = (v) => Number(v ?? 0) || 0;

const dmMoney = (v) =>
    "₱" + dmNum(v).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

const dmSigned = (v) => {
    const n = dmNum(v);
    return (n > 0 ? "+" : "") + n;
};

function dmPillClass(status) {
    const s = String(status || "").toLowerCase();
    if (["approved", "completed", "received", "released"].includes(s)) return "green";
    if (["pending", "for review", "submitted"].includes(s)) return "amber";
    if (["rejected", "cancelled", "canceled"].includes(s)) return "red";
    return "gray";
}

function dmGetProgress(status, approvedIsFinal) {
    const s = String(status || "").toLowerCase();
    const bad = ["rejected", "cancelled", "canceled"].includes(s);
    let level = 1;
    if (s === "approved") level = approvedIsFinal ? 3 : 2;
    if (["completed", "received", "released", "delivered"].includes(s)) level = 3;
    return { level, bad };
}

function dmAdjValue(l) {
    const q = dmNum(l.Adjustment_Quantity);
    const t = String(l.Adjustment_Type || "").toLowerCase();
    if (t.includes("decrease") || t.includes("deduct") || t.includes("minus")) return -Math.abs(q);
    if (t.includes("increase") || t.includes("add")) return Math.abs(q);
    return q;
}

/* ---------- per-transaction config ---------- */

const TX_DETAIL_CONFIG = {

    purchase_order: {
        op: "getPurchaseOrder",
        idField: "PO_ID",
        title: "Purchase Order",
        subtitle: (d) => d.SupplierName || "",
        dateOf: (d) => d.PO_Date,
        steps: ["Created", "Review", "Approved"],
        approvedIsFinal: true,
        approveOp: "approvePurchaseOrder",
        rejectOp:  "rejectPurchaseOrder",
        cancelOp:  "cancelPurchaseOrder",
        meta: [
            ["PO Date", (d) => fmtDate(d.PO_Date)],
            ["Expected", (d) => fmtDate(d.Expected_Date)],
            ["Requested By", (d) => d.UserName]
        ],
        columns: [
            { label: "Product", get: (l) => l.ProductName },
            { label: "Qty", get: (l) => dmNum(l.Quantity), align: "r" },
            { label: "Cost", kind: "money", get: (l) => dmNum(l.CostPrice), align: "r" },
            { label: "Total", kind: "money", get: (l) => dmNum(l.Quantity) * dmNum(l.CostPrice), align: "r" }
        ],
        summary: {
            label: "Grand Total",
            money: true,
            get: (ls) => ls.reduce((a, l) => a + dmNum(l.Quantity) * dmNum(l.CostPrice), 0)
        }
    },

    purchase_return: {
        op: "getPurchaseReturn",
        idField: "Purchase_Return_ID",
        title: "Purchase Return",
        subtitle: (d) => d.SupplierName || "",
        dateOf: (d) => d.Return_Date,
        steps: ["Recorded", "Review", "Approved"],
        approvedIsFinal: true,
        approveOp: "approvePurchaseReturn",
        rejectOp:  "rejectPurchaseReturn",
        cancelOp:  "cancelPurchaseReturn",
        meta: [
            ["Date", (d) => fmtDate(d.Return_Date)],
            ["Recorded By", (d) => d.UserName],
            ["Reason", (d) => d.Reason]
        ],
        columns: [
            { label: "Product", get: (l) => l.ProductName },
            { label: "Qty", get: (l) => dmNum(l.Quantity), align: "r" }
        ],
        summary: {
            label: "Total Returned",
            get: (ls) => ls.reduce((a, l) => a + dmNum(l.Quantity), 0)
        }
    },

    receiving: {
        op: "getReceiving",
        idField: "ReceivingID",
        title: "Receiving",
        subtitle: (d) => d.SupplierName || "",
        dateOf: (d) => d.ReceivingDate,
        steps: ["Recorded", "Review", "Approved"],
        approvedIsFinal: true,
        approveOp: "approveReceiving",
        rejectOp:  "rejectReceiving",
        cancelOp:  "cancelReceiving",
        meta: [
            ["Date", (d) => fmtDate(d.ReceivingDate)],
            ["Received By", (d) => d.UserName],
            ["PO Ref", (d) => poRefLabel(d.PO_Reference)]
        ],
        columns: [
            { label: "Product", get: (l) => l.ProductName },
            { label: "Ordered", get: (l) => dmNum(l.OrderedQuantity), align: "r" },
            { label: "Received", get: (l) => dmNum(l.ReceivedQuantity), align: "r" },
            { label: "Variance", kind: "variance", get: (l) => dmNum(l.Variance), align: "r" }
        ],
        summary: {
            label: "Total Received",
            get: (ls) => ls.reduce((a, l) => a + dmNum(l.ReceivedQuantity), 0)
        }
    },

    stock_release: {
        op: "getStockRelease",
        idField: "ReleaseID",
        title: "Stock Release",
        subtitle: (d) => d.ReleasedBy || "",
        dateOf: (d) => d.ReleaseDate,
        steps: ["Created", "Review", "Approved"],
        approvedIsFinal: true,
        approveOp: "approveStockRelease",
        rejectOp:  "rejectStockRelease",
        cancelOp:  "cancelStockRelease",
        meta: [
            ["Date", (d) => fmtDate(d.ReleaseDate)],
            ["Released By", (d) => d.ReleasedBy],
            ["Status", (d) => d.StatusName]
        ],
        columns: [
            { label: "Product", get: (l) => l.ProductName },
            { label: "Qty", get: (l) => dmNum(l.QuantityReleased), align: "r" },
            { label: "Selling Price", kind: "money", get: (l) => dmNum(l.SellingPrice), align: "r" },
            { label: "Total", kind: "money", get: (l) => dmNum(l.QuantityReleased) * dmNum(l.SellingPrice), align: "r" }
        ],
        summary: [
            {
                label: "Total Released",
                get: (ls) => ls.reduce((a, l) => a + dmNum(l.QuantityReleased), 0)
            },
            {
                label: "Total Amount",
                money: true,
                get: (ls) => ls.reduce((a, l) => a + dmNum(l.QuantityReleased) * dmNum(l.SellingPrice), 0)
            }
        ]
    },

    stock_return: {
        op: "getStockReturn",
        idField: "Stock_Return_ID",
        title: "Stock Return",
        subtitle: (d) => d.UserName || "",
        dateOf: (d) => d.Return_Date,
        steps: ["Recorded", "Review", "Approved"],
        approvedIsFinal: true,
        approveOp: "approveStockReturn",
        rejectOp:  "rejectStockReturn",
        cancelOp:  "cancelStockReturn",
        meta: [
            ["Date", (d) => fmtDate(d.Return_Date)],
            ["Recorded By", (d) => d.UserName],
            ["Reason", (d) => d.Reason]
        ],
        columns: [
            { label: "Product", get: (l) => l.ProductName },
            { label: "Qty", get: (l) => dmNum(l.Quantity), align: "r" }
        ],
        summary: {
            label: "Total Returned",
            get: (ls) => ls.reduce((a, l) => a + dmNum(l.Quantity), 0)
        }
    },

    inventory_adjustment: {
        op: "getInventoryAdjustment",
        idField: "Adjustment_ID",
        title: "Inventory Adjustment",
        subtitle: (d) => d.UserName || "",
        dateOf: (d) => d.Adjustment_Date,
        steps: ["Recorded", "Review", "Approved"],
        approvedIsFinal: true,
        approveOp: "approveAdjustment",
        rejectOp:  "rejectAdjustment",
        cancelOp:  "cancelAdjustment",
        meta: [
            ["Date", (d) => fmtDate(d.Adjustment_Date)],
            ["Recorded By", (d) => d.UserName],
            ["Reason", (d) => d.Reason]
        ],
        columns: [
            { label: "Product", get: (l) => l.ProductName },
            { label: "System", get: (l) => dmNum(l.System_Quantity), align: "r" },
            { label: "Actual", get: (l) => dmNum(l.Actual_Quantity), align: "r" },
            { label: "Adj", get: (l) => dmSigned(dmAdjValue(l)), align: "r" },
            { label: "Type", kind: "type", get: (l) => l.Adjustment_Type, align: "c" }
        ],
        summary: {
            label: "Net Adjustment",
            get: (ls) => ls.reduce((a, l) => a + dmAdjValue(l), 0),
            signed: true
        }
    }
};

/* ---------- renderers ---------- */

function dmRenderStepper(cfg, d) {
    const { level, bad } = dmGetProgress(d.StatusName, cfg.approvedIsFinal);
    const isPending = isPendingName(d.StatusName);

    const stepStates = ["done", "", ""];

    if (bad) {
        stepStates[1] = "done";
        stepStates[2] = "bad";
    } else if (level >= 3) {
        stepStates[1] = "done";
        stepStates[2] = "done";
    } else if (level >= 2) {
        stepStates[1] = "done";
        stepStates[2] = "current";
    } else if (isPending) {
        stepStates[1] = "current";
    }

    const statusName = String(d.StatusName || "").trim();

    let finalLabel;
    if (isPending) {
        finalLabel = "Approved / Rejected";
    } else {
        finalLabel = statusName || "Approved";
    }

    const step = (idx) => {
        const state = stepStates[idx];
        const icon = state === "done" ? "✓" : state === "bad" ? "✕" : String(idx + 1);

        let label = "";
        if (idx === 0) label = cfg.steps[0] || "Created";
        if (idx === 1) label = cfg.steps[1] || "Review";
        if (idx === 2) label = finalLabel;

        const dateText = (idx === 0 && cfg.dateOf(d)) ? cfg.dateOf(d) : "";

        return `
            <div class="dm-step ${state}">
                <div class="dm-circle">${icon}</div>
                <div class="dm-step-label">${escapeHtml(label)}</div>
                ${dateText ? `<div class="dm-step-date">${escapeHtml(dateText)}</div>` : ""}
            </div>
        `;
    };

    const line = (idx) => {
        const isDone = stepStates[idx + 1] === "done";
        const isBad  = stepStates[idx + 1] === "bad";
        return `<div class="dm-line ${isDone ? "done" : ""} ${isBad ? "bad" : ""}"></div>`;
    };

    return `<div class="dm-stepper">${step(0)}${line(0)}${step(1)}${line(1)}${step(2)}</div>`;
}

function dmRenderMeta(cfg, d) {
    return `
        <div class="dm-meta">
            ${cfg.meta.map(([label, get]) => `
                <div>
                    <div class="dm-meta-label">${escapeHtml(label)}</div>
                    <div class="dm-meta-value">${escapeHtml(get(d) || "—")}</div>
                </div>
            `).join("")}
        </div>
    `;
}

function dmRenderCell(col, l) {
    const raw = col.get(l);

    if (col.kind === "type") {
        const t = String(raw || "").toLowerCase();
        const cls = (t.includes("increase") || t.includes("add")) ? "up"
                  : (t.includes("decrease") || t.includes("deduct") || t.includes("minus")) ? "down"
                  : "neutral";
        return `<span class="dm-type ${cls}">${escapeHtml(raw || "—")}</span>`;
    }

    if (col.kind === "money") return escapeHtml(dmMoney(raw));

    if (col.kind === "variance") {
        const v = dmNum(raw);
        const cls = v > 0 ? "badge-amber" : v < 0 ? "badge-red" : "badge-green";
        const label = v === 0 ? "Match" : (v > 0 ? `+${v} Excess` : `${v} Short`);
        return `<span class="badge ${cls}">${label}</span>`;
    }

    return escapeHtml(raw ?? "—");
}

function dmRenderLines(cfg, lines) {
    const alignClass = (c) => c.align ? ` class="${c.align}"` : "";
    const head = cfg.columns.map(c => `<th${alignClass(c)}>${escapeHtml(c.label)}</th>`).join("");
    const rows = lines.length
        ? lines.map(l => `<tr>${cfg.columns.map(c => `<td${alignClass(c)}>${dmRenderCell(c, l)}</td>`).join("")}</tr>`).join("")
        : `<tr><td colspan="${cfg.columns.length}" class="dm-empty">No lines</td></tr>`;
    return `<table class="dm-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

function dmRenderSummary(cfg, lines) {
    if (!cfg.summary) return "";
    const list = Array.isArray(cfg.summary) ? cfg.summary : [cfg.summary];
    return list.map((s) => {
        const total = s.get(lines);
        const text = s.money ? dmMoney(total) : (s.signed ? dmSigned(total) : String(total)) + " pcs";
        return `
            <div class="dm-summary">
                <div class="dm-meta-label">${escapeHtml(s.label)}</div>
                <div class="dm-summary-value">${escapeHtml(text)}</div>
            </div>
        `;
    }).join("");
}

/* ---------- Update Status Bar (Approve / Reject / Cancel) ---------- */

function dmRenderUpdateBar(cfg, d, type, id) {
    const status      = String(d.StatusName || "").trim();
    const statusLower = status.toLowerCase();
    const isPending   = isPendingName(d.StatusName);

    const isSuccess = ["approved", "completed", "received", "released", "delivered"].includes(statusLower);
    const isFailure = ["rejected", "cancelled", "canceled"].includes(statusLower);

    if (isSuccess || isFailure) {
        const icon = isSuccess ? "✓" : "✕";
        const text = `Status updated to ${status}`;
        const cls  = isSuccess ? "success" : "error";

        return `
            <div class="dm-update-bar">
                <div class="dm-status-toast ${cls}">
                    <span class="dm-status-toast-icon">${icon}</span>
                    <span class="dm-status-toast-text">${escapeHtml(text)}</span>
                </div>
            </div>
        `;
    }

    if (!isPending) {
        return "";
    }

    return `
        <div class="dm-update-bar">
            <div class="dm-update-label">Update Status</div>
            <div class="dm-update-actions">
                <button class="dm-action approve"
                    onclick="dmApprove('${type}', ${Number(id)})">
                    ✓ Approve
                </button>
                <button class="dm-action reject"
                    onclick="dmReject('${type}', ${Number(id)})">
                    ✕ Reject
                </button>
                <div class="dm-action-spacer"></div>
            </div>
        </div>
    `;
}

/* ---------- Approve / Reject from details modal ---------- */

let currentDetails = { type: null, id: null };

async function dmApprove(type, id) {
    const cfg = TX_DETAIL_CONFIG[type];
    if (!cfg || !cfg.approveOp) {
        showAlert("Approve is not available for this transaction type.", "Not Available");
        return;
    }

    askConfirm(
        `Approve this ${cfg.title} #${id}?`,
        async () => {
            const res = await apiCall(cfg.approveOp, { [cfg.idField]: id });

            if (!res || !res.success) {
                showAlert((res && res.message) || "Failed to approve.", "Approve Failed");
                return;
            }

            await openTransactionDetails(type, id);

            const activeTab = document.querySelector("#transactions-section .tab-btn.active");
            const tabId = activeTab ? activeTab.getAttribute("data-tab") : null;
            if (tabId && tabLoaders[tabId]) tabLoaders[tabId]();
            loadDashboard();
        },
        {
            confirmColor: "green",
            confirmLabel: "Approve"
        }
    );
}

async function dmReject(type, id) {
    const cfg = TX_DETAIL_CONFIG[type];
    if (!cfg || !cfg.rejectOp) {
        showAlert("Reject is not available for this transaction type.", "Not Available");
        return;
    }

    askConfirm(
        `Are you sure you want to reject this ${cfg.title} #${id}?`,
        async () => {
            const res = await apiCall(cfg.rejectOp, {
                [cfg.idField]: id,
                Reason: ""
            });

            if (!res || !res.success) {
                showAlert((res && res.message) || "Failed to reject.", "Reject Failed");
                return;
            }

            await openTransactionDetails(type, id);

            const activeTab = document.querySelector("#transactions-section .tab-btn.active");
            const tabId = activeTab ? activeTab.getAttribute("data-tab") : null;
            if (tabId && tabLoaders[tabId]) tabLoaders[tabId]();
            loadDashboard();
        },
        {
            confirmColor: "red",
            confirmLabel: "Reject"
        }
    );
}

/* ---------- main ---------- */

async function openTransactionDetails(type, id) {
    const cfg = TX_DETAIL_CONFIG[type];
    if (!cfg) return;

    currentDetails = { type, id };

    const overlay   = document.getElementById("details-modal-overlay");
    const titleEl   = document.getElementById("dm-title");
    const subEl     = document.getElementById("dm-sub");
    const pillEl    = document.getElementById("dm-pill");
    const stepperEl = document.getElementById("dm-stepper");
    const bodyEl    = document.getElementById("dm-body");
    const updateEl  = document.getElementById("dm-update-bar");

    if (!overlay || !titleEl || !bodyEl) return;

    titleEl.textContent = cfg.title;
    subEl.textContent = "";
    pillEl.style.display = "none";
    stepperEl.innerHTML = "";
    updateEl.innerHTML = "";
    bodyEl.innerHTML = `<div class="dm-empty">Loading...</div>`;

    openModal("details-modal-overlay");

    try {
        const payload = {
            operation: cfg.op,
            LoggedInUserID: currentUser ? currentUser.UserID : 0,
            [cfg.idField]: id
        };

        const res = await axios.post(baseApiUrl, payload, {
            headers: { "Content-Type": "application/json" }
        });

        let data = res.data;

        if (typeof data === "string") {
            const start = data.indexOf('{"success"');
            if (start >= 0) {
                try { data = JSON.parse(data.slice(start)); } catch (e) {}
            }
        }

        if (!data || !data.success || !data.data) {
            bodyEl.innerHTML = `<div class="dm-empty" style="color:#B91C1C;">${escapeHtml((data && data.message) || "Failed to load.")}</div>`;
            return;
        }

        const d = data.data;
        const lines = d.lines || [];

        subEl.textContent = cfg.subtitle(d);

        pillEl.textContent = d.StatusName || "—";
        pillEl.className = "dm-pill " + dmPillClass(d.StatusName);
        pillEl.style.display = "inline-flex";

        stepperEl.innerHTML = dmRenderStepper(cfg, d);

        bodyEl.innerHTML =
            dmRenderMeta(cfg, d) +
            dmRenderLines(cfg, lines) +
            dmRenderSummary(cfg, lines);

        updateEl.innerHTML = dmRenderUpdateBar(cfg, d, type, id);

    } catch (err) {
        console.error("Transaction details error:", err);
        bodyEl.innerHTML = `<div class="dm-empty" style="color:#B91C1C;">Failed to load details.</div>`;
    }
}

/* ============================================================
   DASHBOARD
============================================================ */

async function loadDashboard() {
    try {
        const res = await apiCall("getManagerDashboard");
        if (!res || !res.success) return;

        const d = res.data || {};

        const setText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setText("stat-products", d.totalProducts ?? 0);
        setText("stat-lowstock", d.lowStockCount ?? 0);
        setText("stat-adj",      d.pendingAdjustments ?? 0);
        setText("stat-ret",      d.pendingReturns ?? 0);
        setText("stat-po",       d.pendingPOs ?? 0);

        const adjBody = document.getElementById("dashboard-adjustments");
        if (adjBody) {
            if (!d.recentAdjustments || d.recentAdjustments.length === 0) {
                adjBody.innerHTML = `<tr><td colspan="4" class="empty-row">No recent adjustments.</td></tr>`;
            } else {
                adjBody.innerHTML = d.recentAdjustments.map(a => `
                    <tr>
                        <td>${fmtDate(a.Adjustment_Date)}</td>
                        <td>${escapeHtml(a.ProductNames || "—")}</td>
                        <td>${escapeHtml(a.Adjustment_Type || "—")}</td>
                        <td>${statusBadge(a.StatusName)}</td>
                    </tr>
                `).join("");
            }
        }

        const actBody = document.getElementById("dashboard-activity");
        if (actBody) {
            if (!d.recentActivity || d.recentActivity.length === 0) {
                actBody.innerHTML = `<tr><td colspan="4" class="empty-row">No recent activity.</td></tr>`;
            } else {
                actBody.innerHTML = d.recentActivity.map(a => `
                    <tr>
                        <td>${fmtDate(a.ActionTimestamp)}</td>
                        <td>${escapeHtml(a.UserName || "—")}</td>
                        <td>${escapeHtml(a.ActionType || "—")}</td>
                        <td>${escapeHtml(a.TableAffected || "—")}</td>
                    </tr>
                `).join("");
            }
        }
    } catch (err) {
        console.error("Dashboard error:", err);
    }

    try {
        await loadDashboardCharts();
    } catch (err) {
        console.error("Charts error:", err);
    }
}

/* ============================================================
   DASHBOARD CHARTS
============================================================ */

let chartProductsCategory = null;
let chartAdjStatus = null;

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

        ctx.fillStyle = pluginOptions.valueColor || "#052E16";
        ctx.font = pluginOptions.valueFont || "800 26px system-ui, -apple-system, sans-serif";
        ctx.fillText(String(pluginOptions.value ?? ""), centerX, centerY - 11);

        ctx.fillStyle = pluginOptions.labelColor || "#166534";
        ctx.font = pluginOptions.labelFont || "700 11px system-ui, -apple-system, sans-serif";
        ctx.fillText(pluginOptions.label || "", centerX, centerY + 13);

        ctx.restore();
    }
};

async function loadDashboardCharts() {
    if (typeof Chart === "undefined") return;

    const [productsRes, adjRes] = await Promise.all([
        apiCall("getProducts", { search: "" }),
        apiCall("getInventoryAdjustments", { search: "" })
    ]);

    /* ---------- CHART 1: Products by Category ---------- */
    const products = (productsRes && productsRes.data) || [];

    const categoryCounts = {};
    products.forEach(p => {
        const cat = p.CategoryName || "Uncategorized";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    const totalCategories = sortedCategories.length;
    const topCategories = sortedCategories.slice(0, 6);

    const subtitle = document.getElementById("chartCategorySubtitle");
    if (subtitle) subtitle.textContent = `Top ${topCategories.length} of ${totalCategories} categories`;

    const catLabels = topCategories.map(([name]) => name);
    const catCounts = topCategories.map(([, count]) => count);

    if (chartProductsCategory) { chartProductsCategory.destroy(); chartProductsCategory = null; }

    const ctx1 = document.getElementById("chart-products-category");
    if (ctx1) {
        chartProductsCategory = new Chart(ctx1, {
            type: "bar",
            data: {
                labels: catLabels,
                datasets: [{
                    label: "Products",
                    data: catCounts,
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
                        backgroundColor: "#12331F",
                        titleColor: "#FFFFFF",
                        bodyColor: "#FFFFFF",
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: (ctx) => `${ctx.parsed.y} product${ctx.parsed.y === 1 ? "" : "s"}`
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

    /* ---------- CHART 2: Adjustments by Status ---------- */
    const adjRows = (adjRes && adjRes.data) || [];
    const seenAdjIDs = new Set();
    const statusCounts = {};

    adjRows.forEach(a => {
        const id = a.Adjustment_ID;
        if (seenAdjIDs.has(id)) return;
        seenAdjIDs.add(id);

        const status = a.StatusName || "Unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const totalAdj = seenAdjIDs.size;

    const statusColorMap = {
        "Completed": "#0E9F6E", "Approved": "#0E9F6E",
        "Pending": "#D97706", "For Review": "#D97706", "Submitted": "#D97706",
        "Cancelled": "#DC2626", "Canceled": "#DC2626", "Rejected": "#DC2626",
        "Draft": "#9CA3AF"
    };

    const statusLabels = Object.keys(statusCounts);
    const statusValues = statusLabels.map(k => statusCounts[k]);
    const statusColors = statusLabels.map(s => statusColorMap[s] || "#9CA3AF");

    if (chartAdjStatus) { chartAdjStatus.destroy(); chartAdjStatus = null; }

    const ctx2 = document.getElementById("chart-adj-status");
    if (ctx2) {
        chartAdjStatus = new Chart(ctx2, {
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
                layout: { padding: 0 },
                plugins: {
                    legend: {
                        position: (ctxChart) => ctxChart.chart.width < 340 ? "bottom" : "right",
                        labels: {
                            boxWidth: 10, boxHeight: 10,
                            usePointStyle: true, pointStyle: "circle",
                            padding: 14, color: "#052E16",
                            font: { size: 12, weight: "600" },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => ({
                                        text: `${label}    ${data.datasets[0].data[i]}`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].backgroundColor[i],
                                        lineWidth: 0, hidden: false, index: i
                                    }));
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: "#12331F",
                        titleColor: "#FFFFFF", bodyColor: "#FFFFFF",
                        padding: 10, cornerRadius: 8, displayColors: false,
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                                return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
                            }
                        }
                    },
                    doughnutCenterText: { enabled: true, value: totalAdj, label: "TOTAL ADJ." }
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
    if (dashboardResizeObserver) { dashboardResizeObserver.disconnect(); dashboardResizeObserver = null; }

    const dashboardSection = document.getElementById("dashboard-section");
    if (!dashboardSection) return;

    dashboardResizeObserver = new ResizeObserver(() => handleDashboardResize());
    dashboardResizeObserver.observe(dashboardSection);
}

function handleDashboardResize() {
    if (dashboardResizeTimer) clearTimeout(dashboardResizeTimer);
    dashboardResizeTimer = setTimeout(() => {
        if (chartProductsCategory) chartProductsCategory.resize();
        if (chartAdjStatus) chartAdjStatus.resize();
    }, 150);
}

async function loadStatusesCache() {
    if (statusesCache.length > 0) return statusesCache;
    const res = await apiCall("getStatuses");
    if (res && res.success) statusesCache = res.data || [];
    return statusesCache;
}

/* ============================================================
   PRODUCTS / CATEGORIES / SUPPLIERS / LOCATIONS / STOCK
============================================================ */

async function loadProducts() {
    const tbody = document.getElementById("products-tbody");
    if (!tbody) return;

    const search = (document.getElementById("search-products") || {}).value || "";
    const categoryID = (document.getElementById("filter-products-category") || {}).value || "";

    await ensureCategoriesCache();
    populateCategorySelectOnce("filter-products-category");

    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Loading…</td></tr>`;

    try {
        const res = await apiCall("getProducts", { search: search.trim() });
        if (!res || !res.success) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-row">${escapeHtml((res && res.message) || "Failed.")}</td></tr>`;
            setCount("products-count", 0);
            return;
        }

        productsCache = res.data || [];
        let rows = productsCache;
        if (categoryID) rows = rows.filter(p => String(p.CategoryID) === String(categoryID));

        setCount("products-count", rows.length);

        tbody.innerHTML = rows.length
            ? rows.map(p => `
                <tr>
                    <td>${escapeHtml(p.Barcode)}</td>
                    <td>${escapeHtml(p.ProductName)}</td>
                    <td>${escapeHtml(p.CategoryName || "—")}</td>
                    <td>${escapeHtml(p.UnitName || "—")}</td>
                    <td>${escapeHtml(p.BinCode || "—")}</td>
                    <td>${escapeHtml(p.MinStockLevel)}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="6" class="empty-row">No products.</td></tr>`;
    } catch (err) { showScriptError(tbody, 6, "loadProducts", err); }
}

function clearProductFilters() {
    const s = document.getElementById("search-products"); if (s) s.value = "";
    const c = document.getElementById("filter-products-category"); if (c) c.value = "";
    loadProducts();
}

async function loadCategories() {
    const tbody = document.getElementById("categories-tbody");
    if (!tbody) return;
    const search = (document.getElementById("search-categories") || {}).value || "";
    tbody.innerHTML = `<tr><td class="empty-row">Loading…</td></tr>`;

    try {
        const res = await apiCall("getCategories", { search: search.trim() });
        const rows = rowsOrError(res, tbody, 1, "categories-count");
        if (rows === null) return;
        setCount("categories-count", rows.length);
        tbody.innerHTML = rows.length
            ? rows.map(c => `<tr><td>${escapeHtml(c.CategoryName)}</td></tr>`).join("")
            : `<tr><td class="empty-row">No categories.</td></tr>`;
    } catch (err) { showScriptError(tbody, 1, "loadCategories", err); }
}

function clearCategoryFilters() {
    const s = document.getElementById("search-categories"); if (s) s.value = "";
    loadCategories();
}
async function loadSuppliers() {
    const tbody = document.getElementById("suppliers-tbody");
    if (!tbody) return;

    const search = (document.getElementById("search-suppliers") || {}).value || "";
    const productID = (document.getElementById("filter-suppliers-product") || {}).value || "";

    await ensureProductsCache();
    populateProductSelectOnce("filter-suppliers-product");

    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Loading…</td></tr>`;

    try {
        const res = await apiCall("getSuppliers", {
            search: search.trim(),
            ProductID: productID
        });

        const rows = rowsOrError(res, tbody, 5, "suppliers-count");
        if (rows === null) return;

        setCount("suppliers-count", rows.length);

        tbody.innerHTML = rows.length
            ? rows.map(s => `
                <tr>
                    <td>${escapeHtml(s.SupplierName)}</td>
                    <td>${escapeHtml(s.ContactPerson || "—")}</td>
                    <td>${escapeHtml(s.Phone || "—")}</td>
                    <td>${escapeHtml(s.Email || "—")}</td>
                    <td>${escapeHtml(s.Address || "—")}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="5" class="empty-row">No suppliers.</td></tr>`;
    } catch (err) { showScriptError(tbody, 5, "loadSuppliers", err); }
}

async function filterSuppliersByProduct(suppliers, productID) {
    const checks = await Promise.all(suppliers.map(async (s) => {
        try {
            const res = await apiCall("getSupplierProducts", { SupplierID: s.SupplierID });
            const lines = (res && res.success && res.data) || [];
            const matches = lines.some(l =>
                String(l.ProductID ?? l.Product_ID) === String(productID)
            );
            return matches ? s : null;
        } catch (e) { return null; }
    }));
    return checks.filter(Boolean);
}

function clearSupplierFilters() {
    const s = document.getElementById("search-suppliers"); if (s) s.value = "";
    const p = document.getElementById("filter-suppliers-product"); if (p) p.value = "";
    loadSuppliers();
}

async function loadAisles() {
    const tbody = document.getElementById("aisles-tbody");
    if (!tbody) return;
    const search = (document.getElementById("search-aisles") || {}).value || "";
    tbody.innerHTML = `<tr><td class="empty-row">Loading…</td></tr>`;

    const res = await apiCall("getAisles", { search: search.trim() });
    const rows = rowsOrError(res, tbody, 1, "aisles-count");
    if (rows === null) return;

    setCount("aisles-count", rows.length);
    tbody.innerHTML = rows.length
        ? rows.map(a => `<tr><td>${escapeHtml(a.AisleCode)}</td></tr>`).join("")
        : `<tr><td class="empty-row">No aisles.</td></tr>`;
}

function clearAisleFilters() {
    const s = document.getElementById("search-aisles"); if (s) s.value = "";
    loadAisles();
}

async function loadShelves() {
    const tbody = document.getElementById("shelves-tbody");
    if (!tbody) return;

    const search  = (document.getElementById("search-shelves") || {}).value || "";
    const aisleID = (document.getElementById("filter-shelves-aisle") || {}).value || "";

    await ensureAislesCache();
    fillSelect("filter-shelves-aisle", aislesCache, "AisleID", "AisleCode", "All aisles");
    const aisleSel = document.getElementById("filter-shelves-aisle");
    if (aisleSel) aisleSel.value = aisleID;

    tbody.innerHTML = `<tr><td colspan="2" class="empty-row">Loading…</td></tr>`;

    const res = await apiCall("getShelves", { search: search.trim() });
    let rows = rowsOrError(res, tbody, 2, "shelves-count");
    if (rows === null) return;

    if (aisleID) rows = rows.filter(s => String(s.AisleID) === String(aisleID));

    setCount("shelves-count", rows.length);

    tbody.innerHTML = rows.length
        ? rows.map(s => `
            <tr>
                <td>${escapeHtml(s.AisleCode || "—")}</td>
                <td>${escapeHtml(s.ShelfCode)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="2" class="empty-row">No shelves.</td></tr>`;
}

function clearShelfFilters() {
    const s = document.getElementById("search-shelves"); if (s) s.value = "";
    const a = document.getElementById("filter-shelves-aisle"); if (a) a.value = "";
    loadShelves();
}

async function loadBins() {
    const tbody = document.getElementById("bins-tbody");
    if (!tbody) return;

    const search  = (document.getElementById("search-bins") || {}).value || "";
    const aisleID = (document.getElementById("filter-bins-aisle") || {}).value || "";
    const shelfID = (document.getElementById("filter-bins-shelf") || {}).value || "";

    await ensureAislesCache();
    await ensureShelvesCache();

    fillSelect("filter-bins-aisle", aislesCache, "AisleID", "AisleCode", "All aisles");
    const aisleSel = document.getElementById("filter-bins-aisle");
    if (aisleSel) aisleSel.value = aisleID;

    const shelfSel = document.getElementById("filter-bins-shelf");
    if (shelfSel) {
        const shelfOptions = aisleID
            ? shelvesCache.filter(s => String(s.AisleID) === String(aisleID))
            : shelvesCache;

        shelfSel.innerHTML = `<option value="">All shelves</option>` +
            shelfOptions.map(s => `<option value="${s.ShelfID}">${escapeHtml((s.AisleCode || "") + " / " + (s.ShelfCode || ""))}</option>`).join("");
        shelfSel.value = shelfOptions.some(s => String(s.ShelfID) === String(shelfID)) ? shelfID : "";
    }

    tbody.innerHTML = `<tr><td colspan="3" class="empty-row">Loading…</td></tr>`;

    const res = await apiCall("getBins", { search: search.trim() });
    let rows = rowsOrError(res, tbody, 3, "bins-count");
    if (rows === null) return;

    if (aisleID) rows = rows.filter(b => String(b.AisleID) === String(aisleID));
    if (shelfSel && shelfSel.value) rows = rows.filter(b => String(b.ShelfID) === String(shelfSel.value));

    setCount("bins-count", rows.length);

    tbody.innerHTML = rows.length
        ? rows.map(b => `
            <tr>
                <td>${escapeHtml(b.AisleCode || "—")}</td>
                <td>${escapeHtml(b.ShelfCode || "—")}</td>
                <td>${escapeHtml(b.BinCode)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="3" class="empty-row">No bins.</td></tr>`;
}

function clearBinFilters() {
    const s = document.getElementById("search-bins"); if (s) s.value = "";
    const a = document.getElementById("filter-bins-aisle"); if (a) a.value = "";
    const sh = document.getElementById("filter-bins-shelf"); if (sh) sh.value = "";
    loadBins();
}

async function loadStock() {
    const tbody = document.getElementById("stock-tbody");
    if (!tbody) return;

    const search = (document.getElementById("search-stock") || {}).value || "";
    const categoryID = (document.getElementById("filter-stock-category") || {}).value || "";

    await ensureCategoriesCache();
    populateCategorySelectOnce("filter-stock-category");

    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Loading…</td></tr>`;

    try {
        const res = await apiCall("getInventoryQuantities", { search: search.trim() });
        let rows = rowsOrError(res, tbody, 6, "stock-count");
        if (rows === null) return;

        if (categoryID) {
            const catName = categoryNameFromID(categoryID);
            if (catName) rows = rows.filter(r => String(r.CategoryName) === String(catName));
        }

        setCount("stock-count", rows.length);

        tbody.innerHTML = rows.length
            ? rows.map(r => `
                <tr>
                    <td>${escapeHtml(r.ProductName)}</td>
                    <td>${escapeHtml(r.CategoryName || "—")}</td>
                    <td>${escapeHtml(r.BinCode || "—")}</td>
                    <td>${escapeHtml(r.UnitName || "—")}</td>
                    <td>${escapeHtml(r.OnHandQuantity)}</td>
                    <td>${escapeHtml(r.MinStockLevel)}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="6" class="empty-row">No stock data.</td></tr>`;
    } catch (err) { showScriptError(tbody, 6, "loadStock", err); }
}

function clearStockFilters() {
    const s = document.getElementById("search-stock"); if (s) s.value = "";
    const c = document.getElementById("filter-stock-category"); if (c) c.value = "";
    loadStock();
}

async function loadLowStock() {
    const tbody = document.getElementById("lowstock-tbody");
    if (!tbody) return;

    const search = (document.getElementById("search-lowstock") || {}).value || "";
    const categoryID = (document.getElementById("filter-lowstock-category") || {}).value || "";

    await ensureCategoriesCache();
    populateCategorySelectOnce("filter-lowstock-category");

    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Loading…</td></tr>`;

    try {
        const res = await apiCall("getLowStock");
        let rows = rowsOrError(res, tbody, 6, "lowstock-count");
        if (rows === null) return;

        if (search.trim() !== "") {
            const s = search.toLowerCase();
            rows = rows.filter(r =>
                String(r.ProductName || "").toLowerCase().includes(s) ||
                String(r.Barcode || "").toLowerCase().includes(s)
            );
        }

        if (categoryID) {
            const catName = categoryNameFromID(categoryID);
            if (catName) rows = rows.filter(r => String(r.CategoryName) === String(catName));
        }

        setCount("lowstock-count", rows.length);

        tbody.innerHTML = rows.length
            ? rows.map(r => {
                const onHand   = Number(r.OnHandQuantity ?? 0);
                const minStock = Number(r.MinStockLevel ?? 0);
                const shortage = minStock - onHand;

                return `
                    <tr>
                        <td>${escapeHtml(r.ProductName)}</td>
                        <td>${escapeHtml(r.CategoryName || "—")}</td>
                        <td>${escapeHtml(r.BinCode || "—")}</td>
                        <td><strong>${escapeHtml(onHand)}</strong></td>
                        <td>${escapeHtml(minStock)}</td>
                        <td><span class="badge badge-red">${escapeHtml(shortage)}</span></td>
                    </tr>
                `;
            }).join("")
            : `<tr><td colspan="6" class="empty-row">No low stock.</td></tr>`;
    } catch (err) { showScriptError(tbody, 6, "loadLowStock", err); }
}

function clearLowStockFilters() {
    const s = document.getElementById("search-lowstock"); if (s) s.value = "";
    const c = document.getElementById("filter-lowstock-category"); if (c) c.value = "";
    loadLowStock();
}

async function loadMovements() {
    const tbody = document.getElementById("movements-tbody");
    if (!tbody) return;

    const productID = (document.getElementById("filter-movements-product") || {}).value || "";
    const type      = (document.getElementById("filter-movements-type") || {}).value || "";
    const dateFrom  = (document.getElementById("filter-movements-from") || {}).value || "";
    const dateTo    = (document.getElementById("filter-movements-to") || {}).value || "";

    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Loading…</td></tr>`;

    try {
        const res = await apiCall("getInventoryMovements", {
            Product_ID: productID,
            MovementType: type,
            dateFrom, dateTo
        });

        const rows = rowsOrError(res, tbody, 6, "movements-count");
        if (rows === null) return;

        setCount("movements-count", rows.length);

        tbody.innerHTML = rows.length
            ? rows.map(m => `
                <tr>
                    <td>${fmtDate(m.MovementDate)}</td>
                    <td>${escapeHtml(m.MovementType)}</td>
                    <td>${escapeHtml(m.ProductName)}</td>
                    <td>${escapeHtml(m.Quantity)}</td>
                    <td>${escapeHtml(m.Reference || "—")}</td>
                    <td>${escapeHtml(m.UserName || "—")}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="6" class="empty-row">No movements.</td></tr>`;
    } catch (err) { showScriptError(tbody, 6, "loadMovements", err); }
}

function clearMovementFilters() {
    ["filter-movements-product","filter-movements-type","filter-movements-from","filter-movements-to"]
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    loadMovements();
}

async function populateMovementProductFilter() {
    await ensureProductsCache();
    const sel = document.getElementById("filter-movements-product");
    if (sel) {
        const current = sel.value;
        sel.innerHTML = `<option value="">All products</option>` +
            productsCache.map(p => `<option value="${p.ProductID}">${escapeHtml(p.ProductName)}</option>`).join("");
        sel.value = current;
    }
}

/* ============================================================
   DISCREPANCIES
============================================================ */

async function loadDiscrepancies() {
    const search = (document.getElementById("search-discrepancies") || {}).value || "";
    const categoryID = (document.getElementById("filter-discrepancies-category") || {}).value || "";

    await ensureCategoriesCache();
    populateCategorySelectOnce("filter-discrepancies-category");
    await ensureProductsCache();

    const catName = categoryID ? categoryNameFromID(categoryID) : "";
    const lookup = catName ? buildProductCategoryLookup() : null;

    const matchesCategory = (productName) => {
        if (!lookup) return true;
        const cat = lookup[String(productName || "").toLowerCase().trim()];
        return cat === catName;
    };

    const recvBody = document.getElementById("discrepancies-recv-tbody");
    if (recvBody) {
        recvBody.innerHTML = `<tr><td colspan="5" class="empty-row">Loading…</td></tr>`;
        try {
            const res = await apiCall("getReceivingDiscrepancies", { search: search.trim() });
            let rows = rowsOrError(res, recvBody, 5, "");
            if (rows !== null) {
                rows = rows.filter(r => matchesCategory(r.ProductName));

                recvBody.innerHTML = rows.length
                    ? rows.map(r => {
                        const v = Number(r.Variance ?? 0);
                        let cls = "badge-green";
                        let label = "Match";
                        if (v > 0) { cls = "badge-amber"; label = `+${v} Excess`; }
                        else if (v < 0) { cls = "badge-red"; label = `${v} Short`; }

                        return `
                            <tr>
                                <td>#${escapeHtml(r.ReceivingID)}</td>
                                <td>${escapeHtml(r.ProductName)}</td>
                                <td>${escapeHtml(r.OrderedQty)}</td>
                                <td>${escapeHtml(r.ReceivedQty)}</td>
                                <td><span class="badge ${cls}">${label}</span></td>
                            </tr>
                        `;
                    }).join("")
                    : `<tr><td colspan="5" class="empty-row">No discrepancies.</td></tr>`;
            }
        } catch (err) { showScriptError(recvBody, 5, "loadDiscrepancies(recv)", err); }
    }

    const adjBody = document.getElementById("discrepancies-adj-tbody");
    if (adjBody) {
        adjBody.innerHTML = `<tr><td colspan="6" class="empty-row">Loading…</td></tr>`;
        try {
            const res = await apiCall("getAdjustmentDiscrepancies", { search: search.trim() });
            let rows = rowsOrError(res, adjBody, 6, "");
            if (rows !== null) {
                rows = rows.filter(a => matchesCategory(a.ProductName));

                adjBody.innerHTML = rows.length
                    ? rows.map(a => `
                        <tr>
                            <td>${fmtDate(a.Adjustment_Date)}</td>
                            <td>${escapeHtml(a.ProductName || "—")}</td>
                            <td>${escapeHtml(a.System_Quantity)}</td>
                            <td>${escapeHtml(a.Actual_Quantity)}</td>
                            <td><span class="badge badge-amber">${escapeHtml(a.Adjustment_Quantity)}</span></td>
                            <td>${escapeHtml(a.Adjustment_Type)}</td>
                        </tr>
                    `).join("")
                    : `<tr><td colspan="6" class="empty-row">No discrepancies.</td></tr>`;
            }
        } catch (err) { showScriptError(adjBody, 6, "loadDiscrepancies(adj)", err); }
    }
}

function clearDiscrepancyFilters() {
    const s = document.getElementById("search-discrepancies"); if (s) s.value = "";
    const c = document.getElementById("filter-discrepancies-category"); if (c) c.value = "";
    loadDiscrepancies();
}

/* ============================================================
   TRANSACTION LOADERS — Search + Status filter (client-side)
============================================================ */

function poRefLabel(value) {
    if (value === null || value === undefined || value === "") return "—";
    const text = String(value);
    return /^\d+$/.test(text) ? "PO-" + text : text;
}

const TX_TABS = {

    po: {
        op: "getPurchaseOrders", tbody: "po-tbody", search: "search-po",
        status: "filter-po-status", count: "po-count",
        cols: 6, empty: "No purchase orders.",
        text: (r) => [r.PO_ID, r.SupplierName, r.UserName, r.StatusName],
        row: (r) => `
            <td>${fmtDate(r.PO_Date)}</td>
            <td>${fmtDate(r.Expected_Date)}</td>
            <td>${escapeHtml(r.SupplierName || "—")}</td>
            <td>${escapeHtml(r.UserName || "—")}</td>
            <td>${statusBadge(r.StatusName)}</td>
            <td>${viewBtn(`openTransactionDetails('purchase_order', ${r.PO_ID})`)}</td>`
    },

    pret: {
        op: "getPurchaseReturns", tbody: "prets-tbody", search: "search-prets",
        status: "filter-prets-status", count: "prets-count",
        cols: 7, empty: "No purchase returns.",
        text: (r) => [r.SupplierName, r.ProductName, r.Reason, r.StatusName],
        row: (r) => `
            <td>${fmtDate(r.Return_Date)}</td>
            <td>${escapeHtml(r.SupplierName || "—")}</td>
            <td>${escapeHtml(r.ProductName || "—")}</td>
            <td>${escapeHtml(r.Quantity ?? "—")}</td>
            <td>${statusBadge(r.StatusName)}</td>
            <td>${escapeHtml(r.Reason || "—")}</td>
            <td>${viewBtn(`openTransactionDetails('purchase_return', ${r.Purchase_Return_ID})`)}</td>`
    },

    recv: {
        op: "getReceivings", tbody: "receivings-tbody", search: "search-receivings",
        status: "filter-receivings-status", count: "receivings-count",
        cols: 6, empty: "No receivings.",
        text: (r) => [r.ReceivingID, r.SupplierName, r.UserName, r.StatusName, poRefLabel(r.PO_Reference)],
        row: (r) => `
            <td>${fmtDate(r.ReceivingDate)}</td>
            <td>${escapeHtml(r.SupplierName || "—")}</td>
            <td>${escapeHtml(r.UserName || "—")}</td>
            <td>${escapeHtml(poRefLabel(r.PO_Reference))}</td>
            <td>${statusBadge(r.StatusName)}</td>
            <td>${viewBtn(`openTransactionDetails('receiving', ${r.ReceivingID})`)}</td>`
    },

    rel: {
        op: "getStockReleases", tbody: "releases-tbody", search: "search-releases",
        status: "filter-releases-status", count: "releases-count",
        cols: 5, empty: "No stock releases.",
        text: (r) => [r.ReleaseID, r.ReleasedBy, r.StatusName],
        row: (r) => `
            <td>${fmtDate(r.ReleaseDate)}</td>
            <td>${escapeHtml(r.ReleasedBy || "—")}</td>
            <td>${escapeHtml(r.ItemCount ?? "—")}</td>
            <td>${statusBadge(r.StatusName)}</td>
            <td>${viewBtn(`openTransactionDetails('stock_release', ${r.ReleaseID})`)}</td>`
    },

    sret: {
        op: "getStockReturns", tbody: "returns-tbody", search: "search-returns",
        status: "filter-returns-status", count: "returns-count",
        cols: 7, empty: "No stock returns.",
        text: (r) => [r.ProductName, r.Reason, r.StatusName, r.UserName],
        row: (r) => `
            <td>${fmtDate(r.Return_Date)}</td>
            <td>${escapeHtml(r.UserName || "—")}</td>
            <td>${escapeHtml(r.ProductName || "—")}</td>
            <td>${escapeHtml(r.Quantity ?? "—")}</td>
            <td>${statusBadge(r.StatusName)}</td>
            <td>${escapeHtml(r.Reason || "—")}</td>
            <td>${viewBtn(`openTransactionDetails('stock_return', ${r.Stock_Return_ID})`)}</td>`
    },

    adj: {
        op: "getInventoryAdjustments", tbody: "adjustments-tbody", search: "search-adjustments",
        status: "filter-adjustments-status", count: "adjustments-count",
        cols: 9, empty: "No adjustments.",
        text: (r) => [r.ProductName, r.Reason, r.StatusName, r.UserName],
        row: (a) => {
            const q = Number(a.Adjustment_Quantity ?? 0);
            const cell = q === 0
                ? `<span class="badge badge-green">0 (match)</span>`
                : escapeHtml(q);
            return `
                <td>${fmtDate(a.Adjustment_Date)}</td>
                <td>${escapeHtml(a.ProductName || "—")}</td>
                <td>${escapeHtml(a.System_Quantity ?? "—")}</td>
                <td>${escapeHtml(a.Actual_Quantity ?? "—")}</td>
                <td>${cell}</td>
                <td>${escapeHtml(a.Adjustment_Type || "—")}</td>
                <td>${statusBadge(a.StatusName)}</td>
                <td>${escapeHtml(a.Reason || "—")}</td>
                <td>${viewBtn(`openTransactionDetails('inventory_adjustment', ${a.Adjustment_ID})`)}</td>`;
        }
    }
};

const txRows = {};

function fillTxStatusSelect(cfg, rows) {
    const sel = document.getElementById(cfg.status);
    if (!sel) return;

    const current = sel.value;
    const names = [...new Set(rows.map(r => r.StatusName).filter(Boolean))].sort();

    sel.innerHTML = `<option value="">All statuses</option>` +
        names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");

    sel.value = names.includes(current) ? current : "";
}

function renderTxTab(key) {
    const cfg = TX_TABS[key];
    const tbody = document.getElementById(cfg.tbody);
    if (!tbody) return;

    let rows = txRows[key] || [];

    const q = ((document.getElementById(cfg.search) || {}).value || "").trim().toLowerCase();
    const status = (document.getElementById(cfg.status) || {}).value || "";

    if (status) rows = rows.filter(r => r.StatusName === status);

    if (q) {
        rows = rows.filter(r =>
            cfg.text(r).some(v => String(v ?? "").toLowerCase().includes(q))
        );
    }

    setCount(cfg.count, rows.length);

    tbody.innerHTML = rows.length
        ? rows.map(r => `<tr>${cfg.row(r)}</tr>`).join("")
        : `<tr><td colspan="${cfg.cols}" class="empty-row">${escapeHtml(cfg.empty)}</td></tr>`;
}

async function loadTxTab(key) {
    const cfg = TX_TABS[key];
    const tbody = document.getElementById(cfg.tbody);
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="${cfg.cols}" class="empty-row">Loading…</td></tr>`;

    try {
        const res = await apiCall(cfg.op, { search: "" });
        const rows = rowsOrError(res, tbody, cfg.cols, cfg.count);
        if (rows === null) { txRows[key] = []; return; }

        txRows[key] = rows;
        fillTxStatusSelect(cfg, rows);
        renderTxTab(key);
    } catch (err) {
        showScriptError(tbody, cfg.cols, "loadTxTab(" + key + ")", err);
    }
}

function clearTxFilters(key) {
    const cfg = TX_TABS[key];
    const s  = document.getElementById(cfg.search);
    const st = document.getElementById(cfg.status);
    if (s) s.value = "";
    if (st) st.value = "";
    renderTxTab(key);
}

/* gi-keep ang daan nga mga ngalan para dili masira ang tabLoaders / dashboard */
const loadPurchaseOrders  = () => loadTxTab("po");
const loadPurchaseReturns = () => loadTxTab("pret");
const loadReceivings      = () => loadTxTab("recv");
const loadReleases        = () => loadTxTab("rel");
const loadReturns         = () => loadTxTab("sret");
const loadAdjustments     = () => loadTxTab("adj");

function wireTxFilters() {
    Object.keys(TX_TABS).forEach(key => {
        const cfg = TX_TABS[key];
        const s  = document.getElementById(cfg.search);
        const st = document.getElementById(cfg.status);
        if (s)  s.addEventListener("input",  () => renderTxTab(key));
        if (st) st.addEventListener("change", () => renderTxTab(key));
    });
}

/* ============================================================
   REPORTS / AUDIT / STAFF
============================================================ */

async function loadReports() {
    const stockBody = document.getElementById("reports-stock-tbody");
    if (stockBody) {
        stockBody.innerHTML = `<tr><td colspan="5" class="empty-row">Loading…</td></tr>`;
        try {
            const res = await apiCall("getInventoryQuantities");
            const rows = rowsOrError(res, stockBody, 5, "");

            if (rows !== null) {
                stockBody.innerHTML = rows.length
                    ? rows.map(r => {
                        const onHand = Number(r.OnHandQuantity ?? 0);
                        const min    = Number(r.MinStockLevel ?? 0);
                        const status = onHand < min
                            ? `<span class="badge badge-red">Low</span>`
                            : `<span class="badge badge-green">OK</span>`;

                        return `
                            <tr>
                                <td>${escapeHtml(r.ProductName)}</td>
                                <td>${escapeHtml(r.CategoryName || "—")}</td>
                                <td>${escapeHtml(onHand)}</td>
                                <td>${escapeHtml(min)}</td>
                                <td>${status}</td>
                            </tr>
                        `;
                    }).join("")
                    : `<tr><td colspan="5" class="empty-row">No data.</td></tr>`;
            }
        } catch (err) { showScriptError(stockBody, 5, "loadReports(stock)", err); }
    }

    const txnBody = document.getElementById("reports-txn-tbody");
    if (txnBody) {
        txnBody.innerHTML = `<tr><td colspan="3" class="empty-row">Loading…</td></tr>`;
        try {
            const res = await apiCall("getTransactionSummary");
            const rows = rowsOrError(res, txnBody, 3, "");

            if (rows !== null) {
                txnBody.innerHTML = rows.length
                    ? rows.map(t => `
                        <tr>
                            <td>${escapeHtml(t.Type)}</td>
                            <td>${escapeHtml(t.Count)}</td>
                            <td>${escapeHtml(t.TotalQty)}</td>
                        </tr>
                    `).join("")
                    : `<tr><td colspan="3" class="empty-row">No data.</td></tr>`;
            }
        } catch (err) { showScriptError(txnBody, 3, "loadReports(txn)", err); }
    }
}

/* ============================================================
   AUDIT LOG  (redesigned: table + paging + print)
============================================================ */

const AL_ACTIONS = {
    LOGIN:     { label: "Login",     cls: "al-gray",  group: "login" },
    LOGOUT:    { label: "Logout",    cls: "al-gray",  group: "login" },
    INSERT:    { label: "Created",   cls: "al-blue",  group: "created" },
    UPDATE:    { label: "Updated",   cls: "al-amber", group: "updated" },
    APPROVED:  { label: "Approved",  cls: "al-green", group: "approved" },
    REJECTED:  { label: "Rejected",  cls: "al-red",   group: "rejected" },
    CANCELLED: { label: "Cancelled", cls: "al-slate", group: "cancelled" },
    CANCELED:  { label: "Cancelled", cls: "al-slate", group: "cancelled" },
    ARCHIVE:   { label: "Archived",  cls: "al-slate", group: "archived" },
    UNARCHIVE: { label: "Restored",  cls: "al-teal",  group: "archived" }
};

const AL_AVATAR_COLORS = ["#2F7A52", "#3B6EA5", "#8A5A9E", "#B0663A", "#4A8A8A", "#7A7A2F"];

let alRows = [];
let alFilter = "all";
let alPage = 1;
let alSize = 10;
let alBound = false;

const alInfo = (type) =>
    AL_ACTIONS[String(type || "").toUpperCase()] ||
    { label: String(type || "—"), cls: "al-gray", group: "other" };

const alNiceTable = (t) =>
    String(t || "—").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const alDate = (ts) => {
    const d = new Date(String(ts || "").replace(" ", "T"));
    return isNaN(d) ? null : d;
};

const alDayLabel = (ts) => {
    const d = alDate(ts);
    return d
        ? d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
        : String(ts || "");
};

const alTimeLabel = (ts) => {
    const d = alDate(ts);
    return d ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
};

function alDetails(text) {
    return escapeHtml(text || "—")
        .replace(/(?<![&\w])(#\d+)/g, "<b>$1</b>")
        .replace(/\((Pending[^)]*)\)/, "<em>($1)</em>");
}

function alAvatar(name) {
    const n = String(name || "?");
    const sum = [...n].reduce((a, c) => a + c.charCodeAt(0), 0);
    return `<i style="background:${AL_AVATAR_COLORS[sum % AL_AVATAR_COLORS.length]}">${escapeHtml(n.charAt(0).toUpperCase())}</i>`;
}

const alUser = (a) =>
    `<span class="al-user">${alAvatar(a.UserName)}<span>${escapeHtml(a.UserName || "—")}</span></span>`;

function alGroups(list) {
    const groups = [];
    list.forEach((a) => {
        const key = String(a.ActionTimestamp || "").slice(0, 10);
        const last = groups[groups.length - 1];
        if (!last || last.key !== key) {
            groups.push({ key, ts: a.ActionTimestamp, items: [a] });
        } else {
            last.items.push(a);
        }
    });
    return groups;
}

function alFiltered() {
    return alRows.filter(
        (a) => alFilter === "all" || alInfo(a.ActionType).group === alFilter
    );
}

function alTableHtml(groups) {

    let html = `
        <div class="al-card"><div class="al-scroll">
        <table class="al-table">
            <thead><tr>
                <th>User</th><th>Action</th><th>Table</th><th>When</th><th>Details</th>
            </tr></thead>
            <tbody>`;

    groups.forEach((g) => {
        html += `<tr class="al-day"><td colspan="5">${escapeHtml(alDayLabel(g.ts))}</td></tr>`;

        g.items.forEach((a) => {
            const info = alInfo(a.ActionType);
            html += `
                <tr>
                    <td>${alUser(a)}</td>
                    <td><span class="al-badge ${info.cls}">${escapeHtml(info.label)}</span></td>
                    <td class="al-meta">${escapeHtml(alNiceTable(a.TableAffected))}</td>
                    <td class="al-meta al-time">${escapeHtml(alTimeLabel(a.ActionTimestamp))}</td>
                    <td class="al-det">${alDetails(a.Details)}</td>
                </tr>`;
        });
    });

    return html + `</tbody></table></div></div>`;
}

function alRender() {

    const viewEl = document.getElementById("al-view");
    const countEl = document.getElementById("al-count");
    const pagerEl = document.getElementById("al-pager");
    if (!viewEl) return;

    const list = alFiltered();

    const totalPages = Math.max(1, Math.ceil(list.length / alSize));
    if (alPage > totalPages) alPage = totalPages;

    const start = (alPage - 1) * alSize;
    const pageItems = list.slice(start, start + alSize);

    if (!list.length) {
        viewEl.innerHTML = `
            <div class="al-card al-empty">
                No audit records found. Try a different word or clear the filter.
            </div>`;
        countEl.textContent = "No entries";
        pagerEl.innerHTML = "";
        return;
    }

    viewEl.innerHTML = alTableHtml(alGroups(pageItems));

    countEl.textContent =
        `Showing ${start + 1}–${Math.min(start + alSize, list.length)} of ${list.length} entries`;

    const nums = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - alPage) <= 1) {
            nums.push(i);
        } else if (nums[nums.length - 1] !== "…") {
            nums.push("…");
        }
    }

    pagerEl.innerHTML = totalPages > 1
        ? `<button type="button" class="al-pg" data-p="${alPage - 1}"
                ${alPage === 1 ? "disabled" : ""} aria-label="Previous page">‹ Prev</button>` +
          nums.map((n) => n === "…"
              ? `<span class="al-dots">…</span>`
              : `<button type="button" class="al-pg" data-p="${n}"
                    aria-current="${n === alPage}" aria-label="Page ${n}">${n}</button>`
          ).join("") +
          `<button type="button" class="al-pg" data-p="${alPage + 1}"
                ${alPage === totalPages ? "disabled" : ""} aria-label="Next page">Next ›</button>`
        : "";
}

async function loadAudit(search = null) {

    const viewEl = document.getElementById("al-view");
    if (!viewEl) return;

    if (search === null) {
        const input = document.getElementById("search-audit");
        search = input ? input.value : "";
    }

    viewEl.innerHTML = `<div class="al-card al-empty">Loading…</div>`;

    try {
        const res = await apiCall("getAuditLogs", { search: String(search).trim() });

        if (!res || !res.success) {
            alRows = [];
            viewEl.innerHTML = `<div class="al-card al-empty">${escapeHtml((res && res.message) || "Failed to load.")}</div>`;
            document.getElementById("al-count").textContent = "";
            document.getElementById("al-pager").innerHTML = "";
            return;
        }

        alRows = Array.isArray(res.data) ? res.data : [];
        alPage = 1;
        alRender();

    } catch (err) {
        console.error("loadAudit:", err);
        viewEl.innerHTML = `<div class="al-card al-empty">Script error: ${escapeHtml(err.message || err)}</div>`;
    }
}

function clearAuditFilters() {

    const s = document.getElementById("search-audit");
    if (s) s.value = "";

    alFilter = "all";
    alPage = 1;

    document.querySelectorAll("#al-chips .al-chip").forEach((c) =>
        c.setAttribute("aria-pressed", c.dataset.f === "all" ? "true" : "false"));

    loadAudit("");
}

/* ---------- PRINT: mo-print sa TANAN nga filtered rows (dili lang ang karon nga page) ---------- */

function printAuditLog() {

    const list = alFiltered();

    if (!list.length) {
        showAlert("There are no audit records to print.", "Nothing to Print");
        return;
    }

    let holder = document.getElementById("audit-print-holder");

    if (!holder) {
        holder = document.createElement("div");
        holder.id = "audit-print-holder";
        holder.style.display = "none";
        document.body.appendChild(holder);
    }

    holder.innerHTML = `
        <table id="audit-print-table">
            <thead>
                <tr>
                    <th>Date</th><th>User</th><th>Action</th><th>Table</th><th>Details</th>
                </tr>
            </thead>
            <tbody>
                ${list.map((a) => `
                    <tr>
                        <td>${escapeHtml(fmtDate(a.ActionTimestamp))}</td>
                        <td>${escapeHtml(a.UserName || "—")}</td>
                        <td>${escapeHtml(alInfo(a.ActionType).label)}</td>
                        <td>${escapeHtml(alNiceTable(a.TableAffected))}</td>
                        <td>${escapeHtml(a.Details || "—")}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    printReportTable("audit-print-table", "Audit Log Report");
}

/* ---------- events (gitawag sa DOMContentLoaded) ---------- */

function setupAuditLogUI() {

    if (alBound) return;
    alBound = true;

    const chips = document.getElementById("al-chips");
    const size = document.getElementById("al-size");
    const pager = document.getElementById("al-pager");

    if (chips) {
        chips.addEventListener("click", (e) => {
            const btn = e.target.closest(".al-chip");
            if (!btn) return;
            alFilter = btn.dataset.f;
            alPage = 1;
            chips.querySelectorAll(".al-chip").forEach((c) =>
                c.setAttribute("aria-pressed", c === btn ? "true" : "false"));
            alRender();
        });
    }

    if (size) {
        alSize = Number(size.value) || 10;
        size.addEventListener("change", () => {
            alSize = Number(size.value) || 10;
            alPage = 1;
            alRender();
        });
    }

    if (pager) {
        pager.addEventListener("click", (e) => {
            const btn = e.target.closest(".al-pg");
            if (!btn || btn.disabled) return;
            alPage = Number(btn.dataset.p);
            alRender();

            const content = document.querySelector(".content");
            if (content) content.scrollTo({ top: 0 });
        });
    }
}

async function loadStaffActivity() {
    const tbody = document.getElementById("staff-tbody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="4" class="empty-row">Loading…</td></tr>`;

    try {
        const res = await apiCall("getStaffActivity");
        const rows = rowsOrError(res, tbody, 4, "");
        if (rows === null) return;

        tbody.innerHTML = rows.length
            ? rows.map(s => `
                <tr>
                    <td>${escapeHtml(s.UserName || "—")}</td>
                    <td>${escapeHtml(s.RoleName || "—")}</td>
                    <td>${escapeHtml(s.TotalActions)}</td>
                    <td>${fmtDate(s.LastActivity)}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="4" class="empty-row">No staff activity.</td></tr>`;
    } catch (err) { showScriptError(tbody, 4, "loadStaffActivity", err); }
}

/* ============================================================
   LOGOUT
============================================================ */

async function logout() {
    try { await apiCall("logout"); } catch (err) { console.error("Logout error:", err); }
    sessionStorage.removeItem("user");
    window.location.replace("login.html");
}

/* ============================================================
   WIRING
============================================================ */

function wireNavigation() {
    document.querySelectorAll(".nav-link").forEach(btn => {
        btn.addEventListener("click", () => {
            const sectionId = btn.getAttribute("data-section");
            const title     = (btn.querySelector(".nav-text") || btn).textContent.trim();
            setActiveSection(sectionId, title);

            if (sectionId === "dashboard-section")     loadDashboard();
            if (sectionId === "products-section")      loadProducts();
            if (sectionId === "categories-section")    loadCategories();
            if (sectionId === "suppliers-section")     loadSuppliers();
            if (sectionId === "locations-section")     { loadAisles(); loadShelves(); loadBins(); }
            if (sectionId === "stock-section")         loadStock();
            if (sectionId === "lowstock-section")      loadLowStock();
            if (sectionId === "movements-section")     { populateMovementProductFilter(); loadMovements(); }
            if (sectionId === "discrepancies-section") loadDiscrepancies();
            if (sectionId === "reports-section")       loadReports();
            if (sectionId === "audit-section")         loadAudit();
            if (sectionId === "staff-section")         loadStaffActivity();

            if (sectionId === "transactions-section") {
                const section   = document.getElementById("transactions-section");
                const activeTab = section ? section.querySelector(".tab-btn.active") : null;
                const tabId     = activeTab ? activeTab.getAttribute("data-tab") : "tab-tx-po";
                const loader    = tabLoaders[tabId] || tabLoaders["tab-tx-po"];
                loader();
            }
        });
    });
}

function wireTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.getAttribute("data-tab");
            const group = btn.closest(".page-section") || document;

            group.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            group.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active-tab"));

            btn.classList.add("active");
            const panel = document.getElementById(tabId);
            if (panel) panel.classList.add("active-tab");

            if (tabLoaders[tabId]) tabLoaders[tabId]();
        });
    });
}

function wireModals() {
    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.getAttribute("data-close")));
    });

    const confirmYes = document.getElementById("btn-confirm-yes");
    if (confirmYes) {
        confirmYes.addEventListener("click", () => {
            closeModal("confirm-modal-overlay");
            if (typeof confirmCallback === "function") {
                const cb = confirmCallback;
                confirmCallback = null;
                cb();
            }
        });
    }

    [
        "details-modal-overlay",
        "confirm-modal-overlay",
        "alert-modal-overlay"
    ].forEach(id => {
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.addEventListener("click", e => {
                if (e.target.id === id) closeModal(id);
            });
        }
    });
}

function wireSearchInputs() {
    /* Ang transactions (po, prets, receivings, releases, returns, adjustments)
       gi-handle na sa wireTxFilters() */
    const map = {
        "search-products":      loadProducts,
        "search-categories":    loadCategories,
        "search-suppliers":     loadSuppliers,
        "search-aisles":        loadAisles,
        "search-shelves":       loadShelves,
        "search-bins":          loadBins,
        "search-stock":         loadStock,
        "search-lowstock":      loadLowStock,
        "search-discrepancies": loadDiscrepancies,
        "search-audit":         loadAudit
    };

    Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        let timer = null;
        el.addEventListener("input", () => {
            clearTimeout(timer);
            timer = setTimeout(() => map[id](), 300);
        });
    });
}

function wireFilters() {
    /* Ang status filters sa transactions gi-handle na sa wireTxFilters() */
    const map = {
        "filter-products-category":      loadProducts,
        "filter-suppliers-product":      loadSuppliers,
        "filter-shelves-aisle":          loadShelves,
        "filter-bins-aisle":             loadBins,
        "filter-bins-shelf":             loadBins,
        "filter-stock-category":         loadStock,
        "filter-lowstock-category":      loadLowStock,
        "filter-discrepancies-category": loadDiscrepancies,
        "filter-movements-product":      loadMovements,
        "filter-movements-type":         loadMovements,
        "filter-movements-from":         loadMovements,
        "filter-movements-to":           loadMovements
    };

    Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("change", map[id]);
    });
}

/* ============================================================
   SIDEBAR
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

function wireSidebarToggle() {
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
        const savedState = localStorage.getItem("managerSidebarCollapsed");
        if (savedState === "true") {
            sidebarEl.classList.add("collapsed");
            sidebarToggle.setAttribute("title", "Expand sidebar");
        }

        sidebarToggle.addEventListener("click", () => {
            sidebarEl.classList.toggle("collapsed");
            const isCollapsed = sidebarEl.classList.contains("collapsed");
            sidebarToggle.setAttribute("title", isCollapsed ? "Expand sidebar" : "Collapse sidebar");
            localStorage.setItem("managerSidebarCollapsed", isCollapsed ? "true" : "false");
            closeProfileMenu();

            handleDashboardResize();
            setTimeout(() => {
                if (chartProductsCategory) chartProductsCategory.resize();
                if (chartAdjStatus) chartAdjStatus.resize();
            }, 300);
        });
    }
}

/* ============================================================
   PROFILE MENU
============================================================ */

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
    askConfirm(
        "Are you sure you want to log out?",
        () => logout(),
        {
            confirmColor: "primary",
            confirmLabel: "Log Out"
        }
    );
}

function wireProfileMenu() {
    const profileTrigger = document.getElementById("sidebar-profile-trigger");
    const profileEl = document.getElementById("sidebar-profile");
    const logoutBtn = document.getElementById("btn-logout");

    if (profileTrigger) {
        profileTrigger.addEventListener("click", (e) => {
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
   INIT
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    if (!loadSession()) return;

    wireNavigation();
    wireTabs();
    wireModals();
    wireSearchInputs();
    wireFilters();
    wireTxFilters();
    wireSidebarToggle();
    wireProfileMenu();
    wrapTables();

    /* ---------- Audit Log ---------- */
    setupAuditLogUI();

    loadDashboard();
    loadStatusesCache().catch(err => console.error(err));
});