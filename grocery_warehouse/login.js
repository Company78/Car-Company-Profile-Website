const baseApiUrl = "api.php";

/* ============================================================
   ROLE ROUTING
   1. RoleID ang primary (base sa role table)
   2. RoleName ang fallback

   1 = Administrator
   2 = Warehouse Manager
   3 = Inventory staff
   4 = Purchasing Officer
   5 = Receiving Staff
   7 = inventory clerk
   8 = Releasing Staff
============================================================ */

const ROLE_ID_PAGES = {
    1: "admin.html",
    2: "manager_dashboard.html",
    3: "inventory.html",
    4: "purchasing.html",
    5: "receiving_dashboard.html",
    7: "inventory.html",
    8: "releasing.html"
};

function normalizeRole(name) {
    return String(name || "").toLowerCase().replace(/[^a-z]/g, "");
}

function pageForRole(user) {

    const byID = ROLE_ID_PAGES[Number(user.RoleID)];
    if (byID) return byID;

    const role = normalizeRole(user.RoleName);

    if (role.includes("admin")) return "admin.html";
    if (role.includes("purchas")) return "purchasing.html";
    if (role.includes("inventory")) return "inventory.html";
    if (role.includes("manager")) return "manager_dashboard.html";
    if (role.includes("receiv")) return "receiving_dashboard.html";
    if (role.includes("releas")) return "releasing.html";

    return null;
}

/* ============================================================
   ALERT MODAL (puli sa browser alert())
============================================================ */

let alertReturnFocusEl = null;

function showAlert(message, title = "Notice") {
    const overlay = document.getElementById("alert-modal-overlay");
    const titleEl = document.getElementById("alert-modal-title");
    const msgEl   = document.getElementById("alert-message");
    const okBtn   = document.getElementById("alert-modal-ok");

    if (!overlay || !titleEl || !msgEl) {
        console.warn("Alert modal not found:", message);
        return;
    }

    alertReturnFocusEl = document.activeElement;

    titleEl.textContent = title;
    msgEl.textContent = message;
    overlay.classList.add("open");

    if (okBtn) okBtn.focus();
}

function closeAlert() {
    const overlay = document.getElementById("alert-modal-overlay");
    if (overlay) overlay.classList.remove("open");

    if (alertReturnFocusEl && typeof alertReturnFocusEl.focus === "function") {
        alertReturnFocusEl.focus();
    }
    alertReturnFocusEl = null;
}

function wireAlertModal() {
    const overlay  = document.getElementById("alert-modal-overlay");
    const okBtn    = document.getElementById("alert-modal-ok");
    const closeBtn = document.getElementById("alert-modal-close");

    if (okBtn)    okBtn.addEventListener("click", closeAlert);
    if (closeBtn) closeBtn.addEventListener("click", closeAlert);

    // click sa dark nga background = close
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeAlert();
        });
    }

    // Escape = close
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay && overlay.classList.contains("open")) {
            closeAlert();
        }
    });
}

function isAlertOpen() {
    const overlay = document.getElementById("alert-modal-overlay");
    return !!(overlay && overlay.classList.contains("open"));
}

/* ============================================================
   API CALL (axios + operation + json)
============================================================ */

async function apiCall(operation, payload = {}) {

    const formData = new FormData();
    formData.append("operation", operation);
    formData.append("json", JSON.stringify(payload));

    try {
        const res = await axios.post(baseApiUrl, formData);

        if (!res.data || typeof res.data !== "object") {
            console.error("Non-JSON response:", res.data);
            return { success: false, message: "Server returned an invalid response.", data: null };
        }

        return res.data;

    } catch (error) {
        console.error("API ERROR:", operation, error);
        return {
            success: false,
            message: error?.response?.data?.message || "Cannot connect to api.php. Make sure Apache and MySQL are running.",
            data: null
        };
    }
}

/* ============================================================
   LOGIN
============================================================ */

async function login() {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (username === "" || password === "") {
        showAlert("Please enter username and password.", "Missing Information");
        return;
    }

    const res = await apiCall("login", {
        username: username,
        password: password
    });

    if (!res.success || !res.data) {
        showAlert(res.message || "Invalid username or password.", "Login Failed");
        return;
    }

    const user = res.data;
    const page = pageForRole(user);

    if (!page) {
        showAlert(
            "No dashboard is available for this role.\n" +
            "RoleID: " + user.RoleID + "\n" +
            "RoleName: " + user.RoleName,
            "No Dashboard Available"
        );
        return;
    }

    sessionStorage.setItem("user", JSON.stringify(user));
    window.location.replace(page);
}

/* ============================================================
   INIT
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    const loginButton   = document.getElementById("btn-login");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    wireAlertModal();

    if (loginButton) loginButton.addEventListener("click", login);

    [usernameInput, passwordInput].forEach(input => {
        if (input) {
            input.addEventListener("keyup", (e) => {
                // Dili mo-login pag-usab kung ang Enter gi-press aron i-close ang alert
                if (e.key === "Enter" && !isAlertOpen()) login();
            });
        }
    });
});