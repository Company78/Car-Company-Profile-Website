<?php
/**
 * db.php - Shared bootstrap para sa tanang API.
 * Gitawag pinaagi sa: require_once __DIR__ . "/db.php";
 */

ini_set("display_errors", "0");
error_reporting(E_ALL);
ob_start();

/* ---------------- CORS ---------------- */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

/* ---------------- Fatal error -> JSON ---------------- */
register_shutdown_function(function () {
    $e = error_get_last();
    if ($e && in_array($e["type"], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        while (ob_get_level() > 0) { ob_end_clean(); }
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode([
            "success" => false,
            "message" => "PHP error: " . $e["message"] . " (line " . $e["line"] . ")",
            "data"    => null
        ]);
    }
});

/* ---------------- Response helper ---------------- */
function response($success, $message = "", $data = null)
{
    while (ob_get_level() > 0) { ob_end_clean(); }

    $json = json_encode(
        ["success" => $success, "message" => $message, "data" => $data],
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR
    );

    echo $json !== false
        ? $json
        : json_encode(["success" => false, "message" => "JSON error: " . json_last_error_msg(), "data" => null]);
    exit;
}

/* ---------------- Database connection ---------------- */
$host   = "127.0.0.1";
$dbname = "grocery_warehouse_db";
$dbuser = "root";
$dbpass = "";

try {
    $conn = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $dbuser,
        $dbpass
    );
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    response(false, "Database connection failed: " . $e->getMessage(), null);
}

/* ---------------- Input parsing ---------------- */
$input = [];

$rawInput = file_get_contents("php://input");
if (!empty($rawInput)) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) $input = $decoded;
}

if (isset($_POST["json"]) && !empty($_POST["json"])) {
    $jsonData = json_decode($_POST["json"], true);
    if (is_array($jsonData)) $input = array_merge($input, $jsonData);
}

if (!empty($_POST) && empty($input)) $input = $_POST;
if (empty($input) && !empty($_GET)) $input = $_GET;

$operation = $input["operation"] ?? $_POST["operation"] ?? $_GET["operation"] ?? "";

/* ---------------- Shared helpers ---------------- */
function getCurrentUserID($data)
{
    if (isset($data["LoggedInUserID"]) && intval($data["LoggedInUserID"]) > 0)
        return intval($data["LoggedInUserID"]);
    if (isset($data["UserID"]) && intval($data["UserID"]) > 0)
        return intval($data["UserID"]);
    return 0;
}

function getSearch($input)
{
    return isset($input["search"]) ? trim($input["search"]) : "";
}

function getArchivedFilter($input)
{
    return isset($input["archived"]) && (
        $input["archived"] === true ||
        $input["archived"] === 1 ||
        $input["archived"] === "1" ||
        $input["archived"] === "Yes" ||
        $input["archived"] === "true"
    );
}

function addAudit($conn, $userID, $action, $table, $details = "")
{
    if ($userID <= 0) return;
    try {
        $stmt = $conn->prepare("
            INSERT INTO auditlog
            (UserID, ActionType, TableAffected, ActionTimestamp, Details, IsArchived)
            VALUES (:userid, :action, :tablename, NOW(), :details, 'No')
        ");
        $stmt->execute([
            ":userid"    => $userID,
            ":action"    => $action,
            ":tablename" => $table,
            ":details"   => $details
        ]);
    } catch (Exception $e) {}
}