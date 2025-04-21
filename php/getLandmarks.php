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
    // First get country details to find its bounding box
    $countryData = json_decode(file_get_contents(
        "https://restcountries.com/v3.1/alpha/$countryCode"
    ), true)[0];
    
    if (!isset($countryData['latlng'])) {
        throw new Exception('Could not determine country location');
    }
    
    // Then query Nominatim for significant places
    $url = "https://nominatim.openstreetmap.org/search?" . http_build_query([
        'country' => $countryCode,
        'featuretype' => 'city',
        'format' => 'json',
        'limit' => 10,
        'addressdetails' => 1,
        'extratags' => 1
    ]);
    
    $options = [
        'http' => [
            'header' => "User-Agent: WorldGazetteerApp\r\n"
        ]
    ];
    
    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);
    
    $landmarks = array_map(function($place) {
        return [
            'name' => $place['display_name'],
            'lat' => $place['lat'],
            'lng' => $place['lon'],
            'type' => $place['type'] ?? 'N/A'
        ];
    }, json_decode($response, true));
    
    echo json_encode($landmarks);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>