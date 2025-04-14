<?php
header('Content-Type: application/json');

$countryCode = $_GET['code'] ?? '';
if (empty($countryCode)) exit(json_encode(['error' => 'Country code required']));

$url = "https://restcountries.com/v3.1/alpha/$countryCode";
$response = file_get_contents($url);
$data = json_decode($response, true)[0];

$result = [
    'name' => $data['name']['common'],
    'capital' => $data['capital'][0] ?? 'N/A',
    'population' => $data['population'] ?? 0,
    'area' => $data['area'] ?? 0,
    'languages' => isset($data['languages']) ? implode(', ', $data['languages']) : 'N/A',
    'currency' => isset($data['currencies']) ? implode(', ', array_keys($data['currencies'])) : 'N/A',
    'flag' => $data['flags']['png'] ?? '',
    'latlng' => $data['latlng'] ?? [0, 0]
];

echo json_encode($result);
?>