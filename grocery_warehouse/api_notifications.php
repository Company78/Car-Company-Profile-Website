<?php
/**
 * api_notifications.php - Endpoint sa notification bell (para sa TANANG roles).
 * Operations: getNotifications, markNotificationRead, markAllNotificationsRead
 */

require_once __DIR__ . "/db.php";
require_once __DIR__ . "/notifications.php";

function requireActiveUser($conn, $userID)
{
    if (!$userID || intval($userID) <= 0) response(false, "Authentication required.", null);

    $stmt = $conn->prepare("
        SELECT u.UserID, u.UserStatus, u.IsArchived AS UserArchived,
               r.RoleName, r.IsArchived AS RoleArchived
        FROM `user` u
        LEFT JOIN `role` r ON u.RoleID = r.RoleID
        WHERE u.UserID = :id LIMIT 1
    ");
    $stmt->execute([":id" => intval($userID)]);
    $user = $stmt->fetch();

    if (!$user) response(false, "User not found.", null);
    if (strtolower(trim($user["UserArchived"] ?? "")) === "yes") response(false, "Account archived.", null);
    if (strtolower(trim($user["UserStatus"] ?? "")) !== "active") response(false, "Account inactive.", null);

    return $user;
}

try {

    $currentUserID = getCurrentUserID($input);
    $user          = requireActiveUser($conn, $currentUserID);
    $roleName      = strtolower(trim($user["RoleName"] ?? ""));

    notifEnsureTable($conn);

    if ($operation === "getNotifications") {

        if (strpos($roleName, "purchas") !== false) {
            syncZeroStockNotifications($conn);
        }

        $filter = strtolower(trim($input["filter"] ?? "all"));
        $limit  = max(1, min(100, intval($input["limit"] ?? 30)));
        $offset = max(0, intval($input["offset"] ?? 0));

        $sql = "
            SELECT
                n.NotificationID, n.NotificationType, n.Title, n.Message,
                n.RefTable, n.RefID, n.IsRead, n.CreatedAt,
                TIMESTAMPDIFF(SECOND, n.CreatedAt, NOW()) AS AgeSeconds,
                TRIM(CONCAT(COALESCE(a.FirstName,''), ' ', COALESCE(a.LastName,''))) AS ActorName
            FROM notification n
            LEFT JOIN `user` a ON a.UserID = n.ActorUserID
            WHERE n.UserID = :uid AND n.IsArchived = 'No'
        ";
        if ($filter === "unread") $sql .= " AND n.IsRead = 'No' ";
        $sql .= " ORDER BY n.NotificationID DESC LIMIT $limit OFFSET $offset ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([":uid" => $currentUserID]);
        $items = $stmt->fetchAll();

        $cfgs = notifTxConfig();
        foreach ($items as &$item) {
            $item["NotificationID"] = intval($item["NotificationID"]);
            $item["RefID"]          = $item["RefID"] !== null ? intval($item["RefID"]) : null;
            $item["AgeSeconds"]     = intval($item["AgeSeconds"]);
            $item["RefStatus"]      = null;

            if ($item["RefTable"] && isset($cfgs[$item["RefTable"]]) && $item["RefID"]) {
                $item["RefStatus"] = notifTxStatusName($conn, $item["RefTable"], $item["RefID"]);
            }
        }
        unset($item);

        $stmt = $conn->prepare("
            SELECT COUNT(*) AS c FROM notification
            WHERE UserID = :uid AND IsArchived = 'No' AND IsRead = 'No'
        ");
        $stmt->execute([":uid" => $currentUserID]);
        $unread = intval($stmt->fetch()["c"]);

        response(true, "Notifications loaded.", [
            "unreadCount" => $unread,
            "items"       => $items
        ]);
    }

    if ($operation === "markNotificationRead") {
        $id = intval($input["NotificationID"] ?? 0);
        if ($id <= 0) response(false, "Invalid notification.", null);

        $conn->prepare("
            UPDATE notification SET IsRead = 'Yes'
            WHERE NotificationID = :id AND UserID = :uid
        ")->execute([":id" => $id, ":uid" => $currentUserID]);

        response(true, "Marked as read.", null);
    }

    if ($operation === "markAllNotificationsRead") {
        $conn->prepare("
            UPDATE notification SET IsRead = 'Yes'
            WHERE UserID = :uid AND IsArchived = 'No' AND IsRead = 'No'
        ")->execute([":uid" => $currentUserID]);

        response(true, "All notifications marked as read.", null);
    }

    response(false, "Invalid operation: " . $operation, null);

} catch (PDOException $e) {
    response(false, "DB error: " . $e->getMessage(), null);
} catch (Exception $e) {
    response(false, "Server error: " . $e->getMessage(), null);
}