<?php

require_once __DIR__ . "/db.php";
require_once __DIR__ . "/notifications.php";
/* ============================================================
   HELPERS (specific sa Receiving)
============================================================ */

function requireReceivingStaff($conn, $userID)
{
    if (!$userID || intval($userID) <= 0) {
        response(false, "Authentication required.", null);
    }

    try {
        $stmt = $conn->prepare("
            SELECT
                u.UserID, u.UserName, u.UserStatus,
                u.IsArchived AS UserArchived,
                r.RoleName, r.IsArchived AS RoleArchived
            FROM `user` u
            LEFT JOIN `role` r ON u.RoleID = r.RoleID
            WHERE u.UserID = :id
            LIMIT 1
        ");
        $stmt->execute([":id" => intval($userID)]);
        $user = $stmt->fetch();

        if (!$user) response(false, "User not found.", null);

        if (strtolower(trim($user["UserArchived"] ?? "")) === "yes") {
            response(false, "Account archived.", null);
        }

        if (strtolower(trim($user["UserStatus"] ?? "")) !== "active") {
            response(false, "Account inactive.", null);
        }

        if (strtolower(trim($user["RoleArchived"] ?? "")) === "yes") {
            response(false, "Role archived.", null);
        }

        $role = strtolower(trim($user["RoleName"] ?? ""));

        if (
            $role !== "receiving staff" &&
            $role !== "admin" &&
            $role !== "administrator"
        ) {
            response(false, "Receiving Staff access required.", null);
        }

        return $user;

    } catch (PDOException $e) {
        response(false, "Auth error: " . $e->getMessage(), null);
    }
}

/* ============================================================
   STATUS HELPERS
============================================================ */

function getStatusIdByNames($conn, array $names)
{
    foreach ($names as $n) {
        $stmt = $conn->prepare("
            SELECT StatusID FROM status
            WHERE LOWER(TRIM(StatusName)) = :n AND IsArchived = 'No'
            LIMIT 1
        ");
        $stmt->execute([":n" => strtolower($n)]);
        $row = $stmt->fetch();
        if ($row) return intval($row["StatusID"]);
    }
    return null;
}

function isPOReceivedStatus($name)
{
    return in_array(strtolower(trim($name ?? "")), ["completed", "received"], true);
}

/* ============================================================
   STOCK COMPUTATION
============================================================ */

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
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('completed', 'received')
            GROUP BY rl.ProductID
        ) rin ON rin.pid = p.ProductID

        LEFT JOIN (
            SELECT l.ProductID AS pid, SUM(l.QuantityReleased) AS qty
            FROM stock_release_line l
            INNER JOIN stock_release h ON h.ReleaseID = l.ReleaseID
            LEFT JOIN status st ON h.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No'
              AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('completed', 'released')
            GROUP BY l.ProductID
        ) rel ON rel.pid = p.ProductID

        LEFT JOIN (
            SELECT l.Product_ID AS pid, SUM(l.Quantity) AS qty
            FROM stock_return_line l
            INNER JOIN stock_return h ON h.Stock_Return_ID = l.Stock_Return_ID
            LEFT JOIN status st ON h.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No'
              AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('completed')
            GROUP BY l.Product_ID
        ) sret ON sret.pid = p.ProductID

        LEFT JOIN (
            SELECT l.Product_ID AS pid, SUM(l.Quantity) AS qty
            FROM purchase_return_line l
            INNER JOIN purchase_return h ON h.Purchase_Return_ID = l.Purchase_Return_ID
            LEFT JOIN status st ON h.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No'
              AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('completed')
            GROUP BY l.Product_ID
        ) pret ON pret.pid = p.ProductID

        LEFT JOIN (
            SELECT l.Product_ID AS pid,
                   SUM(CASE
                       WHEN LOWER(TRIM(l.Adjustment_Type)) = 'increase' THEN ABS(l.Adjustment_Quantity)
                       WHEN LOWER(TRIM(l.Adjustment_Type)) = 'decrease' THEN -ABS(l.Adjustment_Quantity)
                       ELSE 0
                   END) AS qty
            FROM inventory_adjustment_line l
            INNER JOIN inventory_adjustment h ON h.Adjustment_ID = l.Adjustment_ID
            LEFT JOIN status st ON h.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No'
              AND h.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('completed')
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

try {

    $currentUserID = getCurrentUserID($input);

    if ($operation === "logout") {
        if ($currentUserID > 0) {
            addAudit($conn, $currentUserID, "LOGOUT", "user", "Receiving staff logged out.");
        }
        response(true, "Logout successful.", null);
    }

    requireReceivingStaff($conn, $currentUserID);

    /* ============================================================
       DASHBOARD STATS
    ============================================================ */

    if ($operation === "getReceivingDashboardStats") {

        $stmt = $conn->query("
            SELECT COUNT(*) AS total
            FROM purchase_order po
            INNER JOIN status s ON po.Status_ID = s.StatusID
            WHERE po.IsArchived = 'No'
              AND LOWER(TRIM(s.StatusName)) IN ('pending', 'approved')
        ");
        $expected = intval($stmt->fetch()["total"]);

        $stmt = $conn->query("
            SELECT COUNT(*) AS total
            FROM receiving
            WHERE IsArchived = 'No'
              AND DATE(ReceivingDate) = CURDATE()
        ");
        $today = intval($stmt->fetch()["total"]);

        $stmt = $conn->query("
            SELECT COUNT(*) AS total
            FROM receiving r
            INNER JOIN status s ON r.StatusID = s.StatusID
            WHERE r.IsArchived = 'No'
              AND LOWER(TRIM(s.StatusName)) = 'pending'
        ");
        $pending = intval($stmt->fetch()["total"]);

        $stmt = $conn->query("SELECT COUNT(*) AS total FROM product WHERE IsArchived = 'No'");
        $totalProducts = intval($stmt->fetch()["total"]);

        $stmt = $conn->query("
            SELECT
                po.PO_ID, po.PO_Date, po.Expected_Date,
                s.SupplierName,
                CONCAT(u.FirstName, ' ', u.LastName) AS UserName,
                st.StatusName
            FROM purchase_order po
            LEFT JOIN supplier s ON po.Supplier_ID = s.SupplierID
            LEFT JOIN `user` u ON po.User_ID = u.UserID
            LEFT JOIN status st ON po.Status_ID = st.StatusID
            WHERE po.IsArchived = 'No'
              AND LOWER(TRIM(st.StatusName)) IN ('pending', 'approved')
            ORDER BY po.PO_ID DESC
            LIMIT 10
        ");
        $expectedPOs = $stmt->fetchAll();

        response(true, "Dashboard stats loaded.", [
            "expectedDeliveries" => $expected,
            "receivingsToday"    => $today,
            "pendingReceivings"  => $pending,
            "totalProducts"      => $totalProducts,
            "expectedPOs"        => $expectedPOs
        ]);
    }

    /* ============================================================
       REFERENCE LISTS
    ============================================================ */

    if ($operation === "getProductsForReceiving") {
        $search = getSearch($input);

        $sql = "
            SELECT
                p.ProductID, p.Barcode, p.ProductName, p.Description,
                p.MinStockLevel, p.CategoryID,
                c.CategoryName,
                u.UnitName, u.UnitSymbol,
                b.BinCode, s.ShelfCode, a.AisleCode,
                " . stockExpression() . " AS OnHand
            FROM product p
            LEFT JOIN category c ON p.CategoryID = c.CategoryID
            LEFT JOIN bin b ON p.BinID = b.BinID
            LEFT JOIN shelf s ON b.ShelfID = s.ShelfID
            LEFT JOIN aisle a ON s.AisleID = a.AisleID
            LEFT JOIN unit_of_measure u ON p.UnitOfMeasureID = u.UnitOfMeasureID
            " . stockJoins() . "
            WHERE p.IsArchived = 'No'
        ";

        if ($search !== "") {
            $sql .= " AND (p.ProductName LIKE :s1 OR p.Barcode LIKE :s2 OR c.CategoryName LIKE :s3) ";
        }

        $sql .= " ORDER BY p.ProductName ASC LIMIT 500 ";

        $stmt = $conn->prepare($sql);
        $params = [];
        if ($search !== "") {
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
            $params[":s3"] = "%$search%";
        }
        $stmt->execute($params);

        response(true, "Products loaded.", $stmt->fetchAll());
    }

    if ($operation === "getCategoriesForReceiving") {
        $stmt = $conn->query("
            SELECT CategoryID, CategoryName FROM category
            WHERE IsArchived = 'No'
            ORDER BY CategoryName ASC
        ");
        response(true, "Categories loaded.", $stmt->fetchAll());
    }

    if ($operation === "getSuppliersForReceiving") {
        $search = getSearch($input);

        $sql = "
            SELECT SupplierID, SupplierName, ContactPerson, Phone, Email, Address
            FROM supplier
            WHERE IsArchived = 'No'
        ";

        if ($search !== "") {
            $sql .= " AND (SupplierName LIKE :s1 OR ContactPerson LIKE :s2 OR Email LIKE :s3 OR Phone LIKE :s4) ";
        }

        $sql .= " ORDER BY SupplierName ASC ";

        $stmt = $conn->prepare($sql);
        $params = [];
        if ($search !== "") {
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
            $params[":s3"] = "%$search%";
            $params[":s4"] = "%$search%";
        }
        $stmt->execute($params);

        response(true, "Suppliers loaded.", $stmt->fetchAll());
    }

    if ($operation === "getSupplierProductsForReceiving") {
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

    if ($operation === "getAislesForReceiving") {
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

    if ($operation === "getShelvesForReceiving") {
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

    if ($operation === "getBinsForReceiving") {
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

    if ($operation === "getStatusesForReceiving") {
        $stmt = $conn->query("
            SELECT StatusID, StatusName FROM status
            WHERE IsArchived = 'No'
            ORDER BY StatusName ASC
        ");
        response(true, "Statuses loaded.", $stmt->fetchAll());
    }

    /* ============================================================
       EXPECTED POs — LATEST FIRST
    ============================================================ */

    if ($operation === "getExpectedPurchaseOrders") {
        $search = getSearch($input);

        $sql = "
            SELECT
                po.PO_ID, po.PO_Date, po.Expected_Date,
                po.Supplier_ID, s.SupplierName, po.User_ID,
                CONCAT(u.FirstName, ' ', u.LastName) AS UserName,
                po.Status_ID, st.StatusName
            FROM purchase_order po
            LEFT JOIN supplier s ON po.Supplier_ID = s.SupplierID
            LEFT JOIN `user` u ON po.User_ID = u.UserID
            LEFT JOIN status st ON po.Status_ID = st.StatusID
            WHERE po.IsArchived = 'No'
              AND LOWER(TRIM(st.StatusName)) IN ('pending', 'approved', 'completed', 'received')
        ";

        $params = [];
        if ($search !== "") {
            $sql .= " AND (s.SupplierName LIKE :s1 OR po.PO_ID LIKE :s2) ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
        }

        $sql .= " ORDER BY po.PO_ID DESC ";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        response(true, "Expected POs loaded.", $stmt->fetchAll());
    }

    if ($operation === "getPurchaseOrderLines") {
        $poId = intval($input["PO_ID"] ?? 0);

        $stmt = $conn->prepare("
            SELECT
                pol.PO_Line_ID,
                pol.Product_ID AS ProductID,
                p.ProductName,
                pol.Quantity AS OrderedQuantity,
                pol.Unit_Price AS CostPrice
            FROM purchase_order_line pol
            LEFT JOIN product p ON pol.Product_ID = p.ProductID
            WHERE pol.PO_ID = :id
              AND pol.IsArchived = 'No'
        ");
        $stmt->execute([":id" => $poId]);
        response(true, "PO lines loaded.", $stmt->fetchAll());
    }

    /* ============================================================
       RECEIVINGS — LATEST FIRST
    ============================================================ */

    if ($operation === "getReceivings") {
        $search = getSearch($input);
        $date = trim($input["date"] ?? "");
        $status = trim($input["status"] ?? "");

        $sql = "
            SELECT
                r.ReceivingID, r.ReceivingDate,
                r.SupplierID, s.SupplierName,
                r.ReceivedByUserID,
                CONCAT(u.FirstName, ' ', u.LastName) AS UserName,
                r.PO_ID AS PO_Reference,
                r.StatusID, st.StatusName
            FROM receiving r
            LEFT JOIN supplier s ON r.SupplierID = s.SupplierID
            LEFT JOIN `user` u ON r.ReceivedByUserID = u.UserID
            LEFT JOIN status st ON r.StatusID = st.StatusID
            WHERE r.IsArchived = 'No'
        ";

        $params = [];

        if ($search !== "") {
            $sql .= " AND (s.SupplierName LIKE :s1 OR r.PO_ID LIKE :s2) ";
            $params[":s1"] = "%$search%";
            $params[":s2"] = "%$search%";
        }

        if ($date !== "") {
            $sql .= " AND DATE(r.ReceivingDate) = :date ";
            $params[":date"] = $date;
        }

        if ($status !== "") {
            $sql .= " AND r.StatusID = :status ";
            $params[":status"] = intval($status);
        }

        $sql .= " ORDER BY r.ReceivingID DESC LIMIT 500 ";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        response(true, "Receivings loaded.", $stmt->fetchAll());
    }

    if ($operation === "getReceivingById") {
        $id = intval($input["ReceivingID"] ?? 0);

        $stmt = $conn->prepare("
            SELECT
                r.ReceivingID, r.ReceivingDate,
                r.SupplierID, s.SupplierName,
                r.ReceivedByUserID,
                CONCAT(u.FirstName, ' ', u.LastName) AS UserName,
                r.PO_ID AS PO_Reference,
                r.StatusID, st.StatusName
            FROM receiving r
            LEFT JOIN supplier s ON r.SupplierID = s.SupplierID
            LEFT JOIN `user` u ON r.ReceivedByUserID = u.UserID
            LEFT JOIN status st ON r.StatusID = st.StatusID
            WHERE r.ReceivingID = :id
            LIMIT 1
        ");
        $stmt->execute([":id" => $id]);
        $row = $stmt->fetch();

        if (!$row) response(false, "Receiving not found.", null);

        $poId = !empty($row["PO_Reference"]) ? intval($row["PO_Reference"]) : null;

        $stmt = $conn->prepare("
            SELECT
                rl.ReceivingLineID,
                rl.ProductID AS ProductID,
                p.ProductName,
                rl.ReceivedQuantity AS ReceivedQty,
                rl.CostPrice,
                COALESCE(pol.Quantity, 0) AS OrderedQty
            FROM receiving_line rl
            LEFT JOIN product p
                ON rl.ProductID = p.ProductID
            LEFT JOIN purchase_order_line pol
                ON pol.Product_ID = rl.ProductID
                AND pol.PO_ID = :poId
                AND pol.IsArchived = 'No'
            WHERE rl.ReceivingID = :id
              AND rl.IsArchived = 'No'
        ");
        $stmt->execute([
            ":id"   => $id,
            ":poId" => $poId
        ]);
        $row["lines"] = $stmt->fetchAll();

        response(true, "Receiving loaded.", $row);
    }

    /* ============================================================
       insertReceiving
       AUTO-COMPLETED — walay status picker
       FOR UPDATE lock — walay duplicate
    ============================================================ */

    if ($operation === "insertReceiving") {

        $supplierID = intval($input["SupplierID"] ?? 0);
        $date = trim($input["ReceivingDate"] ?? "");
        $poRefInput = trim($input["PO_Reference"] ?? "");
        $poId = $poRefInput !== "" ? intval($poRefInput) : null;
        $lines = $input["Lines"] ?? [];

        if ($supplierID <= 0 || $date === "") {
            response(false, "Supplier and date are required.", null);
        }

        if (!is_array($lines) || !count($lines)) {
            response(false, "At least one line is required.", null);
        }

        $completedStatusID = getStatusIdByNames($conn, ["completed", "received"]);

        if (!$completedStatusID) {
            response(false, "No 'Completed' status found. Ask the admin to add it.", null);
        }

        $conn->beginTransaction();

        try {

            if ($poId) {
                $chk = $conn->prepare("
                    SELECT st.StatusName
                    FROM purchase_order po
                    LEFT JOIN status st ON po.Status_ID = st.StatusID
                    WHERE po.PO_ID = :id
                    FOR UPDATE
                ");
                $chk->execute([":id" => $poId]);
                $poRow = $chk->fetch();

                if ($poRow && isPOReceivedStatus($poRow["StatusName"] ?? "")) {
                    $conn->rollBack();
                    response(false, "This PO is already received.", null);
                }
            }

            $stmt = $conn->prepare("
                INSERT INTO receiving
                (ReceivingDate, SupplierID, ReceivedByUserID, PO_ID, StatusID, IsArchived)
                VALUES (:date, :sup, :usr, :po, :st, 'No')
            ");
            $stmt->execute([
                ":date" => $date,
                ":sup"  => $supplierID,
                ":usr"  => $currentUserID,
                ":po"   => $poId,
                ":st"   => $completedStatusID
            ]);

            $newID = $conn->lastInsertId();

            $lineStmt = $conn->prepare("
                INSERT INTO receiving_line
                (ReceivingID, ProductID, ReceivedQuantity, CostPrice, IsArchived)
                VALUES (:rid, :pid, :rq, :cp, 'No')
            ");

            foreach ($lines as $line) {
                $lineStmt->execute([
                    ":rid" => $newID,
                    ":pid" => intval($line["ProductID"] ?? 0) ?: null,
                    ":rq"  => floatval($line["ReceivedQuantity"] ?? $line["ReceivedQty"] ?? 0),
                    ":cp"  => floatval($line["CostPrice"] ?? 0)
                ]);
            }

            if ($poId) {
                $conn->prepare("UPDATE purchase_order SET Status_ID = :s WHERE PO_ID = :id")
                     ->execute([":s" => $completedStatusID, ":id" => $poId]);
            }

            $conn->commit();

            addAudit($conn, $currentUserID, "INSERT", "receiving", "Created Receiving #$newID (Completed)");
            notifyTransactionCompleted($conn, "receiving", $newID, $currentUserID);
            response(true, "Receiving saved and marked as Completed.", ["ReceivingID" => $newID]);

        } catch (Exception $e) {
            $conn->rollBack();
            response(false, "Insert failed: " . $e->getMessage(), null);
        }
    }

    response(false, "Invalid operation: " . $operation, null);

} catch (PDOException $e) {
    response(false, "DB error: " . $e->getMessage(), null);
} catch (Exception $e) {
    response(false, "Server error: " . $e->getMessage(), null);
}