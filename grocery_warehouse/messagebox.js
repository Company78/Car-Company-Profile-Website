/* ============================================================
   messagebox.js  —  shared modal replacement for alert()/prompt()
   Self-contained: injects its own CSS + DOM, no CSS file edits needed.
   Include BEFORE the page's main script:
       <script src="messagebox.js"></script>

   API:
     showMessageModal(message, type = "info", onClose = null)
     showSuccessModal(message, onClose)
     showErrorModal(message, onClose)
     showWarningModal(message, onClose)
     showInfoModal(message, onClose)
     showPromptModal(title, message, onConfirm, { placeholder, okLabel })
     window.alert(...)  -> now opens the modal (type auto-detected)
============================================================ */
(function () {

    if (window.__gwMessageBox) return;
    window.__gwMessageBox = true;

    const STYLE = `
    .gw-msg-overlay{position:fixed;inset:0;background:rgba(5,46,22,.45);display:none;
        align-items:center;justify-content:center;z-index:99999;padding:16px;
        font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;}
    .gw-msg-overlay.open{display:flex;}
    .gw-msg-box{background:#fff;width:100%;max-width:420px;border-radius:14px;
        box-shadow:0 20px 50px rgba(0,0,0,.25);overflow:hidden;animation:gwMsgIn .15s ease-out;}
    @keyframes gwMsgIn{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
    .gw-msg-header{display:flex;align-items:center;justify-content:space-between;
        padding:14px 18px;border-bottom:1px solid #E4F6EC;}
    .gw-msg-header h3{margin:0;font-size:16px;color:#12331F;}
    .gw-msg-close{background:none;border:0;font-size:22px;line-height:1;cursor:pointer;color:#6B7280;}
    .gw-msg-body{padding:22px 20px;text-align:center;}
    .gw-msg-icon{width:52px;height:52px;border-radius:50%;margin:0 auto 12px;
        display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;}
    .gw-msg-icon.success{background:#DCFCE7;color:#166534;}
    .gw-msg-icon.error{background:#FEE2E2;color:#991B1B;}
    .gw-msg-icon.warning{background:#FEF3C7;color:#92400E;}
    .gw-msg-icon.info{background:#DBEAFE;color:#1E40AF;}
    .gw-msg-icon.prompt{display:none;}
    .gw-msg-text{margin:0;font-size:14.5px;line-height:1.5;color:#0F2419;
        white-space:pre-line;word-break:break-word;}
    .gw-msg-input{display:none;width:100%;margin-top:14px;padding:9px 11px;font:inherit;
        font-size:14px;border:1px solid #A6DDBB;border-radius:8px;resize:vertical;
        min-height:70px;box-sizing:border-box;}
    .gw-msg-input:focus{outline:2px solid #0E9F6E;outline-offset:0;}
    .gw-msg-footer{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px 16px;}
    .gw-msg-btn{padding:8px 18px;border-radius:8px;font:inherit;font-size:14px;font-weight:600;
        cursor:pointer;border:1px solid transparent;}
    .gw-msg-btn.ok{background:#0E9F6E;color:#fff;}
    .gw-msg-btn.ok:hover{background:#047857;}
    .gw-msg-btn.cancel{background:#fff;color:#374151;border-color:#D1D5DB;display:none;}
    .gw-msg-overlay.is-prompt .gw-msg-btn.cancel{display:inline-block;}
    .gw-msg-overlay.is-prompt .gw-msg-input{display:block;}
    .gw-msg-overlay.is-prompt .gw-msg-body{text-align:left;}
    `;

    const ICONS  = { success: "✔", error: "✖", warning: "⚠", info: "ℹ" };
    const TITLES = { success: "Success", error: "Error", warning: "Warning", info: "Message" };

    let overlay, titleEl, iconEl, textEl, inputEl, okBtn, cancelBtn;
    let active = null;
    const queue = [];

    function build() {
        if (overlay) return true;
        if (!document.body) return false;

        const st = document.createElement("style");
        st.textContent = STYLE;
        document.head.appendChild(st);

        overlay = document.createElement("div");
        overlay.className = "gw-msg-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.innerHTML = `
            <div class="gw-msg-box">
                <div class="gw-msg-header">
                    <h3 class="gw-msg-title">Message</h3>
                    <button type="button" class="gw-msg-close" aria-label="Close">&times;</button>
                </div>
                <div class="gw-msg-body">
                    <div class="gw-msg-icon info">ℹ</div>
                    <p class="gw-msg-text"></p>
                    <textarea class="gw-msg-input" rows="3"></textarea>
                </div>
                <div class="gw-msg-footer">
                    <button type="button" class="gw-msg-btn cancel">Cancel</button>
                    <button type="button" class="gw-msg-btn ok">OK</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        titleEl   = overlay.querySelector(".gw-msg-title");
        iconEl    = overlay.querySelector(".gw-msg-icon");
        textEl    = overlay.querySelector(".gw-msg-text");
        inputEl   = overlay.querySelector(".gw-msg-input");
        okBtn     = overlay.querySelector(".gw-msg-btn.ok");
        cancelBtn = overlay.querySelector(".gw-msg-btn.cancel");

        okBtn.addEventListener("click", () => finish(true));
        cancelBtn.addEventListener("click", () => finish(false));
        overlay.querySelector(".gw-msg-close").addEventListener("click", () => finish(false));
        overlay.addEventListener("click", (e) => { if (e.target === overlay) finish(false); });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && active) finish(false);
        });

        return true;
    }

    function next() {
        if (active || !queue.length) return;

        if (!build()) {
            document.addEventListener("DOMContentLoaded", next, { once: true });
            return;
        }

        active = queue.shift();

        const isPrompt = !!active.prompt;
        overlay.classList.toggle("is-prompt", isPrompt);

        titleEl.textContent = active.title || TITLES[active.type] || "Message";
        textEl.textContent  = active.message;

        iconEl.className   = "gw-msg-icon " + (isPrompt ? "prompt" : active.type);
        iconEl.textContent = ICONS[active.type] || "ℹ";

        inputEl.value = "";
        inputEl.placeholder = active.placeholder || "";
        okBtn.textContent = active.okLabel || "OK";

        overlay.classList.add("open");
        setTimeout(() => (isPrompt ? inputEl : okBtn).focus(), 30);
    }

    function finish(ok) {
        if (!active) return;
        const item = active;
        active = null;
        overlay.classList.remove("open");

        if (item.prompt) {
            if (ok && typeof item.onConfirm === "function") item.onConfirm(inputEl.value.trim());
        } else if (typeof item.onClose === "function") {
            item.onClose();
        }

        setTimeout(next, 0);
    }

    function guessType(message) {
        const t = String(message || "").toLowerCase();
        if (/fail|error|unable|cannot|can't|invalid|not found|insufficient|denied|exception/.test(t)) return "error";
        if (/^no\b|please|required|must|select|enter|more than|resolve|set the|allow|only/.test(t)) return "warning";
        if (/success|saved|complet|created|updated|released|cancel+ed|approved|restored|added|removed/.test(t)) return "success";
        return "info";
    }

    window.showMessageModal = function (message, type = "info", onClose = null) {
        queue.push({ message: String(message ?? ""), type, onClose });
        next();
    };
    window.showSuccessModal = (m, cb) => window.showMessageModal(m, "success", cb);
    window.showErrorModal   = (m, cb) => window.showMessageModal(m, "error", cb);
    window.showWarningModal = (m, cb) => window.showMessageModal(m, "warning", cb);
    window.showInfoModal    = (m, cb) => window.showMessageModal(m, "info", cb);

    window.showPromptModal = function (title, message, onConfirm, opts = {}) {
        queue.push({
            prompt: true,
            type: "info",
            title,
            message: String(message ?? ""),
            onConfirm,
            placeholder: opts.placeholder || "",
            okLabel: opts.okLabel || "Submit"
        });
        next();
    };

    /* Replace the native alert() everywhere */
    window.alert = function (message) {
        window.showMessageModal(message, guessType(message));
    };

})();