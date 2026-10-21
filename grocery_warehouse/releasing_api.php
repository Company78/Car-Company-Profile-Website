<?php

require_once __DIR__ . "/db.php";
require_once __DIR__ . "/notifications.php";
/* ============================================================
   HELPERS (specific sa Releasing)
============================================================ */

function requireReleasing($conn, $currentUserID)
{
    if (!$currentUserID || intval($currentUserID) <= 0) {
        response(false, "Releasing access required.", null);
    }

    try {
        $stmt = $conn->prepare("
            SELECT u.UserID, u.RoleID, u.UserName, u.UserStatus,
                   u.IsArchived AS UserArchived,
                   r.RoleName, r.IsArchived AS RoleArchived
            FROM `user` u
            LEFT JOIN `role` r ON u.RoleID = r.RoleID
            WHERE u.UserID = :id LIMIT 1
        ");
        $stmt->execute([":id" => intval($currentUserID)]);
        $user = $stmt->fetch();

        if (!$user) response(false, "User not found.", null);
        if (strtolower(trim($user["UserArchived"] ?? "")) === "yes")
            response(false, "Your account is archived.", null);
        if (strtolower(trim($user["UserStatus"] ?? "")) !== "active")
            response(false, "Your account is inactive.", null);
        if (strtolower(trim($user["RoleArchived"] ?? "")) === "yes")
            response(false, "Your role is archived.", null);

        $allowedRoleIDs = [1, 8];
        $roleOk = in_array(intval($user["RoleID"]), $allowedRoleIDs, true);

        if (!$roleOk) {
            $role = preg_replace('/[^a-z]/', '', strtolower($user["RoleName"] ?? ""));
            $roleOk = (strpos($role, "releas") !== false) || $role === "admin" || $role === "administrator";
        }

        if (!$roleOk) {
            response(false, "Releasing access required. Current role: " . ($user["RoleName"] ?? "No Role"), null);
        }

        return $user;
    } catch (PDOException $e) {
        response(false, "Auth error: " . $e->getMessage(), null);
    }
}

/* ============================================================
   STOCK COMPUTATION
   Only APPROVED / COMPLETED / RELEASED / RECEIVED transactions
   affect QOH. Pending transactions DO NOT count.
============================================================ */

function stockJoins()
{
    return "
        LEFT JOIN (
            SELECT rl.ProductID AS pid, SUM(rl.ReceivedQuantity) AS qty
            FROM receiving_line rl
            INNER JOIN receiving r ON rl.ReceivingID = r.ReceivingID
            LEFT JOIN status st ON r.StatusID = st.StatusID
            WHERE rl.IsArchived = 'No'
              AND r.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed', 'received')
            GROUP BY rl.ProductID
        ) rin ON rin.pid = p.ProductID

        LEFT JOIN (
            SELECT srl.ProductID AS pid, SUM(srl.QuantityReleased) AS qty
            FROM stock_release_line srl
            INNER JOIN stock_release sr ON srl.ReleaseID = sr.ReleaseID
            LEFT JOIN status st ON sr.Status_ID = st.StatusID
            WHERE srl.IsArchived = 'No'
              AND sr.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed', 'released')
            GROUP BY srl.ProductID
        ) rel ON rel.pid = p.ProductID

        LEFT JOIN (
            SELECT l.Product_ID AS pid, SUM(l.Quantity) AS qty
            FROM stock_return_line l
            INNER JOIN stock_return sr ON l.Stock_Return_ID = sr.Stock_Return_ID
            LEFT JOIN status st ON sr.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No'
              AND sr.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed')
            GROUP BY l.Product_ID
        ) sret ON sret.pid = p.ProductID

        LEFT JOIN (
            SELECT l.Product_ID AS pid, SUM(l.Quantity) AS qty
            FROM purchase_return_line l
            INNER JOIN purchase_return pr ON l.Purchase_Return_ID = pr.Purchase_Return_ID
            LEFT JOIN status st ON pr.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No'
              AND pr.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed')
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
            INNER JOIN inventory_adjustment ia ON l.Adjustment_ID = ia.Adjustment_ID
            LEFT JOIN status st ON ia.Status_ID = st.StatusID
            WHERE l.IsArchived = 'No'
              AND ia.IsArchived = 'No'
              AND LOWER(TRIM(COALESCE(st.StatusName, ''))) IN ('approved', 'completed')
            GROUP BY l.Product_ID
        ) adj ON adj.pid = p.ProductID
    ";
}

function stockExpression()
{
    return "(
        COALESCE(rin.qty, 0) - COALESCE(rel.qty, 0)
        + COALESCE(sret.qty, 0) - COALESCE(pret.qty, 0)
        + COALESCE(adj.qty, 0)
    )";
}

function getOnHand($conn, $productID)
{
    $stmt = $conn->prepare("
        SELECT " . stockExpression() . " AS OnHand
        FROM product p " . stockJoins() . "
        WHERE p.ProductID = :pid
    ");
    $stmt->execute([":pid" => intval($productID)]);
    $row = $stmt->fetch();
    return $row ? intval($row["OnHand"]) : 0;
}

function findStatusIDByName($conn, $name)
{
    $stmt = $conn->prepare("
        SELECT StatusID FROM status
        WHERE LOWER(TRIM(StatusName)) = :name AND IsArchived = 'No' LIMIT 1
    ");
    $stmt->execute([":name" => strtolower(trim($name))]);
    $row = $stmt->fetch();
    return $row ? intval($row["StatusID"]) : 0;
}

try {

    $currentUserID = getCurrentUserID($input);

    if ($operation === "logout") {
        if ($currentUserID > 0) {
            addAudit($conn, $currentUserID, "LOGOUT", "user", "Releasing staff logged out.");
        }
        response(true, "Logout successful.", null);
    }

    requireReleasing($conn, $currentUserID);

    /* ============================================================
       DASHBOARD
    ============================================================ */

    if ($operation === "getDashboardStats") {

        $pendingID   = findStatusIDByName($conn, "pending");
        $approvedID  = findStatusIDByName($conn, "approved");
        $completedID = findStatusIDByName($conn, "completed");

        $toProcessCount = 0;
        if ($approvedID > 0) {
            $stmt = $conn->prepare("
                SELECT COUNT(*) AS t FROM stock_release
                WHERE IsArchived = 'No' AND Status_ID = :sid
            ");
            $stmt->execute([":sid" => $approvedID]);
            $toProcessCount = intval($stmt->fetch()["t"]);
        }

        $completedCount = 0;
        if ($completedID > 0) {
            $stmt = $conn->prepare("
                SELECT COUNT(*) AS t FROM stock_release
                WHERE IsArchived = 'No' AND Status_ID = :sid
            ");
            $stmt->execute([":sid" => $completedID]);
            $completedCount = intval($stmt->fetch()["t"]);
        }

        $totalProducts = intval($conn->query("
            SELECT COUNT(*) AS t FROM product WHERE IsArchived = 'No'
        ")->fetch()["t"]);

        $lowStockCount = intval($conn->query("
            SELECT COUNT(*) AS t FROM (
                SELECT p.ProductID, " . stockExpression() . " AS OnHand, p.MinStockLevel
                FROM product p " . stockJoins() . "
                WHERE p.IsArchived = 'No'
                HAVING OnHand <= p.MinStockLevel
            ) x
        ")->fetch()["t"]);

        $toProcess = [];
        if ($approvedID > 0) {
            $stmt = $conn->prepare("
                SELECT sr.ReleaseID,
                       st.StatusName,
                       (SELECT COUNT(*) FROM stock_release_line l WHERE l.ReleaseID = sr.ReleaseID AND l.IsArchived = 'No') AS ItemCount
                FROM stock_release sr
                LEFT JOIN status st ON sr.Status_ID = st.StatusID
                WHERE sr.IsArchived = 'No' AND sr.Status_ID = :sid
                ORDER BY sr.ReleaseID DESC
                LIMIT 8
            ");
            $stmt->execute([":sid" => $approvedID]);
            $toProcess = $stmt->fetchAll();
        }

        $recentCompleted = [];
        if ($completedID > 0) {
            $stmt = $conn->prepare("
                SELECT sr.ReleaseID, sr.ReleaseDate,
                       NULLIF(TRIM(CONCAT(COALESCE(u.FirstName,''), ' ', COALESCE(u.LastName,''))), '') AS ReleasedBy,
                       st.StatusName
                FROM stock_release sr
                LEFT JOIN `user` u ON sr.ReleasedByUserID = u.UserID
                LEFT JOIN status st ON sr.Status_ID = st.StatusID
                WHERE sr.IsArchived = 'No' AND sr.Status_ID = :sid
                ORDER BY sr.ReleaseDate DESC, sr.ReleaseID DESC
                LIMIT 8
            ");
            $stmt->execute([":sid" => $completedID]);
            $recentCompleted = $stmt->fetchAll();
        }

        $topProducts = [];
        if ($completedID > 0) {
            $stmt = $conn->prepare("
                SELECT p.ProductName, SUM(srl.QuantityReleased) AS Qty
                FROM stock_release_line srl
                INNER JOIN stock_release sr ON srl.ReleaseID = sr.ReleaseID
                INNER JOIN product p ON srl.ProductID = p.ProductID
                WHERE srl.IsArchived = 'No' AND sr.IsArchived = 'No' AND sr.Status_ID = :sid
                GROUP BY p.ProductID, p.ProductName
                ORDER BY Qty DESC
                LIMIT 6
            ");
            $stmt->execute([":sid" => $completedID]);
            $topProducts = $stmt->fetchAll();
        }

        $lowStockItems = $conn->query("
            SELECT p.ProductName, " . stockExpression() . " AS OnHand, p.MinStockLevel
            FROM product p " . stockJoins() . "
            WHERE p.IsArchived = 'No'
            HAVING OnHand <= p.MinStockLevel
            ORDER BY (p.MinStockLevel - OnHand) DESC
            LIMIT 8
        ")->fetchAll();

        $statusBreakdown = $conn->query("
            SELECT COALESCE(st.StatusName, 'No Status') AS StatusName, COUNT(*) AS Total
            FROM stock_release sr
            LEFT JOIN status st ON sr.Status_ID = st.StatusID
            WHERE sr.IsArchived = 'No'
            GROUP BY st.StatusName
            ORDER BY Total DESC
        ")->fetchAll();

        response(true, "Dashboard loaded.", [
            "topProducts"     => $topProducts,
            "lowStockItems"   => $lowStockItems,
            "toProcessCount"  => $toProcessCount,
            "completedCount"  => $completedCount,
            "totalProducts"   => $totalProducts,
            "lowStockCount"   => $lowStockCount,
            "toProcess"       => $toProcess,
            "recentCompleted" => $recentCompleted,
            "statusBreakdown" => $statusBreakdown
        ]);
    }

    /* ============================================================
       REFERENCE DATA (view-only)
    ============================================================ */

    /* categories (for the category filter dropdown)
       Falls back to an unfiltered query if the category table
       has no IsArchived column. */
    if ($operation === "getCategories") {
        try {
            $stmt = $conn->query("
                SELECT CategoryID, CategoryName FROM category
                WHERE IsArchived = 'No' ORDER BY CategoryName ASC
            ");
        } catch (PDOException $e) {
            $stmt = $conn->query("
                SELECT CategoryID, CategoryName FROM category
                ORDER BY CategoryName ASC
            ");
        }
        response(true, "Categories loaded.", $stmt->fetchAll());
    }

    /* search + category filter */
    if ($operation === "getProducts") {
        $search     = getSearch($input);
        $categoryID = intval($input["CategoryID"] ?? 0);

        $sql = "
            SELECT p.ProductID, p.Barcode, p.ProductName, p.MinStockLevel,
                   p.CostPrice, p.CategoryID,
                   c.CategoryName, u.UnitName, b.BinCode,
                   " . stockExpression() . " AS OnHand
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
            $params[":s1"] = "%$search%"; $params[":s2"] = "%$search%"; $params[":s3"] = "%$search%";
        }
        if ($categoryID > 0) {
            $sql .= " AND p.CategoryID = :cid ";
            $params[":cid"] = $categoryID;
        }
        $sql .= " ORDER BY p.ProductName ASC LIMIT 500 ";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Products loaded.", $stmt->fetchAll());
    }

    /* search + category filter (also used by the New Release modal) */
    if ($operation === "getInventoryQuantities") {
        $search     = getSearch($input);
        $categoryID = intval($input["CategoryID"] ?? 0);

        $sql = "
            SELECT p.ProductID, p.Barcode, p.ProductName, p.MinStockLevel,
                   p.CostPrice, p.CategoryID,
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
            $params[":s1"] = "%$search%"; $params[":s2"] = "%$search%"; $params[":s3"] = "%$search%";
        }
        if ($categoryID > 0) {
            $sql .= " AND p.CategoryID = :cid ";
            $params[":cid"] = $categoryID;
        }
        $sql .= " ORDER BY p.ProductName ASC ";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Inventory loaded.", $stmt->fetchAll());
    }

    if ($operation === "getAisles") {
        $search = getSearch($input);

        $sql = "SELECT AisleID, AisleCode FROM aisle WHERE IsArchived = 'No'";
        $params = [];

        if ($search !== "") {
            $sql .= " AND AisleCode LIKE :search ";
            $params[":search"] = "%$search%";
        }
        $sql .= " ORDER BY AisleCode ASC";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Aisles loaded.", $stmt->fetchAll());
    }

    if ($operation === "getShelves") {
        $search  = getSearch($input);
        $aisleID = intval($input["AisleID"] ?? 0);

        $sql = "
            SELECT s.ShelfID, s.ShelfCode, s.AisleID, a.AisleCode
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
        if ($aisleID > 0) {
            $sql .= " AND s.AisleID = :aid ";
            $params[":aid"] = $aisleID;
        }
        $sql .= " ORDER BY a.AisleCode ASC, s.ShelfCode ASC";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Shelves loaded.", $stmt->fetchAll());
    }

    if ($operation === "getBins") {
        $search  = getSearch($input);
        $aisleID = intval($input["AisleID"] ?? 0);
        $shelfID = intval($input["ShelfID"] ?? 0);

        $sql = "
            SELECT b.BinID, b.BinCode, s.ShelfCode, s.ShelfID, a.AisleCode, a.AisleID
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
        if ($aisleID > 0) {
            $sql .= " AND a.AisleID = :aid ";
            $params[":aid"] = $aisleID;
        }
        if ($shelfID > 0) {
            $sql .= " AND b.ShelfID = :sid ";
            $params[":sid"] = $shelfID;
        }
        $sql .= " ORDER BY a.AisleCode ASC, s.ShelfCode ASC, b.BinCode ASC";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        response(true, "Bins loaded.", $stmt->fetchAll());
    }

    /* ============================================================
       STOCK RELEASES
    ============================================================ */

    if ($operation === "getStockReleases") {

        $search   = getSearch($input);
        $statusID = intval($input["Status_ID"] ?? 0);
        $dateFrom = trim($input["dateFrom"] ?? "");
        $dateTo   = trim($input["dateTo"] ?? "");

        $sql = "
            SELECT sr.ReleaseID, sr.ReleaseDate,
                   NULLIF(TRIM(CONCAT(COALESCE(lu.FirstName,''), ' ', COALESCE(lu.LastName,''))), '') AS ReleasedBy,
                   sr.Status_ID, st.StatusName,
                   (SELECT COUNT(*) FROM stock_release_line l WHERE l.ReleaseID = sr.ReleaseID AND l.IsArchived = 'No') AS ItemCount
            FROM stock_release sr
            LEFT JOIN `user` lu ON sr.ReleasedByUserID = lu.UserID
            LEFT JOIN status st ON sr.Status_ID = st.StatusID
            WHERE sr.IsArchived = 'No'
        ";

        $params = [];

        if ($statusID > 0) {
            $sql .= " AND sr.Status_ID = :statusid ";
            $params[":statusid"] = $statusID;
        }

        if ($search !== "") {
            $sql .= " AND (
                CONCAT(COALESCE(lu.FirstName,''),' ',COALESCE(lu.LastName,'')) LIKE :s1
                OR EXISTS (
                    SELECT 1 FROM stock_release_line srl
                    INNER JOIN product p ON srl.ProductID = p.ProductID
                    WHERE srl.ReleaseID = sr.ReleaseID
                      AND srl.IsArchived = 'No'
                      AND p.ProductName LIKE :s2
                )
            ) ";
            $params[":s1"] = "%$search%"; $params[":s2"] = "%$search%";
        }

        if ($dateFrom !== "") {
            $sql .= " AND (sr.ReleaseDate >= :df OR sr.ReleaseDate IS NULL) ";
            $params[":df"] = $dateFrom;
        }

        if ($dateTo !== "") {
            $sql .= " AND (sr.ReleaseDate <= :dt OR sr.ReleaseDate IS NULL) ";
            $params[":dt"] = $dateTo;
        }

        $sql .= " ORDER BY sr.ReleaseID DESC LIMIT 500 ";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        response(true, "Stock releases loaded.", $stmt->fetchAll());
    }

    if ($operation === "getStockRelease") {

        $id = intval($input["ReleaseID"] ?? 0);
        if ($id <= 0) response(false, "Invalid release ID.", null);

        $stmt = $conn->prepare("
            SELECT sr.ReleaseID, sr.ReleaseDate, sr.Status_ID, st.StatusName,
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
            SELECT srl.ReleaseLineID AS Stock_Release_Line_ID, srl.ProductID, p.ProductName, b.BinCode,
                   u.UnitName,
                   srl.QuantityReleased,
                   COALESCE(srl.SellingPrice, 0) AS SellingPrice,
                   " . stockExpression() . " AS OnHand
            FROM stock_release_line srl
            INNER JOIN product p ON srl.ProductID = p.ProductID
            LEFT JOIN bin b ON p.BinID = b.BinID
            LEFT JOIN unit_of_measure u ON p.UnitOfMeasureID = u.UnitOfMeasureID
            " . stockJoins() . "
            WHERE srl.ReleaseID = :id AND srl.IsArchived = 'No'
            ORDER BY srl.ReleaseLineID ASC
        ");
        $stmt->execute([":id" => $id]);
        $header["lines"] = $stmt->fetchAll();

        response(true, "Stock release loaded.", $header);
    }

    /* ------------------------------------------------------------
       CREATE a stock release (done by releasing staff)
       Saved as COMPLETED directly (no manager approval, no extra processing step).
       Saves SellingPrice (auto +20% from cost on frontend)
    ------------------------------------------------------------ */
    if ($operation === "createStockRelease") {

        $releaseDate = trim($input["ReleaseDate"] ?? "");
        $lines       = $input["lines"] ?? [];

        if ($releaseDate === "") response(false, "Release date is required.", null);
        if (!is_array($lines) || count($lines) === 0) response(false, "Add at least one product.", null);

        // Merge duplicate products (keep highest SellingPrice)
        $merged = [];
        foreach ($lines as $l) {
            $pid          = intval($l["ProductID"] ?? 0);
            $qty          = intval($l["Quantity"] ?? 0);
            $sellingPrice = floatval($l["SellingPrice"] ?? 0);

            if ($pid <= 0) response(false, "Please select a product for every line.", null);
            if ($qty <= 0) response(false, "Quantity must be greater than zero.", null);

            if (!isset($merged[$pid])) {
                $merged[$pid] = ["qty" => 0, "price" => $sellingPrice];
            }
            $merged[$pid]["qty"] += $qty;

            if ($sellingPrice > $merged[$pid]["price"]) {
                $merged[$pid]["price"] = $sellingPrice;
            }
        }

        // Save as COMPLETED (manager approval no longer required)
        $completedStatusID = findStatusIDByName($conn, "completed");
        if ($completedStatusID <= 0) response(false, "No 'Completed' status found. Ask the admin to add it.", null);

        // Validate products + soft-check on-hand
        $chk = $conn->prepare("SELECT ProductName FROM product WHERE ProductID = :id AND IsArchived = 'No' LIMIT 1");
        foreach ($merged as $pid => $row) {
            $chk->execute([":id" => $pid]);
            $prod = $chk->fetch();
            if (!$prod) response(false, "A selected product was not found.", null);

            $onHand = getOnHand($conn, $pid);
            if ($row["qty"] > $onHand) {
                response(false, "Insufficient stock for \"" . $prod["ProductName"] . "\". On hand: $onHand, requested: " . $row["qty"] . ".", null);
            }
        }

        try {
            $conn->beginTransaction();

            $conn->prepare("
                INSERT INTO stock_release (ReleasedByUserID, ReleaseDate, Status_ID, IsArchived)
                VALUES (:rel, :rdate, :s, 'No')
            ")->execute([
                ":rel"   => $currentUserID,
                ":rdate" => $releaseDate,
                ":s"     => $completedStatusID
            ]);
            $releaseID = intval($conn->lastInsertId());

            $ins = $conn->prepare("
                INSERT INTO stock_release_line (ReleaseID, ProductID, QuantityReleased, SellingPrice, IsArchived)
                VALUES (:r, :p, :q, :sp, 'No')
            ");
            foreach ($merged as $pid => $row) {
                $ins->execute([
                    ":r"  => $releaseID,
                    ":p"  => $pid,
                    ":q"  => $row["qty"],
                    ":sp" => $row["price"]
                ]);
            }

            $conn->commit();
        } catch (Exception $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            response(false, "Failed to create stock release: " . $e->getMessage(), null);
        }

        addAudit($conn, $currentUserID, "INSERT", "stock_release", "Created stock release #$releaseID (Completed).");

        response(true, "Stock release #$releaseID completed.", ["ReleaseID" => $releaseID]);
    }

    /* ------------------------------------------------------------
       PROCESS an existing Approved release
    ------------------------------------------------------------ */
    if ($operation === "processStockRelease") {

        $id            = intval($input["ReleaseID"] ?? 0);
        $releaseDate   = trim($input["ReleaseDate"] ?? "");
        $lines         = $input["lines"] ?? [];
        $markCompleted = !empty($input["markCompleted"]);

        if ($id <= 0) response(false, "Invalid release ID.", null);
        if ($releaseDate === "") response(false, "Release date is required.", null);
        if (!is_array($lines) || count($lines) === 0) response(false, "No release lines to process.", null);

        $stmt = $conn->prepare("
            SELECT sr.*, st.StatusName
            FROM stock_release sr
            LEFT JOIN status st ON sr.Status_ID = st.StatusID
            WHERE sr.ReleaseID = :id AND sr.IsArchived = 'No'
            LIMIT 1
        ");
        $stmt->execute([":id" => $id]);
        $release = $stmt->fetch();

        if (!$release) response(false, "Stock release not found.", null);

        $statusName = strtolower(trim($release["StatusName"] ?? ""));
        if ($statusName !== "approved") {
            response(false, "Only approved stock releases can be processed. This one is " . ($release["StatusName"] ?: "unknown") . ".", null);
        }

        $lineCheck = $conn->prepare("
            SELECT ProductID, QuantityReleased
            FROM stock_release_line
            WHERE ReleaseLineID = :lid AND ReleaseID = :rid AND IsArchived = 'No'
            LIMIT 1
        ");

        foreach ($lines as $line) {

            $lineID = intval($line["Stock_Release_Line_ID"] ?? 0);
            $qty    = intval($line["QuantityReleased"] ?? -1);

            if ($lineID <= 0) response(false, "Invalid release line.", null);
            if ($qty < 0) response(false, "Quantity released cannot be negative.", null);

            $lineCheck->execute([":lid" => $lineID, ":rid" => $id]);
            $lineRow = $lineCheck->fetch();

            if (!$lineRow) response(false, "A release line was not found.", null);

            $onHand       = getOnHand($conn, $lineRow["ProductID"]);
            $prevReleased = intval($lineRow["QuantityReleased"] ?? 0);
            $availableNow = $onHand + $prevReleased;

            if ($qty > $availableNow) {
                response(false, "Insufficient stock to release the quantity for one of the products.", null);
            }
        }

        if ($markCompleted) {
            foreach ($lines as $line) {
                $qty = intval($line["QuantityReleased"] ?? 0);
                if ($qty <= 0) {
                    response(false, "Every line needs a quantity greater than zero to mark this release as completed.", null);
                }
            }
        }

        $conn->beginTransaction();

        $lineStmt = $conn->prepare("
            UPDATE stock_release_line
            SET QuantityReleased = :qty,
                SellingPrice = :sp
            WHERE ReleaseLineID = :lid AND ReleaseID = :rid
        ");

        foreach ($lines as $line) {
            $lineStmt->execute([
                ":qty" => intval($line["QuantityReleased"] ?? 0),
                ":sp"  => floatval($line["SellingPrice"] ?? 0),
                ":lid" => intval($line["Stock_Release_Line_ID"]),
                ":rid" => $id
            ]);
        }

        if ($markCompleted) {

            $completedID = findStatusIDByName($conn, "completed");
            if ($completedID <= 0) {
                $conn->rollBack();
                response(false, "No 'Completed' status found. Ask the admin to add it.", null);
            }

            $conn->prepare("
                UPDATE stock_release
                SET ReleaseDate = :rdate, Status_ID = :status, ReleasedByUserID = :uid
                WHERE ReleaseID = :id
            ")->execute([
                ":rdate"  => $releaseDate,
                ":status" => $completedID,
                ":uid"    => $currentUserID,
                ":id"     => $id
            ]);

            $conn->commit();

            addAudit($conn, $currentUserID, "UPDATE", "stock_release", "Completed stock release #$id.");

            response(true, "Stock release marked as completed.", null);

        } else {

            $conn->prepare("
                UPDATE stock_release
                SET ReleaseDate = :rdate
                WHERE ReleaseID = :id
            ")->execute([":rdate" => $releaseDate, ":id" => $id]);

            $conn->commit();

            addAudit($conn, $currentUserID, "UPDATE", "stock_release", "Saved progress on stock release #$id.");

            response(true, "Progress saved.", null);
        }
    }

    response(false, "Invalid operation: " . $operation, null);

} catch (PDOException $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    response(false, "Database error: " . $e->getMessage(), null);
} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    response(false, "Server error: " . $e->getMessage(), null);
}