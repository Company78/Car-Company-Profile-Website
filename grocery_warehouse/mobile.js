/* =========================================================
   mobile.js — i-wrap ang matag table sa .table-scroll para
   ang table ra ang mo-scroll pa-kilid (dili ang tibuok page).
   I-link sa ubos sa </body>, WALA ang ubang script:
   <script src="mobile.js"></script>
========================================================= */
(function () {
    // Naa na'y kaugalingong scroll wrapper ang kini nga mga parent
    var SKIP_PARENTS = [
        'table-scroll', 'table-responsive', 'table-wrap',
        'al-scroll', 'release-table-wrap'
    ];

    function hasSkipParent(el) {
        var p = el.parentElement;
        if (!p) return true;
        return SKIP_PARENTS.some(function (c) { return p.classList.contains(c); });
    }

    function wrapTable(table) {
        if (hasSkipParent(table)) return;
        var wrap = document.createElement('div');
        wrap.className = 'table-scroll';
        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
    }

    function wrapAll(root) {
        (root || document).querySelectorAll('table').forEach(wrapTable);
    }

    function start() {
        wrapAll(document);

        // Para sa mga table nga gi-generate sa JS (modals, details, etc.)
        var busy = false;
        new MutationObserver(function () {
            if (busy) return;
            busy = true;
            requestAnimationFrame(function () {
                wrapAll(document);
                busy = false;
            });
        }).observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();