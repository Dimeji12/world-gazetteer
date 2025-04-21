<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

if (!isset($_GET['country'])) {
    echo json_encode(['error' => 'Country code is required']);
    exit;
}

$countryCode = strtoupper($_GET['country']);

// Fallback to showing just the capital
$response = file_get_contents("https://restcountries.com/v3.1/alpha/{$countryCode}");
$data = json_decode($response, true)[0] ?? null;

if ($data) {
    echo json_encode([[
        'name' => $data['capital'][0] ?? 'Capital',
        'lat' => $data['latlng'][0] ?? 0,
        'lng' => $data['latlng'][1] ?? 0,
        'population' => 'N/A'
    ]]);
} else {
    echo json_encode(['error' => 'Failed to fetch city data']);
}
?>