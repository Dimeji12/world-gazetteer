<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$url = "http://api.geonames.org/countryInfoJSON?username=dimejioladiti";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

if ($response === false) {
    echo json_encode(['error' => 'Failed to fetch countries']);
    exit;
}

$data = json_decode($response, true);
if (isset($data['geonames']) && is_array($data['geonames'])) {
    $countries = array_map(function($country) {
        return [
            'code' => $country['countryCode'],
            'name' => $country['countryName']
        ];
    }, $data['geonames']);

    // Sort by name
    usort($countries, function($a, $b) {
        return strcmp($a['name'], $b['name']);
    });

    // Output the countries as JSON
    echo json_encode($countries);
} else {
    echo json_encode(['error' => 'No countries found']);
}
