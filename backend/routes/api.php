<?php

use App\Http\Controllers\Api\AppUserController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\DeviceTypeController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\InkColorController;
use App\Http\Controllers\Api\InkController;
use App\Http\Controllers\Api\InkVoucherController;
use App\Http\Controllers\Api\PrinterTypeController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\ServiceProviderController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SubscriptionCategoryController;
use App\Http\Controllers\Api\SubscriptionController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::middleware('auth.api')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
    });
});

Route::middleware('auth.api')->group(function () {
    // Devices
    Route::get('devices', [DeviceController::class, 'index'])->middleware('permission:devices.view,devices.manage,dashboard.devices');
    Route::post('devices', [DeviceController::class, 'store'])->middleware('permission:devices.manage');
    Route::put('devices/{device}', [DeviceController::class, 'update'])->middleware('permission:devices.manage');
    Route::patch('devices/{device}', [DeviceController::class, 'update'])->middleware('permission:devices.manage');
    Route::delete('devices/{device}', [DeviceController::class, 'destroy'])->middleware('permission:devices.manage');
    Route::get('devices/{device}/custody', [DeviceController::class, 'custody'])->middleware('permission:devices.view,devices.manage');
    Route::post('devices/{device}/transfer', [DeviceController::class, 'transfer'])->middleware('permission:devices.manage');
    Route::post('devices/{device}/return', [DeviceController::class, 'returnToStorage'])->middleware('permission:devices.manage');

    // Inks
    Route::get('inks', [InkController::class, 'index'])->middleware('permission:inks.view,inks.manage,dashboard.inks,inks.vouchers.view,inks.vouchers.create,inks.vouchers.approve');
    Route::get('inks/dispenses', [InkController::class, 'dispenses'])->middleware('permission:inks.view,inks.manage');
    Route::post('inks/dispense-batch', [InkController::class, 'dispenseBatch'])->middleware('permission:inks.manage');
    Route::post('inks/{id}/dispense', [InkController::class, 'dispense'])->middleware('permission:inks.manage');
    Route::post('inks', [InkController::class, 'store'])->middleware('permission:inks.manage');
    Route::put('inks/{ink}', [InkController::class, 'update'])->middleware('permission:inks.manage');
    Route::patch('inks/{ink}', [InkController::class, 'update'])->middleware('permission:inks.manage');
    Route::delete('inks/{ink}', [InkController::class, 'destroy'])->middleware('permission:inks.manage');

    // Ink Dispense Vouchers (إذن صرف)
    Route::get('ink-vouchers', [InkVoucherController::class, 'index'])->middleware('permission:inks.vouchers.view,inks.vouchers.create,inks.vouchers.approve');
    Route::post('ink-vouchers', [InkVoucherController::class, 'store'])->middleware('permission:inks.vouchers.create,inks.vouchers.approve');
    Route::post('ink-vouchers/{id}/dispense', [InkVoucherController::class, 'dispense'])->middleware('permission:inks.vouchers.approve');
    Route::post('ink-vouchers/{id}/reject', [InkVoucherController::class, 'reject'])->middleware('permission:inks.vouchers.approve');
    Route::delete('ink-vouchers/{id}', [InkVoucherController::class, 'destroy'])->middleware('permission:inks.vouchers.create,inks.vouchers.approve');

    // Subscriptions
    Route::get('subscriptions', [SubscriptionController::class, 'index'])->middleware('permission:subscriptions.view,subscriptions.manage,dashboard.subscriptions');
    Route::post('subscriptions', [SubscriptionController::class, 'store'])->middleware('permission:subscriptions.manage');
    Route::put('subscriptions/{subscription}', [SubscriptionController::class, 'update'])->middleware('permission:subscriptions.manage');
    Route::patch('subscriptions/{subscription}', [SubscriptionController::class, 'update'])->middleware('permission:subscriptions.manage');
    Route::delete('subscriptions/{subscription}', [SubscriptionController::class, 'destroy'])->middleware('permission:subscriptions.manage');

    // Users, Settings & Audit Logs
    Route::apiResource('users', AppUserController::class)->except(['show'])->middleware('permission:settings.manage');
    Route::get('audit-logs', [AuditLogController::class, 'index'])->middleware('permission:settings.manage');
    Route::get('settings', [SettingController::class, 'index'])->middleware('permission:settings.manage,inks.view,inks.manage');
    Route::put('settings', [SettingController::class, 'update'])->middleware('permission:settings.manage');
    Route::post('settings/test-email', [SettingController::class, 'sendTestEmail'])->middleware('permission:settings.manage');
    Route::get('settings/backup', [BackupController::class, 'download'])->middleware('permission:settings.manage');

    // Departments & Employees
    Route::get('departments', [DepartmentController::class, 'index'])->middleware('permission:employees.manage,settings.manage,devices.view,devices.manage,inks.view,inks.manage,inks.vouchers.view,inks.vouchers.create,inks.vouchers.approve,subscriptions.view,subscriptions.manage');
    Route::post('departments', [DepartmentController::class, 'store'])->middleware('permission:employees.manage,settings.manage');
    Route::put('departments/{department}', [DepartmentController::class, 'update'])->middleware('permission:employees.manage,settings.manage');
    Route::delete('departments/{department}', [DepartmentController::class, 'destroy'])->middleware('permission:employees.manage,settings.manage');

    Route::get('employees', [EmployeeController::class, 'index'])->middleware('permission:employees.manage,settings.manage,devices.view,devices.manage,inks.view,inks.manage,inks.vouchers.view,inks.vouchers.create,inks.vouchers.approve');
    Route::post('employees', [EmployeeController::class, 'store'])->middleware('permission:employees.manage,settings.manage');
    Route::put('employees/{employee}', [EmployeeController::class, 'update'])->middleware('permission:employees.manage,settings.manage');
    Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->middleware('permission:employees.manage,settings.manage');

    // Dictionary
    Route::prefix('dictionary')->group(function () {
        Route::get('device-types', [DeviceTypeController::class, 'index'])->middleware('permission:dictionary.deviceTypes,devices.view,devices.manage,dashboard.devices');
        Route::post('device-types', [DeviceTypeController::class, 'store'])->middleware('permission:dictionary.deviceTypes');
        Route::put('device-types/{device_type}', [DeviceTypeController::class, 'update'])->middleware('permission:dictionary.deviceTypes');
        Route::delete('device-types/{device_type}', [DeviceTypeController::class, 'destroy'])->middleware('permission:dictionary.deviceTypes');

        Route::get('brands', [BrandController::class, 'index'])->middleware('permission:dictionary.brands,devices.view,devices.manage,inks.view,inks.manage');
        Route::post('brands', [BrandController::class, 'store'])->middleware('permission:dictionary.brands');
        Route::put('brands/{brand}', [BrandController::class, 'update'])->middleware('permission:dictionary.brands');
        Route::delete('brands/{brand}', [BrandController::class, 'destroy'])->middleware('permission:dictionary.brands');

        Route::get('ink-colors', [InkColorController::class, 'index'])->middleware('permission:dictionary.inkColors,inks.view,inks.manage,dashboard.inks,inks.vouchers.view,inks.vouchers.create,inks.vouchers.approve');
        Route::post('ink-colors', [InkColorController::class, 'store'])->middleware('permission:dictionary.inkColors');
        Route::put('ink-colors/{ink_color}', [InkColorController::class, 'update'])->middleware('permission:dictionary.inkColors');
        Route::delete('ink-colors/{ink_color}', [InkColorController::class, 'destroy'])->middleware('permission:dictionary.inkColors');

        Route::get('printer-types', [PrinterTypeController::class, 'index'])->middleware('permission:dictionary.printerTypes,dictionary.inkColors,inks.view,inks.manage,dashboard.inks,inks.vouchers.view,inks.vouchers.create,inks.vouchers.approve');
        Route::post('printer-types', [PrinterTypeController::class, 'store'])->middleware('permission:dictionary.printerTypes,dictionary.inkColors,inks.manage');
        Route::put('printer-types/{printer_type}', [PrinterTypeController::class, 'update'])->middleware('permission:dictionary.printerTypes,dictionary.inkColors,inks.manage');
        Route::delete('printer-types/{printer_type}', [PrinterTypeController::class, 'destroy'])->middleware('permission:dictionary.printerTypes,dictionary.inkColors,inks.manage');

        Route::get('services', [ServiceController::class, 'index'])->middleware('permission:dictionary.services,subscriptions.view,subscriptions.manage');
        Route::post('services', [ServiceController::class, 'store'])->middleware('permission:dictionary.services');
        Route::put('services/{service}', [ServiceController::class, 'update'])->middleware('permission:dictionary.services');
        Route::delete('services/{service}', [ServiceController::class, 'destroy'])->middleware('permission:dictionary.services');

        Route::get('providers', [ServiceProviderController::class, 'index'])->middleware('permission:dictionary.services,subscriptions.view,subscriptions.manage');
        Route::post('providers', [ServiceProviderController::class, 'store'])->middleware('permission:dictionary.services');
        Route::put('providers/{provider}', [ServiceProviderController::class, 'update'])->middleware('permission:dictionary.services');
        Route::delete('providers/{provider}', [ServiceProviderController::class, 'destroy'])->middleware('permission:dictionary.services');

        Route::get('subscription-categories', [SubscriptionCategoryController::class, 'index'])->middleware('permission:dictionary.services,subscriptions.view,subscriptions.manage,dashboard.subscriptions');
        Route::post('subscription-categories', [SubscriptionCategoryController::class, 'store'])->middleware('permission:dictionary.services');
        Route::put('subscription-categories/{subscription_category}', [SubscriptionCategoryController::class, 'update'])->middleware('permission:dictionary.services');
        Route::delete('subscription-categories/{subscription_category}', [SubscriptionCategoryController::class, 'destroy'])->middleware('permission:dictionary.services');
    });
});
