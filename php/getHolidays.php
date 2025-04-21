<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
error_reporting(0);

// Using Nager.Date API (free, no key required)
$countryCode = $_GET['country'] ?? '';
if (empty($countryCode)) {
    http_response_code(400);
    echo json_encode(['error' => 'Country code required']);
    exit;
}

try {
    $currentYear = date('Y');
    $apiUrl = "https://date.nager.at/api/v3/PublicHolidays/$currentYear/$countryCode";
    
    // Use cURL with proper redirect handling
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true, // Follow redirects
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json'
        ],
        CURLOPT_USERAGENT => 'WorldGazetteer/1.0'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("API connection failed: " . $error);
    }
    
    if ($httpCode !== 200) {
        throw new Exception("API returned HTTP $httpCode");
    }
    
    $holidays = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid API response format");
    }
    
    // Format the response
    $result = array_map(function($holiday) {
        return [
            'name' => $holiday['name'],
            'date' => $holiday['date'],
            'public' => true // All holidays from this API are public
        ];
    }, array_slice($holidays, 0, 10)); // Limit to 10 holidays
    
    echo json_encode($result);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'api_used' => 'Nager.Date',
        'debug' => [
            'country' => $countryCode,
            'year' => $currentYear,
            'http_code' => $httpCode ?? null
        ]
    ]);
}
?>