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
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://192.168.110.2',
        'http://192.168.110.2:5173',
        'http://192.168.110.2:5174',
        'http://192.168.110.65:5173',
        'http://192.168.110.65:5174',
        'https://192.168.110.2',
        'https://192.168.110.2:5173',
        'https://192.168.110.2:5174',
        'https://192.168.110.65',
        'https://192.168.110.65:5173',
        'https://192.168.110.65:5174',
        'https://ww2.ncra.tifr.res.in',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];