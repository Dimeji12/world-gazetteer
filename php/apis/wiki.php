<?php
header('Content-Type: application/json');

$countryName = $_GET['country'] ?? '';

if (empty($countryName)) {
    echo json_encode(['error' => 'Country name required']);
    exit;
}

$url = "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&exintro=true&explaintext=true&titles=$countryName&pithumbsize=300";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$pages = $data['query']['pages'] ?? [];
$result = [];

foreach ($pages as $page) {
    $result = [
        'title' => $page['title'],
        'extract' => $page['extract'] ?? 'No information available',
        'thumbnail' => $page['thumbnail']['source'] ?? null
    ];
    break;
}

echo json_encode($result);
?>