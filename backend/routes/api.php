<?php

use App\Http\Controllers\Api\V1\Analytics\AnalyticsController;
use App\Http\Controllers\Api\V1\Analytics\DashboardController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\MasterData\AxleConfigurationController;
use App\Http\Controllers\Api\V1\Reports\ReportController;
use App\Http\Controllers\Api\V1\MasterData\CustomerController;
use App\Http\Controllers\Api\V1\MasterData\DamageTypeController;
use App\Http\Controllers\Api\V1\MasterData\FailureCodeController;
use App\Http\Controllers\Api\V1\MasterData\InspectionChecklistController;
use App\Http\Controllers\Api\V1\MasterData\ProjectController;
use App\Http\Controllers\Api\V1\MasterData\RemovalReasonController;
use App\Http\Controllers\Api\V1\MasterData\RepairTypeController;
use App\Http\Controllers\Api\V1\MasterData\RetreadVendorController;
use App\Http\Controllers\Api\V1\MasterData\ScrapReasonController;
use App\Http\Controllers\Api\V1\MasterData\SiteController;
use App\Http\Controllers\Api\V1\MasterData\SupplierController;
use App\Http\Controllers\Api\V1\MasterData\TyreBrandController;
use App\Http\Controllers\Api\V1\MasterData\TyreController;
use App\Http\Controllers\Api\V1\MasterData\TyrePatternController;
use App\Http\Controllers\Api\V1\MasterData\TyrePositionController;
use App\Http\Controllers\Api\V1\MasterData\TyreSizeController;
use App\Http\Controllers\Api\V1\MasterData\TyreTypeController;
use App\Http\Controllers\Api\V1\MasterData\VehicleCategoryController;
use App\Http\Controllers\Api\V1\MasterData\VehicleModelController;
use App\Http\Controllers\Api\V1\MasterData\WarehouseController;
use App\Http\Controllers\Api\V1\Settings\ApprovalWorkflowController;
use App\Http\Controllers\Api\V1\Settings\AuditLogController;
use App\Http\Controllers\Api\V1\Settings\BarcodeRfidConfigController;
use App\Http\Controllers\Api\V1\Settings\CompanyProfileController;
use App\Http\Controllers\Api\V1\Settings\NotificationPreferenceController;
use App\Http\Controllers\Api\V1\Settings\RoleController;
use App\Http\Controllers\Api\V1\Settings\SystemConfigurationController;
use App\Http\Controllers\Api\V1\Settings\UserController;
use App\Http\Controllers\Api\V1\Transaction\GoodsReceiptController;
use App\Http\Controllers\Api\V1\Transaction\InitialStockEntryController;
use App\Http\Controllers\Api\V1\Transaction\InspectionController;
use App\Http\Controllers\Api\V1\Transaction\LostController;
use App\Http\Controllers\Api\V1\Transaction\PurchaseOrderController;
use App\Http\Controllers\Api\V1\Transaction\RepairController;
use App\Http\Controllers\Api\V1\Transaction\RetreadController;
use App\Http\Controllers\Api\V1\Transaction\ScrapController;
use App\Http\Controllers\Api\V1\Transaction\StockAdjustmentController;
use App\Http\Controllers\Api\V1\Transaction\StockInventoryController;
use App\Http\Controllers\Api\V1\Transaction\StockMovementController;
use App\Http\Controllers\Api\V1\Transaction\StockTransferController;
use App\Http\Controllers\Api\V1\Transaction\TyreInstallationController;
use App\Http\Controllers\Api\V1\Transaction\TyreLifecycleController;
use App\Http\Controllers\Api\V1\Transaction\WarrantyClaimController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::post('refresh', [AuthController::class, 'refresh']);

        Route::middleware('auth:api')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });

    Route::middleware('auth:api')->group(function () {
        // Master Data: uniform CRUD (+ restore) behind master.view / master.manage.
        $masterDataResources = [
            'vehicle-categories' => VehicleCategoryController::class,
            'vehicle-models' => VehicleModelController::class,
            'axle-configurations' => AxleConfigurationController::class,
            'tyre-positions' => TyrePositionController::class,
            'tyre-brands' => TyreBrandController::class,
            'tyre-patterns' => TyrePatternController::class,
            'tyre-sizes' => TyreSizeController::class,
            'tyre-types' => TyreTypeController::class,
            'sites' => SiteController::class,
            'warehouses' => WarehouseController::class,
            'customers' => CustomerController::class,
            'projects' => ProjectController::class,
            'suppliers' => SupplierController::class,
            'failure-codes' => FailureCodeController::class,
            'damage-types' => DamageTypeController::class,
            'removal-reasons' => RemovalReasonController::class,
            'scrap-reasons' => ScrapReasonController::class,
            'repair-types' => RepairTypeController::class,
            'retread-vendors' => RetreadVendorController::class,
            'inspection-checklists' => InspectionChecklistController::class,
        ];

        Route::prefix('master-data')->middleware('permission:master.view|master.manage')->group(function () use ($masterDataResources) {
            foreach ($masterDataResources as $uri => $controller) {
                Route::get($uri, [$controller, 'index']);
                Route::get("{$uri}/{id}", [$controller, 'show']);
            }
        });

        Route::prefix('master-data')->middleware('permission:master.manage')->group(function () use ($masterDataResources) {
            foreach ($masterDataResources as $uri => $controller) {
                Route::post($uri, [$controller, 'store']);
                Route::put("{$uri}/{id}", [$controller, 'update']);
                Route::delete("{$uri}/{id}", [$controller, 'destroy']);
                Route::post("{$uri}/{id}/restore", [$controller, 'restore']);
            }
        });

        // Tyre master data (bespoke controller: lifecycle-aware, not plain CRUD).
        Route::prefix('master-data/tyres')->middleware('permission:master.view|master.manage')->group(function () {
            Route::get('/', [TyreController::class, 'index']);
            Route::get('lookup', [TyreController::class, 'lookupByCode']);
            Route::get('{id}', [TyreController::class, 'show']);
        });
        Route::prefix('master-data/tyres')->middleware('permission:master.manage')->group(function () {
            Route::put('{id}', [TyreController::class, 'update']);
            Route::post('{id}/generate-barcode', [TyreController::class, 'generateBarcode']);
        });

        // Transactions
        Route::prefix('transactions')->group(function () {
            // Procurement
            Route::middleware('permission:transaction.procurement.view|transaction.procurement.manage')->group(function () {
                Route::get('purchase-orders', [PurchaseOrderController::class, 'index']);
                Route::get('purchase-orders/{id}', [PurchaseOrderController::class, 'show']);
                Route::get('goods-receipts', [GoodsReceiptController::class, 'index']);
                Route::get('goods-receipts/{id}', [GoodsReceiptController::class, 'show']);
                Route::get('initial-stock-entries', [InitialStockEntryController::class, 'index']);
            });
            Route::middleware('permission:transaction.procurement.manage')->group(function () {
                Route::post('purchase-orders', [PurchaseOrderController::class, 'store']);
                Route::put('purchase-orders/{id}', [PurchaseOrderController::class, 'update']);
                Route::patch('purchase-orders/{id}/status', [PurchaseOrderController::class, 'updateStatus']);
                Route::delete('purchase-orders/{id}', [PurchaseOrderController::class, 'destroy']);
                Route::post('goods-receipts', [GoodsReceiptController::class, 'store']);
                Route::post('initial-stock-entries', [InitialStockEntryController::class, 'store']);
            });

            // Warehouse / Stock
            Route::middleware('permission:transaction.warehouse.view|transaction.warehouse.manage')->group(function () {
                Route::get('stock-inventory', [StockInventoryController::class, 'index']);
                Route::get('stock-inventory/summary', [StockInventoryController::class, 'summary']);
                Route::get('stock-movements', [StockMovementController::class, 'index']);
                Route::get('stock-transfers', [StockTransferController::class, 'index']);
                Route::get('stock-transfers/{id}', [StockTransferController::class, 'show']);
                Route::get('stock-adjustments', [StockAdjustmentController::class, 'index']);
            });
            Route::middleware('permission:transaction.warehouse.manage')->group(function () {
                Route::post('stock-transfers', [StockTransferController::class, 'store']);
                Route::post('stock-adjustments', [StockAdjustmentController::class, 'store']);
            });

            // Tyre Installation (+ Interactive Axle View)
            Route::middleware('permission:transaction.installation.view|transaction.installation.manage')->group(function () {
                Route::get('vehicles/{vehicleId}/axle-view', [TyreInstallationController::class, 'axleView']);
                Route::get('tyres/{tyreId}/history', [TyreLifecycleController::class, 'history']);
                Route::get('tyres/{tyreId}/timeline', [TyreLifecycleController::class, 'timeline']);
            });
            Route::middleware('permission:transaction.installation.manage')->group(function () {
                Route::post('tyre-installations/install', [TyreInstallationController::class, 'install']);
                Route::post('tyre-installations/remove', [TyreInstallationController::class, 'remove']);
                Route::post('tyre-installations/rotate', [TyreInstallationController::class, 'rotate']);
            });

            // Inspection
            Route::middleware('permission:transaction.inspection.view|transaction.inspection.manage')->group(function () {
                Route::get('inspections', [InspectionController::class, 'index']);
                Route::get('inspections/{id}', [InspectionController::class, 'show']);
            });
            Route::middleware('permission:transaction.inspection.manage')->group(function () {
                Route::post('inspections', [InspectionController::class, 'store']);
                Route::put('inspections/{id}', [InspectionController::class, 'update']);
                Route::delete('inspections/{id}', [InspectionController::class, 'destroy']);
            });

            // Maintenance
            Route::middleware('permission:transaction.maintenance.view|transaction.maintenance.manage')->group(function () {
                Route::get('repairs', [RepairController::class, 'index']);
                Route::get('repairs/{id}', [RepairController::class, 'show']);
                Route::get('retreads', [RetreadController::class, 'index']);
                Route::get('retreads/{id}', [RetreadController::class, 'show']);
                Route::get('warranty-claims', [WarrantyClaimController::class, 'index']);
                Route::get('warranty-claims/{id}', [WarrantyClaimController::class, 'show']);
            });
            Route::middleware('permission:transaction.maintenance.manage')->group(function () {
                Route::post('repairs', [RepairController::class, 'store']);
                Route::post('retreads', [RetreadController::class, 'store']);
                Route::post('warranty-claims', [WarrantyClaimController::class, 'store']);
                Route::put('warranty-claims/{id}', [WarrantyClaimController::class, 'update']);
            });

            // Disposal
            Route::middleware('permission:transaction.disposal.view|transaction.disposal.manage')->group(function () {
                Route::get('scraps', [ScrapController::class, 'index']);
                Route::get('scraps/{id}', [ScrapController::class, 'show']);
                Route::get('lost-tyres', [LostController::class, 'index']);
                Route::get('lost-tyres/{id}', [LostController::class, 'show']);
            });
            Route::middleware('permission:transaction.disposal.manage')->group(function () {
                Route::post('scraps', [ScrapController::class, 'store']);
                Route::post('lost-tyres', [LostController::class, 'store']);
                Route::put('lost-tyres/{id}', [LostController::class, 'update']);
            });
        });

        // Dashboard + Analytics
        Route::middleware('permission:analytics.view')->group(function () {
            Route::get('dashboard/kpis', [DashboardController::class, 'kpis']);

            Route::prefix('analytics')->group(function () {
                Route::get('cost-per-km', [AnalyticsController::class, 'costPerKm']);
                Route::get('cost-per-hour', [AnalyticsController::class, 'costPerHour']);
                Route::get('cost-per-vehicle', [AnalyticsController::class, 'costPerVehicle']);
                Route::get('cost-per-fleet', [AnalyticsController::class, 'costPerFleet']);
                Route::get('cost-per-site', [AnalyticsController::class, 'costPerSite']);
                Route::get('cost-per-project', [AnalyticsController::class, 'costPerProject']);
                Route::get('brand-performance', [AnalyticsController::class, 'brandPerformance']);
                Route::get('pattern-performance', [AnalyticsController::class, 'patternPerformance']);
                Route::get('tyre-lifetime', [AnalyticsController::class, 'tyreLifetime']);
                Route::get('tyre-utilization', [AnalyticsController::class, 'tyreUtilization']);
                Route::get('failure-analysis', [AnalyticsController::class, 'failureAnalysis']);
                Route::get('damage-analysis', [AnalyticsController::class, 'damageAnalysis']);
                Route::get('scrap-analysis', [AnalyticsController::class, 'scrapAnalysis']);
            });
        });

        // Reports
        Route::prefix('reports')->group(function () {
            Route::middleware('permission:reports.view')->get('{key}', [ReportController::class, 'show']);
            Route::middleware('permission:reports.export')->get('{key}/export', [ReportController::class, 'export']);
        });

        // Settings
        Route::prefix('settings')->group(function () {
            Route::middleware('permission:users.manage')->group(function () {
                Route::apiResource('users', UserController::class);
            });

            Route::middleware('permission:users.manage')->group(function () {
                Route::get('roles', [RoleController::class, 'index']);
                Route::get('roles/permissions', [RoleController::class, 'permissions']);
                Route::get('roles/{id}', [RoleController::class, 'show']);
                Route::post('roles', [RoleController::class, 'store']);
                Route::put('roles/{id}', [RoleController::class, 'update']);
                Route::delete('roles/{id}', [RoleController::class, 'destroy']);
            });

            Route::middleware('permission:settings.view|settings.manage')->group(function () {
                Route::get('company-profile', [CompanyProfileController::class, 'show']);
                Route::get('barcode-rfid-config', [BarcodeRfidConfigController::class, 'show']);
                Route::get('audit-logs', [AuditLogController::class, 'index']);
                Route::get('system-configurations', [SystemConfigurationController::class, 'index']);
                Route::get('approval-workflows', [ApprovalWorkflowController::class, 'index']);
                Route::get('approval-workflows/{id}', [ApprovalWorkflowController::class, 'show']);
            });

            Route::middleware('permission:settings.manage')->group(function () {
                Route::put('company-profile', [CompanyProfileController::class, 'update']);
                Route::put('barcode-rfid-config', [BarcodeRfidConfigController::class, 'update']);
                Route::put('system-configurations', [SystemConfigurationController::class, 'update']);
                Route::post('approval-workflows', [ApprovalWorkflowController::class, 'store']);
                Route::put('approval-workflows/{id}', [ApprovalWorkflowController::class, 'update']);
                Route::delete('approval-workflows/{id}', [ApprovalWorkflowController::class, 'destroy']);
            });

            Route::get('notification-preferences', [NotificationPreferenceController::class, 'index']);
            Route::put('notification-preferences', [NotificationPreferenceController::class, 'update']);
        });
    });
});
