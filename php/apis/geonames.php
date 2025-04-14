<?php
header('Content-Type: application/json');

$username = 'dimejioladiti'; // Register at geonames.org
$country = $_GET['country'] ?? '';
$featureCode = $_GET['featureCode'] ?? 'PPL'; // Default: populated places
$maxRows = $_GET['maxRows'] ?? 50;

if (empty($country)) exit(json_encode(['error' => 'Country code required']));

$url = "http://api.geonames.org/searchJSON?country=$country&featureCode=$featureCode&maxRows=$maxRows&username=$username";

$response = file_get_contents($url);
$data = json_decode($response, true);

$results = [];
foreach ($data['geonames'] as $place) {
    $results[] = [
        'name' => $place['name'],
        'lat' => $place['lat'],
        'lng' => $place['lng'],
        'population' => $place['population'] ?? 'N/A',
        'countryCode' => $place['countryCode'] ?? ''
    ];
}

echo json_encode($results);
?>