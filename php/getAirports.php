<?php
header('Content-Type: application/json');

// Validate parameters
$country = $_GET['country'] ?? '';
if (empty($country)) {
    echo json_encode(['error' => 'Missing country code']);
    exit;
}

// GeoNames credentials (REPLACE WITH YOUR USERNAME)
$username = 'dimejioladiti';

// Build API URL
$url = "http://api.geonames.org/searchJSON?" . http_build_query([
    'country' => $country,
    'featureCode' => 'AIRP', // Airports only
    'maxRows' => 50,
    'username' => $username
]);

// Fetch data
$response = file_get_contents($url);
if ($response === false) {
    echo json_encode(['error' => 'Failed to fetch data from GeoNames']);
    exit;
}

// Process response
$data = json_decode($response, true);
if (isset($data['status'])) {
    echo json_encode(['error' => 'GeoNames error: ' . $data['status']['message']]);
    exit;
}

// Return simplified airport data
$airports = array_map(function($airport) {
    return [
        'name' => $airport['name'],
        'code' => $airport['iataCode'] ?? '',
        'lat' => (float)($airport['lat'] ?? 0),
        'lng' => (float)($airport['lng'] ?? 0),
        'city' => $airport['adminName1'] ?? ''
    ];
}, $data['geonames'] ?? []);

echo json_encode($airports);
?>