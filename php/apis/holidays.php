<?php
header('Content-Type: application/json');

$apiKey = 'UqC1nMq5pkzkGWdUzrxvBSwz63eu7VHQ'; // Get from calendarindex.com
$countryCode = $_GET['country'] ?? '';
$year = date('Y');

if (empty($countryCode)) {
    echo json_encode(['error' => 'Country code required']);
    exit;
}

$url = "https://www.calendarindex.com/api/v1/holidays?country=$countryCode&year=$year&api_key=$apiKey";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if (isset($data['response']['holidays'])) {
    $holidays = array_slice($data['response']['holidays'], 0, 10); // Get first 10 holidays
    echo json_encode($holidays);
} else {
    echo json_encode(['error' => 'No holidays found']);
}
?>