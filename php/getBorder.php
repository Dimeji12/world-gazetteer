<?php
header('Content-Type: application/json');

$countryCode = $_GET['code'] ?? '';
if (empty($countryCode)) exit(json_encode(['error' => 'Country code required']));

$geoJson = json_decode(file_get_contents('countryBorders.geo.json'), true);

foreach ($geoJson['features'] as $feature) {
    if ($feature['properties']['iso_a2'] === $countryCode) {
        echo json_encode($feature);
        exit;
    }
}

echo json_encode(['error' => 'Country not found']);
?>