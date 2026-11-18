<?php

namespace App\Providers;

use App\Mail\Transport\MicrosoftGraphTransport;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Mail::extend('msgraph', function () {
            return new MicrosoftGraphTransport(
                (string) config('services.msgraph.tenant_id', ''),
                (string) config('services.msgraph.client_id', ''),
                (string) config('services.msgraph.client_secret', ''),
                (string) config('services.msgraph.user_id', ''),
                config('services.msgraph.proxy'),
                (int) config('services.msgraph.timeout', 15),
                (int) config('services.msgraph.connect_timeout', 5),
                (int) config('services.msgraph.retries', 2),
                (int) config('services.msgraph.retry_delay', 500),
                (bool) config('services.msgraph.verify_ssl', true),
                config('services.msgraph.ca_bundle'),
            );
        });
    }
}
