<?php

use App\Http\Controllers\Api\AppUserController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\DeviceTypeController;
use App\Http\Controllers\Api\InkColorController;
use App\Http\Controllers\Api\InkController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\ServiceProviderController;
use App\Http\Controllers\Api\SubscriptionController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::apiResource('devices', DeviceController::class)->except(['show']);

Route::get('inks/dispenses', [InkController::class, 'dispenses']);
Route::post('inks/{id}/dispense', [InkController::class, 'dispense']);
Route::apiResource('inks', InkController::class)->except(['show']);

Route::apiResource('subscriptions', SubscriptionController::class)->except(['show']);
Route::apiResource('users', AppUserController::class)->except(['show']);

Route::prefix('dictionary')->group(function () {
    Route::apiResource('device-types', DeviceTypeController::class)->except(['show']);
    Route::apiResource('brands', BrandController::class)->except(['show']);
    Route::apiResource('ink-colors', InkColorController::class)->except(['show']);
    Route::apiResource('services', ServiceController::class)->except(['show']);
    Route::apiResource('providers', ServiceProviderController::class)->except(['show']);
});
