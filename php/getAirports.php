<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

if (!isset($_GET['country'])) {
    echo json_encode(['error' => 'Country code is required']);
    exit;
}

$countryCode = strtoupper($_GET['country']);
$cacheFile = "cache/airports_{$countryCode}.json";

// Use cached data if fresh (1 week cache)
if (file_exists($cacheFile) && time() - filemtime($cacheFile) < 604800) {
    echo file_get_contents($cacheFile);
    exit;
}

$url = "https://ourairports.com/data/airports.csv";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$csvData = curl_exec($ch);
curl_close($ch);

if ($csvData === false) {
    echo json_encode(['error' => 'Failed to fetch airport data']);
    exit;
}

$airports = [];
$lines = explode("\n", $csvData);
$headers = str_getcsv(array_shift($lines));

foreach ($lines as $line) {
    $row = str_getcsv($line);
    if (count($row) < count($headers)) continue;
    
    $airport = array_combine($headers, $row);
    if ($airport['iso_country'] === $countryCode && 
        in_array($airport['type'], ['medium_airport', 'large_airport'])) {
        $airports[] = [
            'name' => $airport['name'] ?? 'Unknown Airport',
            'lat' => $airport['latitude_deg'] ?? 0,
            'lng' => $airport['longitude_deg'] ?? 0,
            'code' => $airport['iata_code'] ?? 'N/A'
        ];
    }
}

if (!empty($airports)) {
    // Save to cache
    file_put_contents($cacheFile, json_encode($airports));
    echo json_encode($airports);
} else {
    echo json_encode(['error' => 'No airports found for this country']);
}
?>