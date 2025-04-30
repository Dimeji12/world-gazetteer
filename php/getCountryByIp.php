<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

try {
    $response = file_get_contents('https://ipapi.co/json/');
    $data = json_decode($response, true);
    
    echo json_encode([
        'country_code' => $data['country_code'] ?? null,
        'country_name' => $data['country_name'] ?? null
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>