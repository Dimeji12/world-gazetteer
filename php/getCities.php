<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

if (!isset($_GET['country'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Country code is required']);
    exit;
}

$countryCode = strtoupper($_GET['country']);
$username = 'dimejioladiti'; // MAKE SURE THIS IS SET

try {
    $url = "http://api.geonames.org/searchJSON?country=$countryCode&featureClass=P&maxRows=50&orderby=population&username=$username";
    $response = file_get_contents($url);
    
    if ($response === false) {
        throw new Exception("Failed to fetch from GeoNames");
    }
    
    $data = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON response from GeoNames");
    }
    
    if (isset($data['status'])) {
        throw new Exception("GeoNames error: " . $data['status']['message']);
    }
    
    if (!isset($data['geonames'])) {
        throw new Exception("Unexpected response format from GeoNames");
    }
    
    $cities = array_map(function($city) {
        return [
            'name' => $city['name'] ?? 'Unknown City',
            'lat' => $city['lat'] ?? 0,
            'lng' => $city['lng'] ?? 0,
            'population' => $city['population'] ?? 'N/A'
        ];
    }, $data['geonames']);
    
    echo json_encode($cities);
    
} catch (Exception $e) {
    http_response_code(500);
    error_log("getCities.php error: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}
?>