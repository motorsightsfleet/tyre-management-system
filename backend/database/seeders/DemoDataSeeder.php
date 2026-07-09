<?php

namespace Database\Seeders;

use App\Models\ApprovalRequest;
use App\Models\ApprovalWorkflow;
use App\Models\AxleConfiguration;
use App\Models\FailureCode;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\InitialStockEntry;
use App\Models\Inspection;
use App\Models\InspectionChecklist;
use App\Models\LostRecord;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Repair;
use App\Models\RepairType;
use App\Models\Retread;
use App\Models\RetreadVendor;
use App\Models\ScrapReason;
use App\Models\ScrapRecord;
use App\Models\Site;
use App\Models\StockAdjustment;
use App\Models\StockMovement;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\Supplier;
use App\Models\Tyre;
use App\Models\TyreBrand;
use App\Models\TyreInstallation;
use App\Models\TyrePattern;
use App\Models\TyreSize;
use App\Models\TyreType;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleModel as VehicleModelModel;
use App\Models\VehicleReading;
use App\Models\Warehouse;
use App\Models\WarrantyClaim;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    private array $brandIds;

    private array $patternIds;

    private array $sizeIds;

    private int $typeRadialId;

    private array $supplierIds;

    private array $axleConfigs;

    private array $vehicleModels;

    public function run(): void
    {
        $this->brandIds = TyreBrand::pluck('id', 'code')->toArray();
        $this->patternIds = TyrePattern::pluck('id', 'code')->toArray();
        $this->sizeIds = TyreSize::pluck('id', 'code')->toArray();
        $this->typeRadialId = TyreType::where('code', 'RADIAL')->value('id');
        $this->supplierIds = Supplier::pluck('id', 'code')->toArray();
        $this->axleConfigs = AxleConfiguration::get()->keyBy('code')->toArray();
        $this->vehicleModels = VehicleModelModel::get()->keyBy('code')->toArray();

        $vehicles = $this->seedVehiclesWithInstalledTyres();
        $this->seedWarehouseStock();
        $this->seedProcurementFlow();
        $this->seedWarehouseMovements();
        $this->seedInspections($vehicles);
        $this->seedMaintenanceAndDisposal();
    }

    private function serial(string $prefix): string
    {
        return $prefix.'-'.Str::upper(Str::random(8));
    }

    private function barcode(): string
    {
        return 'TYR'.str_pad((string) random_int(1, 999999999), 9, '0', STR_PAD_LEFT);
    }

    private function tyreSpecFor(string $vehicleModelCode): array
    {
        return match ($vehicleModelCode) {
            'CAT-777D', 'CAT-793F' => ['brand' => 'MICHELIN', 'pattern' => 'MICH-XDR2', 'size' => '27.00R49'],
            'KOM-HD785' => ['brand' => 'BRIDGESTONE', 'pattern' => 'BS-VRDP', 'size' => '24.00R35'],
            'CAT-773' => ['brand' => 'GOODYEAR', 'pattern' => 'GY-RM4A', 'size' => '12.00R24'],
            'HINO-RK8' => ['brand' => 'GTRADIAL', 'pattern' => 'GTR-GDL617', 'size' => '295/80R22.5'],
            'FUSO-TRAILER20' => ['brand' => 'CONTINENTAL', 'pattern' => 'CONTI-HSR2', 'size' => '11R22.5'],
            'CAT-140K' => ['brand' => 'BRIDGESTONE', 'pattern' => 'BS-R150', 'size' => '295/80R22.5'],
            default => ['brand' => 'MICHELIN', 'pattern' => 'MICH-XZY3', 'size' => '295/80R22.5'],
        };
    }

    private function seedVehiclesWithInstalledTyres(): array
    {
        $siteA = Site::where('code', 'SITE-A')->first();
        $siteB = Site::where('code', 'SITE-B')->first();
        $hq = Site::where('code', 'HQ')->first();
        $prjAlpha = Project::where('code', 'PRJ-ALPHA-PIT1')->first();
        $prjBeta = Project::where('code', 'PRJ-BETA-PIT2')->first();
        $admin = User::where('email', 'motorsightsfleet@gmail.com')->first();

        $specs = [
            ['HT-001', 'CAT-777D', 'MINING-HAUL-2AXLE', $siteA, $prjAlpha, 48200, 6100],
            ['HT-002', 'CAT-777D', 'MINING-HAUL-2AXLE', $siteA, $prjAlpha, 51200, 6400],
            ['HT-003', 'CAT-793F', 'MINING-HAUL-2AXLE', $siteA, $prjAlpha, 22100, 2900],
            ['RD-001', 'KOM-HD785', 'MINING-RIGID-8X4', $siteB, $prjBeta, 63500, 8100],
            ['RD-002', 'KOM-HD785', 'MINING-RIGID-8X4', $siteB, $prjBeta, 71200, 9200],
            ['WT-001', 'CAT-773', 'TRUCK-6X4', $siteA, $prjAlpha, 88000, null],
            ['WT-002', 'CAT-773', 'TRUCK-6X4', $siteA, $prjAlpha, 95500, null],
            ['BUS-001', 'HINO-RK8', 'BUS-4X2', $hq, null, 132000, null],
            ['BUS-002', 'HINO-RK8', 'BUS-4X2', $hq, null, 118500, null],
            ['TRL-001', 'FUSO-TRAILER20', 'TRAILER-3AXLE', $siteB, $prjBeta, 205000, null],
            ['TRL-002', 'FUSO-TRAILER20', 'TRAILER-3AXLE', $siteB, $prjBeta, 189000, null],
            ['GRD-001', 'CAT-140K', 'BUS-4X2', $siteA, $prjAlpha, 15200, 2100],
        ];

        $vehicles = [];

        foreach ($specs as [$code, $modelCode, $axleCode, $site, $project, $odometer, $hours]) {
            $model = $this->vehicleModels[$modelCode];
            $axle = $this->axleConfigs[$axleCode];

            $vehicle = Vehicle::firstOrCreate(['code' => $code], [
                'plate_number' => 'B '.random_int(1000, 9999).' '.Str::upper(Str::random(3)),
                'vehicle_model_id' => $model['id'],
                'vehicle_category_id' => $model['vehicle_category_id'],
                'axle_configuration_id' => $axle['id'],
                'site_id' => $site?->id,
                'project_id' => $project?->id,
                'odometer_km' => $odometer,
                'engine_hours' => $hours ?? 0,
                'status' => 'active',
                'commissioned_at' => now()->subMonths(random_int(6, 36)),
            ]);

            $vehicles[] = $vehicle;

            $spec = $this->tyreSpecFor($modelCode);
            $installedAt = now()->subDays(random_int(30, 180));

            foreach ($axle['layout'] as $position) {
                if ($position['is_spare']) {
                    continue;
                }

                $tyre = Tyre::create([
                    'serial_number' => $this->serial($spec['brand']),
                    'barcode_code' => $this->barcode(),
                    'tyre_brand_id' => $this->brandIds[$spec['brand']],
                    'tyre_pattern_id' => $this->patternIds[$spec['pattern']],
                    'tyre_size_id' => $this->sizeIds[$spec['size']],
                    'tyre_type_id' => $this->typeRadialId,
                    'supplier_id' => $this->supplierIds[array_rand($this->supplierIds)],
                    'manufacture_date' => $installedAt->copy()->subMonths(random_int(1, 6)),
                    'tread_depth_new_mm' => 28,
                    'cost' => random_int(3_000_000, 45_000_000),
                    'status' => 'installed',
                    'current_vehicle_id' => $vehicle->id,
                    'current_tyre_position_id' => $position['tyre_position_id'],
                    'purchased_at' => $installedAt->copy()->subDays(random_int(5, 20)),
                ]);

                TyreInstallation::create([
                    'tyre_id' => $tyre->id,
                    'vehicle_id' => $vehicle->id,
                    'tyre_position_id' => $position['tyre_position_id'],
                    'installed_by' => $admin?->id,
                    'installed_at' => $installedAt,
                    'odometer_km_at_install' => max(0, $odometer - random_int(500, 5000)),
                    'engine_hours_at_install' => max(0, ($hours ?? 0) - random_int(50, 500)),
                ]);

                $tyre->events()->create([
                    'event_type' => 'installed',
                    'event_date' => $installedAt,
                    'notes' => "Installed on {$vehicle->code}",
                ]);
            }

            foreach ([3, 2, 1] as $monthsAgo) {
                VehicleReading::create([
                    'vehicle_id' => $vehicle->id,
                    'reading_date' => now()->subMonths($monthsAgo),
                    'odometer_km' => max(0, $odometer - $monthsAgo * random_int(1500, 3000)),
                    'engine_hours' => max(0, ($hours ?? 0) - $monthsAgo * random_int(80, 200)),
                    'recorded_by' => $admin?->id,
                ]);
            }
        }

        return $vehicles;
    }

    private function seedWarehouseStock(): void
    {
        $whA = Warehouse::where('code', 'WH-A')->first();
        $whB = Warehouse::where('code', 'WH-B')->first();

        $stockSpecs = [
            ['MICHELIN', 'MICH-XDR2', '27.00R49', $whA, 4],
            ['BRIDGESTONE', 'BS-VRDP', '24.00R35', $whB, 4],
            ['GOODYEAR', 'GY-RM4A', '12.00R24', $whA, 6],
            ['GTRADIAL', 'GTR-GDL617', '295/80R22.5', $whB, 8],
            ['CONTINENTAL', 'CONTI-HSR2', '11R22.5', $whA, 6],
        ];

        foreach ($stockSpecs as [$brand, $pattern, $size, $warehouse, $qty]) {
            for ($i = 0; $i < $qty; $i++) {
                Tyre::create([
                    'serial_number' => $this->serial($brand),
                    'barcode_code' => $this->barcode(),
                    'tyre_brand_id' => $this->brandIds[$brand],
                    'tyre_pattern_id' => $this->patternIds[$pattern],
                    'tyre_size_id' => $this->sizeIds[$size],
                    'tyre_type_id' => $this->typeRadialId,
                    'supplier_id' => $this->supplierIds[array_rand($this->supplierIds)],
                    'manufacture_date' => now()->subMonths(random_int(1, 8)),
                    'tread_depth_new_mm' => 28,
                    'cost' => random_int(3_000_000, 45_000_000),
                    'status' => 'in_stock',
                    'current_warehouse_id' => $warehouse->id,
                    'purchased_at' => now()->subDays(random_int(10, 60)),
                ]);
            }
        }
    }

    private function seedProcurementFlow(): void
    {
        $whA = Warehouse::where('code', 'WH-A')->first();
        $supplier = Supplier::where('code', 'SUP-SUMBERBAN')->first();
        $warehouseStaff = User::where('email', 'warehouse.staff@tms.local')->first();
        $fleetManager = User::where('email', 'fleet.manager@tms.local')->first();

        $po = PurchaseOrder::create([
            'code' => 'PO-2026-0001',
            'supplier_id' => $supplier->id,
            'warehouse_id' => $whA->id,
            'requested_by' => $warehouseStaff?->id,
            'status' => 'received',
            'order_date' => now()->subDays(25),
            'expected_date' => now()->subDays(10),
            'total_amount' => 180_000_000,
            'notes' => 'Quarterly restock for Site Alpha.',
        ]);

        $item = PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'tyre_brand_id' => $this->brandIds['MICHELIN'],
            'tyre_pattern_id' => $this->patternIds['MICH-XDR2'],
            'tyre_size_id' => $this->sizeIds['27.00R49'],
            'tyre_type_id' => $this->typeRadialId,
            'quantity' => 4,
            'unit_price' => 45_000_000,
            'received_quantity' => 4,
        ]);

        $approvalWorkflow = ApprovalWorkflow::where('code', 'PO-APPROVAL')->first();
        $request = ApprovalRequest::create([
            'approval_workflow_id' => $approvalWorkflow->id,
            'requestable_type' => PurchaseOrder::class,
            'requestable_id' => $po->id,
            'requested_by' => $warehouseStaff?->id,
            'status' => 'approved',
            'current_step' => 2,
        ]);
        $request->actions()->create([
            'step_order' => 1,
            'actor_id' => $warehouseStaff?->id,
            'action' => 'approved',
            'comment' => 'Stock levels confirmed low.',
            'acted_at' => now()->subDays(24),
        ]);
        $request->actions()->create([
            'step_order' => 2,
            'actor_id' => $fleetManager?->id,
            'action' => 'approved',
            'comment' => 'Approved within budget.',
            'acted_at' => now()->subDays(23),
        ]);

        $receipt = GoodsReceipt::create([
            'code' => 'GR-2026-0001',
            'purchase_order_id' => $po->id,
            'warehouse_id' => $whA->id,
            'received_by' => $warehouseStaff?->id,
            'receipt_date' => now()->subDays(10),
            'notes' => 'Received in good condition.',
        ]);

        for ($i = 0; $i < 4; $i++) {
            $tyre = Tyre::create([
                'serial_number' => $this->serial('MICHELIN'),
                'barcode_code' => $this->barcode(),
                'tyre_brand_id' => $this->brandIds['MICHELIN'],
                'tyre_pattern_id' => $this->patternIds['MICH-XDR2'],
                'tyre_size_id' => $this->sizeIds['27.00R49'],
                'tyre_type_id' => $this->typeRadialId,
                'supplier_id' => $supplier->id,
                'manufacture_date' => now()->subMonths(2),
                'tread_depth_new_mm' => 28,
                'cost' => 45_000_000,
                'status' => 'in_stock',
                'current_warehouse_id' => $whA->id,
                'purchased_at' => now()->subDays(10),
            ]);

            GoodsReceiptItem::create([
                'goods_receipt_id' => $receipt->id,
                'purchase_order_item_id' => $item->id,
                'tyre_id' => $tyre->id,
                'serial_number' => $tyre->serial_number,
                'cost' => 45_000_000,
            ]);

            StockMovement::create([
                'tyre_id' => $tyre->id,
                'movement_type' => 'receipt',
                'to_warehouse_id' => $whA->id,
                'user_id' => $warehouseStaff?->id,
                'moved_at' => now()->subDays(10),
                'notes' => "Received via {$receipt->code}",
            ]);
        }

        $openingTyre = Tyre::where('status', 'in_stock')->where('current_warehouse_id', $whA->id)->latest('id')->skip(4)->first()
            ?? Tyre::where('status', 'in_stock')->first();

        if ($openingTyre) {
            InitialStockEntry::create([
                'tyre_id' => $openingTyre->id,
                'warehouse_id' => $whA->id,
                'entered_by' => $warehouseStaff?->id,
                'entry_date' => now()->subMonths(3),
                'notes' => 'Opening balance migrated from legacy system.',
            ]);
        }
    }

    private function seedWarehouseMovements(): void
    {
        $whA = Warehouse::where('code', 'WH-A')->first();
        $whB = Warehouse::where('code', 'WH-B')->first();
        $warehouseStaff = User::where('email', 'warehouse.staff@tms.local')->first();

        $tyresToTransfer = Tyre::where('status', 'in_stock')->where('current_warehouse_id', $whA->id)->limit(2)->get();

        if ($tyresToTransfer->count() === 2) {
            $transfer = StockTransfer::create([
                'code' => 'TRF-2026-0001',
                'from_warehouse_id' => $whA->id,
                'to_warehouse_id' => $whB->id,
                'requested_by' => $warehouseStaff?->id,
                'status' => 'completed',
                'transfer_date' => now()->subDays(5),
                'notes' => 'Rebalancing stock between sites.',
            ]);

            foreach ($tyresToTransfer as $tyre) {
                StockTransferItem::create(['stock_transfer_id' => $transfer->id, 'tyre_id' => $tyre->id]);
                $tyre->update(['current_warehouse_id' => $whB->id]);

                StockMovement::create([
                    'tyre_id' => $tyre->id,
                    'movement_type' => 'transfer',
                    'from_warehouse_id' => $whA->id,
                    'to_warehouse_id' => $whB->id,
                    'user_id' => $warehouseStaff?->id,
                    'moved_at' => now()->subDays(5),
                    'notes' => "Transferred via {$transfer->code}",
                ]);
            }
        }

        $adjustTyre = Tyre::where('status', 'in_stock')->first();
        if ($adjustTyre) {
            StockAdjustment::create([
                'tyre_id' => $adjustTyre->id,
                'warehouse_id' => $adjustTyre->current_warehouse_id,
                'reason' => 'Physical count correction',
                'adjusted_by' => $warehouseStaff?->id,
                'adjustment_date' => now()->subDays(3),
                'notes' => 'Found during quarterly stock opname.',
            ]);
        }
    }

    private function seedInspections(array $vehicles): void
    {
        $inspector = User::where('email', 'inspector@tms.local')->first();
        $dailyChecklist = InspectionChecklist::where('code', 'DAILY-PREOP')->first();
        $periodicChecklist = InspectionChecklist::where('code', 'PERIODIC-INSPECTION')->first();

        foreach ($vehicles as $vehicle) {
            $installedTyres = Tyre::where('current_vehicle_id', $vehicle->id)->get();

            foreach ($installedTyres as $tyre) {
                $treadDepth = round(random_int(60, 260) / 10, 1);
                $pressure = round(random_int(900, 1300) / 10, 1);

                $inspection = Inspection::create([
                    'tyre_id' => $tyre->id,
                    'vehicle_id' => $vehicle->id,
                    'tyre_position_id' => $tyre->current_tyre_position_id,
                    'inspection_checklist_id' => $dailyChecklist->id,
                    'type' => 'daily',
                    'tread_depth_mm' => $treadDepth,
                    'pressure_psi' => $pressure,
                    'temperature_c' => round(random_int(280, 450) / 10, 1),
                    'checklist_results' => ['visual_ok' => true, 'pressure_ok' => true, 'no_embedded_objects' => true],
                    'inspected_by' => $inspector?->id,
                    'inspected_at' => now()->subDays(random_int(1, 5)),
                ]);

                $tyre->events()->create([
                    'event_type' => 'inspected',
                    'event_date' => $inspection->inspected_at,
                    'ref_type' => Inspection::class,
                    'ref_id' => $inspection->id,
                ]);

                if (random_int(0, 2) === 0) {
                    Inspection::create([
                        'tyre_id' => $tyre->id,
                        'vehicle_id' => $vehicle->id,
                        'tyre_position_id' => $tyre->current_tyre_position_id,
                        'inspection_checklist_id' => $periodicChecklist->id,
                        'type' => 'periodic',
                        'tread_depth_mm' => $treadDepth,
                        'pressure_psi' => $pressure,
                        'checklist_results' => ['tread_ok' => true, 'sidewall_ok' => true, 'valve_ok' => true, 'rim_ok' => true],
                        'inspected_by' => $inspector?->id,
                        'inspected_at' => now()->subDays(random_int(10, 25)),
                    ]);
                }
            }
        }
    }

    private function seedMaintenanceAndDisposal(): void
    {
        $inspector = User::where('email', 'inspector@tms.local')->first();
        $fleetManager = User::where('email', 'fleet.manager@tms.local')->first();
        $repairType = RepairType::where('code', 'SECTION-REPAIR')->first();
        $retreadVendor = RetreadVendor::where('code', 'RTV-VIPAL')->first();
        $scrapReason = ScrapReason::where('code', 'BELOW-MIN-TREAD')->first();
        $supplier = Supplier::where('code', 'SUP-GLOBALTYRE')->first();
        $failureCode = FailureCode::where('code', 'MFG-DEFECT')->first();

        $repairTyre = Tyre::create([
            'serial_number' => $this->serial('BRIDGESTONE'),
            'barcode_code' => $this->barcode(),
            'tyre_brand_id' => $this->brandIds['BRIDGESTONE'],
            'tyre_pattern_id' => $this->patternIds['BS-R150'],
            'tyre_size_id' => $this->sizeIds['295/80R22.5'],
            'tyre_type_id' => $this->typeRadialId,
            'cost' => 8_500_000,
            'status' => 'in_repair',
            'purchased_at' => now()->subMonths(4),
        ]);
        Repair::create([
            'tyre_id' => $repairTyre->id,
            'repair_type_id' => $repairType->id,
            'vendor_id' => $supplier->id,
            'cost' => 750_000,
            'tread_before_mm' => 12,
            'tread_after_mm' => 11,
            'repaired_by' => $inspector?->id,
            'repair_date' => now()->subDays(4),
            'notes' => 'Section repair for sidewall cut.',
        ]);
        $repairTyre->events()->create(['event_type' => 'repaired', 'event_date' => now()->subDays(4)]);

        $retreadTyre = Tyre::create([
            'serial_number' => $this->serial('GOODYEAR'),
            'barcode_code' => $this->barcode(),
            'tyre_brand_id' => $this->brandIds['GOODYEAR'],
            'tyre_pattern_id' => $this->patternIds['GY-RM4A'],
            'tyre_size_id' => $this->sizeIds['12.00R24'],
            'tyre_type_id' => $this->typeRadialId,
            'cost' => 12_000_000,
            'status' => 'retreaded',
            'retread_count' => 1,
            'purchased_at' => now()->subYear(),
        ]);
        Retread::create([
            'tyre_id' => $retreadTyre->id,
            'retread_vendor_id' => $retreadVendor->id,
            'cost' => 3_200_000,
            'sent_date' => now()->subDays(30),
            'received_date' => now()->subDays(15),
            'retread_count_after' => 1,
            'warranty_months' => 6,
            'notes' => 'First retread cycle.',
        ]);
        $retreadTyre->events()->create(['event_type' => 'retreaded', 'event_date' => now()->subDays(15)]);

        WarrantyClaim::create([
            'tyre_id' => $repairTyre->id,
            'supplier_id' => $supplier->id,
            'failure_code_id' => $failureCode->id,
            'claim_date' => now()->subDays(3),
            'reason' => 'Premature sidewall failure suspected manufacturing defect.',
            'status' => 'submitted',
        ]);

        for ($i = 0; $i < 2; $i++) {
            $scrapTyre = Tyre::create([
                'serial_number' => $this->serial('CONTINENTAL'),
                'barcode_code' => $this->barcode(),
                'tyre_brand_id' => $this->brandIds['CONTINENTAL'],
                'tyre_pattern_id' => $this->patternIds['CONTI-HSR2'],
                'tyre_size_id' => $this->sizeIds['11R22.5'],
                'tyre_type_id' => $this->typeRadialId,
                'cost' => 4_500_000,
                'status' => 'scrapped',
                'purchased_at' => now()->subYears(2),
            ]);
            ScrapRecord::create([
                'tyre_id' => $scrapTyre->id,
                'scrap_reason_id' => $scrapReason->id,
                'scrapped_by' => $inspector?->id,
                'approved_by' => $fleetManager?->id,
                'scrap_date' => now()->subDays(random_int(1, 20)),
                'final_tread_depth_mm' => 2.5,
                'notes' => 'Below minimum legal tread depth.',
            ]);
            $scrapTyre->events()->create(['event_type' => 'scrapped', 'event_date' => now()->subDays(1)]);
        }

        $lostTyre = Tyre::create([
            'serial_number' => $this->serial('GTRADIAL'),
            'barcode_code' => $this->barcode(),
            'tyre_brand_id' => $this->brandIds['GTRADIAL'],
            'tyre_pattern_id' => $this->patternIds['GTR-GDL617'],
            'tyre_size_id' => $this->sizeIds['295/80R22.5'],
            'tyre_type_id' => $this->typeRadialId,
            'cost' => 5_000_000,
            'status' => 'lost',
            'purchased_at' => now()->subMonths(8),
        ]);
        LostRecord::create([
            'tyre_id' => $lostTyre->id,
            'reported_by' => $inspector?->id,
            'reported_date' => now()->subDays(7),
            'last_seen_location' => 'Site Beta workshop yard',
            'cost_writeoff' => 5_000_000,
            'status' => 'investigating',
            'notes' => 'Missing after night shift changeover.',
        ]);
        $lostTyre->events()->create(['event_type' => 'lost', 'event_date' => now()->subDays(7)]);
    }
}
