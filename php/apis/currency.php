<?php
header('Content-Type: application/json');

$apiKey = 'd00f7f16e8074d64ae547254a40cb5a7';
$base = $_GET['base'] ?? 'USD';

$url = "https://openexchangerates.org/api/latest.json?app_id=$apiKey&base=$base";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>