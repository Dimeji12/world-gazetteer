<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

if (!isset($_GET['country'])) {
    echo json_encode(['error' => 'Country code is required']);
    exit;
}

$countryCode = strtoupper($_GET['country']);

// Fallback to showing just the country's Wikipedia page
$response = file_get_contents("https://restcountries.com/v3.1/alpha/{$countryCode}");
$data = json_decode($response, true)[0] ?? null;

if ($data) {
    $countryName = $data['name']['common'] ?? $countryCode;
    echo json_encode([[
        'title' => $countryName,
        'lat' => $data['latlng'][0] ?? 0,
        'lng' => $data['latlng'][1] ?? 0,
        'url' => "https://en.wikipedia.org/wiki/" . urlencode($countryName)
    ]]);
} else {
    echo json_encode(['error' => 'Failed to fetch Wikipedia points']);
}
?>