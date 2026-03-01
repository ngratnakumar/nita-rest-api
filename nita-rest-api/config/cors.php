<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        // localhost
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:8000',
        'https://localhost:5173',
        'https://localhost:5174',
        'https://localhost:8000',
        
        // 127.0.0.1
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'https://127.0.0.1:5173',
        'https://127.0.0.1:5174',
        
        // LAN IP 192.168.110.2
        'http://192.168.110.2',
        'http://192.168.110.2:5173',
        'http://192.168.110.2:5174',
        'http://192.168.110.2:8000',
        'https://192.168.110.2',
        'https://192.168.110.2:5173',
        'https://192.168.110.2:5174',
        'https://192.168.110.2:8000',
        
        // LAN Domain ww2.ncra.tifr.res.in
        'http://ww2.ncra.tifr.res.in',
        'https://ww2.ncra.tifr.res.in',
        'https://ww2.ncra.tifr.res.in:5174',
        
        // Optional: keep other IPs if needed
        'http://192.168.110.65:5173',
        'http://192.168.110.65:5174',
        'https://192.168.110.65:5173',
        'https://192.168.110.65:5174',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];