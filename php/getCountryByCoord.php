<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$lat = $_GET['lat'] ?? '';
$lng = $_GET['lng'] ?? '';

if (empty($lat) || empty($lng)) {
    echo json_encode(['error' => 'Coordinates required']);
    exit;
}

try {
    $url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng";
    $options = [
        'http' => ['header' => "User-Agent: WorldGazetteer/1.0\r\n"]
    ];
    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);
    $data = json_decode($response, true);
    
    echo json_encode([
        'country_code' => strtoupper($data['address']['country_code'] ?? ''),
        'country_name' => $data['address']['country'] ?? ''
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>