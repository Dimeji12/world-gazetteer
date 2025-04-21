<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
error_reporting(0);

$countryCode = $_GET['country'] ?? '';
if (empty($countryCode)) {
    http_response_code(400);
    echo json_encode(['error' => 'Country code required']);
    exit;
}

try {
    // First get country currency code
    $countryData = json_decode(file_get_contents("https://restcountries.com/v3.1/alpha/{$countryCode}"), true)[0];
    $currencyCode = array_keys($countryData['currencies'] ?? [])[0] ?? 'USD';
    
    // Get exchange rates
    $apiKey = 'a0712c7d7e9a9c4e8d5977fe'; // Get from exchangerate-api.com
    $url = "https://v6.exchangerate-api.com/v6/{$apiKey}/latest/{$currencyCode}";
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    
    if ($data['result'] !== 'success') {
        throw new Exception($data['error-type'] ?? 'Currency API error');
    }
    
    echo json_encode([
        'base' => $currencyCode,
        'date' => $data['time_last_update_utc'],
        'rates' => $data['conversion_rates']
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>