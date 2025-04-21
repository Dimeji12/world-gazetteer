<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
error_reporting(0);

$countryCode = $_GET['code'] ?? '';
if (empty($countryCode)) {
    http_response_code(400);
    echo json_encode(['error' => 'Country code required']);
    exit;
}

try {
    $response = file_get_contents("https://restcountries.com/v3.1/alpha/{$countryCode}");
    $data = json_decode($response, true)[0];
    
    echo json_encode([
        'name' => $data['name']['common'],
        'capital' => $data['capital'][0] ?? 'N/A',
        'population' => $data['population'] ?? 0,
        'area' => $data['area'] ?? 0,
        'languages' => isset($data['languages']) ? implode(', ', array_values($data['languages'])) : 'N/A',
        'currency' => isset($data['currencies']) ? implode(', ', array_keys($data['currencies'])) : 'N/A',
        'flag' => $data['flags']['png'] ?? '',
        'latlng' => $data['latlng'] ?? [0, 0],
        'code' => $data['cca2']
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>