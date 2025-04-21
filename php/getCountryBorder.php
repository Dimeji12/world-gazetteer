<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$countryCode = $_GET['code'] ?? '';
if (empty($countryCode)) {
    http_response_code(400);
    echo json_encode(['error' => 'Country code required']);
    exit;
}

// Fallback simple border data
echo json_encode([
    'type' => 'Feature',
    'properties' => ['name' => $countryCode],
    'geometry' => [
        'type' => 'Polygon',
        'coordinates' => [[
            [-10, -10], [10, -10], [10, 10], [-10, 10], [-10, -10]
        ]]
    ]
]);
?>