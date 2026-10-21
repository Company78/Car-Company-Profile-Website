<?php
/**
 * notifications.php - Shared notification helpers.
 * Gamita:  require_once __DIR__ . "/db.php";
 *          require_once __DIR__ . "/notifications.php";
 */

function notifEnsureTable($conn)
{
    static $done = false;
    if ($done) return;
    $done = true;

    try {
        $conn->exec("
            CREATE TABLE IF NOT EXISTS `notification` (
              `NotificationID`   int(11) NOT NULL AUTO_INCREMENT,
              `UserID`           int(11) NOT NULL,
              `NotificationType` varchar(50) NOT NULL,
              `Title`            varchar(150) NOT NULL,
              `Message`          text DEFAULT NULL,
              `RefTable`         varchar(50) DEFAULT NULL,
              `RefID`            int(11) DEFAULT NULL,
              `ActorUserID`      int(11) DEFAULT NULL,
              `IsRead`           enum('Yes','No') NOT NULL DEFAULT 'No',
              `CreatedAt`        datetime NOT NULL DEFAULT current_timestamp(),
              `IsArchived`       enum('Yes','No') NOT NULL DEFAULT 'No',
              PRIMARY KEY (`NotificationID`),
              KEY `idx_notif_user` (`UserID`, `IsArchived`, `IsRead`),
              KEY `idx_notif_ref`  (`RefTable`, `RefID`, `NotificationType`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        ");
    } catch (Exception $e) {}
}

/* ---------------- ROLES / USERS ---------------- */

function notifRoleKeywords($group)
{
    $map = [
        "purchasing" => ["purchas"],
        "manager"    => ["manager"],
        "admin"      => ["admin"],
        "inventory"  => ["inventory", "stock clerk"],
        "receiving"  => ["receiv"],
        "releasing"  => ["releas"]
    ];
    return $map[strtolower($group)] ?? [strtolower($group)];
}

function notifUserIDsByRole($conn, $group, $excludeUserID = 0)
{
    $conds  = [];
    $params = [];
    foreach (notifRoleKeywords($group) as $i => $kw) {
        $conds[]        = "LOWER(r.RoleName) LIKE :k$i";
        $params[":k$i"] = "%" . $kw . "%";
    }

    $sql = "
        SELECT u.UserID
        FROM `user` u
        INNER JOIN `role` r ON r.RoleID = u.RoleID
        WHERE u.IsArchived = 'No'
          AND r.IsArchived = 'No'
          AND LOWER(TRIM(COALESCE(u.UserStatus, ''))) = 'active'
          AND (" . implode(" OR ", $conds) . ")
    ";
    if ($excludeUserID > 0) {
        $sql .= " AND u.UserID <> :ex";
        $params[":ex"] = intval($excludeUserID);
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    return array_map("intval", array_column($stmt->fetchAll(), "UserID"));
}

function notifUserName($conn, $userID)
{
    if (intval($userID) <= 0) return "Someone";
    try {
        $stmt = $conn->prepare("
            SELECT TRIM(CONCAT(COALESCE(FirstName,''), ' ', COALESCE(LastName,''))) AS FullName, UserName
            FROM `user` WHERE UserID = :id LIMIT 1
        ");
        $stmt->execute([":id" => intval($userID)]);
        $row = $stmt->fetch();
        if (!$row) return "Someone";
        return $row["FullName"] !== "" ? $row["FullName"] : $row["UserName"];
    } catch (Exception $e) {
        return "Someone";
    }
}

/* ---------------- CORE ---------------- */

function notifyUser($conn, $userID, $type, $title, $message = "", $refTable = null, $refID = null, $actorID = 0, $dedupe = false)
{
    try {
        notifEnsureTable($conn);
        $userID = intval($userID);
        if ($userID <= 0) return 0;

        if ($dedupe) {
            $stmt = $conn->prepare("
                SELECT NotificationID FROM notification
                WHERE UserID = :u AND NotificationType = :t AND IsArchived = 'No'
                  AND ((RefTable IS NULL AND :rt1 IS NULL) OR RefTable = :rt2)
                  AND ((RefID IS NULL AND :ri1 IS NULL) OR RefID = :ri2)
                LIMIT 1
            ");
            $stmt->execute([
                ":u" => $userID, ":t" => $type,
                ":rt1" => $refTable, ":rt2" => $refTable,
                ":ri1" => $refID,    ":ri2" => $refID
            ]);
            if ($stmt->fetch()) return 0;
        }

        $conn->prepare("
            INSERT INTO notification
            (UserID, NotificationType, Title, Message, RefTable, RefID, ActorUserID, IsRead, CreatedAt, IsArchived)
            VALUES (:u, :t, :title, :msg, :rt, :ri, :actor, 'No', NOW(), 'No')
        ")->execute([
            ":u"     => $userID,
            ":t"     => $type,
            ":title" => $title,
            ":msg"   => $message,
            ":rt"    => $refTable,
            ":ri"    => $refID,
            ":actor" => intval($actorID) > 0 ? intval($actorID) : null
        ]);

        return intval($conn->lastInsertId());
    } catch (Exception $e) {
        return 0;
    }
}

function notifyGroup($conn, $group, $type, $title, $message = "", $refTable = null, $refID = null, $actorID = 0, $dedupe = false)
{
    try {
        $count = 0;
        foreach (notifUserIDsByRole($conn, $group, $actorID) as $uid) {
            if (notifyUser($conn, $uid, $type, $title, $message, $refTable, $refID, $actorID, $dedupe) > 0) $count++;
        }
        return $count;
    } catch (Exception $e) {
        return 0;
    }
}

/* ---------------- TRANSACTION CONFIG ---------------- */

function notifTxConfig()
{
    return [
        "purchase_order" => [
            "label" => "Purchase Order", "request" => "purchase request", "prefix" => "po",
            "idCol" => "PO_ID", "userCol" => "User_ID", "statusCol" => "Status_ID"
        ],
        "purchase_return" => [
            "label" => "Purchase Return", "request" => "purchase return", "prefix" => "pret",
            "idCol" => "Purchase_Return_ID", "userCol" => "User_ID", "statusCol" => "Status_ID"
        ],
        "receiving" => [
            "label" => "Receiving", "request" => "receiving record", "prefix" => "rcv",
            "idCol" => "ReceivingID", "userCol" => "ReceivedByUserID", "statusCol" => "StatusID"
        ],
        "stock_release" => [
            "label" => "Stock Release", "request" => "stock release", "prefix" => "rel",
            "idCol" => "ReleaseID", "userCol" => "ReleasedByUserID", "statusCol" => "Status_ID"
        ],
        "stock_return" => [
            "label" => "Stock Return", "request" => "stock return", "prefix" => "sret",
            "idCol" => "Stock_Return_ID", "userCol" => "User_ID", "statusCol" => "Status_ID"
        ],
        "inventory_adjustment" => [
            "label" => "Inventory Adjustment", "request" => "inventory adjustment", "prefix" => "adj",
            "idCol" => "Adjustment_ID", "userCol" => "User_ID", "statusCol" => "Status_ID"
        ]
    ];
}

function notifTxStatusName($conn, $table, $id)
{
    $cfg = notifTxConfig()[$table] ?? null;
    if (!$cfg) return "";
    try {
        $stmt = $conn->prepare("
            SELECT st.StatusName
            FROM `$table` t
            LEFT JOIN status st ON st.StatusID = t.`" . $cfg["statusCol"] . "`
            WHERE t.`" . $cfg["idCol"] . "` = :id LIMIT 1
        ");
        $stmt->execute([":id" => intval($id)]);
        $row = $stmt->fetch();
        return $row ? trim($row["StatusName"] ?? "") : "";
    } catch (Exception $e) {
        return "";
    }
}

function notifTxSummary($conn, $table, $id)
{
    if ($table !== "purchase_order") return "";
    try {
        $stmt = $conn->prepare("
            SELECT s.SupplierName,
                   COUNT(l.PO_Line_ID) AS Items,
                   COALESCE(SUM(l.Quantity * l.Unit_Price), 0) AS Total
            FROM purchase_order po
            LEFT JOIN supplier s ON s.SupplierID = po.Supplier_ID
            LEFT JOIN purchase_order_line l ON l.PO_ID = po.PO_ID AND l.IsArchived = 'No'
            WHERE po.PO_ID = :id
            GROUP BY po.PO_ID, s.SupplierName
        ");
        $stmt->execute([":id" => intval($id)]);
        $r = $stmt->fetch();
        if (!$r) return "";
        return " (" . ($r["SupplierName"] ?: "No supplier") . " - "
             . intval($r["Items"]) . " item(s), ₱" . number_format(floatval($r["Total"]), 2) . ")";
    } catch (Exception $e) {
        return "";
    }
}

/* ---------------- EVENT: transaction gi-submit -> notify MANAGER ---------------- */

function notifyTransactionCreated($conn, $table, $id, $actorID)
{
    try {
        $cfg = notifTxConfig()[$table] ?? null;
        if (!$cfg || intval($id) <= 0) return;

        $status = strtolower(notifTxStatusName($conn, $table, $id));
        if (!in_array($status, ["pending", "for review", "submitted", ""], true)) return;

        $actor   = notifUserName($conn, $actorID);
        $summary = notifTxSummary($conn, $table, $id);

        if ($table === "purchase_order") {
            $title = "Purchase request awaiting approval";
            $msg   = "$actor submitted Purchase Order #$id$summary. It is pending and needs your approval.";
        } else {
            $title = $cfg["label"] . " awaiting approval";
            $msg   = "$actor submitted " . $cfg["label"] . " #$id. It is pending and needs your approval.";
        }

        notifyGroup($conn, "manager", $cfg["prefix"] . "_pending", $title, $msg, $table, intval($id), $actorID, true);
    } catch (Exception $e) {}
}

/* ---------------- EVENT: approved / rejected / cancelled -> notify creator ---------------- */

function notifyTransactionStatusChange($conn, $actorID, $table, $id, $actionLabel)
{
    try {
        $cfg = notifTxConfig()[$table] ?? null;
        $id  = intval($id);
        if (!$cfg || $id <= 0) return;

        notifEnsureTable($conn);

        $action = strtolower(trim($actionLabel));
        $prefix = $cfg["prefix"];

        $conn->prepare("
            UPDATE notification SET IsRead = 'Yes'
            WHERE RefTable = :t AND RefID = :id AND NotificationType = :type AND IsArchived = 'No'
        ")->execute([":t" => $table, ":id" => $id, ":type" => $prefix . "_pending"]);

        $stmt = $conn->prepare("SELECT `" . $cfg["userCol"] . "` AS CreatorID FROM `$table` WHERE `" . $cfg["idCol"] . "` = :id LIMIT 1");
        $stmt->execute([":id" => $id]);
        $row       = $stmt->fetch();
        $creatorID = $row ? intval($row["CreatorID"]) : 0;

        $actor = notifUserName($conn, $actorID);
        $what  = $table === "purchase_order" ? "purchase request (PO #$id)" : $cfg["label"] . " #$id";

        $titles = [
            "approved"  => $table === "purchase_order" ? "Purchase request approved" : $cfg["label"] . " approved",
            "rejected"  => $table === "purchase_order" ? "Purchase request rejected" : $cfg["label"] . " rejected",
            "cancelled" => $table === "purchase_order" ? "Purchase request cancelled" : $cfg["label"] . " cancelled"
        ];
        $title = $titles[$action] ?? ($cfg["label"] . " " . $action);
        $msg   = "Your $what was $action by $actor.";
        if ($action === "approved" && $table === "purchase_order") {
            $msg .= " You may now proceed with the order.";
        }

        if ($creatorID > 0 && $creatorID !== intval($actorID)) {
            notifyUser($conn, $creatorID, $prefix . "_" . $action, $title, $msg, $table, $id, $actorID);
        }

        if ($table === "purchase_order" && $action === "approved") {
            notifyGroup(
                $conn, "receiving", "po_incoming",
                "Incoming delivery expected",
                "Purchase Order #$id was approved. Prepare to receive the items from the supplier.",
                $table, $id, $actorID, true
            );
        }

        syncZeroStockNotifications($conn);

    } catch (Exception $e) {}
}

/* ---------------- ZERO STOCK -> notify PURCHASING ---------------- */

function notifStockJoins()
{
    return "
        LEFT JOIN (
            SELECT rl.ProductID AS pid, SUM(rl.ReceivedQuantity) AS qty
            FROM receiving_line rl
            INNER JOIN receiving h ON h.ReceivingID = rl.ReceivingID
            LEFT JOIN status st ON h.StatusID = st.StatusID
            WHERE rl.IsArchived = 'No' AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed', 'received')
            GROUP BY rl.ProductID
        ) rin ON rin.pid = p.ProductID

        LEFT JOIN (
            SELECT l.ProductID AS pid, SUM(l.QuantityReleased) AS qty
            FROM stock_release_line l
            INNER JOIN stock_release h ON h.ReleaseID = l.ReleaseID
            LEFT JOIN status st ON h.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No' AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed', 'released')
            GROUP BY l.ProductID
        ) rel ON rel.pid = p.ProductID

        LEFT JOIN (
            SELECT l.Product_ID AS pid, SUM(l.Quantity) AS qty
            FROM stock_return_line l
            INNER JOIN stock_return h ON h.Stock_Return_ID = l.Stock_Return_ID
            LEFT JOIN status st ON h.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No' AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed')
            GROUP BY l.Product_ID
        ) sret ON sret.pid = p.ProductID

        LEFT JOIN (
            SELECT l.Product_ID AS pid, SUM(l.Quantity) AS qty
            FROM purchase_return_line l
            INNER JOIN purchase_return h ON h.Purchase_Return_ID = l.Purchase_Return_ID
            LEFT JOIN status st ON h.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No' AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed')
            GROUP BY l.Product_ID
        ) pret ON pret.pid = p.ProductID

        LEFT JOIN (
            SELECT l.Product_ID AS pid,
                   SUM(CASE
                       WHEN LOWER(TRIM(l.Adjustment_Type)) = 'increase' THEN  l.Adjustment_Quantity
                       WHEN LOWER(TRIM(l.Adjustment_Type)) = 'decrease' THEN -l.Adjustment_Quantity
                       ELSE 0
                   END) AS qty
            FROM inventory_adjustment_line l
            INNER JOIN inventory_adjustment h ON h.Adjustment_ID = l.Adjustment_ID
            LEFT JOIN status st ON h.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No' AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed')
            GROUP BY l.Product_ID
        ) adj ON adj.pid = p.ProductID
    ";
}

function notifStockExpression()
{
    return "(COALESCE(rin.qty,0) - COALESCE(rel.qty,0) + COALESCE(sret.qty,0) - COALESCE(pret.qty,0) + COALESCE(adj.qty,0))";
}

function syncZeroStockNotifications($conn)
{
    try {
        notifEnsureTable($conn);

        $rows = $conn->query("
            SELECT p.ProductID, p.ProductName, " . notifStockExpression() . " AS QOH
            FROM product p " . notifStockJoins() . "
            WHERE p.IsArchived = 'No'
        ")->fetchAll();

        $zero = [];
        foreach ($rows as $r) {
            if (intval($r["QOH"]) <= 0) $zero[intval($r["ProductID"])] = $r["ProductName"];
        }

        $active = $conn->query("
            SELECT DISTINCT RefID FROM notification
            WHERE NotificationType = 'zero_stock' AND IsArchived = 'No'
        ")->fetchAll();

        $toResolve = [];
        foreach ($active as $a) {
            $pid = intval($a["RefID"]);
            if (!isset($zero[$pid])) $toResolve[] = $pid;
        }
        if ($toResolve) {
            $in = implode(",", array_map("intval", $toResolve));
            $conn->exec("
                UPDATE notification SET IsArchived = 'Yes'
                WHERE NotificationType = 'zero_stock' AND IsArchived = 'No' AND RefID IN ($in)
            ");
        }

        if (!$zero) return;

        $purchasing = notifUserIDsByRole($conn, "purchasing");
        if (!$purchasing) return;

        $existing = [];
        foreach ($conn->query("
            SELECT UserID, RefID FROM notification
            WHERE NotificationType = 'zero_stock' AND IsArchived = 'No'
        ")->fetchAll() as $e) {
            $existing[intval($e["UserID"]) . ":" . intval($e["RefID"])] = true;
        }

        foreach ($zero as $pid => $name) {
            foreach ($purchasing as $uid) {
                if (isset($existing["$uid:$pid"])) continue;
                notifyUser(
                    $conn, $uid, "zero_stock",
                    "Out of stock - purchase needed",
                    "'$name' has no stock. It needs to be purchased.",
                    "product", $pid, 0, false
                );
            }
        }
    } catch (Exception $e) {}
}

function notifyProductCreated($conn, $productID, $productName, $actorID)
{
    try {
        notifyGroup(
            $conn, "purchasing", "zero_stock",
            "New product needs purchasing",
            "'" . $productName . "' was just added and has no stock. It needs to be purchased.",
            "product", intval($productID), $actorID, true
        );
        syncZeroStockNotifications($conn);
    } catch (Exception $e) {}
}

/* ---------------- EVENT: Receiving / Releasing (Completed dayon) ---------------- */

function notifyTransactionCompleted($conn, $table, $id, $actorID)
{
    try {
        $id = intval($id);
        if ($id <= 0) return;

        $actor = notifUserName($conn, $actorID);

        if ($table === "receiving") {
            $stmt = $conn->prepare("SELECT PO_ID FROM receiving WHERE ReceivingID = :id LIMIT 1");
            $stmt->execute([":id" => $id]);
            $row  = $stmt->fetch();
            $poID = $row ? intval($row["PO_ID"]) : 0;

            $poText = $poID > 0 ? " against Purchase Order #$poID" : "";

            notifyGroup($conn, "manager", "rcv_completed", "Delivery received",
                "$actor completed Receiving #$id$poText. Stock has been updated.",
                "receiving", $id, $actorID, true);

            if ($poID > 0) {
                notifyGroup($conn, "purchasing", "po_received", "Purchase order received",
                    "Purchase Order #$poID was received by $actor.",
                    "purchase_order", $poID, $actorID, true);
            }

            notifyGroup($conn, "inventory", "rcv_stock_in", "New stock received",
                "$actor received Receiving #$id$poText. The items are ready for checking and put-away.",
                "receiving", $id, $actorID, true);

        } elseif ($table === "stock_release") {
            notifyGroup($conn, "manager", "rel_completed", "Stock released",
                "$actor completed Stock Release #$id. Stock levels have been updated.",
                "stock_release", $id, $actorID, true);
        }

        syncZeroStockNotifications($conn);

    } catch (Exception $e) {}
}

/* ---------------- EVENT: Purchasing nag-cancel sa pending PO/return ---------------- */

function notifyTransactionCancelledByOwner($conn, $table, $id, $actorID)
{
    try {
        $cfg = notifTxConfig()[$table] ?? null;
        $id  = intval($id);
        if (!$cfg || $id <= 0) return;

        notifEnsureTable($conn);

        $conn->prepare("
            UPDATE notification SET IsRead = 'Yes'
            WHERE RefTable = :t AND RefID = :id AND NotificationType = :type AND IsArchived = 'No'
        ")->execute([":t" => $table, ":id" => $id, ":type" => $cfg["prefix"] . "_pending"]);

        $actor = notifUserName($conn, $actorID);
        $what  = $table === "purchase_order" ? "Purchase Order #$id" : $cfg["label"] . " #$id";

        notifyGroup($conn, "manager", $cfg["prefix"] . "_cancelled",
            $table === "purchase_order" ? "Purchase request cancelled" : $cfg["label"] . " cancelled",
            "$actor cancelled $what. No approval is needed anymore.",
            $table, $id, $actorID);
    } catch (Exception $e) {}
}