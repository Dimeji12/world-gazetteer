<?php
header('Content-Type: application/json');

$apiKey = '5cdeb6d7a5f3dac3a1b5347e83d5e214';
$lat = $_GET['lat'] ?? '';
$lng = $_GET['lng'] ?? '';

if (empty($lat) || empty($lng)) exit(json_encode(['error' => 'Coordinates required']));

$url = "https://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lng&appid=$apiKey&units=metric";
echo file_get_contents($url);
?>