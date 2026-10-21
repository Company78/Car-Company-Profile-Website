/* ============================================================
   NOTIFICATIONS — bell + floating dropdown (self-contained)
============================================================ */
(function () {
    "use strict";

    var API_URL     = window.NOTIF_API_URL || "api_notifications.php";
    var MANAGER_URL = window.NOTIF_MANAGER_API_URL || "api_manager.php";
    var POLL_MS     = window.NOTIF_POLL_MS || 15000;

    var ACTIONS = {
        purchase_order:       { approve: "approvePurchaseOrder",  reject: "rejectPurchaseOrder",  idField: "PO_ID",              label: "Purchase Order" },
        purchase_return:      { approve: "approvePurchaseReturn", reject: "rejectPurchaseReturn", idField: "Purchase_Return_ID", label: "Purchase Return" },
        receiving:            { approve: "approveReceiving",      reject: "rejectReceiving",      idField: "ReceivingID",        label: "Receiving" },
        stock_release:        { approve: "approveStockRelease",   reject: "rejectStockRelease",   idField: "ReleaseID",          label: "Stock Release" },
        stock_return:         { approve: "approveStockReturn",    reject: "rejectStockReturn",    idField: "Stock_Return_ID",    label: "Stock Return" },
        inventory_adjustment: { approve: "approveAdjustment",     reject: "rejectAdjustment",     idField: "Adjustment_ID",      label: "Inventory Adjustment" }
    };

    var CSS = [
        ".gwn-wrap{display:inline-flex;position:relative;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;}",
        ".gwn-wrap.gwn-floating{position:fixed;top:12px;right:16px;z-index:9000;}",
        ".gwn-bell{position:relative;width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:background .15s;}",
        ".gwn-bell:hover{background:rgba(255,255,255,.24);}",
        ".gwn-floating .gwn-bell{background:#12331F;}",
        ".gwn-badge{position:absolute;top:-3px;right:-3px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#E11D48;color:#fff;font-size:10.5px;font-weight:700;line-height:17px;text-align:center;box-sizing:border-box;}",
        ".gwn-badge[hidden]{display:none;}",

        ".gwn-panel{position:fixed;top:60px;right:16px;width:340px;max-width:calc(100vw - 16px);background:#fff;border:1px solid #cfe9d8;border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.22);z-index:99000;overflow:hidden;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#12331F;text-align:left;}",
        ".gwn-panel[hidden]{display:none;}",
        ".gwn-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#E3F7EA;border-bottom:1px solid #cfe9d8;}",
        ".gwn-head h3{margin:0;font-size:13.5px;font-weight:800;color:#12331F;}",
        ".gwn-markall{background:none;border:0;padding:0;color:#15803D;font-size:12px;font-weight:700;cursor:pointer;}",
        ".gwn-markall:hover{text-decoration:underline;}",

        ".gwn-list{max-height:330px;overflow-y:auto;scrollbar-width:thin;}",
        ".gwn-list.gwn-expanded{max-height:min(68vh,560px);}",
        ".gwn-empty{padding:30px 16px;text-align:center;font-size:12.5px;color:#6B8A78;}",

        ".gwn-item{position:relative;display:flex;align-items:flex-start;gap:10px;padding:11px 26px 11px 14px;border-bottom:1px solid #EEF3F0;cursor:pointer;}",
        ".gwn-item:hover{background:#F4FAF6;}",
        ".gwn-item.unread{background:#EAF8EF;}",
        ".gwn-item.unread:hover{background:#DFF3E7;}",
        ".gwn-ico{flex:0 0 auto;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;}",
        ".gwn-ico.amber{background:#FFF1DB;} .gwn-ico.red{background:#FDE2E2;} .gwn-ico.blue{background:#E4E9FB;} .gwn-ico.green{background:#DCFCE7;} .gwn-ico.gray{background:#E8ECEA;}",
        ".gwn-body{flex:1;min-width:0;}",
        ".gwn-title{font-size:12.5px;font-weight:700;color:#12331F;line-height:1.3;}",
        ".gwn-msg{margin-top:2px;font-size:11.5px;line-height:1.4;color:#4B6B57;word-break:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
        ".gwn-time{margin-top:2px;font-size:11px;color:#7C9A87;}",
        ".gwn-dot{position:absolute;right:10px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:#16A34A;}",

        ".gwn-actions{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:7px;}",
        ".gwn-btn{border:1px solid #CBD5D0;background:#fff;color:#1F2937;padding:4px 11px;border-radius:6px;font-size:11.5px;font-weight:600;cursor:pointer;font-family:inherit;}",
        ".gwn-btn:hover{background:#F3F6F4;}",
        ".gwn-btn.primary{background:#16A34A;border-color:#16A34A;color:#fff;} .gwn-btn.primary:hover{background:#15803D;}",
        ".gwn-btn.danger{border-color:#FCA5A5;color:#B91C1C;} .gwn-btn.danger:hover{background:#FEE2E2;}",
        ".gwn-confirm{font-size:11.5px;font-weight:600;color:#12331F;}",
        ".gwn-working{font-size:11.5px;color:#6B8A78;}",
        ".gwn-status{margin-top:5px;font-size:11.5px;color:#4B6B57;}",

        ".gwn-foot{padding:10px;text-align:center;border-top:1px solid #E3EFE7;background:#fff;}",
        ".gwn-viewall{background:none;border:0;color:#15803D;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}",
        ".gwn-viewall:hover{text-decoration:underline;}",

        ".gwn-toasts{position:fixed;top:68px;right:16px;z-index:99500;display:flex;flex-direction:column;gap:10px;pointer-events:none;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;}",
        ".gwn-toast{pointer-events:auto;display:flex;align-items:flex-start;gap:10px;width:320px;max-width:calc(100vw - 24px);padding:11px 13px;background:#fff;border:1px solid #cfe9d8;border-left:4px solid #16A34A;border-radius:10px;box-shadow:0 10px 28px rgba(0,0,0,.22);cursor:pointer;animation:gwnIn .25s ease-out;transition:opacity .3s,transform .3s;}",
        ".gwn-toast.out{opacity:0;transform:translateX(20px);}",
        "@keyframes gwnIn{from{opacity:0;transform:translateX(24px);}to{opacity:1;transform:none;}}",

        ".topbar-user{display:flex;align-items:center;gap:12px;overflow:visible !important;}",

        "@media (max-width:520px){.gwn-toasts{left:10px;right:10px;} .gwn-toast{width:auto;max-width:none;}}"
    ].join("\n");

    var state = {
        user: null, items: [], unread: 0, open: false, expanded: false,
        lastSeenID: null, fetchedAt: Date.now(), pendingConfirm: null, busy: {}
    };
    var els = {};

    /* ---------------- helpers ---------------- */

    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function loadUser() {
        try {
            var raw = sessionStorage.getItem("user");
            if (!raw) return null;
            var u = JSON.parse(raw);
            return u && u.UserID ? u : null;
        } catch (e) { return null; }
    }

    function isManagerRole() {
        var r = String((state.user && state.user.RoleName) || "").toLowerCase();
        return r.indexOf("manager") !== -1 || r.indexOf("admin") !== -1;
    }

    function isPendingStatus(s) {
        s = String(s || "").toLowerCase().trim();
        return s === "pending" || s === "for review" || s === "submitted" || s === "";
    }

    function timeAgo(item) {
        var secs = (item.AgeSeconds || 0) + Math.floor((Date.now() - state.fetchedAt) / 1000);
        if (secs < 60) return "Just now";
        var m = Math.floor(secs / 60);
        if (m < 60) return m + " min ago";
        var h = Math.floor(m / 60);
        if (h < 24) return h + " hr ago";
        var d = Math.floor(h / 24);
        if (d === 1) return "Yesterday";
        if (d < 7) return d + " days ago";
        return Math.floor(d / 7) + " wk ago";
    }

    function iconFor(type) {
        type = String(type || "");
        if (type === "zero_stock")      return { cls: "red",   glyph: "\uD83D\uDCE6" };
        if (type === "po_incoming")     return { cls: "amber", glyph: "\uD83D\uDE9A" };
        if (type === "rcv_stock_in")    return { cls: "blue",  glyph: "\uD83D\uDCE5" };
        if (type === "po_received" || /_completed$/.test(type)) return { cls: "green", glyph: "\u2705" };
        if (/_pending$/.test(type))     return { cls: "blue",  glyph: "\uD83D\uDCCB" };
        if (/_approved$/.test(type))    return { cls: "green", glyph: "\u2705" };
        if (/_rejected$/.test(type))    return { cls: "red",   glyph: "\u274C" };
        if (/_cancelled$/.test(type))   return { cls: "gray",  glyph: "\uD83D\uDEAB" };
        return { cls: "blue", glyph: "\uD83D\uDD14" };
    }

    function post(url, op, payload) {
        var body = Object.assign({ operation: op, LoggedInUserID: state.user ? state.user.UserID : 0 }, payload || {});
        return fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }).then(function (r) { return r.text(); }).then(function (txt) {
            var i = txt.indexOf('{"success"');
            try { return JSON.parse(i >= 0 ? txt.slice(i) : txt); }
            catch (e) { return { success: false, message: "Invalid server response.", data: null }; }
        }).catch(function () {
            return { success: false, message: "Cannot connect to the server.", data: null };
        });
    }

    /* ---------------- build UI ---------------- */

    function build() {
        var st = document.createElement("style");
        st.id = "gwn-styles";
        st.textContent = CSS;
        document.head.appendChild(st);

        var host = document.querySelector(".topbar-user");
        var wrap = document.createElement("div");
        wrap.className = "gwn-wrap" + (host ? "" : " gwn-floating");
        wrap.innerHTML =
            '<button type="button" class="gwn-bell" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">' +
                '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' +
                '</svg>' +
                '<span class="gwn-badge" hidden>0</span>' +
            '</button>';
        if (host) host.insertBefore(wrap, host.firstChild);
        else document.body.appendChild(wrap);

        var panel = document.createElement("div");
        panel.className = "gwn-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-label", "Notifications");
        panel.hidden = true;
        panel.innerHTML =
            '<div class="gwn-head"><h3 class="gwn-title-count">Notifications</h3>' +
                '<button type="button" class="gwn-markall">Mark all read</button></div>' +
            '<div class="gwn-list"></div>' +
            '<div class="gwn-foot"><button type="button" class="gwn-viewall">View all notifications</button></div>';
        document.body.appendChild(panel);

        var toasts = document.createElement("div");
        toasts.className = "gwn-toasts";
        document.body.appendChild(toasts);

        els.bell     = wrap.querySelector(".gwn-bell");
        els.badge    = wrap.querySelector(".gwn-badge");
        els.panel    = panel;
        els.heading  = panel.querySelector(".gwn-title-count");
        els.list     = panel.querySelector(".gwn-list");
        els.viewAll  = panel.querySelector(".gwn-viewall");
        els.toasts   = toasts;

        els.bell.addEventListener("click", function (e) { e.stopPropagation(); togglePanel(); });
        panel.addEventListener("click", function (e) { e.stopPropagation(); });
        panel.querySelector(".gwn-markall").addEventListener("click", markAllRead);
        els.viewAll.addEventListener("click", function () {
            state.expanded = !state.expanded;
            els.list.classList.toggle("gwn-expanded", state.expanded);
            els.viewAll.textContent = state.expanded ? "Show less" : "View all notifications";
            refresh();
        });
        els.list.addEventListener("click", onListClick);

        document.addEventListener("click", function () { if (state.open) togglePanel(false); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && state.open) togglePanel(false); });
        window.addEventListener("resize", function () { if (state.open) positionPanel(); });
        window.addEventListener("scroll", function () { if (state.open) positionPanel(); }, true);
    }

    function positionPanel() {
        var r = els.bell.getBoundingClientRect();
        var p = els.panel.style;
        p.top = (r.bottom + 10) + "px";
        if (window.innerWidth <= 520) {
            p.left = "8px"; p.right = "8px"; p.width = "auto";
        } else {
            p.left = "auto"; p.width = "";
            p.right = Math.max(8, window.innerWidth - r.right - 4) + "px";
        }
    }

    function togglePanel(force) {
        state.open = typeof force === "boolean" ? force : !state.open;
        els.panel.hidden = !state.open;
        els.bell.setAttribute("aria-expanded", state.open ? "true" : "false");
        if (state.open) { positionPanel(); refresh(); }
    }

    /* ---------------- render ---------------- */

    function actionsHtml(it) {
        var cfg = ACTIONS[it.RefTable];
        if (!cfg || !/_pending$/.test(it.NotificationType) || !isManagerRole()) return "";

        if (!isPendingStatus(it.RefStatus)) {
            return '<div class="gwn-status">Status: <strong>' + esc(it.RefStatus) + "</strong></div>";
        }
        if (state.busy[it.NotificationID]) {
            return '<div class="gwn-actions"><span class="gwn-working">Working\u2026</span></div>';
        }

        var pc = state.pendingConfirm;
        if (pc && pc.id === it.NotificationID) {
            var verb = pc.action === "approve" ? "Approve" : "Reject";
            return '<div class="gwn-actions">' +
                '<span class="gwn-confirm">' + verb + " " + esc(cfg.label) + " #" + it.RefID + "?</span>" +
                '<button type="button" class="gwn-btn ' + (pc.action === "approve" ? "primary" : "danger") + '" data-act="confirm" data-id="' + it.NotificationID + '">Yes</button>' +
                '<button type="button" class="gwn-btn" data-act="cancel" data-id="' + it.NotificationID + '">No</button></div>';
        }

        return '<div class="gwn-actions">' +
            '<button type="button" class="gwn-btn primary" data-act="approve" data-id="' + it.NotificationID + '">Approve</button>' +
            '<button type="button" class="gwn-btn danger" data-act="reject" data-id="' + it.NotificationID + '">Reject</button>' +
            '<button type="button" class="gwn-btn" data-act="view" data-id="' + it.NotificationID + '">View</button></div>';
    }

    function render() {
        if (state.unread > 0) {
            els.badge.hidden = false;
            els.badge.textContent = state.unread > 99 ? "99+" : String(state.unread);
        } else {
            els.badge.hidden = true;
        }
        els.heading.textContent = "Notifications" + (state.unread > 0 ? " (" + state.unread + ")" : "");

        if (!state.items.length) {
            els.list.innerHTML = '<div class="gwn-empty">No notifications yet.</div>';
            return;
        }

        els.list.innerHTML = state.items.map(function (it) {
            var ic = iconFor(it.NotificationType);
            var unread = it.IsRead === "No";
            return '<div class="gwn-item' + (unread ? " unread" : "") + '" data-act="open" data-id="' + it.NotificationID + '">' +
                '<div class="gwn-ico ' + ic.cls + '">' + ic.glyph + "</div>" +
                '<div class="gwn-body">' +
                    '<div class="gwn-title">' + esc(it.Title) + "</div>" +
                    '<div class="gwn-msg">' + esc(it.Message) + "</div>" +
                    '<div class="gwn-time">' + timeAgo(it) + "</div>" +
                    actionsHtml(it) +
                "</div>" +
                (unread ? '<span class="gwn-dot"></span>' : "") +
            "</div>";
        }).join("");
    }

    /* ---------------- data ---------------- */

    function refresh() {
        if (!state.user) return Promise.resolve();

        return post(API_URL, "getNotifications", { filter: "all", limit: state.expanded ? 100 : 20 }).then(function (res) {
            if (!res || !res.success || !res.data) return;

            var items = res.data.items || [];
            var maxID = items.reduce(function (m, i) { return Math.max(m, i.NotificationID); }, 0);

            if (state.lastSeenID !== null) {
                items.filter(function (i) { return i.NotificationID > state.lastSeenID && i.IsRead === "No"; })
                     .slice(0, 3).reverse().forEach(showToast);
            }
            state.lastSeenID = Math.max(state.lastSeenID || 0, maxID);

            state.items = items;
            state.unread = res.data.unreadCount || 0;
            state.fetchedAt = Date.now();
            render();
        });
    }

    function findItem(id) {
        for (var i = 0; i < state.items.length; i++) if (state.items[i].NotificationID === id) return state.items[i];
        return null;
    }

    function markRead(it) {
        if (!it || it.IsRead === "Yes") return Promise.resolve();
        it.IsRead = "Yes";
        state.unread = Math.max(0, state.unread - 1);
        render();
        return post(API_URL, "markNotificationRead", { NotificationID: it.NotificationID });
    }

    function markAllRead() {
        state.items.forEach(function (i) { i.IsRead = "Yes"; });
        state.unread = 0;
        render();
        post(API_URL, "markAllNotificationsRead");
    }

    /* ---------------- interactions ---------------- */

    function openItem(it) {
        markRead(it);

        if (typeof window.onNotificationOpen === "function") {
            try { if (window.onNotificationOpen(it) === true) { togglePanel(false); return; } } catch (e) {}
        }

        if (it.RefTable && ACTIONS[it.RefTable] && typeof window.openTransactionDetails === "function") {
            togglePanel(false);
            window.openTransactionDetails(it.RefTable, it.RefID);
            return;
        }

        document.dispatchEvent(new CustomEvent("notification:open", { detail: it }));
    }

    function decide(it, action) {
        var cfg = ACTIONS[it.RefTable];
        if (!cfg) return;

        state.busy[it.NotificationID] = true;
        state.pendingConfirm = null;
        render();

        var payload = {};
        payload[cfg.idField] = it.RefID;
        if (action === "reject") payload.Reason = "";

        post(MANAGER_URL, action === "approve" ? cfg.approve : cfg.reject, payload).then(function (res) {
            delete state.busy[it.NotificationID];

            if (!res || !res.success) {
                render();
                alert((res && res.message) || "Action failed.");
                return;
            }

            it.IsRead = "Yes";
            return post(API_URL, "markNotificationRead", { NotificationID: it.NotificationID }).then(refresh).then(function () {
                if (typeof window.loadDashboard === "function") { try { window.loadDashboard(); } catch (e) {} }
            });
        });
    }

    function onListClick(e) {
        var t = e.target.closest("[data-act]");
        if (!t) return;

        var id = parseInt(t.getAttribute("data-id"), 10);
        var it = findItem(id);
        if (!it) return;

        var act = t.getAttribute("data-act");

        if (act === "open" || act === "view") { state.pendingConfirm = null; openItem(it); return; }
        if (act === "approve" || act === "reject") { state.pendingConfirm = { id: id, action: act }; render(); return; }
        if (act === "cancel") { state.pendingConfirm = null; render(); return; }
        if (act === "confirm" && state.pendingConfirm) { decide(it, state.pendingConfirm.action); }
    }

    function showToast(it) {
        var ic = iconFor(it.NotificationType);
        var el = document.createElement("div");
        el.className = "gwn-toast";
        el.innerHTML = '<div class="gwn-ico ' + ic.cls + '">' + ic.glyph + "</div>" +
            '<div class="gwn-body"><div class="gwn-title">' + esc(it.Title) + "</div>" +
            '<div class="gwn-msg">' + esc(it.Message) + "</div></div>";
        el.addEventListener("click", function () { el.remove(); togglePanel(true); });
        els.toasts.appendChild(el);
        setTimeout(function () { el.classList.add("out"); setTimeout(function () { el.remove(); }, 300); }, 7000);
    }

    /* ---------------- init ---------------- */

    function start() {
        state.user = loadUser();
        if (!state.user) return;

        build();
        refresh();

        setInterval(function () { if (!document.hidden) refresh(); }, POLL_MS);
        document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(); });
        setInterval(function () { if (state.open) render(); }, 60000);

        window.NotificationCenter = { refresh: refresh, open: function () { togglePanel(true); } };
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
})();