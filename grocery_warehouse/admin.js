const baseApiUrl =
    "http://localhost/grocery_warehouse/api.php";

const getStoredUser = () => {

    const raw = sessionStorage.getItem("user");

    try {
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
};

const currentUser = getStoredUser();

const isAdminUser = (u) => {
    if (!u) return false;
    const role = String(u.RoleName || "").toLowerCase().replace(/[^a-z]/g, "");
    return Number(u.RoleID) === 1 || role === "admin" || role === "administrator";
};

if (!isAdminUser(currentUser)) {
    sessionStorage.removeItem("user");
    window.location.replace("login.html");
}

/* ============================================================
   GLOBAL MESSAGE MODAL
============================================================ */

let messageModalTimer = null;

function showMessageModal(message, type = "info") {

    const overlay = document.getElementById("message-modal-overlay");
    const titleEl = document.getElementById("message-modal-title");
    const bodyEl  = document.getElementById("message-modal-message");
    const confirmBtn = document.getElementById("btn-message-confirm");
    const iconEl  = document.getElementById("message-modal-icon");

    if (!overlay || !titleEl || !bodyEl) {
        console.warn("Message modal not found:", message);
        return;
    }

    let title = "Message";
    let icon = "ℹ";
    let iconClass = "info";

    if (type === "success") {
        title = "Success";
        icon = "✔";
        iconClass = "success";
    } else if (type === "error") {
        title = "Error";
        icon = "✖";
        iconClass = "error";
    } else if (type === "warning") {
        title = "Warning";
        icon = "⚠";
        iconClass = "warning";
    }

    titleEl.textContent = title;
    bodyEl.textContent = message;

    if (iconEl) {
        iconEl.textContent = icon;
        iconEl.className = "message-modal-icon " + iconClass;
    }

    overlay.classList.add("open");

    if (confirmBtn) {
        confirmBtn.onclick = () => hideMessageModal();
    }
}

function hideMessageModal() {
    const overlay = document.getElementById("message-modal-overlay");
    if (overlay) overlay.classList.remove("open");
    if (messageModalTimer) {
        clearTimeout(messageModalTimer);
        messageModalTimer = null;
    }
}

function showErrorModal(message) { showMessageModal(message, "error"); }
function showSuccessModal(message) { showMessageModal(message, "success"); }
function showWarningModal(message) { showMessageModal(message, "warning"); }
function showInfoModal(message) { showMessageModal(message, "info"); }

/* ============================================================
   API
============================================================ */

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

/* ============================================================
   HELPERS
============================================================ */

const esc = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

const jsArg = (value) => esc(JSON.stringify(String(value ?? "")));

const statusBadge = (val) => {
    const map = {
        Active: "badge-green",
        Inactive: "badge-gray",
        Pending: "badge-amber",
        Approved: "badge-green",
        Completed: "badge-green",
        Cancelled: "badge-gray",
        Rejected: "badge-red"
    };
    return `
        <span class="badge ${map[val] || "badge-gray"}">
            ${esc(val ?? "-")}
        </span>
    `;
};

const logout = async () => {
    await callApi("logout");
    sessionStorage.removeItem("user");
    window.location.href = "login.html";
};

const sectionTitles = {
    "section-dashboard": "Dashboard",
    "section-role": "Roles",
    "section-category": "Categories",
    "section-supplier": "Suppliers",
    "section-storage-location": "Storage Location",
    "section-product": "Products",
    "section-uom": "Units of Measure",
    "section-user": "User Accounts",
    "section-transactions": "Inventory & Transactions",
    "section-audit": "Audit Log"
};

/* ============================================================
   ACTION BUTTONS
============================================================ */

function actionButtons(moduleKey, id) {
    return `
        <button class="btn-icon" title="Edit"
            onclick="openFormModal('${moduleKey}', ${Number(id)})">✎</button>
        <button class="btn-icon btn-icon-danger" title="Archive"
            onclick="deleteRecord('${moduleKey}', ${Number(id)})">🗑</button>
    `;
}

function restoreButton(moduleKey, id, displayName) {
    return `
        <button class="btn-icon" title="Restore this record"
            onclick="restoreRecord('${moduleKey}', ${Number(id)}, ${jsArg(displayName)})"
        >↺ Restore</button>
    `;
}

function renderActionsCell(moduleKey, id, mode, displayName) {
    return mode === "archived"
        ? restoreButton(moduleKey, id, displayName)
        : actionButtons(moduleKey, id);
}

/* ============================================================
   MODULES
============================================================ */

const MODULES = {

    role: {
        title: "Role",
        idField: "RoleID",
        ops: { list: "getRoles", get: "getRole", insert: "insertRole", update: "updateRole", delete: "deleteRole" },
        tableBody: "tbl-role",
        searchInput: "search-role",
        fields: [
            { name: "RoleName", label: "Role Name", type: "text", required: true }
        ],
        row: (r, mode = "list") => `
            <td>${esc(r.RoleName)}</td>
            <td>${renderActionsCell("role", r.RoleID, mode, r.RoleName)}</td>
        `
    },

    category: {
        title: "Category",
        idField: "CategoryID",
        ops: { list: "getCategories", get: "getCategory", insert: "insertCategory", update: "updateCategory", delete: "deleteCategory" },
        tableBody: "tbl-category",
        searchInput: "search-category",
        fields: [
            { name: "CategoryName", label: "Category Name", type: "text", required: true }
        ],
        row: (r, mode = "list") => `
            <td>${esc(r.CategoryName)}</td>
            <td>${renderActionsCell("category", r.CategoryID, mode, r.CategoryName)}</td>
        `
    },

    supplier: {
        title: "Supplier",
        idField: "SupplierID",
        ops: { list: "getSuppliers", get: "getSupplier", insert: "insertSupplier", update: "updateSupplier", delete: "deleteSupplier" },
        tableBody: "tbl-supplier",
        searchInput: "search-supplier",
        fields: [
            { name: "SupplierName", label: "Supplier Name", type: "text", required: true },
            { name: "ContactPerson", label: "Contact Person", type: "text" },
            { name: "Phone", label: "Phone", type: "text" },
            { name: "Email", label: "Email", type: "text" },
            { name: "Address", label: "Address", type: "textarea" }
        ],
        row: (r, mode = "list") => `
            <td>${esc(r.SupplierName)}</td>
            <td>${esc(r.ContactPerson)}</td>
            <td>${esc(r.Phone)}</td>
            <td>${esc(r.Email)}</td>
            <td>
                ${renderActionsCell("supplier", r.SupplierID, mode, r.SupplierName)}
                ${
                    mode !== "archived"
                        ? `<button class="btn-icon" title="Manage Products"
                              onclick="openSupplierProductsModal(${Number(r.SupplierID)}, ${jsArg(r.SupplierName)})"
                           >📦 Products</button>`
                        : ""
                }
            </td>
        `
    },

    aisle: {
        title: "Aisle",
        idField: "AisleID",
        ops: { list: "getAisles", get: "getAisle", insert: "insertAisle", update: "updateAisle", delete: "deleteAisle" },
        tableBody: "tbl-aisle",
        searchInput: "search-aisle",
        fields: [
            { name: "AisleCode", label: "Aisle Code", type: "text", required: true }
        ],
        row: (r, mode = "list") => `
            <td>${esc(r.AisleCode)}</td>
            <td>${renderActionsCell("aisle", r.AisleID, mode, r.AisleCode)}</td>
        `
    },

    shelf: {
        title: "Shelf",
        idField: "ShelfID",
        ops: { list: "getShelves", get: "getShelf", insert: "insertShelf", update: "updateShelf", delete: "deleteShelf" },
        tableBody: "tbl-shelf",
        searchInput: "search-shelf",
        fields: [
            { name: "AisleID", label: "Aisle", type: "select", optionsSource: "aisle", required: true },
            { name: "ShelfCode", label: "Shelf Code", type: "text", required: true }
        ],
        row: (r, mode = "list") => `
            <td>${esc(r.AisleCode)}</td>
            <td>${esc(r.ShelfCode)}</td>
            <td>${renderActionsCell("shelf", r.ShelfID, mode, r.ShelfCode)}</td>
        `
    },

    bin: {
        title: "Bin",
        idField: "BinID",
        ops: { list: "getBins", get: "getBin", insert: "insertBin", update: "updateBin", delete: "deleteBin" },
        tableBody: "tbl-bin",
        searchInput: "search-bin",
        fields: [
            { name: "ShelfID", label: "Shelf", type: "select", optionsSource: "shelf", required: true },
            { name: "BinCode", label: "Bin Code", type: "text", required: true }
        ],
        row: (r, mode = "list") => `
            <td>${esc(r.AisleCode || "—")}</td>
            <td>${esc(r.ShelfCode || "—")}</td>
            <td>${esc(r.BinCode)}</td>
            <td>${renderActionsCell("bin", r.BinID, mode, r.BinCode)}</td>
        `
    },

    product: {
        title: "Product",
        idField: "ProductID",
        ops: { list: "getProducts", get: "getProduct", insert: "insertProduct", update: "updateProduct", delete: "deleteProduct" },
        tableBody: "tbl-product",
        searchInput: "search-product",
        fields: [
            { name: "ProductName", label: "Product Name", type: "text", required: true },
            { name: "Barcode", label: "Barcode", type: "text" },
            { name: "Description", label: "Description", type: "textarea" },
            { name: "CategoryID", label: "Category", type: "select", optionsSource: "category" },
            { name: "UnitOfMeasureID", label: "Unit of Measure", type: "select", optionsSource: "uom" },
            { name: "CostPrice", label: "Cost Price", type: "number", hint: "Purchase cost per unit (e.g., 12.50)" },
            { name: "MinStockLevel", label: "Minimum Stock Level", type: "number", half: true },
            { name: "MaxStockLevel", label: "Maximum Stock Level", type: "number", half: true },
            { name: "BinID", label: "Bin Location", type: "select", optionsSource: "bin" }
        ],
        row: (r, mode = "list") => `
            <td>${esc(r.ProductName)}</td>
            <td>${esc(r.Barcode)}</td>
            <td>${esc(r.CategoryName)}</td>
            <td>${esc(r.UnitSymbol || r.UnitName)}</td>
            <td class="num">${r.CostPrice != null && r.CostPrice !== "" ? "₱" + Number(r.CostPrice).toFixed(2) : "—"}</td>
            <td>${esc(r.MinStockLevel)}</td>
            <td>${esc(r.MaxStockLevel)}</td>
            <td>${
                r.AisleCode
                    ? `${esc(r.AisleCode)} / ${esc(r.ShelfCode)} / ${esc(r.BinCode)}`
                    : esc(r.BinCode)
            }</td>
            <td>${renderActionsCell("product", r.ProductID, mode, r.ProductName)}</td>
        `
    },

    uom: {
        title: "Unit of Measure",
        idField: "UnitOfMeasureID",
        ops: { list: "getUnitsOfMeasureList", get: "getUnitOfMeasure", insert: "insertUnitOfMeasure", update: "updateUnitOfMeasure", delete: "deleteUnitOfMeasure" },
        tableBody: "tbl-uom",
        searchInput: "search-uom",
        fields: [
            { name: "UnitName", label: "Unit Name", type: "text", required: true },
            { name: "UnitSymbol", label: "Symbol", type: "text" }
        ],
        row: (r, mode = "list") => `
            <td>${esc(r.UnitName)}</td>
            <td>${esc(r.UnitSymbol || "—")}</td>
            <td>${renderActionsCell("uom", r.UnitOfMeasureID, mode, r.UnitName)}</td>
        `
    },

    user: {
        title: "User Account",
        idField: "UserID",
        ops: { list: "getUsers", get: "getUser", insert: "insertUser", update: "updateUser", delete: "deleteUser" },
        tableBody: "tbl-user",
        searchInput: "search-user",
        fields: [
            { name: "UserName", label: "Username", type: "text", required: true },
            { name: "Password", label: "Password", type: "password", required: true,
              hint: "Leave blank to keep the current password when editing." },
            { name: "FirstName", label: "First Name", type: "text", half: true },
            { name: "LastName", label: "Last Name", type: "text", half: true },
            { name: "Email", label: "Email", type: "text" },
            { name: "RoleID", label: "Role", type: "select", optionsSource: "role", required: true, half: true },
            { name: "UserStatus", label: "Account Status", type: "select", half: true,
              default: "Active",
              staticOptions: [
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" }
              ]
            }
        ],
        row: (r, mode = "list") => `
            <td>${esc(r.UserName)}</td>
            <td>${esc(r.FirstName)} ${esc(r.LastName)}</td>
            <td>${esc(r.Email)}</td>
            <td>${esc(r.RoleName)}</td>
            <td>${statusBadge(r.UserStatus)}</td>
            <td>
                ${renderActionsCell("user", r.UserID, mode, r.UserName)}
                ${
                    mode !== "archived"
                        ? `<button class="btn-icon" title="Toggle Active/Inactive"
                              onclick="toggleUserStatus(${Number(r.UserID)}, '${r.UserStatus === "Active" ? "Inactive" : "Active"}', ${jsArg(r.UserName)})"
                           >⇄</button>`
                        : ""
                }
            </td>
        `
    }
};

const PLURALS = {
    category: "Categories",
    shelf: "Shelves",
    uom: "Units of Measure",
    user: "User Accounts"
};

/* ============================================================
   TABLE LOADING
============================================================ */

async function loadTable(moduleKey, search = "") {

    const module = MODULES[moduleKey];
    if (!module) return;

    const result = await callApi(module.ops.list, { search });

    const tbody = document.getElementById(module.tableBody);
    if (!tbody) return;

    if (!result.success) {
        tbody.innerHTML = `
            <tr><td colspan="20" class="empty-row">${esc(result.message)}</td></tr>
        `;
        return;
    }

    let rows = result.data || [];
    rows = storageFilterRows(moduleKey, rows);
    setStorageCount(moduleKey, rows.length);

    if (!rows.length) {
        tbody.innerHTML = `
            <tr><td colspan="20" class="empty-row">No records found.</td></tr>
        `;
        return;
    }

    tbody.innerHTML = rows
        .map(r => `<tr>${module.row(r, "list")}</tr>`)
        .join("");
}

/* ============================================================
   STORAGE LOCATION — filters + count (parehas sa manager)
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

function storageFilterRows(key, rows) {
    if (key === "shelf") {
        const a = storageVal("filter-shelf-aisle");
        if (a) rows = rows.filter(r => String(r.AisleCode) === a);
    }
    if (key === "bin") {
        const a = storageVal("filter-bin-aisle");
        const s = storageVal("filter-bin-shelf");
        if (a) rows = rows.filter(r => String(r.AisleCode) === a);
        if (s) rows = rows.filter(r => String(r.ShelfID) === s);
    }
    if (key === "product") {
        const c = storageVal("filter-product-category");
        if (c) rows = rows.filter(r => String(r.CategoryID) === c);
    }
    return rows;
}

function renderAisleSelect(id, label) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = `<option value="">${esc(label)}</option>` +
        storageAisles.map(a => `<option value="${esc(a.AisleCode)}">${esc(a.AisleCode)}</option>`).join("");
    sel.value = storageAisles.some(a => a.AisleCode === current) ? current : "";
}

function refreshBinShelfOptions() {
    const sel = document.getElementById("filter-bin-shelf");
    if (!sel) return;
    const aisle = storageVal("filter-bin-aisle");
    const current = sel.value;
    const list = aisle
        ? storageShelves.filter(s => String(s.AisleCode) === aisle)
        : storageShelves;

    sel.innerHTML = `<option value="">All shelves</option>` +
        list.map(s => `<option value="${esc(s.ShelfID)}">${esc((s.AisleCode || "") + " / " + (s.ShelfCode || ""))}</option>`).join("");
    sel.value = list.some(s => String(s.ShelfID) === current) ? current : "";
}

async function fillStorageFilters() {
    const [a, s] = await Promise.all([
        callApi("getAisles", { search: "" }),
        callApi("getShelves", { search: "" })
    ]);

    storageAisles  = (a.data || []).filter(r => r.IsArchived === "No");
    storageShelves = (s.data || []).filter(r => r.IsArchived === "No");

    renderAisleSelect("filter-shelf-aisle", "All aisles");
    renderAisleSelect("filter-bin-aisle", "All aisles");
    refreshBinShelfOptions();
}

async function loadStorageLocationTables() {
    await fillStorageFilters();
    loadTable("aisle", storageVal("search-aisle"));
    loadTable("shelf", storageVal("search-shelf"));
    loadTable("bin",   storageVal("search-bin"));
}

function clearStorageFilters(key) {
    const ids = {
        aisle: ["search-aisle"],
        shelf: ["search-shelf", "filter-shelf-aisle"],
        bin:   ["search-bin", "filter-bin-aisle", "filter-bin-shelf"]
    }[key] || [];

    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });

    if (key === "bin") refreshBinShelfOptions();
    loadTable(key, "");
}

function wireStorageFilters() {
    const shelfAisle = document.getElementById("filter-shelf-aisle");
    const binAisle   = document.getElementById("filter-bin-aisle");
    const binShelf   = document.getElementById("filter-bin-shelf");

    if (shelfAisle) shelfAisle.addEventListener("change", () =>
        loadTable("shelf", storageVal("search-shelf")));

    if (binAisle) binAisle.addEventListener("change", () => {
        refreshBinShelfOptions();
        loadTable("bin", storageVal("search-bin"));
    });

    if (binShelf) binShelf.addEventListener("change", () =>
        loadTable("bin", storageVal("search-bin")));
}

/* ============================================================
   PRODUCT — category filter
============================================================ */

async function fillProductCategoryFilter() {
    const sel = document.getElementById("filter-product-category");
    if (!sel) return;

    const current = sel.value;
    const res = await callApi("getCategories", { search: "" });
    const cats = (res.data || []).filter(c => c.IsArchived === "No");

    sel.innerHTML = `<option value="">All categories</option>` +
        cats.map(c => `<option value="${esc(c.CategoryID)}">${esc(c.CategoryName)}</option>`).join("");

    sel.value = cats.some(c => String(c.CategoryID) === current) ? current : "";
}

/* ============================================================
   ARCHIVED MODAL
============================================================ */

let currentArchivedModuleKey = null;

async function loadArchivedTable(moduleKey) {

    const module = MODULES[moduleKey];
    if (!module) return;

    const tbody = document.getElementById("archived-modal-tbody");
    if (!tbody) return;

    tbody.innerHTML = `
        <tr><td colspan="20" class="empty-row">Loading...</td></tr>
    `;

    const result = await callApi(module.ops.list, {
        search: "",
        archived: true
    });

    if (!result.success) {
        tbody.innerHTML = `
            <tr><td colspan="20" class="empty-row">${esc(result.message)}</td></tr>
        `;
        return;
    }

    const rows = result.data || [];

    if (!rows.length) {
        tbody.innerHTML = `
            <tr><td colspan="20" class="empty-row">No archived records found.</td></tr>
        `;
        return;
    }

    tbody.innerHTML = rows
        .map(r => `<tr>${module.row(r, "archived")}</tr>`)
        .join("");
}

function openArchivedModal(moduleKey) {

    const module = MODULES[moduleKey];
    if (!module) return;

    currentArchivedModuleKey = moduleKey;

    document.getElementById("archived-modal-title").textContent =
        "Archived " + (PLURALS[moduleKey] || module.title + "s");

    const sourceTable = document
        .getElementById(module.tableBody)
        ?.closest("table");

    const theadTarget = document.getElementById("archived-modal-thead");

    if (sourceTable && theadTarget) {
        theadTarget.innerHTML = sourceTable.querySelector("thead").innerHTML;
    }

    document.getElementById("archived-modal-overlay").classList.add("open");

    loadArchivedTable(moduleKey);
}

function closeArchivedModal() {
    document.getElementById("archived-modal-overlay").classList.remove("open");
    currentArchivedModuleKey = null;
}

/* ============================================================
   RESTORE RECORD
============================================================ */

async function restoreRecord(moduleKey, id, displayName = "") {

    const module = MODULES[moduleKey];
    if (!module) return;

    closeArchivedModal();

    const nameText = displayName && String(displayName).trim() !== ""
        ? `${module.title}: "${displayName}"`
        : `this ${module.title.toLowerCase()}`;

    const returnModuleKey = moduleKey;

    openConfirmModal(
        `Are you sure you want to restore ${nameText}?`,
        {
            title: `Restore ${module.title}`,
            warning: "This record will become active again and will show up in the main list.",
            confirmLabel: "Restore",

            onCancel: () => {
                openArchivedModal(returnModuleKey);
            },

            onConfirm: async () => {

                const result = await callApi("restoreRecord", {
                    table: moduleKey,
                    id: id
                });

                if (!result.success) {
                    showErrorModal(result.message);
                    openArchivedModal(returnModuleKey);
                    return;
                }

                showSuccessModal(result.message || "Record restored successfully.");

                if (moduleKey === "aisle" || moduleKey === "shelf" || moduleKey === "bin") {
                    loadStorageLocationTables();
                } else {
                    loadTable(moduleKey);
                }

                if (moduleKey === "category") fillProductCategoryFilter();

                loadAuditLog();
            }
        }
    );
}

/* ============================================================
   OPTIONS
============================================================ */

async function getOptions(sourceKey) {

    switch (sourceKey) {

        case "aisle": {
            const res = await callApi("getAisles", { search: "" });
            return (res.data || [])
                .filter(r => r.IsArchived === "No")
                .map(r => ({ value: r.AisleID, label: r.AisleCode }));
        }

        case "shelf": {
            const res = await callApi("getShelves", { search: "" });
            return (res.data || [])
                .filter(r => r.IsArchived === "No")
                .map(r => ({ value: r.ShelfID, label: `${r.AisleCode} / ${r.ShelfCode}` }));
        }

        case "bin": {
            const res = await callApi("getBins", { search: "" });
            return (res.data || [])
                .filter(r => r.IsArchived === "No")
                .map(r => ({ value: r.BinID, label: `${r.AisleCode} / ${r.ShelfCode} / ${r.BinCode}` }));
        }

        case "category": {
            const res = await callApi("getCategories", { search: "" });
            return (res.data || [])
                .filter(r => r.IsArchived === "No")
                .map(r => ({ value: r.CategoryID, label: r.CategoryName }));
        }

        case "uom": {
            const res = await callApi("getUnitsOfMeasure");
            return (res.data || [])
                .map(r => ({ value: r.UnitOfMeasureID, label: `${r.UnitName} (${r.UnitSymbol || ""})` }));
        }

        case "role": {
            const res = await callApi("getRoles", { search: "" });
            return (res.data || [])
                .filter(r => r.IsArchived === "No")
                .map(r => ({ value: r.RoleID, label: r.RoleName }));
        }

        default:
            return [];
    }
}

/* ============================================================
   FORM MODAL
============================================================ */

let currentModuleKey = null;
let currentEditId = null;

async function openFormModal(moduleKey, id = null) {

    const module = MODULES[moduleKey];
    if (!module) return;

    currentModuleKey = moduleKey;
    currentEditId = id;

    document.getElementById("modal-title").textContent =
        (id ? "Edit " : "Add ") + module.title;

    const body = document.getElementById("modal-body");
    body.innerHTML = `<p class="modal-loading">Loading form...</p>`;

    document.getElementById("modal-overlay").classList.add("open");

    const optionsCache = {};

    for (const field of module.fields) {
        if (field.type === "select" && field.optionsSource) {
            optionsCache[field.name] = await getOptions(field.optionsSource);
        }
    }

    let record = {};

    if (id) {
        const res = await callApi(module.ops.get, { [module.idField]: id });
        if (res.success) record = res.data || {};
    }

    body.innerHTML = module.fields.map((field) => {

        // default value only applies when creating a new record
        const value = record[field.name] ?? (id ? "" : (field.default ?? ""));
        const requiredMark = field.required ? " *" : "";
        const groupClass = field.half ? "form-group half" : "form-group";
        const hint = field.hint
            ? `<small class="field-hint">${esc(field.hint)}</small>`
            : "";

        if (field.type === "select") {

            const opts = field.staticOptions || optionsCache[field.name] || [];

            const optionsHtml = opts.map(o => `
                <option value="${esc(o.value)}"
                    ${String(o.value) === String(value) ? "selected" : ""}>
                    ${esc(o.label)}
                </option>
            `).join("");

            return `
                <div class="${groupClass}">
                    <label>${field.label}${requiredMark}</label>
                    <select id="field-${field.name}">
                        <option value="">-- Select ${field.label} --</option>
                        ${optionsHtml}
                    </select>
                    ${hint}
                </div>
            `;
        }

        if (field.type === "textarea") {
            return `
                <div class="${groupClass}">
                    <label>${field.label}${requiredMark}</label>
                    <textarea id="field-${field.name}" rows="3">${esc(value)}</textarea>
                    ${hint}
                </div>
            `;
        }

        // Number fields: add step="0.01" for CostPrice
        const stepAttr = (field.type === "number" && field.name === "CostPrice")
            ? ` step="0.01" min="0"`
            : (field.type === "number" ? ` step="1" min="0"` : "");

        return `
            <div class="${groupClass}">
                <label>${field.label}${requiredMark}</label>
                <input type="${field.type}" id="field-${field.name}"${stepAttr}
                    autocomplete="${field.type === "password" ? "new-password" : "off"}"
                    value="${field.type === "password" ? "" : esc(value)}">
                ${hint}
            </div>
        `;

    }).join("");

    // Max Stock auto-suggest (Min × 3), product form only
    if (moduleKey === "product") setupMaxStockSuggest(Boolean(id));
}

function closeFormModal() {
    document.getElementById("modal-overlay").classList.remove("open");
    currentModuleKey = null;
    currentEditId = null;
}

/* ============================================================
   MAX STOCK AUTO-SUGGEST (Min × 3, still editable)
============================================================ */

function setupMaxStockSuggest(isEdit) {

    const minEl = document.getElementById("field-MinStockLevel");
    const maxEl = document.getElementById("field-MaxStockLevel");
    if (!minEl || !maxEl) return;

    const suggested = () => {
        const m = Number(minEl.value);
        return m > 0 ? m * 3 : 0;
    };

    // manual = the admin has edited Max, so don't overwrite it anymore
    let manual = false;

    if (isEdit) {
        const curMax = Number(maxEl.value);
        // If the saved Max differs from Min × 3, treat it as a manual value
        manual = curMax > 0 && curMax !== suggested();
        // Older products with no Max yet: fill in the suggestion
        if (curMax <= 0 && suggested() > 0) maxEl.value = suggested();
    }

    maxEl.addEventListener("input", () => {
        // If the admin clears the field, go back to auto mode
        manual = maxEl.value.trim() !== "";
    });

    minEl.addEventListener("input", () => {
        if (!manual) maxEl.value = suggested() > 0 ? suggested() : "";
    });
}

async function saveRecord() {

    const module = MODULES[currentModuleKey];
    if (!module) return;

    const payload = {};

    for (const field of module.fields) {

        const el = document.getElementById(`field-${field.name}`);
        if (!el) continue;

        if (
            field.required &&
            el.value.trim() === "" &&
            !(currentEditId && field.type === "password")
        ) {
            showErrorModal(`${field.label} is required.`);
            return;
        }

        payload[field.name] = el.value;
    }

    // Validate CostPrice
    if (payload.CostPrice !== undefined) {
        if (payload.CostPrice === "" || payload.CostPrice === null) {
            payload.CostPrice = 0;
        } else {
            const cp = Number(payload.CostPrice);
            if (isNaN(cp) || cp < 0) {
                showErrorModal("Cost price must be a positive number.");
                return;
            }
            payload.CostPrice = cp;
        }
    }

    // Validate Min / Max stock (product only)
    if (module === MODULES.product) {
        const min = Number(payload.MinStockLevel || 0);
        let max = Number(payload.MaxStockLevel || 0);

        if (isNaN(min) || min < 0 || isNaN(max) || max < 0) {
            showErrorModal("Stock levels must be zero or higher.");
            return;
        }
        if (max === 0 && min > 0) max = min * 3;   // fall back to Min × 3

        if (max > 0 && max < min) {
            showErrorModal("Maximum stock level cannot be lower than the minimum stock level.");
            return;
        }
        payload.MinStockLevel = min;
        payload.MaxStockLevel = max;
    }

    let result;
    const isEdit = Boolean(currentEditId);

    if (isEdit) {
        payload[module.idField] = currentEditId;
        result = await callApi(module.ops.update, payload);
    } else {
        result = await callApi(module.ops.insert, payload);
    }

    if (!result.success) {
        showErrorModal(result.message);
        return;
    }

    const successMessage = result.message ||
        (isEdit ? `${module.title} updated successfully.` : `${module.title} added successfully.`);

    showSuccessModal(successMessage);

    closeFormModal();

    const savedKey = currentModuleKeySafe(module);

    if (savedKey === "aisle" || savedKey === "shelf" || savedKey === "bin") {
        loadStorageLocationTables();
    } else {
        loadTable(savedKey);
    }

    if (savedKey === "category") fillProductCategoryFilter();

    loadAuditLog();
}

function currentModuleKeySafe(moduleObj) {
    return Object.keys(MODULES).find(key => MODULES[key] === moduleObj);
}

/* ============================================================
   CONFIRM MODAL
============================================================ */

let confirmActionCallback = null;
let confirmCancelCallback = null;

function openConfirmModal(message, {
    title = "Confirm Action",
    warning = "This can be reviewed later; archived records are not permanently deleted.",
    confirmLabel = "Archive",
    onConfirm = null,
    onCancel = null
} = {}) {

    document.getElementById("confirm-modal-title").textContent = title;
    document.getElementById("confirm-modal-message").textContent = message;
    document.getElementById("confirm-modal-warning").textContent = warning;

    const btn = document.getElementById("btn-confirm-action");
    btn.textContent = confirmLabel;

    confirmActionCallback = onConfirm;
    confirmCancelCallback = onCancel;

    document.getElementById("confirm-modal-overlay").classList.add("open");
}

function closeConfirmModal(triggerCancel = false) {

    document.getElementById("confirm-modal-overlay").classList.remove("open");

    const cancelCb = confirmCancelCallback;

    confirmActionCallback = null;
    confirmCancelCallback = null;

    if (triggerCancel && typeof cancelCb === "function") {
        cancelCb();
    }
}

function deleteRecord(moduleKey, id) {

    const module = MODULES[moduleKey];
    if (!module) return;

    openConfirmModal(
        `Are you sure you want to archive this ${module.title.toLowerCase()}?`,
        {
            title: `Archive ${module.title}`,
            confirmLabel: "Archive",
            onConfirm: async () => {

                const result = await callApi(module.ops.delete, {
                    [module.idField]: id
                });

                if (!result.success) {
                    showErrorModal(result.message);
                    return;
                }

                showSuccessModal(result.message ||
                    `${module.title} archived successfully.`);

                if (moduleKey === "aisle" || moduleKey === "shelf" || moduleKey === "bin") {
                    loadStorageLocationTables();
                } else {
                    loadTable(moduleKey);
                }

                if (moduleKey === "category") fillProductCategoryFilter();

                loadAuditLog();
            }
        }
    );
}

function toggleUserStatus(userID, newStatus, userName = "") {

    // Dili pwede i-inactive ang kaugalingon nga account
    if (newStatus === "Inactive" && Number(userID) === Number(currentUser?.UserID)) {
        showErrorModal("You cannot deactivate your own account.");
        return;
    }

    const applyStatus = async () => {

        const result = await callApi("toggleUserStatus", {
            UserID: userID,
            UserStatus: newStatus
        });

        if (!result.success) {
            showErrorModal(result.message);
            return;
        }

        showSuccessModal(result.message || `User status changed to ${newStatus}.`);

        loadTable("user");
        loadAuditLog();
    };

    // I-activate: diretso na, walay confirmation
    if (newStatus !== "Inactive") {
        applyStatus();
        return;
    }

    // I-inactive: mangayo og confirmation
    const nameText = userName && String(userName).trim() !== ""
        ? `user "${userName}"`
        : "this user";

    openConfirmModal(
        `Are you sure you want to deactivate ${nameText}?`,
        {
            title: "Deactivate User",
            warning: "This user will no longer be able to log in until the account is activated again.",
            confirmLabel: "Deactivate",
            onConfirm: applyStatus
        }
    );
}

/* ============================================================
   DASHBOARD
============================================================ */

let chartProductsCategory = null;
let chartPoStatus = null;

async function loadDashboard() {

    const result = await callApi("getDashboardStats");

    if (!result.success) {
        console.error(result.message);
        return;
    }

    const s = result.data || {};

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setText("stat-products",    s.totalProducts ?? 0);
    setText("stat-suppliers",   s.totalSuppliers ?? 0);
    setText("stat-categories",  s.totalCategories ?? 0);
    setText("stat-active-users",
        `${s.activeUsers ?? 0} / ${s.totalUsers ?? 0}`);
    setText("stat-pending-po",  s.pendingPOs ?? 0);

    const lowStock = document.getElementById("tbl-low-stock");

    if (lowStock) {
        lowStock.innerHTML = (s.lowStockWatchlist || []).map(p => `
            <tr>
                <td>${esc(p.ProductName)}</td>
                <td>${esc(p.MinStockLevel)}</td>
            </tr>
        `).join("") || `
            <tr><td colspan="2" class="empty-row">No products yet.</td></tr>
        `;
    }

    const activity = document.getElementById("tbl-recent-activity");

    if (activity) {
        activity.innerHTML = (s.recentActivity || []).map(a => `
            <tr>
                <td>${esc(a.UserName || "—")}</td>
                <td>${esc(a.ActionType)}</td>
                <td>${esc(a.TableAffected)}</td>
                <td>${esc(a.ActionTimestamp)}</td>
            </tr>
        `).join("") || `
            <tr><td colspan="4" class="empty-row">No activity yet.</td></tr>
        `;
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
        ctx.font = pluginOptions.valueFont ||
            "800 26px system-ui, -apple-system, sans-serif";
        ctx.fillText(
            String(pluginOptions.value ?? ""),
            centerX,
            centerY - 11
        );

        ctx.fillStyle = pluginOptions.labelColor || "#166534";
        ctx.font = pluginOptions.labelFont ||
            "700 11px system-ui, -apple-system, sans-serif";
        ctx.fillText(
            pluginOptions.label || "",
            centerX,
            centerY + 13
        );

        ctx.restore();
    }
};

async function loadDashboardCharts() {

    if (typeof Chart === "undefined") {
        console.warn("Chart.js not loaded — skipping charts.");
        return;
    }

    const [productsRes, poRes] = await Promise.all([
        callApi("getProducts", { search: "" }),
        callApi("getPurchaseOrders", { search: "" })
    ]);

    const products = (productsRes.data || []).filter(p => p.IsArchived !== "Yes");

    const categoryCounts = {};
    products.forEach(p => {
        const cat = p.CategoryName || "Uncategorized";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1]);

    const totalCategories = sortedCategories.length;
    const topCategories = sortedCategories.slice(0, 6);

    const subtitle = document.getElementById("chartCategorySubtitle");
    if (subtitle) {
        subtitle.textContent = `Top ${topCategories.length} of ${totalCategories} categories`;
    }

    const catLabels = topCategories.map(([name]) => name);
    const catCounts = topCategories.map(([, count]) => count);

    if (chartProductsCategory) {
        chartProductsCategory.destroy();
        chartProductsCategory = null;
    }

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
                        ticks: {
                            precision: 0,
                            color: "#166534",
                            font: { size: 11, weight: "600" }
                        },
                        grid: {
                            color: "rgba(166, 221, 187, 0.5)",
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: "#166534",
                            font: { size: 11, weight: "600" }
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    const pos = (poRes.data || []).filter(p => p.IsArchived !== "Yes");

    const statusCounts = {};
    pos.forEach(p => {
        const status = p.StatusName || "Unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const totalPOs = pos.length;

    const statusColorMap = {
        "Completed": "#0E9F6E",
        "Approved":  "#0E9F6E",
        "Pending":   "#D97706",
        "For Review":"#D97706",
        "Submitted":"#D97706",
        "Cancelled": "#DC2626",
        "Canceled":  "#DC2626",
        "Rejected":  "#DC2626",
        "Draft":     "#9CA3AF"
    };

    const statusLabels = Object.keys(statusCounts);
    const statusValues = statusLabels.map(k => statusCounts[k]);
    const statusColors = statusLabels.map(s =>
        statusColorMap[s] || "#9CA3AF"
    );

    if (chartPoStatus) {
        chartPoStatus.destroy();
        chartPoStatus = null;
    }

    const ctx2 = document.getElementById("chart-po-status");
    if (ctx2) {
        chartPoStatus = new Chart(ctx2, {
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
                layout: {
                    padding: 0
                },
                plugins: {
                    legend: {
                        position: (ctxChart) =>
                            ctxChart.chart.width < 340 ? "bottom" : "right",
                        labels: {
                            boxWidth: 10,
                            boxHeight: 10,
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 14,
                            color: "#052E16",
                            font: { size: 12, weight: "600" },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const value = data.datasets[0].data[i];
                                        return {
                                            text: `${label}    ${value}`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            strokeStyle: data.datasets[0].backgroundColor[i],
                                            lineWidth: 0,
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: "#12331F",
                        titleColor: "#FFFFFF",
                        bodyColor: "#FFFFFF",
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0
                                    ? Math.round((ctx.parsed / total) * 100)
                                    : 0;
                                return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
                            }
                        }
                    },
                    doughnutCenterText: {
                        enabled: true,
                        value: totalPOs,
                        label: "TOTAL POS"
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

    const dashboardSection = document.getElementById("section-dashboard");
    if (!dashboardSection) return;

    dashboardResizeObserver = new ResizeObserver(() => {
        handleDashboardResize();
    });

    dashboardResizeObserver.observe(dashboardSection);
}

function handleDashboardResize() {
    if (dashboardResizeTimer) clearTimeout(dashboardResizeTimer);
    dashboardResizeTimer = setTimeout(() => {
        if (chartProductsCategory) chartProductsCategory.resize();
        if (chartPoStatus) chartPoStatus.resize();
    }, 150);
}

/* ============================================================
   AUDIT LOG  (redesigned: table + paging)
============================================================ */

const AL_ACTIONS = {
    LOGIN:     { label: "Login",    cls: "al-gray",  group: "login" },
    LOGOUT:    { label: "Logout",   cls: "al-gray",  group: "login" },
    INSERT:    { label: "Created",  cls: "al-blue",  group: "created" },
    UPDATE:    { label: "Updated",  cls: "al-amber", group: "updated" },
    APPROVED:  { label: "Approved", cls: "al-green", group: "approved" },
    REJECTED:  { label: "Rejected", cls: "al-red",   group: "rejected" },
    ARCHIVE:   { label: "Archived", cls: "al-slate", group: "archived" },
    UNARCHIVE: { label: "Restored", cls: "al-teal",  group: "archived" }
};

const AL_AVATAR_COLORS = ["#2F7A52", "#3B6EA5", "#8A5A9E", "#B0663A", "#4A8A8A", "#7A7A2F"];

let alRows = [];
let alFilter = "all";
let alView = "table";
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
    return esc(text || "—")
        .replace(/(?<![&\w])(#\d+)/g, "<b>$1</b>")
        .replace(/\((Pending[^)]*)\)/, "<em>($1)</em>");
}

function alAvatar(name) {
    const n = String(name || "?");
    const sum = [...n].reduce((a, c) => a + c.charCodeAt(0), 0);
    return `<i style="background:${AL_AVATAR_COLORS[sum % AL_AVATAR_COLORS.length]}">${esc(n.charAt(0).toUpperCase())}</i>`;
}

const alUser = (a) => `<span class="al-user">${alAvatar(a.UserName)}<span>${esc(a.UserName || "—")}</span></span>`;

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

function alTableHtml(groups) {

    let html = `
        <div class="al-card"><div class="al-scroll">
        <table class="al-table">
            <thead><tr>
                <th>User</th><th>Action</th><th>Table</th><th>When</th><th>Details</th>
            </tr></thead>
            <tbody>`;

    groups.forEach((g) => {
        html += `<tr class="al-day"><td colspan="5">${esc(alDayLabel(g.ts))}</td></tr>`;

        g.items.forEach((a) => {
            const info = alInfo(a.ActionType);
            html += `
                <tr>
                    <td>${alUser(a)}</td>
                    <td><span class="al-badge ${info.cls}">${esc(info.label)}</span></td>
                    <td class="al-meta">${esc(alNiceTable(a.TableAffected))}</td>
                    <td class="al-meta al-time">${esc(alTimeLabel(a.ActionTimestamp))}</td>
                    <td class="al-det">${alDetails(a.Details)}</td>
                </tr>`;
        });
    });

    return html + `</tbody></table></div></div>`;
}

function alTimelineHtml(groups) {

    let html = `<div class="al-card al-timeline">`;

    groups.forEach((g) => {
        html += `<h2>${esc(alDayLabel(g.ts))}</h2>`;

        g.items.forEach((a) => {
            const info = alInfo(a.ActionType);
            html += `
                <div class="al-ev ${info.cls}">
                    <div class="al-ev-time">${esc(alTimeLabel(a.ActionTimestamp))}</div>
                    <div class="al-rail"></div>
                    <div class="al-ev-body">
                        <div class="al-ev-head">
                            ${alUser(a)}
                            <span class="al-badge ${info.cls}">${esc(info.label)}</span>
                        </div>
                        <div class="al-det">${alDetails(a.Details)}</div>
                        <div class="al-ev-sub">${esc(alNiceTable(a.TableAffected))}</div>
                    </div>
                </div>`;
        });
    });

    return html + `</div>`;
}

function alCardsHtml(groups) {

    let html = `<div class="al-grid">`;

    groups.forEach((g) => {
        html += `<div class="al-gh">${esc(alDayLabel(g.ts))}</div>`;

        g.items.forEach((a) => {
            const info = alInfo(a.ActionType);
            html += `
                <article class="al-tile ${info.cls}">
                    <div class="al-ln">
                        <span class="al-badge ${info.cls}">${esc(info.label)}</span>
                        <span class="al-tile-meta">${esc(alTimeLabel(a.ActionTimestamp))}</span>
                    </div>
                    <div class="al-det">${alDetails(a.Details)}</div>
                    <div class="al-ln">
                        ${alUser(a)}
                        <span class="al-tile-meta">${esc(alNiceTable(a.TableAffected))}</span>
                    </div>
                </article>`;
        });
    });

    return html + `</div>`;
}

function alRender() {

    const viewEl = document.getElementById("al-view");
    const countEl = document.getElementById("al-count");
    const pagerEl = document.getElementById("al-pager");
    if (!viewEl) return;

    const list = alRows.filter(
        (a) => alFilter === "all" || alInfo(a.ActionType).group === alFilter
    );

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

    const groups = alGroups(pageItems);

    viewEl.innerHTML =
        alView === "timeline" ? alTimelineHtml(groups) :
        alView === "cards"    ? alCardsHtml(groups) :
                                alTableHtml(groups);

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

async function loadAuditLog(search = null) {

    const viewEl = document.getElementById("al-view");
    if (!viewEl) return;

    if (search === null) {
        const input = document.getElementById("search-audit");
        search = input ? input.value : "";
    }

    const result = await callApi("getAuditLogs", { search });

    if (!result.success) {
        alRows = [];
        viewEl.innerHTML = `<div class="al-card al-empty">${esc(result.message)}</div>`;
        document.getElementById("al-count").textContent = "";
        document.getElementById("al-pager").innerHTML = "";
        return;
    }

    alRows = result.data || [];
    alPage = 1;
    alRender();
}

function setupAuditLogUI() {

    if (alBound) return;
    alBound = true;

    const chips = document.getElementById("al-chips");
    const seg = document.getElementById("al-seg");
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

    if (seg) {
        seg.addEventListener("click", (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;
            alView = btn.dataset.v;
            seg.querySelectorAll("button").forEach((b) =>
                b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
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

/* ============================================================
   TRANSACTIONS (VIEW ONLY FOR ADMIN) — Search + Status filter
============================================================ */

const ICON_EYE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

function buildViewButton(type, id) {
    return `
        <button class="btn-icon btn-view" title="View Details"
            onclick="openTransactionDetails('${type}', ${Number(id)})"
        >${ICON_EYE} View</button>
    `;
}

function fmtDate(value) {
    if (!value) return "—";
    const text = String(value);
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(text);
    const d = dateOnly ? new Date(text + "T00:00:00") : new Date(text.replace(" ", "T"));
    if (isNaN(d)) return text;
    return dateOnly ? d.toLocaleDateString() : d.toLocaleString();
}

function poRefLabel(value) {
    if (value === null || value === undefined || value === "") return "—";
    const text = String(value);
    return /^\d+$/.test(text) ? "PO-" + text : text;
}

const TX_TABS = {

    po: {
        op: "getPurchaseOrders", tbody: "tbl-po", search: "search-po",
        status: "filter-po-status", count: "po-count",
        cols: 6, empty: "No purchase orders found.",
        text: (r) => [r.PO_ID, r.SupplierName, r.UserName, r.StatusName],
        row: (r) => `
            <td>${esc(fmtDate(r.PO_Date))}</td>
            <td>${esc(fmtDate(r.Expected_Date))}</td>
            <td>${esc(r.SupplierName || "—")}</td>
            <td>${esc(r.UserName || "—")}</td>
            <td>${statusBadge(r.StatusName)}</td>
            <td>${buildViewButton("purchase_order", r.PO_ID)}</td>`
    },

    pret: {
        op: "getPurchaseReturns", tbody: "tbl-purchase-return", search: "search-pret",
        status: "filter-pret-status", count: "pret-count",
        cols: 7, empty: "No purchase returns found.",
        text: (r) => [r.SupplierName, r.ProductName, r.Reason, r.StatusName, r.UserName],
        row: (r) => `
            <td>${esc(fmtDate(r.Return_Date))}</td>
            <td>${esc(r.SupplierName || "—")}</td>
            <td>${esc(r.ProductName || "—")}</td>
            <td>${esc(r.Quantity ?? "—")}</td>
            <td>${statusBadge(r.StatusName)}</td>
            <td>${esc(r.Reason || "—")}</td>
            <td>${buildViewButton("purchase_return", r.Purchase_Return_ID)}</td>`
    },

    recv: {
        op: "getReceivings", tbody: "tbl-recv", search: "search-recv",
        status: "filter-recv-status", count: "recv-count",
        cols: 6, empty: "No receiving records found.",
        text: (r) => [r.ReceivingID, r.SupplierName, r.UserName, r.StatusName, poRefLabel(r.PO_Reference)],
        row: (r) => `
            <td>${esc(fmtDate(r.ReceivingDate))}</td>
            <td>${esc(r.SupplierName || "—")}</td>
            <td>${esc(r.UserName || "—")}</td>
            <td>${esc(poRefLabel(r.PO_Reference))}</td>
            <td>${statusBadge(r.StatusName)}</td>
            <td>${buildViewButton("receiving", r.ReceivingID)}</td>`
    },

    rel: {
        op: "getStockReleases", tbody: "tbl-release", search: "search-rel",
        status: "filter-rel-status", count: "rel-count",
        cols: 5, empty: "No stock releases found.",
        text: (r) => [r.ReleaseID, r.ReleasedBy, r.StatusName],
        row: (r) => `
            <td>${esc(fmtDate(r.ReleaseDate))}</td>
            <td>${esc(r.ReleasedBy || "—")}</td>
            <td>${esc(r.ItemCount ?? "—")}</td>
            <td>${statusBadge(r.StatusName)}</td>
            <td>${buildViewButton("stock_release", r.ReleaseID)}</td>`
    },

    sret: {
        op: "getStockReturns", tbody: "tbl-return", search: "search-sret",
        status: "filter-sret-status", count: "sret-count",
        cols: 7, empty: "No stock returns found.",
        text: (r) => [r.ProductName, r.Reason, r.StatusName, r.UserName],
        row: (r) => `
            <td>${esc(fmtDate(r.Return_Date))}</td>
            <td>${esc(r.UserName || "—")}</td>
            <td>${esc(r.ProductName || "—")}</td>
            <td>${esc(r.Quantity ?? "—")}</td>
            <td>${statusBadge(r.StatusName)}</td>
            <td>${esc(r.Reason || "—")}</td>
            <td>${buildViewButton("stock_return", r.Stock_Return_ID)}</td>`
    },

    adj: {
        op: "getInventoryAdjustments", tbody: "tbl-adjust", search: "search-adj",
        status: "filter-adj-status", count: "adj-count",
        cols: 9, empty: "No inventory adjustments found.",
        text: (r) => [r.ProductName, r.Reason, r.StatusName, r.UserName],
        row: (r) => {
            const q = Number(r.Adjustment_Quantity ?? 0);
            const cell = q === 0
                ? `<span class="badge badge-green">0 (match)</span>`
                : esc(q);
            return `
                <td>${esc(fmtDate(r.Adjustment_Date))}</td>
                <td>${esc(r.ProductName || "—")}</td>
                <td>${esc(r.System_Quantity ?? "—")}</td>
                <td>${esc(r.Actual_Quantity ?? "—")}</td>
                <td>${cell}</td>
                <td>${esc(r.Adjustment_Type || "—")}</td>
                <td>${statusBadge(r.StatusName)}</td>
                <td>${esc(r.Reason || "—")}</td>
                <td>${buildViewButton("inventory_adjustment", r.Adjustment_ID)}</td>`;
        }
    }
};

const txRows = {};

function setTxCount(id, n) {
    const el = document.getElementById(id);
    if (el) el.textContent = n === 0 ? "" : `${n} record${n === 1 ? "" : "s"} found`;
}

function fillTxStatusSelect(cfg, rows) {
    const sel = document.getElementById(cfg.status);
    if (!sel) return;

    const current = sel.value;
    const names = [...new Set(rows.map(r => r.StatusName).filter(Boolean))].sort();

    sel.innerHTML = `<option value="">All statuses</option>` +
        names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("");

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

    setTxCount(cfg.count, rows.length);

    tbody.innerHTML = rows.length
        ? rows.map(r => `<tr>${cfg.row(r)}</tr>`).join("")
        : `<tr><td colspan="${cfg.cols}" class="empty-row">${esc(cfg.empty)}</td></tr>`;
}

async function loadTxTab(key) {

    const cfg = TX_TABS[key];
    const tbody = document.getElementById(cfg.tbody);
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="${cfg.cols}" class="empty-row">Loading…</td></tr>`;

    const res = await callApi(cfg.op);

    if (!res.success) {
        txRows[key] = [];
        tbody.innerHTML = `<tr><td colspan="${cfg.cols}" class="empty-row">${esc(res.message)}</td></tr>`;
        setTxCount(cfg.count, 0);
        return;
    }

    txRows[key] = res.data || [];
    fillTxStatusSelect(cfg, txRows[key]);
    renderTxTab(key);
}

function clearTxFilters(key) {
    const cfg = TX_TABS[key];
    const s = document.getElementById(cfg.search);
    const st = document.getElementById(cfg.status);
    if (s) s.value = "";
    if (st) st.value = "";
    renderTxTab(key);
}

async function loadTransactions() {
    await Promise.all(Object.keys(TX_TABS).map(loadTxTab));
}

/* ============================================================
   TRANSACTION DETAILS MODAL (VIEW ONLY)
============================================================ */

function closeDetailsModal() {
    const overlay = document.getElementById("details-modal-overlay");
    if (overlay) overlay.classList.remove("open");
}

const dmNum = (v) => Number(v ?? 0) || 0;

const dmSigned = (v) => {
    const n = dmNum(v);
    return (n > 0 ? "+" : "") + n;
};

const dmMoney = (v) =>
    "₱" + dmNum(v).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

const dmSellPrice = (l) =>
    dmNum(l.SellingPrice ?? l.Selling_Price ?? l.UnitPrice ?? l.Unit_Price ?? l.Price);

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
    if (["completed", "received", "released"].includes(s)) level = 3;
    return { level, bad };
}

function dmAdjValue(l) {
    const q = dmNum(l.Adjustment_Quantity);
    const t = String(l.Adjustment_Type || "").toLowerCase();
    if (t.includes("decrease") || t.includes("deduct") || t.includes("minus")) return -Math.abs(q);
    if (t.includes("increase") || t.includes("add")) return Math.abs(q);
    return q;
}

const TX_DETAIL_CONFIG = {

    purchase_order: {
        op: "getPurchaseOrder",
        idField: "PO_ID",
        title: "Purchase Order",
        subtitle: (d) => d.SupplierName || "",
        dateOf: (d) => d.PO_Date,
        steps: ["Created", "Approved", "Completed"],
        approvedIsFinal: false,
        meta: [
            ["Date", (d) => d.PO_Date],
            ["Expected", (d) => d.Expected_Date],
            ["Requested By", (d) => d.UserName]
        ],
        columns: [
            { label: "Product", get: (l) => l.ProductName },
            { label: "Qty", get: (l) => dmNum(l.Quantity), align: "r" }
        ],
        summary: {
            label: "Total Quantity",
            get: (ls) => ls.reduce((a, l) => a + dmNum(l.Quantity), 0)
        }
    },

    purchase_return: {
        op: "getPurchaseReturn",
        idField: "Purchase_Return_ID",
        title: "Purchase Return",
        subtitle: (d) => d.SupplierName || "",
        dateOf: (d) => d.Return_Date,
        steps: ["Recorded", "Approved", "Stock updated"],
        approvedIsFinal: true,
        meta: [
            ["Date", (d) => d.Return_Date],
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
        steps: ["Recorded", "Approved", "Stock updated"],
        approvedIsFinal: true,
        meta: [
            ["Date", (d) => d.ReceivingDate],
            ["Received By", (d) => d.UserName],
            ["Linked PO Date", (d) => d.PO_Date]
        ],
        columns: [
            { label: "Product", get: (l) => l.ProductName },
            { label: "Received", get: (l) => dmNum(l.ReceivedQuantity), align: "r" },
            { label: "Cost Price", kind: "money", get: (l) => dmNum(l.CostPrice), align: "r" },
            { label: "Total", kind: "money", get: (l) => dmNum(l.ReceivedQuantity) * dmNum(l.CostPrice), align: "r" }
        ],
        summary: [
            {
                label: "Total Received",
                get: (ls) => ls.reduce((a, l) => a + dmNum(l.ReceivedQuantity), 0)
            },
            {
                label: "Total Amount",
                money: true,
                get: (ls) => ls.reduce((a, l) => a + dmNum(l.ReceivedQuantity) * dmNum(l.CostPrice), 0)
            }
        ]
    },

    stock_release: {
        op: "getStockRelease",
        idField: "ReleaseID",
        title: "Stock Release",
        subtitle: (d) => d.ReleasedBy || "",
        dateOf: (d) => d.ReleaseDate,
        steps: ["Recorded", "Approved", "Stock updated"],
        approvedIsFinal: false,
        meta: [
            ["Date", (d) => d.ReleaseDate],
            ["Released By", (d) => d.ReleasedBy],
            ["Status", (d) => d.StatusName]
        ],
        columns: [
            { label: "Product", get: (l) => l.ProductName },
            { label: "Qty", get: (l) => dmNum(l.QuantityReleased), align: "r" },
            { label: "Selling Price", kind: "money", get: (l) => dmSellPrice(l), align: "r" },
            { label: "Total", kind: "money", get: (l) => dmNum(l.QuantityReleased) * dmSellPrice(l), align: "r" }
        ],
        summary: [
            {
                label: "Total Released",
                get: (ls) => ls.reduce((a, l) => a + dmNum(l.QuantityReleased), 0)
            },
            {
                label: "Total Amount",
                money: true,
                get: (ls) => ls.reduce((a, l) => a + dmNum(l.QuantityReleased) * dmSellPrice(l), 0)
            }
        ]
    },

    stock_return: {
        op: "getStockReturn",
        idField: "Stock_Return_ID",
        title: "Stock Return",
        subtitle: (d) => d.UserName || "",
        dateOf: (d) => d.Return_Date,
        steps: ["Recorded", "Approved", "Stock updated"],
        approvedIsFinal: true,
        meta: [
            ["Date", (d) => d.Return_Date],
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
        steps: ["Recorded", "Approved", "Stock updated"],
        approvedIsFinal: true,
        meta: [
            ["Date", (d) => d.Adjustment_Date],
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

function dmRenderStepper(cfg, d) {

    const { level, bad } = dmGetProgress(d.StatusName, cfg.approvedIsFinal);
    const isPending = String(d.StatusName || "").toLowerCase() === "pending";

    const states = [1, 2, 3].map((n) => {
        if (n === 1) return "done";
        if (bad && n === 2) return "bad";
        if (bad) return "";
        if (n <= level) return "done";
        if (n === level + 1 && isPending) return "current";
        return "";
    });

    const icon = (st, n) =>
        st === "done" ? "✓" : st === "bad" ? "✕" : String(n);

    const labels = cfg.steps.slice();
    if (bad) labels[1] = d.StatusName;

    const step = (i) => `
        <div class="dm-step ${states[i]}">
            <div class="dm-circle">${icon(states[i], i + 1)}</div>
            <div class="dm-step-label">${esc(labels[i])}</div>
            ${i === 0 && cfg.dateOf(d)
                ? `<div class="dm-step-date">${esc(cfg.dateOf(d))}</div>`
                : ""}
        </div>
    `;

    const line = (i) =>
        `<div class="dm-line ${states[i + 1] === "done" ? "done" : ""}"></div>`;

    return `<div class="dm-stepper">${step(0)}${line(0)}${step(1)}${line(1)}${step(2)}</div>`;
}

function dmRenderMeta(cfg, d) {
    return `
        <div class="dm-meta">
            ${cfg.meta.map(([label, get]) => `
                <div>
                    <div class="dm-meta-label">${esc(label)}</div>
                    <div class="dm-meta-value">${esc(get(d) || "—")}</div>
                </div>
            `).join("")}
        </div>
    `;
}

function dmRenderCell(col, l) {
    const raw = col.get(l);

    if (col.kind === "type") {
        const t = String(raw || "").toLowerCase();
        const cls =
            (t.includes("increase") || t.includes("add")) ? "up" :
            (t.includes("decrease") || t.includes("deduct") || t.includes("minus")) ? "down" :
            "neutral";
        return `<span class="dm-type ${cls}">${esc(raw || "—")}</span>`;
    }

    if (col.kind === "money") {
        return esc(dmMoney(raw));
    }

    return esc(raw ?? "—");
}

function dmRenderLines(cfg, lines) {

    const alignClass = (c) => (c.align ? ` class="${c.align}"` : "");

    const head = cfg.columns
        .map((c) => `<th${alignClass(c)}>${esc(c.label)}</th>`)
        .join("");

    const rows = lines.length
        ? lines.map((l) => `
            <tr>
                ${cfg.columns
                    .map((c) => `<td${alignClass(c)}>${dmRenderCell(c, l)}</td>`)
                    .join("")}
            </tr>
        `).join("")
        : `<tr><td colspan="${cfg.columns.length}" class="dm-empty">No lines</td></tr>`;

    return `
        <table class="dm-table">
            <thead><tr>${head}</tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function dmRenderSummary(cfg, lines) {
    if (!cfg.summary) return "";

    const list = Array.isArray(cfg.summary) ? cfg.summary : [cfg.summary];

    return list.map((s) => {
        const total = s.get(lines);
        const text = s.money
            ? dmMoney(total)
            : (s.signed ? dmSigned(total) : String(total)) + " pcs";

        return `
            <div class="dm-summary">
                <div class="dm-meta-label">${esc(s.label)}</div>
                <div class="dm-summary-value">${esc(text)}</div>
            </div>
        `;
    }).join("");
}

async function openTransactionDetails(type, id) {

    const cfg = TX_DETAIL_CONFIG[type];
    if (!cfg) return;

    const overlay   = document.getElementById("details-modal-overlay");
    const titleEl   = document.getElementById("dm-title");
    const subEl     = document.getElementById("dm-sub");
    const pillEl    = document.getElementById("dm-pill");
    const stepperEl = document.getElementById("dm-stepper");
    const bodyEl    = document.getElementById("dm-body");

    if (!overlay || !titleEl || !bodyEl) return;

    titleEl.textContent = cfg.title;
    subEl.textContent = "";
    pillEl.style.display = "none";
    stepperEl.innerHTML = "";
    bodyEl.innerHTML = `<div class="dm-empty">Loading...</div>`;

    overlay.classList.add("open");

    try {
        const res = await callApi(cfg.op, { [cfg.idField]: id });

        if (!res || !res.success || !res.data) {
            bodyEl.innerHTML = `
                <div class="dm-empty" style="color:#B91C1C;">
                    ${esc((res && res.message) || "Failed to load.")}
                </div>`;
            return;
        }

        const d = res.data;
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

    } catch (err) {
        console.error("Transaction details error:", err);
        bodyEl.innerHTML = `
            <div class="dm-empty" style="color:#B91C1C;">Failed to load details.</div>`;
    }
}

/* ============================================================
   SECTION SWITCHING
============================================================ */

function switchSection(targetId) {

    document.querySelectorAll(".page-section")
        .forEach(el => el.classList.remove("active-section"));

    const target = document.getElementById(targetId);
    if (!target) return;

    target.classList.add("active-section");

    document.querySelectorAll(".nav-link")
        .forEach(el => el.classList.remove("active"));

    const nav = document.querySelector(`.nav-link[data-target="${targetId}"]`);
    if (nav) nav.classList.add("active");

    const title = document.getElementById("page-title");
    if (title) title.textContent = sectionTitles[targetId] || "";

    closeSidebar();

    if (targetId === "section-dashboard") {
        loadDashboard();
        requestAnimationFrame(() => {
            handleDashboardResize();
        });
    } else if (targetId === "section-storage-location") {
        loadStorageLocationTables();
    } else if (targetId === "section-transactions") {
        loadTransactions();
    } else if (targetId === "section-audit") {
        loadAuditLog();
    } else {
        const key = Object.keys(MODULES)
            .find(k => `section-${k}` === targetId);
        if (key === "product") {
            const q = (document.getElementById("search-product") || {}).value || "";
            fillProductCategoryFilter().then(() => loadTable("product", q));
        } else if (key) {
            loadTable(key);
        }
    }
}

/* ============================================================
   DASHBOARD → SECTION NAVIGATION
============================================================ */

function goToSection(targetId, tabId = null) {

    const navBtn = document.querySelector(`.nav-link[data-target="${targetId}"]`);
    if (navBtn) {
        navBtn.click();
    } else {
        switchSection(targetId);
    }

    if (tabId) {
        requestAnimationFrame(() => {
            const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
            if (tabBtn) tabBtn.click();
        });
    }
}

/* ============================================================
   SUPPLIER PRODUCTS
============================================================ */

let currentSupplierIDForProducts = null;

let spAll = [];
let spLinkedRows = [];
let spLinked = new Map();
let spStaged = new Set();
let spCat = "All";
let spBound = false;
let spToastTimer = null;

const spCatOf = (p) => p.CategoryName || "Uncategorized";

function spToast(message) {
    const el = document.getElementById("sp-toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(spToastTimer);
    spToastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

function spAvailable() {
    const q = (document.getElementById("sp-search").value || "").trim().toLowerCase();

    return spAll.filter(p =>
        !spLinked.has(Number(p.ProductID)) &&
        (spCat === "All" || spCatOf(p) === spCat) &&
        (
            !q ||
            String(p.ProductName || "").toLowerCase().includes(q) ||
            String(p.Barcode || "").toLowerCase().includes(q)
        )
    );
}

function spRender() {

    const unlinked = spAll.filter(p => !spLinked.has(Number(p.ProductID)));

    const counts = {};
    unlinked.forEach(p => {
        const c = spCatOf(p);
        counts[c] = (counts[c] || 0) + 1;
    });

    if (spCat !== "All" && !counts[spCat]) spCat = "All";

    const unlinkedIds = new Set(unlinked.map(p => Number(p.ProductID)));
    spStaged.forEach(id => { if (!unlinkedIds.has(id)) spStaged.delete(id); });

    document.getElementById("sp-chips").innerHTML =
        ["All", ...Object.keys(counts).sort()].map(c => {
            const n = c === "All" ? unlinked.length : counts[c];
            return `<button type="button" class="sp-chip ${c === spCat ? "active" : ""}"
                        data-cat="${esc(c)}">${esc(c)} · ${n}</button>`;
        }).join("");

    const av = spAvailable();

    document.getElementById("sp-grid").innerHTML = av.length
        ? av.map(p => {
            const id = Number(p.ProductID);
            const on = spStaged.has(id);
            return `
                <div class="sp-card ${on ? "selected" : ""}" data-id="${id}">
                    <span class="sp-card-check">${on ? "✓" : ""}</span>
                    <span class="sp-card-name">${esc(p.ProductName)}</span>
                    <span class="sp-card-cat">${esc(spCatOf(p))}</span>
                </div>`;
        }).join("")
        : `<div class="sp-empty">${
            unlinked.length ? "No matching products." : "All products are already added."
        }</div>`;

    const selectedShown = av.filter(p => spStaged.has(Number(p.ProductID))).length;
    const allBox = document.getElementById("sp-select-all");

    allBox.disabled = !av.length;
    allBox.checked = av.length > 0 && selectedShown === av.length;
    allBox.indeterminate = selectedShown > 0 && selectedShown < av.length;

    document.getElementById("sp-select-all-text").textContent =
        spCat === "All" ? "Select all" : `Select all in ${spCat}`;
    document.getElementById("sp-bar-info").textContent =
        `${selectedShown} of ${av.length} shown`;

    document.getElementById("sp-linked-title").textContent =
        `In this supplier (${spLinkedRows.length})`;
    document.getElementById("sp-remove-all").style.display =
        spLinkedRows.length ? "" : "none";

    document.getElementById("sp-tray").innerHTML = spLinkedRows.length
        ? spLinkedRows.map(r => `
            <span class="sp-pill">${esc(r.ProductName)}
                <button type="button" title="Remove"
                        data-remove="${Number(r.SupplierProductID)}">×</button>
            </span>`).join("")
        : `<span class="sp-none">No products linked yet.</span>`;

    const addBtn = document.getElementById("btn-sp-add");
    addBtn.disabled = spStaged.size === 0;
    addBtn.textContent = spStaged.size ? `+ Add ${spStaged.size} selected` : "+ Add selected";
    document.getElementById("sp-selected-count").textContent = `${spStaged.size} selected`;
}

async function spReloadLinked() {

    const result = await callApi("getSupplierProducts", {
        SupplierID: currentSupplierIDForProducts
    });

    if (!result.success) {
        showErrorModal(result.message);
        return;
    }

    spLinkedRows = result.data || [];
    spLinked = new Map(
        spLinkedRows.map(r => [Number(r.ProductID), Number(r.SupplierProductID)])
    );

    spRender();
}

function spBindOnce() {

    if (spBound) return;
    spBound = true;

    document.getElementById("sp-search").addEventListener("input", spRender);

    document.getElementById("sp-chips").addEventListener("click", (e) => {
        const chip = e.target.closest(".sp-chip");
        if (!chip) return;
        spCat = chip.dataset.cat;
        spRender();
    });

    document.getElementById("sp-grid").addEventListener("click", (e) => {
        const card = e.target.closest(".sp-card");
        if (!card) return;
        const id = Number(card.dataset.id);
        spStaged.has(id) ? spStaged.delete(id) : spStaged.add(id);
        spRender();
    });

    document.getElementById("sp-select-all").addEventListener("change", (e) => {
        spAvailable().forEach(p => {
            const id = Number(p.ProductID);
            e.target.checked ? spStaged.add(id) : spStaged.delete(id);
        });
        spRender();
    });

    document.getElementById("btn-sp-add").addEventListener("click", addSupplierProduct);

    document.getElementById("sp-tray").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-remove]");
        if (btn) removeSupplierProduct(Number(btn.dataset.remove));
    });

    document.getElementById("sp-remove-all").addEventListener("click", removeAllSupplierProducts);

    document.getElementById("supplier-products-modal-overlay")
        .addEventListener("click", (e) => {
            if (e.target.id === "supplier-products-modal-overlay") closeSupplierProductsModal();
        });
}

async function openSupplierProductsModal(supplierId, supplierName) {

    spBindOnce();

    currentSupplierIDForProducts = supplierId;
    spAll = [];
    spLinkedRows = [];
    spLinked = new Map();
    spStaged = new Set();
    spCat = "All";

    document.getElementById("supplier-products-modal-title").textContent =
        `Products — ${supplierName}`;
    document.getElementById("sp-search").value = "";
    document.getElementById("sp-grid").innerHTML =
        `<div class="sp-empty">Loading...</div>`;
    document.getElementById("sp-tray").innerHTML = "";
    document.getElementById("supplier-products-modal-overlay").classList.add("open");

    const [productsRes, linkedRes] = await Promise.all([
        callApi("getProducts", { search: "" }),
        callApi("getSupplierProducts", { SupplierID: supplierId })
    ]);

    if (!productsRes.success || !linkedRes.success) {
        showErrorModal(productsRes.message || linkedRes.message || "Failed to load products.");
        closeSupplierProductsModal();
        return;
    }

    spAll = (productsRes.data || []).filter(p => p.IsArchived !== "Yes");
    spLinkedRows = linkedRes.data || [];
    spLinked = new Map(
        spLinkedRows.map(r => [Number(r.ProductID), Number(r.SupplierProductID)])
    );

    spRender();
}

async function addSupplierProduct() {

    if (!spStaged.size) return;

    const btn = document.getElementById("btn-sp-add");
    btn.disabled = true;

    const result = await callApi("insertSupplierProducts", {
        SupplierID: currentSupplierIDForProducts,
        ProductIDs: [...spStaged]
    });

    if (!result.success) {
        showErrorModal(result.message);
        spRender();
        return;
    }

    spStaged.clear();
    await spReloadLinked();
    spToast(result.message || "Products added.");
    loadAuditLog();
}

async function removeSupplierProduct(supplierProductId) {

    const result = await callApi("deleteSupplierProduct", {
        SupplierProductID: supplierProductId
    });

    if (!result.success) {
        showErrorModal(result.message);
        return;
    }

    await spReloadLinked();
    spToast("Product removed.");
    loadAuditLog();
}

function removeAllSupplierProducts() {

    if (!spLinkedRows.length) return;

    openConfirmModal(
        `Remove all ${spLinkedRows.length} product(s) from this supplier?`,
        {
            title: "Remove All Products",
            warning: "You can add them back anytime.",
            confirmLabel: "Remove All",
            onConfirm: async () => {

                const result = await callApi("deleteAllSupplierProducts", {
                    SupplierID: currentSupplierIDForProducts
                });

                if (!result.success) {
                    showErrorModal(result.message);
                    return;
                }

                await spReloadLinked();
                spToast("All products removed.");
                loadAuditLog();
            }
        }
    );
}

function closeSupplierProductsModal() {
    document.getElementById("supplier-products-modal-overlay").classList.remove("open");
    currentSupplierIDForProducts = null;
    spStaged.clear();
}

/* ============================================================
   SEARCH SETUP
============================================================ */

function setupSearches() {

    Object.entries(MODULES).forEach(([key, module]) => {

        const input = document.getElementById(module.searchInput);
        if (!input) return;

        let timer = null;

        input.addEventListener("input", () => {
            clearTimeout(timer);
            timer = setTimeout(() => loadTable(key, input.value), 300);
        });
    });

    const auditSearch = document.getElementById("search-audit");

    if (auditSearch) {
        let timer = null;
        auditSearch.addEventListener("input", () => {
            clearTimeout(timer);
            timer = setTimeout(() => loadAuditLog(auditSearch.value), 300);
        });
    }

    // Stop the browser from autofilling saved logins into search / filter boxes
    document.querySelectorAll(".search-input, .filter-field input").forEach(el => {
        el.setAttribute("autocomplete", "off");
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
    if (sidebar.classList.contains("sidebar-open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

/* ============================================================
   SIDEBAR PROFILE MENU (Log Out)
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

    openConfirmModal(
        "Are you sure you want to log out?",
        {
            title: "Log Out",
            warning: "You will need to sign in again to access the admin panel.",
            confirmLabel: "Log Out",
            onConfirm: () => {
                logout();
            }
        }
    );
}

/* ============================================================
   INIT
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    if (!isAdminUser(currentUser)) return;

    document.querySelectorAll(".nav-link").forEach(btn => {
        btn.addEventListener("click", () => switchSection(btn.dataset.target));
    });

    /* ---------- Transaction Tabs ---------- */
    document.querySelectorAll("#section-transactions .tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#section-transactions .tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll("#section-transactions .tab-panel").forEach(p => p.classList.remove("active-tab"));
            btn.classList.add("active");
            const tab = document.getElementById(btn.dataset.tab);
            if (tab) tab.classList.add("active-tab");
        });
    });

    /* ---------- Storage Location Tabs ---------- */
    document.querySelectorAll(".tab-btn[data-storage-tab]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn[data-storage-tab]").forEach(b => b.classList.remove("active"));
            document.querySelectorAll("#section-storage-location .tab-panel").forEach(p => p.classList.remove("active-tab"));
            btn.classList.add("active");
            const tab = document.getElementById(btn.dataset.storageTab);
            if (tab) tab.classList.add("active-tab");
        });
    });

    setupSearches();
    wireStorageFilters();

    const prodCat = document.getElementById("filter-product-category");
    if (prodCat) {
        prodCat.addEventListener("change", () =>
            loadTable("product", document.getElementById("search-product").value));
    }

    /* ---------- Audit Log ---------- */
    setupAuditLogUI();

    const displayName = (
        currentUser?.FirstName || currentUser?.UserName || "Admin"
    );
    const fullDisplayName = currentUser?.FirstName
        ? `${currentUser.FirstName} ${currentUser.LastName || ""}`.trim()
        : (currentUser?.UserName || "Admin");

    const welcome = document.getElementById("welcome-text");
    if (welcome) welcome.textContent = `Welcome, ${displayName}`;

    const profileName = document.getElementById("sidebar-profile-name");
    if (profileName) profileName.textContent = fullDisplayName;

    const profileRole = document.getElementById("sidebar-profile-role");
    if (profileRole) profileRole.textContent = currentUser?.RoleName || "Administrator";

    const profileAvatar = document.getElementById("sidebar-profile-avatar");
    if (profileAvatar) {
        profileAvatar.textContent = fullDisplayName.trim().charAt(0).toUpperCase() || "A";
    }

    const hamburger = document.getElementById("hamburger-btn");
    if (hamburger) {
        hamburger.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) {
        backdrop.addEventListener("click", closeSidebar);
    }

    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebarEl = document.getElementById("sidebar");

    if (sidebarToggle && sidebarEl) {

        const savedState = localStorage.getItem("sidebarCollapsed");
        if (savedState === "true") {
            sidebarEl.classList.add("collapsed");
            sidebarToggle.setAttribute("title", "Expand sidebar");
        }

        sidebarToggle.addEventListener("click", () => {
            sidebarEl.classList.toggle("collapsed");

            const isCollapsed = sidebarEl.classList.contains("collapsed");
            sidebarToggle.setAttribute(
                "title",
                isCollapsed ? "Expand sidebar" : "Collapse sidebar"
            );

            localStorage.setItem("sidebarCollapsed", isCollapsed ? "true" : "false");
            closeProfileMenu();

            handleDashboardResize();
            setTimeout(() => {
                if (chartProductsCategory) chartProductsCategory.resize();
                if (chartPoStatus) chartPoStatus.resize();
            }, 300);
        });
    }

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
        if (profileEl && !profileEl.contains(e.target)) {
            closeProfileMenu();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeProfileMenu();
    });

    const saveBtn = document.getElementById("btn-save-record");
    if (saveBtn) saveBtn.addEventListener("click", saveRecord);

    const overlay = document.getElementById("modal-overlay");
    if (overlay) {
        overlay.addEventListener("click", e => {
            if (e.target.id === "modal-overlay") closeFormModal();
        });
    }

    const confirmBtn = document.getElementById("btn-confirm-action");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", () => {
            const callback = confirmActionCallback;
            closeConfirmModal(false);
            if (callback) callback();
        });
    }

    const confirmOverlay = document.getElementById("confirm-modal-overlay");
    if (confirmOverlay) {
        confirmOverlay.addEventListener("click", e => {
            if (e.target.id === "confirm-modal-overlay") {
                closeConfirmModal(true);
            }
        });
    }

    const archivedOverlay = document.getElementById("archived-modal-overlay");
    if (archivedOverlay) {
        archivedOverlay.addEventListener("click", e => {
            if (e.target.id === "archived-modal-overlay") closeArchivedModal();
        });
    }

    const detailsOverlay = document.getElementById("details-modal-overlay");
    if (detailsOverlay) {
        detailsOverlay.addEventListener("click", e => {
            if (e.target.id === "details-modal-overlay") closeDetailsModal();
        });
    }

    const messageOverlay = document.getElementById("message-modal-overlay");
    if (messageOverlay) {
        messageOverlay.addEventListener("click", e => {
            if (e.target.id === "message-modal-overlay") hideMessageModal();
        });
    }

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") hideMessageModal();
    });

    loadDashboard();
});
