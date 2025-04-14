<?php
header('Content-Type: application/json');

$geoJson = json_decode(file_get_contents('countryBorders.geo.json'), true);

$countries = [];
foreach ($geoJson['features'] as $feature) {
    $countries[] = [
        'code' => $feature['properties']['iso_a2'],
        'name' => $feature['properties']['name']
    ];
}

usort($countries, function($a, $b) {
    return strcmp($a['name'], $b['name']);
});

echo json_encode($countries);
?>