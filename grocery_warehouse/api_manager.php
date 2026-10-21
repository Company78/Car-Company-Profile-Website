<?php

require_once __DIR__ . "/db.php";
require_once __DIR__ . "/notifications.php";
/* ============================================================
   HELPERS (specific sa Manager)
============================================================ */

function requireManager($conn, $userID)
{
    if (!$userID || intval($userID) <= 0) {
        response(false, "Authentication required.", null);
    }

    $stmt = $conn->prepare("
        SELECT
            u.UserID, u.UserStatus, u.IsArchived AS UserArchived,
            r.RoleName, r.IsArchived AS RoleArchived
        FROM `user` u
        LEFT JOIN `role` r ON u.RoleID = r.RoleID
        WHERE u.UserID = :id
        LIMIT 1
    ");
    $stmt->execute([":id" => intval($userID)]);
    $user = $stmt->fetch();

    if (!$user) response(false, "User not found.", null);
    if (strtolower(trim($user["UserArchived"] ?? "")) === "yes") response(false, "Account archived.", null);
    if (strtolower(trim($user["UserStatus"] ?? "")) !== "active") response(false, "Account inactive.", null);
    if (strtolower(trim($user["RoleArchived"] ?? "")) === "yes") response(false, "Role archived.", null);

    $role = strtolower(trim($user["RoleName"] ?? ""));
    $allowed = ["warehouse manager", "manager", "warehouse", "admin", "administrator"];

    if (!in_array($role, $allowed, true)) {
        response(false, "Warehouse Manager access required.", null);
    }

    return $user;
}

/*
 * ON HAND calculation with STATUS FILTER
 *
 * Only APPROVED / COMPLETED transactions affect the QOH.
 * Pending / Rejected / Cancelled transactions are IGNORED.
 *
 * ON HAND = Received - Released + Stock Return - Purchase Return +/- Adjustment
 */
function stockJoins()
{
    return "
        LEFT JOIN (
            SELECT rl.ProductID AS pid, SUM(rl.ReceivedQuantity) AS qty
            FROM receiving_line rl
            INNER JOIN receiving h ON h.ReceivingID = rl.ReceivingID
            LEFT JOIN status st ON h.StatusID = st.StatusID
            WHERE rl.IsArchived = 'No'
              AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed', 'received')
            GROUP BY rl.ProductID
        ) rin ON rin.pid = p.ProductID

        LEFT JOIN (
            SELECT l.ProductID AS pid, SUM(l.QuantityReleased) AS qty
            FROM stock_release_line l
            INNER JOIN stock_release h ON h.ReleaseID = l.ReleaseID
            LEFT JOIN status st ON h.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No'
              AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed', 'released')
            GROUP BY l.ProductID
        ) rel ON rel.pid = p.ProductID

        LEFT JOIN (
            SELECT l.Product_ID AS pid, SUM(l.Quantity) AS qty
            FROM stock_return_line l
            INNER JOIN stock_return h ON h.Stock_Return_ID = l.Stock_Return_ID
            LEFT JOIN status st ON h.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No'
              AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed')
            GROUP BY l.Product_ID
        ) sret ON sret.pid = p.ProductID

        LEFT JOIN (
            SELECT l.Product_ID AS pid, SUM(l.Quantity) AS qty
            FROM purchase_return_line l
            INNER JOIN purchase_return h ON h.Purchase_Return_ID = l.Purchase_Return_ID
            LEFT JOIN status st ON h.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No'
              AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed')
            GROUP BY l.Product_ID
        ) pret ON pret.pid = p.ProductID

        LEFT JOIN (
            SELECT
                l.Product_ID AS pid,
                SUM(CASE
                    WHEN LOWER(TRIM(l.Adjustment_Type)) = 'increase' THEN  l.Adjustment_Quantity
                    WHEN LOWER(TRIM(l.Adjustment_Type)) = 'decrease' THEN -l.Adjustment_Quantity
                    ELSE 0
                END) AS qty
            FROM inventory_adjustment_line l
            INNER JOIN inventory_adjustment h ON h.Adjustment_ID = l.Adjustment_ID
            LEFT JOIN status st ON h.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No'
              AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed')
            GROUP BY l.Product_ID
        ) adj ON adj.pid = p.ProductID
    ";
}

function stockExpression()
{
    return "
        (
            COALESCE(rin.qty, 0)
            - COALESCE(rel.qty, 0)
            + COALESCE(sret.qty, 0)
            - COALESCE(pret.qty, 0)
            + COALESCE(adj.qty, 0)
        )
    ";
}

function findStatusID($conn, $names)
{
    foreach ((array)$names as $name) {
        $stmt = $conn->prepare("
            SELECT StatusID FROM status
            WHERE LOWER(TRIM(StatusName)) = :n AND IsArchived = 'No'
            LIMIT 1
        ");
        $stmt->execute([":n" => strtolower(trim($name))]);
        $row = $stmt->fetch();

        if ($row) return intval($row["StatusID"]);
    }
    return 0;
}

function isPendingStatus($statusName)
{
    $s = strtolower(trim($statusName ?? ""));
    return in_array($s, ["pending", "for review", "submitted", "draft", ""], true);
}

function hasColumn($conn, $table, $column)
{
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS c
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = :t
        AND COLUMN_NAME = :c
    ");
    $stmt->execute([":t" => $table, ":c" => $column]);
    return intval($stmt->fetch()["c"]) > 0;
}

function receivingPoColumn($conn)
{
    if (hasColumn($conn, "receiving", "PO_Reference")) return "PO_Reference";
    if (hasColumn($conn, "receiving", "PO_ID")) return "PO_ID";
    return null;
}

function extractPoId($value)
{
    if ($value === null || $value === "") return 0;
    if (preg_match('/(\d+)/', (string)$value, $m)) return intval($m[1]);
    return 0;
}

function orderedQtyMap($conn, $poId)
{
    if ($poId <= 0) return [];

    $stmt = $conn->prepare("
        SELECT Product_ID, SUM(Quantity) AS qty
        FROM purchase_order_line
        WHERE PO_ID = :po AND IsArchived = 'No'
        GROUP BY Product_ID
    ");
    $stmt->execute([":po" => $poId]);

    $map = [];
    foreach ($stmt->fetchAll() as $row) {
        $map[intval($row["Product_ID"])] = intval($row["qty"]);
    }
    return $map;
}

/* ============================================================
   GENERIC STATUS CHANGE
============================================================ */

function changeTransactionStatus($conn, $userID, $table, $idColumn, $id, $newStatusNames, $actionLabel, $statusColumn = "Status_ID")
{
    if ($id <= 0) {
        response(false, "Invalid ID.", null);
    }

    $statusID = findStatusID($conn, $newStatusNames);

    if ($statusID <= 0) {
        response(
            false,
            "Status '" . implode(" / ", (array)$newStatusNames) . "' not found in status table. Ask the admin to add it.",
            null
        );
    }

    $stmt = $conn->prepare("
        SELECT t.`$idColumn` AS id, t.IsArchived
        FROM `$table` t
        WHERE t.`$idColumn` = :id
        LIMIT 1
    ");
    $stmt->execute([":id" => $id]);
    $row = $stmt->fetch();

    if (!$row) {
        response(false, ucfirst($actionLabel) . " target not found.", null);
    }

    if ($row["IsArchived"] === "Yes") {
        response(false, "Record is archived.", null);
    }

    $conn->prepare("
        UPDATE `$table`
        SET `$statusColumn` = :s
        WHERE `$idColumn` = :id
    ")->execute([":s" => $statusID, ":id" => $id]);

    addAudit($conn, $userID, strtoupper($actionLabel), $table,
        ucfirst($actionLabel) . " record #$id");
    notifyTransactionStatusChange($conn, $userID, $table, $id, $actionLabel);
    response(true, "Record " . strtolower($actionLabel) . " successfully.", null);
}

/* ============================================================
   MAIN
============================================================ */

try {

    $currentUserID = getCurrentUserID($input);

    if ($operation === "logout") {
        if ($currentUserID > 0) {
            addAudit($conn, $currentUserID, "LOGOUT", "user", "Manager logged out.");
        }
        response(true, "Logout successful.", null);
    }

    requireManager($conn, $currentUserID);

    /* ============================ DASHBOARD ============================ */

    if ($operation === "getManagerDashboard") {

        $totalProducts = intval($conn->query("
            SELECT COUNT(*) AS c FROM product WHERE IsArchived = 'No'
        ")->fetch()["c"]);

        $lowStockCount = intval($conn->query("
            SELECT COUNT(*) AS c FROM (
                SELECT p.ProductID, " . stockExpression() . " AS OnHand, p.MinStockLevel
                FROM product p
                " . stockJoins() . "
                WHERE p.IsArchived = 'No'
                HAVING OnHand < p.MinStockLevel
            ) x
        ")->fetch()["c"]);

        $pendingAdjustments = intval($conn->query("
            SELECT COUNT(*) AS c
            FROM inventory_adjustment ia
            LEFT JOIN status st ON ia.Status_ID = st.StatusID
            WHERE ia.IsArchived = 'No'
            AND LOWER(TRIM(COALESCE(st.StatusName,''))) IN ('pending','for review','submitted','draft','')
        ")->fetch()["c"]);

        $pendingReturns = intval($conn->query("
            SELECT COUNT(*) AS c
            FROM stock_return sr
            LEFT JOIN status st ON sr.Status_ID = st.StatusID
            WHERE sr.IsArchived = 'No'
            AND LOWER(TRIM(COALESCE(st.StatusName,''))) IN ('pending','for review','submitted','draft','')
        ")->fetch()["c"]);

        $pendingPOs = intval($conn->query("
            SELECT COUNT(*) AS c
            FROM purchase_order po
            INNER JOIN status st ON po.Status_ID = st.StatusID
            WHERE po.IsArchived = 'No'
            AND LOWER(TRIM(st.StatusName)) = 'pending'
        ")->fetch()["c"]);

        $recentAdjustments = $conn->query("
            SELECT
                ia.Adjustment_ID, ia.Adjustment_Date,
                st.StatusName,
                GROUP_CONCAT(DISTINCT p.ProductName ORDER BY p.ProductName SEPARATOR ', ') AS ProductNames,
                GROUP_CONCAT(DISTINCT l.Adjustment_Type SEPARATOR ', ') AS Adjustment_Type
            FROM inventory_adjustment ia
            LEFT JOIN status st ON ia.Status_ID = st.StatusID
            LEFT JOIN inventory_adjustment_line l
                ON l.Adjustment_ID = ia.Adjustment_ID AND l.IsArchived = 'No'
            LEFT JOIN product p ON l.Product_ID = p.ProductID
            WHERE ia.IsArchived = 'No'
            GROUP BY ia.Adjustment_ID, ia.Adjustment_Date, st.StatusName
            ORDER BY ia.Adjustment_Date DESC, ia.Adjustment_ID DESC
            LIMIT 8
        ")->fetchAll();

        $recentActivity = $conn->query("
            SELECT
                a.ActionTimestamp, a.ActionType, a.TableAffected,
                TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName
            FROM auditlog a
            LEFT JOIN `user` u ON a.UserID = u.UserID
            WHERE a.IsArchived = 'No'
            ORDER BY a.ActionTimestamp DESC, a.AuditLogID DESC
            LIMIT 8
        ")->fetchAll();

        response(true, "Dashboard loaded.", [
            "totalProducts"      => $totalProducts,
            "lowStockCount"      => $lowStockCount,
            "pendingAdjustments" => $pendingAdjustments,
            "pendingReturns"     => $pendingReturns,
            "pendingPOs"         => $pendingPOs,
            "recentAdjustments"  => $recentAdjustments,
            "recentActivity"     => $recentActivity
        ]);
    }

    /* ============================ REFERENCE ============================ */

    if ($operation === "getStatuses") {
        response(true, "Statuses loaded.", $conn->query("
            SELECT StatusID, StatusName FROM status
            WHERE IsArchived = 'No' ORDER BY StatusName ASC
        ")->fetchAll());
    }

    if ($operation === "getProducts") {
        $search = getSearch($input);
        $sql = "
            SELECT
                p.ProductID, p.Barcode, p.ProductName, p.MinStockLevel,
                p.CategoryID, c.CategoryName, u.UnitName, b.BinCode
            FROM product p
            LEFT JOIN category c ON p.CategoryID = c.CategoryID
            LEFT JOIN unit_of_measure u ON p.UnitOfMeasureID = u.UnitOfMeasureID
            LEFT JOIN bin b ON p.BinID = b.BinID
            WHERE p.IsArchived = 'No'
        ";
        $params = [];
        if ($search !== "") {
            $sql .= " AND (p.ProductName LIKE :s1 OR p.Barcode LIKE :s2 OR c.CategoryName LIKE :s3) ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
            $params[":s3"] = "%$search%";
        }
        $sql .= " ORDER BY p.ProductName ASC LIMIT 1000 ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Products loaded.", $stmt->fetchAll());
    }

    if ($operation === "getCategories") {
        $search = getSearch($input);
        $sql = "SELECT CategoryID, CategoryName FROM category WHERE IsArchived = 'No' ";
        $params = [];
        if ($search !== "") {
            $sql .= " AND CategoryName LIKE :s ";
            $params[":s"] = "%$search%";
        }
        $sql .= " ORDER BY CategoryName ASC ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Categories loaded.", $stmt->fetchAll());
    }

    /* ---------- SUPPLIERS (with optional product filter, done in SQL) ---------- */

    if ($operation === "getSuppliers") {
        $search    = getSearch($input);
        $productID = intval($input["ProductID"] ?? 0);

        $sql = "
            SELECT SupplierID, SupplierName, ContactPerson, Phone, Email, Address
            FROM supplier
            WHERE IsArchived = 'No'
        ";
        $params = [];

        if ($search !== "") {
            $sql .= " AND (SupplierName LIKE :s1 OR ContactPerson LIKE :s2 OR Phone LIKE :s3 OR Email LIKE :s4) ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
            $params[":s3"] = "%$search%";
            $params[":s4"] = "%$search%";
        }

        if ($productID > 0) {
            $sql .= " AND EXISTS (
                SELECT 1 FROM supplier_product sp
                WHERE sp.SupplierID = supplier.SupplierID
                  AND sp.ProductID = :pid
                  AND sp.IsArchived = 'No'
            ) ";
            $params[":pid"] = $productID;
        }

        $sql .= " ORDER BY SupplierName ASC ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Suppliers loaded.", $stmt->fetchAll());
    }

    if ($operation === "getSupplierProducts") {
        $supplierID = intval($input["SupplierID"] ?? 0);
        $stmt = $conn->prepare("
            SELECT sp.ProductID, p.ProductName
            FROM supplier_product sp
            INNER JOIN product p ON sp.ProductID = p.ProductID
            WHERE sp.SupplierID = :sid
            AND sp.IsArchived = 'No'
            AND p.IsArchived = 'No'
            ORDER BY p.ProductName ASC
        ");
        $stmt->execute([":sid" => $supplierID]);
        response(true, "Supplier products loaded.", $stmt->fetchAll());
    }

    if ($operation === "getAisles") {
        $search = getSearch($input);
        $sql = "SELECT AisleID, AisleCode FROM aisle WHERE IsArchived = 'No' ";
        $params = [];
        if ($search !== "") {
            $sql .= " AND AisleCode LIKE :s ";
            $params[":s"] = "%$search%";
        }
        $sql .= " ORDER BY AisleCode ASC ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Aisles loaded.", $stmt->fetchAll());
    }

    if ($operation === "getShelves") {
        $search = getSearch($input);
        $sql = "
            SELECT s.ShelfID, s.AisleID, s.ShelfCode, a.AisleCode
            FROM shelf s
            LEFT JOIN aisle a ON s.AisleID = a.AisleID
            WHERE s.IsArchived = 'No'
        ";
        $params = [];
        if ($search !== "") {
            $sql .= " AND (s.ShelfCode LIKE :s1 OR a.AisleCode LIKE :s2) ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
        }
        $sql .= " ORDER BY a.AisleCode, s.ShelfCode ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Shelves loaded.", $stmt->fetchAll());
    }

    if ($operation === "getBins") {
        $search = getSearch($input);
        $sql = "
            SELECT b.BinID, b.ShelfID, b.BinCode, s.ShelfCode, s.AisleID, a.AisleCode
            FROM bin b
            LEFT JOIN shelf s ON b.ShelfID = s.ShelfID
            LEFT JOIN aisle a ON s.AisleID = a.AisleID
            WHERE b.IsArchived = 'No'
        ";
        $params = [];
        if ($search !== "") {
            $sql .= " AND (b.BinCode LIKE :s1 OR s.ShelfCode LIKE :s2 OR a.AisleCode LIKE :s3) ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
            $params[":s3"] = "%$search%";
        }
        $sql .= " ORDER BY a.AisleCode, s.ShelfCode, b.BinCode ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Bins loaded.", $stmt->fetchAll());
    }

    /* ============================== STOCK ============================== */

    if ($operation === "getInventoryQuantities") {
        $search = getSearch($input);
        $sql = "
            SELECT
                p.ProductID, p.Barcode, p.ProductName, p.MinStockLevel,
                c.CategoryName, u.UnitName, b.BinCode,
                " . stockExpression() . " AS OnHandQuantity
            FROM product p
            LEFT JOIN category c ON p.CategoryID = c.CategoryID
            LEFT JOIN unit_of_measure u ON p.UnitOfMeasureID = u.UnitOfMeasureID
            LEFT JOIN bin b ON p.BinID = b.BinID
            " . stockJoins() . "
            WHERE p.IsArchived = 'No'
        ";
        $params = [];
        if ($search !== "") {
            $sql .= " AND (p.ProductName LIKE :s1 OR p.Barcode LIKE :s2 OR c.CategoryName LIKE :s3) ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
            $params[":s3"] = "%$search%";
        }
        $sql .= " ORDER BY p.ProductName ASC ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Inventory loaded.", $stmt->fetchAll());
    }

    if ($operation === "getLowStock") {
        response(true, "Low stock loaded.", $conn->query("
            SELECT
                p.ProductID, p.Barcode, p.ProductName, p.MinStockLevel,
                c.CategoryName, u.UnitName, b.BinCode,
                " . stockExpression() . " AS OnHandQuantity
            FROM product p
            LEFT JOIN category c ON p.CategoryID = c.CategoryID
            LEFT JOIN unit_of_measure u ON p.UnitOfMeasureID = u.UnitOfMeasureID
            LEFT JOIN bin b ON p.BinID = b.BinID
            " . stockJoins() . "
            WHERE p.IsArchived = 'No'
            HAVING OnHandQuantity < p.MinStockLevel
            ORDER BY (p.MinStockLevel - OnHandQuantity) DESC, p.ProductName ASC
        ")->fetchAll());
    }

    if ($operation === "getInventoryMovements") {
        $productID = intval($input["Product_ID"] ?? 0);
        $type      = trim($input["MovementType"] ?? "");
        $dateFrom  = trim($input["dateFrom"] ?? "");
        $dateTo    = trim($input["dateTo"] ?? "");

        $sql = "
            SELECT * FROM (
                SELECT r.ReceivingDate AS MovementDate, 'Receiving' AS MovementType,
                       rl.ProductID AS Product_ID, p.ProductName,
                       rl.ReceivedQuantity AS Quantity,
                       CONCAT('Receiving #', r.ReceivingID) AS Reference,
                       TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName
                FROM receiving_line rl
                INNER JOIN receiving r ON rl.ReceivingID = r.ReceivingID
                INNER JOIN product p ON rl.ProductID = p.ProductID
                LEFT JOIN `user` u ON r.ReceivedByUserID = u.UserID
                WHERE rl.IsArchived = 'No' AND r.IsArchived = 'No'

                UNION ALL

                SELECT sr.ReleaseDate, 'Release',
                       srl.ProductID, p.ProductName,
                       srl.QuantityReleased,
                       CONCAT('Release #', sr.ReleaseID),
                       TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,'')))
                FROM stock_release_line srl
                INNER JOIN stock_release sr ON srl.ReleaseID = sr.ReleaseID
                INNER JOIN product p ON srl.ProductID = p.ProductID
                LEFT JOIN `user` u ON sr.ReleasedByUserID = u.UserID
                WHERE srl.IsArchived = 'No' AND sr.IsArchived = 'No'

                UNION ALL

                SELECT st.Return_Date, 'Stock Return',
                       l.Product_ID, p.ProductName,
                       l.Quantity,
                       CONCAT('Stock Return #', st.Stock_Return_ID),
                       TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,'')))
                FROM stock_return_line l
                INNER JOIN stock_return st ON l.Stock_Return_ID = st.Stock_Return_ID
                INNER JOIN product p ON l.Product_ID = p.ProductID
                LEFT JOIN `user` u ON st.User_ID = u.UserID
                WHERE l.IsArchived = 'No' AND st.IsArchived = 'No'

                UNION ALL

                SELECT pr.Return_Date, 'Purchase Return',
                       l.Product_ID, p.ProductName,
                       l.Quantity,
                       CONCAT('Purchase Return #', pr.Purchase_Return_ID),
                       TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,'')))
                FROM purchase_return_line l
                INNER JOIN purchase_return pr ON l.Purchase_Return_ID = pr.Purchase_Return_ID
                INNER JOIN product p ON l.Product_ID = p.ProductID
                LEFT JOIN `user` u ON pr.User_ID = u.UserID
                WHERE l.IsArchived = 'No' AND pr.IsArchived = 'No'

                UNION ALL

                SELECT ia.Adjustment_Date, 'Adjustment',
                       l.Product_ID, p.ProductName,
                       CASE
                           WHEN LOWER(TRIM(l.Adjustment_Type)) = 'decrease' THEN -l.Adjustment_Quantity
                           ELSE l.Adjustment_Quantity
                       END,
                       CONCAT('Adjustment #', ia.Adjustment_ID),
                       TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,'')))
                FROM inventory_adjustment_line l
                INNER JOIN inventory_adjustment ia ON l.Adjustment_ID = ia.Adjustment_ID
                INNER JOIN product p ON l.Product_ID = p.ProductID
                LEFT JOIN `user` u ON ia.User_ID = u.UserID
                WHERE l.IsArchived = 'No' AND ia.IsArchived = 'No'
            ) m
            WHERE 1 = 1
        ";

        $params = [];
        if ($productID > 0) { $sql .= " AND m.Product_ID = :pid "; $params[":pid"] = $productID; }
        if ($type !== "")   { $sql .= " AND m.MovementType = :mtype "; $params[":mtype"] = $type; }
        if ($dateFrom !== "") { $sql .= " AND DATE(m.MovementDate) >= :dfrom "; $params[":dfrom"] = $dateFrom; }
        if ($dateTo !== "")   { $sql .= " AND DATE(m.MovementDate) <= :dto "; $params[":dto"] = $dateTo; }

        $sql .= " ORDER BY m.MovementDate DESC LIMIT 500 ";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Movements loaded.", $stmt->fetchAll());
    }

    /* ========================== DISCREPANCIES ========================== */

    if ($operation === "getReceivingDiscrepancies") {
        $search = getSearch($input);
        $poCol  = receivingPoColumn($conn);

        $sql = "
            SELECT r.ReceivingID, " . ($poCol ? "r.$poCol" : "NULL") . " AS PoRef,
                   rl.ProductID, p.ProductName, rl.ReceivedQuantity
            FROM receiving_line rl
            INNER JOIN receiving r ON rl.ReceivingID = r.ReceivingID
            INNER JOIN product p ON rl.ProductID = p.ProductID
            WHERE rl.IsArchived = 'No' AND r.IsArchived = 'No'
        ";
        $params = [];
        if ($search !== "") {
            $sql .= " AND p.ProductName LIKE :s ";
            $params[":s"] = "%$search%";
        }
        $sql .= " ORDER BY r.ReceivingID DESC, p.ProductName ASC ";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        $maps = [];
        $out  = [];

        foreach ($stmt->fetchAll() as $row) {
            $poId = extractPoId($row["PoRef"]);
            if ($poId <= 0) continue;

            if (!isset($maps[$poId])) $maps[$poId] = orderedQtyMap($conn, $poId);

            $ordered  = $maps[$poId][intval($row["ProductID"])] ?? 0;
            $received = intval($row["ReceivedQuantity"]);
            $variance = $received - $ordered;

            if ($variance === 0) continue;

            $out[] = [
                "ReceivingID" => $row["ReceivingID"],
                "ProductName" => $row["ProductName"],
                "OrderedQty"  => $ordered,
                "ReceivedQty" => $received,
                "Variance"    => $variance
            ];
        }
        response(true, "Receiving discrepancies loaded.", $out);
    }

    if ($operation === "getAdjustmentDiscrepancies") {
        $search = getSearch($input);
        $sql = "
            SELECT ia.Adjustment_Date, p.ProductName,
                   l.System_Quantity, l.Actual_Quantity,
                   l.Adjustment_Quantity, l.Adjustment_Type
            FROM inventory_adjustment_line l
            INNER JOIN inventory_adjustment ia ON l.Adjustment_ID = ia.Adjustment_ID
            INNER JOIN product p ON l.Product_ID = p.ProductID
            WHERE l.IsArchived = 'No' AND ia.IsArchived = 'No'
            AND l.Adjustment_Quantity <> 0
        ";
        $params = [];
        if ($search !== "") {
            $sql .= " AND p.ProductName LIKE :s ";
            $params[":s"] = "%$search%";
        }
        $sql .= " ORDER BY ia.Adjustment_Date DESC, ia.Adjustment_ID DESC ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Adjustment discrepancies loaded.", $stmt->fetchAll());
    }

    /* =========================== ADJUSTMENTS =========================== */

    if ($operation === "getInventoryAdjustments") {
        $search = getSearch($input);
        $sql = "
            SELECT
                ia.Adjustment_ID, ia.Adjustment_Date, ia.Reason, ia.Status_ID,
                st.StatusName,
                TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName,
                p.ProductName,
                l.System_Quantity, l.Actual_Quantity,
                l.Adjustment_Quantity, l.Adjustment_Type
            FROM inventory_adjustment ia
            LEFT JOIN status st ON ia.Status_ID = st.StatusID
            LEFT JOIN `user` u ON ia.User_ID = u.UserID
            LEFT JOIN inventory_adjustment_line l
                ON l.Adjustment_ID = ia.Adjustment_ID AND l.IsArchived = 'No'
            LEFT JOIN product p ON l.Product_ID = p.ProductID
            WHERE ia.IsArchived = 'No'
        ";
        $params = [];
        if ($search !== "") {
            $sql .= "
                AND (
                    p.ProductName LIKE :s1 OR ia.Reason LIKE :s2
                    OR st.StatusName LIKE :s3
                    OR CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,'')) LIKE :s4
                )
            ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
            $params[":s3"] = "%$search%";
            $params[":s4"] = "%$search%";
        }
        $sql .= " ORDER BY ia.Adjustment_Date DESC, ia.Adjustment_ID DESC LIMIT 500 ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Adjustments loaded.", $stmt->fetchAll());
    }

    if ($operation === "getInventoryAdjustment") {
        $id = intval($input["Adjustment_ID"] ?? 0);

        $stmt = $conn->prepare("
            SELECT ia.Adjustment_ID, ia.Adjustment_Date, ia.Reason, ia.Status_ID,
                   st.StatusName,
                   TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName
            FROM inventory_adjustment ia
            LEFT JOIN status st ON ia.Status_ID = st.StatusID
            LEFT JOIN `user` u ON ia.User_ID = u.UserID
            WHERE ia.Adjustment_ID = :id AND ia.IsArchived = 'No'
            LIMIT 1
        ");
        $stmt->execute([":id" => $id]);
        $header = $stmt->fetch();
        if (!$header) response(false, "Adjustment not found.", null);

        $stmt = $conn->prepare("
            SELECT p.ProductName, l.System_Quantity, l.Actual_Quantity,
                   l.Adjustment_Quantity, l.Adjustment_Type
            FROM inventory_adjustment_line l
            INNER JOIN product p ON l.Product_ID = p.ProductID
            WHERE l.Adjustment_ID = :id AND l.IsArchived = 'No'
            ORDER BY l.Adjustment_Line_ID ASC
        ");
        $stmt->execute([":id" => $id]);
        $header["lines"] = $stmt->fetchAll();

        response(true, "Adjustment loaded.", $header);
    }

    /* =========================== STOCK RETURNS =========================== */

    if ($operation === "getStockReturns") {
        $search = getSearch($input);
        $sql = "
            SELECT
                sr.Stock_Return_ID, sr.Return_Date, sr.Reason, sr.Status_ID,
                st.StatusName,
                TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName,
                GROUP_CONCAT(p.ProductName ORDER BY p.ProductName SEPARATOR ', ') AS ProductName,
                COALESCE(SUM(l.Quantity), 0) AS Quantity
            FROM stock_return sr
            LEFT JOIN status st ON sr.Status_ID = st.StatusID
            LEFT JOIN `user` u ON sr.User_ID = u.UserID
            LEFT JOIN stock_return_line l
                ON l.Stock_Return_ID = sr.Stock_Return_ID AND l.IsArchived = 'No'
            LEFT JOIN product p ON l.Product_ID = p.ProductID
            WHERE sr.IsArchived = 'No'
        ";
        $params = [];
        if ($search !== "") {
            $sql .= "
                AND (
                    p.ProductName LIKE :s1 OR sr.Reason LIKE :s2
                    OR st.StatusName LIKE :s3
                    OR CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,'')) LIKE :s4
                )
            ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
            $params[":s3"] = "%$search%";
            $params[":s4"] = "%$search%";
        }
        $sql .= "
            GROUP BY sr.Stock_Return_ID, sr.Return_Date, sr.Reason, sr.Status_ID,
                     st.StatusName, u.FirstName, u.LastName
            ORDER BY sr.Return_Date DESC, sr.Stock_Return_ID DESC
            LIMIT 500
        ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Stock returns loaded.", $stmt->fetchAll());
    }

    if ($operation === "getStockReturn") {
        $id = intval($input["Stock_Return_ID"] ?? 0);

        $stmt = $conn->prepare("
            SELECT sr.Stock_Return_ID, sr.Return_Date, sr.Reason, sr.Status_ID,
                   st.StatusName,
                   TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName
            FROM stock_return sr
            LEFT JOIN status st ON sr.Status_ID = st.StatusID
            LEFT JOIN `user` u ON sr.User_ID = u.UserID
            WHERE sr.Stock_Return_ID = :id AND sr.IsArchived = 'No'
            LIMIT 1
        ");
        $stmt->execute([":id" => $id]);
        $header = $stmt->fetch();
        if (!$header) response(false, "Stock return not found.", null);

        $stmt = $conn->prepare("
            SELECT p.ProductName, l.Quantity
            FROM stock_return_line l
            INNER JOIN product p ON l.Product_ID = p.ProductID
            WHERE l.Stock_Return_ID = :id AND l.IsArchived = 'No'
            ORDER BY l.Stock_Return_Line_ID ASC
        ");
        $stmt->execute([":id" => $id]);
        $header["lines"] = $stmt->fetchAll();

        response(true, "Stock return loaded.", $header);
    }

    /* ======================= STOCK RELEASES ======================= */

    if ($operation === "getStockReleases") {
        $stmt = $conn->query("
            SELECT
                sr.ReleaseID, sr.ReleaseDate, sr.Status_ID,
                COALESCE(st.StatusName, 'Pending') AS StatusName,
                NULLIF(TRIM(CONCAT(COALESCE(lu.FirstName,''), ' ', COALESCE(lu.LastName,''))), '') AS ReleasedBy,
                (
                    SELECT COUNT(*) FROM stock_release_line l
                    WHERE l.ReleaseID = sr.ReleaseID AND l.IsArchived = 'No'
                ) AS ItemCount
            FROM stock_release sr
            LEFT JOIN `user` lu ON sr.ReleasedByUserID = lu.UserID
            LEFT JOIN status st ON sr.Status_ID = st.StatusID
            WHERE sr.IsArchived = 'No'
            ORDER BY sr.ReleaseDate DESC, sr.ReleaseID DESC
            LIMIT 500
        ");
        response(true, "Stock releases loaded.", $stmt->fetchAll());
    }

    if ($operation === "getStockRelease") {
        $id = intval($input["ReleaseID"] ?? 0);
        if ($id <= 0) response(false, "Invalid release ID.", null);

        $stmt = $conn->prepare("
            SELECT
                sr.ReleaseID, sr.ReleaseDate, sr.Status_ID,
                COALESCE(st.StatusName, 'Pending') AS StatusName,
                NULLIF(TRIM(CONCAT(COALESCE(lu.FirstName,''), ' ', COALESCE(lu.LastName,''))), '') AS ReleasedBy
            FROM stock_release sr
            LEFT JOIN `user` lu ON sr.ReleasedByUserID = lu.UserID
            LEFT JOIN status st ON sr.Status_ID = st.StatusID
            WHERE sr.ReleaseID = :id AND sr.IsArchived = 'No'
            LIMIT 1
        ");
        $stmt->execute([":id" => $id]);
        $header = $stmt->fetch();
        if (!$header) response(false, "Stock release not found.", null);

        $stmt = $conn->prepare("
            SELECT p.ProductName, srl.QuantityReleased, srl.SellingPrice
            FROM stock_release_line srl
            INNER JOIN product p ON srl.ProductID = p.ProductID
            WHERE srl.ReleaseID = :id AND srl.IsArchived = 'No'
            ORDER BY srl.ReleaseLineID ASC
        ");
        $stmt->execute([":id" => $id]);
        $header["lines"] = $stmt->fetchAll();

        response(true, "Stock release loaded.", $header);
    }

    /* =========================== PURCHASE ORDERS =========================== */

    if ($operation === "getPurchaseOrders") {
        $search = getSearch($input);
        $sql = "
            SELECT
                po.PO_ID, po.PO_Date, po.Expected_Date,
                s.SupplierName, st.StatusName,
                TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName
            FROM purchase_order po
            LEFT JOIN supplier s ON po.Supplier_ID = s.SupplierID
            LEFT JOIN `user` u ON po.User_ID = u.UserID
            LEFT JOIN status st ON po.Status_ID = st.StatusID
            WHERE po.IsArchived = 'No'
        ";
        $params = [];
        if ($search !== "") {
            $sql .= " AND (s.SupplierName LIKE :s1 OR st.StatusName LIKE :s2 OR po.PO_ID LIKE :s3) ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
            $params[":s3"] = "%$search%";
        }
        $sql .= " ORDER BY po.PO_Date DESC, po.PO_ID DESC LIMIT 500 ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Purchase orders loaded.", $stmt->fetchAll());
    }

    if ($operation === "getPurchaseOrder") {
        $id = intval($input["PO_ID"] ?? 0);

        $stmt = $conn->prepare("
            SELECT po.PO_ID, po.PO_Date, po.Expected_Date,
                   s.SupplierName, st.StatusName,
                   TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName
            FROM purchase_order po
            LEFT JOIN supplier s ON po.Supplier_ID = s.SupplierID
            LEFT JOIN `user` u ON po.User_ID = u.UserID
            LEFT JOIN status st ON po.Status_ID = st.StatusID
            WHERE po.PO_ID = :id AND po.IsArchived = 'No'
            LIMIT 1
        ");
        $stmt->execute([":id" => $id]);
        $header = $stmt->fetch();
        if (!$header) response(false, "Purchase order not found.", null);

        $stmt = $conn->prepare("
            SELECT p.ProductName, l.Quantity,
                   l.Unit_Price AS CostPrice
            FROM purchase_order_line l
            INNER JOIN product p ON l.Product_ID = p.ProductID
            WHERE l.PO_ID = :id AND l.IsArchived = 'No'
            ORDER BY l.PO_Line_ID ASC
        ");
        $stmt->execute([":id" => $id]);
        $header["lines"] = $stmt->fetchAll();

        response(true, "Purchase order loaded.", $header);
    }

    /* ============================== RECEIVINGS ============================== */
    /* NOTE: receiving table uses "StatusID" (no underscore) */

    if ($operation === "getReceivings") {
        $search = getSearch($input);
        $poCol  = receivingPoColumn($conn);

        $sql = "
            SELECT
                r.ReceivingID, r.ReceivingDate,
                " . ($poCol ? "r.$poCol" : "NULL") . " AS PO_Reference,
                s.SupplierName, st.StatusName,
                TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName
            FROM receiving r
            LEFT JOIN supplier s ON r.SupplierID = s.SupplierID
            LEFT JOIN `user` u ON r.ReceivedByUserID = u.UserID
            LEFT JOIN status st ON r.StatusID = st.StatusID
            WHERE r.IsArchived = 'No'
        ";
        $params = [];
        if ($search !== "") {
            $sql .= " AND (s.SupplierName LIKE :s1 OR st.StatusName LIKE :s2 OR r.ReceivingID LIKE :s3) ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
            $params[":s3"] = "%$search%";
        }
        $sql .= " ORDER BY r.ReceivingDate DESC, r.ReceivingID DESC LIMIT 500 ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Receivings loaded.", $stmt->fetchAll());
    }

    if ($operation === "getReceiving") {
        $id    = intval($input["ReceivingID"] ?? 0);
        $poCol = receivingPoColumn($conn);

        $stmt = $conn->prepare("
            SELECT r.ReceivingID, r.ReceivingDate,
                   " . ($poCol ? "r.$poCol" : "NULL") . " AS PO_Reference,
                   s.SupplierName, st.StatusName,
                   TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName
            FROM receiving r
            LEFT JOIN supplier s ON r.SupplierID = s.SupplierID
            LEFT JOIN `user` u ON r.ReceivedByUserID = u.UserID
            LEFT JOIN status st ON r.StatusID = st.StatusID
            WHERE r.ReceivingID = :id AND r.IsArchived = 'No'
            LIMIT 1
        ");
        $stmt->execute([":id" => $id]);
        $header = $stmt->fetch();
        if (!$header) response(false, "Receiving not found.", null);

        $stmt = $conn->prepare("
            SELECT rl.ProductID, p.ProductName, rl.ReceivedQuantity
            FROM receiving_line rl
            INNER JOIN product p ON rl.ProductID = p.ProductID
            WHERE rl.ReceivingID = :id AND rl.IsArchived = 'No'
            ORDER BY rl.ReceivingLineID ASC
        ");
        $stmt->execute([":id" => $id]);

        $poId    = extractPoId($header["PO_Reference"]);
        $ordered = orderedQtyMap($conn, $poId);

        $lines = [];
        foreach ($stmt->fetchAll() as $row) {
            $orderedQty  = $ordered[intval($row["ProductID"])] ?? 0;
            $receivedQty = intval($row["ReceivedQuantity"]);

            $lines[] = [
                "ProductName"      => $row["ProductName"],
                "OrderedQuantity"  => $orderedQty,
                "ReceivedQuantity" => $receivedQty,
                "Variance"         => $poId > 0 ? $receivedQty - $orderedQty : 0
            ];
        }
        $header["lines"] = $lines;

        response(true, "Receiving loaded.", $header);
    }

    /* ========================== PURCHASE RETURNS ========================== */

    if ($operation === "getPurchaseReturns") {
        $search = getSearch($input);
        $sql = "
            SELECT
                pr.Purchase_Return_ID, pr.Return_Date, pr.Reason, pr.Status_ID,
                st.StatusName, s.SupplierName,
                GROUP_CONCAT(p.ProductName ORDER BY p.ProductName SEPARATOR ', ') AS ProductName,
                COALESCE(SUM(l.Quantity), 0) AS Quantity
            FROM purchase_return pr
            LEFT JOIN supplier s ON pr.Supplier_ID = s.SupplierID
            LEFT JOIN status st ON pr.Status_ID = st.StatusID
            LEFT JOIN purchase_return_line l
                ON l.Purchase_Return_ID = pr.Purchase_Return_ID AND l.IsArchived = 'No'
            LEFT JOIN product p ON l.Product_ID = p.ProductID
            WHERE pr.IsArchived = 'No'
        ";
        $params = [];
        if ($search !== "") {
            $sql .= " AND (s.SupplierName LIKE :s1 OR p.ProductName LIKE :s2 OR pr.Reason LIKE :s3 OR st.StatusName LIKE :s4) ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
            $params[":s3"] = "%$search%";
            $params[":s4"] = "%$search%";
        }
        $sql .= "
            GROUP BY pr.Purchase_Return_ID, pr.Return_Date, pr.Reason, pr.Status_ID,
                     st.StatusName, s.SupplierName
            ORDER BY pr.Return_Date DESC, pr.Purchase_Return_ID DESC
            LIMIT 500
        ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Purchase returns loaded.", $stmt->fetchAll());
    }

    if ($operation === "getPurchaseReturn") {
        $id = intval($input["Purchase_Return_ID"] ?? 0);

        $stmt = $conn->prepare("
            SELECT pr.Purchase_Return_ID, pr.PO_ID, pr.Return_Date, pr.Reason, pr.Status_ID,
                   st.StatusName, s.SupplierName,
                   TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName
            FROM purchase_return pr
            LEFT JOIN supplier s ON pr.Supplier_ID = s.SupplierID
            LEFT JOIN status st ON pr.Status_ID = st.StatusID
            LEFT JOIN `user` u ON pr.User_ID = u.UserID
            WHERE pr.Purchase_Return_ID = :id AND pr.IsArchived = 'No'
            LIMIT 1
        ");
        $stmt->execute([":id" => $id]);
        $header = $stmt->fetch();
        if (!$header) response(false, "Purchase return not found.", null);

        $stmt = $conn->prepare("
            SELECT p.ProductName, l.Quantity
            FROM purchase_return_line l
            INNER JOIN product p ON l.Product_ID = p.ProductID
            WHERE l.Purchase_Return_ID = :id AND l.IsArchived = 'No'
            ORDER BY l.Purchase_Return_Line_ID ASC
        ");
        $stmt->execute([":id" => $id]);
        $header["lines"] = $stmt->fetchAll();

        response(true, "Purchase return loaded.", $header);
    }

    /* ======================= REPORTS / AUDIT / STAFF ======================= */

    if ($operation === "getTransactionSummary") {
        $rows = $conn->query("
            SELECT 'Receiving' AS Type,
                   COUNT(DISTINCT r.ReceivingID) AS `Count`,
                   COALESCE(SUM(l.ReceivedQuantity), 0) AS TotalQty
            FROM receiving r
            LEFT JOIN receiving_line l ON l.ReceivingID = r.ReceivingID AND l.IsArchived = 'No'
            WHERE r.IsArchived = 'No'

            UNION ALL

            SELECT 'Stock Release',
                   COUNT(DISTINCT sr.ReleaseID),
                   COALESCE(SUM(l.QuantityReleased), 0)
            FROM stock_release sr
            LEFT JOIN stock_release_line l ON l.ReleaseID = sr.ReleaseID AND l.IsArchived = 'No'
            WHERE sr.IsArchived = 'No'

            UNION ALL

            SELECT 'Stock Return',
                   COUNT(DISTINCT s.Stock_Return_ID),
                   COALESCE(SUM(l.Quantity), 0)
            FROM stock_return s
            LEFT JOIN stock_return_line l ON l.Stock_Return_ID = s.Stock_Return_ID AND l.IsArchived = 'No'
            WHERE s.IsArchived = 'No'

            UNION ALL

            SELECT 'Purchase Return',
                   COUNT(DISTINCT pr.Purchase_Return_ID),
                   COALESCE(SUM(l.Quantity), 0)
            FROM purchase_return pr
            LEFT JOIN purchase_return_line l
                ON l.Purchase_Return_ID = pr.Purchase_Return_ID AND l.IsArchived = 'No'
            WHERE pr.IsArchived = 'No'

            UNION ALL

            SELECT 'Inventory Adjustment',
                   COUNT(DISTINCT ia.Adjustment_ID),
                   COALESCE(SUM(
                       CASE
                           WHEN LOWER(TRIM(l.Adjustment_Type)) = 'decrease' THEN -l.Adjustment_Quantity
                           ELSE l.Adjustment_Quantity
                       END
                   ), 0)
            FROM inventory_adjustment ia
            LEFT JOIN inventory_adjustment_line l
                ON l.Adjustment_ID = ia.Adjustment_ID AND l.IsArchived = 'No'
            WHERE ia.IsArchived = 'No'
        ")->fetchAll();

        response(true, "Transaction summary loaded.", $rows);
    }

    if ($operation === "getAuditLogs") {
        $search = getSearch($input);
        $sql = "
            SELECT
                a.AuditLogID, a.ActionTimestamp, a.ActionType, a.TableAffected, a.Details,
                TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName
            FROM auditlog a
            LEFT JOIN `user` u ON a.UserID = u.UserID
            WHERE a.IsArchived = 'No'
        ";
        $params = [];
        if ($search !== "") {
            $sql .= "
                AND (
                    a.ActionType LIKE :s1 OR a.TableAffected LIKE :s2
                    OR a.Details LIKE :s3
                    OR CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,'')) LIKE :s4
                )
            ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
            $params[":s3"] = "%$search%";
            $params[":s4"] = "%$search%";
        }
        $sql .= " ORDER BY a.ActionTimestamp DESC, a.AuditLogID DESC LIMIT 500 ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Audit logs loaded.", $stmt->fetchAll());
    }

    if ($operation === "getStaffActivity") {
        response(true, "Staff activity loaded.", $conn->query("
            SELECT
                u.UserID,
                TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))) AS UserName,
                r.RoleName,
                COUNT(a.AuditLogID) AS TotalActions,
                MAX(a.ActionTimestamp) AS LastActivity
            FROM `user` u
            LEFT JOIN `role` r ON u.RoleID = r.RoleID
            LEFT JOIN auditlog a ON a.UserID = u.UserID AND a.IsArchived = 'No'
            WHERE u.IsArchived = 'No'
            GROUP BY u.UserID, u.FirstName, u.LastName, r.RoleName
            ORDER BY TotalActions DESC, UserName ASC
        ")->fetchAll());
    }

    /* ============================================================
       APPROVE / REJECT / CANCEL
    ============================================================ */

    /* ---------- PURCHASE ORDERS ---------- */
    if ($operation === "approvePurchaseOrder") {
        changeTransactionStatus($conn, $currentUserID,
            "purchase_order", "PO_ID", intval($input["PO_ID"] ?? 0),
            ["approved", "completed"], "Approved");
    }
    if ($operation === "rejectPurchaseOrder") {
        changeTransactionStatus($conn, $currentUserID,
            "purchase_order", "PO_ID", intval($input["PO_ID"] ?? 0),
            ["rejected", "cancelled", "canceled"], "Rejected");
    }
    if ($operation === "cancelPurchaseOrder") {
        changeTransactionStatus($conn, $currentUserID,
            "purchase_order", "PO_ID", intval($input["PO_ID"] ?? 0),
            ["cancelled", "canceled"], "Cancelled");
    }

    /* ---------- PURCHASE RETURNS ---------- */
    if ($operation === "approvePurchaseReturn") {
        changeTransactionStatus($conn, $currentUserID,
            "purchase_return", "Purchase_Return_ID", intval($input["Purchase_Return_ID"] ?? 0),
            ["approved", "completed"], "Approved");
    }
    if ($operation === "rejectPurchaseReturn") {
        changeTransactionStatus($conn, $currentUserID,
            "purchase_return", "Purchase_Return_ID", intval($input["Purchase_Return_ID"] ?? 0),
            ["rejected", "cancelled", "canceled"], "Rejected");
    }
    if ($operation === "cancelPurchaseReturn") {
        changeTransactionStatus($conn, $currentUserID,
            "purchase_return", "Purchase_Return_ID", intval($input["Purchase_Return_ID"] ?? 0),
            ["cancelled", "canceled"], "Cancelled");
    }

    /* ---------- RECEIVING (uses "StatusID" — no underscore) ---------- */
    if ($operation === "approveReceiving") {
        changeTransactionStatus($conn, $currentUserID,
            "receiving", "ReceivingID", intval($input["ReceivingID"] ?? 0),
            ["approved", "completed"], "Approved", "StatusID");
    }
    if ($operation === "rejectReceiving") {
        changeTransactionStatus($conn, $currentUserID,
            "receiving", "ReceivingID", intval($input["ReceivingID"] ?? 0),
            ["rejected", "cancelled", "canceled"], "Rejected", "StatusID");
    }
    if ($operation === "cancelReceiving") {
        changeTransactionStatus($conn, $currentUserID,
            "receiving", "ReceivingID", intval($input["ReceivingID"] ?? 0),
            ["cancelled", "canceled"], "Cancelled", "StatusID");
    }

    /* ---------- STOCK RELEASES ---------- */
    if ($operation === "approveStockRelease") {
        changeTransactionStatus($conn, $currentUserID,
            "stock_release", "ReleaseID", intval($input["ReleaseID"] ?? 0),
            ["completed", "approved", "released"], "Approved");
    }
    if ($operation === "rejectStockRelease") {
        changeTransactionStatus($conn, $currentUserID,
            "stock_release", "ReleaseID", intval($input["ReleaseID"] ?? 0),
            ["rejected", "cancelled", "canceled"], "Rejected");
    }
    if ($operation === "cancelStockRelease") {
        changeTransactionStatus($conn, $currentUserID,
            "stock_release", "ReleaseID", intval($input["ReleaseID"] ?? 0),
            ["cancelled", "canceled"], "Cancelled");
    }

    /* ---------- STOCK RETURNS ---------- */
    if ($operation === "approveStockReturn") {
        changeTransactionStatus($conn, $currentUserID,
            "stock_return", "Stock_Return_ID", intval($input["Stock_Return_ID"] ?? 0),
            ["approved", "completed"], "Approved");
    }
    if ($operation === "rejectStockReturn") {
        changeTransactionStatus($conn, $currentUserID,
            "stock_return", "Stock_Return_ID", intval($input["Stock_Return_ID"] ?? 0),
            ["rejected", "cancelled", "canceled"], "Rejected");
    }
    if ($operation === "cancelStockReturn") {
        changeTransactionStatus($conn, $currentUserID,
            "stock_return", "Stock_Return_ID", intval($input["Stock_Return_ID"] ?? 0),
            ["cancelled", "canceled"], "Cancelled");
    }

    /* ---------- INVENTORY ADJUSTMENTS ---------- */
    if ($operation === "approveAdjustment") {
        changeTransactionStatus($conn, $currentUserID,
            "inventory_adjustment", "Adjustment_ID", intval($input["Adjustment_ID"] ?? 0),
            ["approved", "completed"], "Approved");
    }
    if ($operation === "rejectAdjustment") {
        changeTransactionStatus($conn, $currentUserID,
            "inventory_adjustment", "Adjustment_ID", intval($input["Adjustment_ID"] ?? 0),
            ["rejected", "cancelled", "canceled"], "Rejected");
    }
    if ($operation === "cancelAdjustment") {
        changeTransactionStatus($conn, $currentUserID,
            "inventory_adjustment", "Adjustment_ID", intval($input["Adjustment_ID"] ?? 0),
            ["cancelled", "canceled"], "Cancelled");
    }

    /* ---------- LEGACY ---------- */
    if ($operation === "updateTransactionStatus") {
        response(false, "Please use the specific approve/reject/cancel operations instead.", null);
    }

    response(false, "Invalid operation: " . $operation, null);

} catch (PDOException $e) {
    response(false, "DB error: " . $e->getMessage(), null);
} catch (Exception $e) {
    response(false, "Server error: " . $e->getMessage(), null);
}