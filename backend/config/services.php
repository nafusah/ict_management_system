<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'msgraph' => [
        'tenant_id' => env('MSGRAPH_TENANT_ID'),
        'client_id' => env('MSGRAPH_CLIENT_ID'),
        'client_secret' => env('MSGRAPH_CLIENT_SECRET'),
        'user_id' => env('MSGRAPH_USER_ID'),
        'proxy' => env('MSGRAPH_PROXY') ?: (env('HTTPS_PROXY') ?: env('HTTP_PROXY')),
        'verify_ssl' => filter_var(env('MSGRAPH_VERIFY_SSL', true), FILTER_VALIDATE_BOOLEAN),
        'ca_bundle' => env('MSGRAPH_CA_BUNDLE'),
        'timeout' => (int) env('MSGRAPH_TIMEOUT', 15),
        'connect_timeout' => (int) env('MSGRAPH_CONNECT_TIMEOUT', 5),
        'retries' => (int) env('MSGRAPH_RETRIES', 2),
        'retry_delay' => (int) env('MSGRAPH_RETRY_DELAY', 500),
    ],

];
