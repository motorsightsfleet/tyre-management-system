<?php

namespace Database\Seeders;

use App\Models\ApprovalWorkflow;
use App\Models\AxleConfiguration;
use App\Models\BarcodeRfidConfig;
use App\Models\CompanyProfile;
use App\Models\Customer;
use App\Models\DamageType;
use App\Models\FailureCode;
use App\Models\InspectionChecklist;
use App\Models\Project;
use App\Models\RemovalReason;
use App\Models\RepairType;
use App\Models\RetreadVendor;
use App\Models\ScrapReason;
use App\Models\Site;
use App\Models\Supplier;
use App\Models\SystemConfiguration;
use App\Models\TyreBrand;
use App\Models\TyrePattern;
use App\Models\TyrePosition;
use App\Models\TyreSize;
use App\Models\TyreType;
use App\Models\VehicleCategory;
use App\Models\VehicleModel as VehicleModelModel;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedTyrePositionsAndAxleConfigurations();
        $this->seedVehicleTaxonomy();
        $this->seedTyreTaxonomy();
        $this->seedLocationsAndPartners();
        $this->seedReasonsAndTypes();
        $this->seedInspectionChecklists();
        $this->seedSettingsDefaults();
        $this->seedApprovalWorkflows();
    }

    private function seedTyrePositionsAndAxleConfigurations(): void
    {
        $positions = [
            ['FL', 'Front Left (Steer)'],
            ['FR', 'Front Right (Steer)'],
            ['F2L', 'Front Axle 2 Left (Steer Tandem)'],
            ['F2R', 'Front Axle 2 Right (Steer Tandem)'],
            ['RL', 'Rear Left (Single)'],
            ['RR', 'Rear Right (Single)'],
            ['A1LO', 'Axle 1 Left Outer'],
            ['A1LI', 'Axle 1 Left Inner'],
            ['A1RI', 'Axle 1 Right Inner'],
            ['A1RO', 'Axle 1 Right Outer'],
            ['A2LO', 'Axle 2 Left Outer'],
            ['A2LI', 'Axle 2 Left Inner'],
            ['A2RI', 'Axle 2 Right Inner'],
            ['A2RO', 'Axle 2 Right Outer'],
            ['A3LO', 'Axle 3 Left Outer'],
            ['A3LI', 'Axle 3 Left Inner'],
            ['A3RI', 'Axle 3 Right Inner'],
            ['A3RO', 'Axle 3 Right Outer'],
            ['SPARE1', 'Spare 1'],
            ['SPARE2', 'Spare 2'],
        ];

        $ids = [];
        foreach ($positions as [$code, $name]) {
            $ids[$code] = TyrePosition::firstOrCreate(['code' => $code], ['name' => $name])->id;
        }

        $pos = fn (string $code, int $axleNo, string $side, bool $dual, float $x, float $y, bool $spare = false) => [
            'tyre_position_id' => $ids[$code],
            'code' => $code,
            'axle_no' => $axleNo,
            'side' => $side,
            'is_dual' => $dual,
            'is_spare' => $spare,
            'x' => $x,
            'y' => $y,
        ];

        $configs = [
            [
                'code' => 'BUS-4X2',
                'name' => 'Bus / Light Truck 4x2',
                'axle_count' => 2,
                'layout' => [
                    $pos('FL', 1, 'left', false, 20, 8),
                    $pos('FR', 1, 'right', false, 80, 8),
                    $pos('A2LO', 2, 'left', true, 12, 85),
                    $pos('A2LI', 2, 'left', true, 32, 85),
                    $pos('A2RI', 2, 'right', true, 68, 85),
                    $pos('A2RO', 2, 'right', true, 88, 85),
                ],
            ],
            [
                'code' => 'TRUCK-6X4',
                'name' => 'Heavy Truck 6x4',
                'axle_count' => 3,
                'layout' => [
                    $pos('FL', 1, 'left', false, 20, 6),
                    $pos('FR', 1, 'right', false, 80, 6),
                    $pos('A2LO', 2, 'left', true, 12, 55),
                    $pos('A2LI', 2, 'left', true, 32, 55),
                    $pos('A2RI', 2, 'right', true, 68, 55),
                    $pos('A2RO', 2, 'right', true, 88, 55),
                    $pos('A3LO', 3, 'left', true, 12, 88),
                    $pos('A3LI', 3, 'left', true, 32, 88),
                    $pos('A3RI', 3, 'right', true, 68, 88),
                    $pos('A3RO', 3, 'right', true, 88, 88),
                ],
            ],
            [
                'code' => 'MINING-RIGID-8X4',
                'name' => 'Mining Rigid Dump Truck 8x4',
                'axle_count' => 4,
                'layout' => [
                    $pos('FL', 1, 'left', false, 20, 5),
                    $pos('FR', 1, 'right', false, 80, 5),
                    $pos('F2L', 2, 'left', false, 20, 20),
                    $pos('F2R', 2, 'right', false, 80, 20),
                    $pos('A3LO', 3, 'left', true, 12, 65),
                    $pos('A3LI', 3, 'left', true, 32, 65),
                    $pos('A3RI', 3, 'right', true, 68, 65),
                    $pos('A3RO', 3, 'right', true, 88, 65),
                    $pos('A2LO', 4, 'left', true, 12, 90),
                    $pos('A2LI', 4, 'left', true, 32, 90),
                    $pos('A2RI', 4, 'right', true, 68, 90),
                    $pos('A2RO', 4, 'right', true, 88, 90),
                ],
            ],
            [
                'code' => 'TRAILER-3AXLE',
                'name' => 'Semi-Trailer 3-Axle',
                'axle_count' => 3,
                'layout' => [
                    $pos('A1LO', 1, 'left', true, 12, 20),
                    $pos('A1LI', 1, 'left', true, 32, 20),
                    $pos('A1RI', 1, 'right', true, 68, 20),
                    $pos('A1RO', 1, 'right', true, 88, 20),
                    $pos('A2LO', 2, 'left', true, 12, 50),
                    $pos('A2LI', 2, 'left', true, 32, 50),
                    $pos('A2RI', 2, 'right', true, 68, 50),
                    $pos('A2RO', 2, 'right', true, 88, 50),
                    $pos('A3LO', 3, 'left', true, 12, 80),
                    $pos('A3LI', 3, 'left', true, 32, 80),
                    $pos('A3RI', 3, 'right', true, 68, 80),
                    $pos('A3RO', 3, 'right', true, 88, 80),
                ],
            ],
            [
                'code' => 'MINING-HAUL-2AXLE',
                'name' => 'Mining Haul Truck 2-Axle (Single Giant Tyres)',
                'axle_count' => 2,
                'layout' => [
                    $pos('FL', 1, 'left', false, 20, 12),
                    $pos('FR', 1, 'right', false, 80, 12),
                    $pos('RL', 2, 'left', false, 20, 85),
                    $pos('RR', 2, 'right', false, 80, 85),
                ],
            ],
        ];

        foreach ($configs as $config) {
            AxleConfiguration::firstOrCreate(
                ['code' => $config['code']],
                ['name' => $config['name'], 'axle_count' => $config['axle_count'], 'layout' => $config['layout']]
            );
        }
    }

    private function seedVehicleTaxonomy(): void
    {
        $categories = [
            'MINE-HAUL' => 'Mining Haul Truck',
            'RIGID-DUMP' => 'Rigid Dump Truck',
            'WATER-TRUCK' => 'Water Truck',
            'BUS' => 'Bus',
            'TRAILER' => 'Trailer',
            'GRADER' => 'Motor Grader',
        ];

        $categoryIds = [];
        foreach ($categories as $code => $name) {
            $categoryIds[$code] = VehicleCategory::firstOrCreate(['code' => $code], ['name' => $name])->id;
        }

        $models = [
            ['CAT-777D', 'Caterpillar 777D', 'MINE-HAUL'],
            ['CAT-793F', 'Caterpillar 793F', 'MINE-HAUL'],
            ['KOM-HD785', 'Komatsu HD785-7', 'RIGID-DUMP'],
            ['CAT-773', 'Caterpillar 773 Water Truck', 'WATER-TRUCK'],
            ['HINO-RK8', 'Hino RK8 Bus', 'BUS'],
            ['FUSO-TRAILER20', 'Fuso Trailer 20ft', 'TRAILER'],
            ['CAT-140K', 'Caterpillar 140K Grader', 'GRADER'],
        ];

        foreach ($models as [$code, $name, $categoryCode]) {
            VehicleModelModel::firstOrCreate(
                ['code' => $code],
                ['name' => $name, 'vehicle_category_id' => $categoryIds[$categoryCode]]
            );
        }
    }

    private function seedTyreTaxonomy(): void
    {
        $brands = [
            'MICHELIN' => ['Michelin', 'France'],
            'BRIDGESTONE' => ['Bridgestone', 'Japan'],
            'GOODYEAR' => ['Goodyear', 'USA'],
            'CONTINENTAL' => ['Continental', 'Germany'],
            'GTRADIAL' => ['GT Radial', 'Indonesia'],
        ];

        $brandIds = [];
        foreach ($brands as $code => [$name, $origin]) {
            $brandIds[$code] = TyreBrand::firstOrCreate(['code' => $code], ['name' => $name, 'country_of_origin' => $origin])->id;
        }

        $patterns = [
            ['MICH-XDR2', 'XDR2', 'MICHELIN', 'Mining Haul'],
            ['MICH-XZY3', 'XZY3', 'MICHELIN', 'Highway'],
            ['BS-VRDP', 'VRDP', 'BRIDGESTONE', 'Mining Rigid'],
            ['BS-R150', 'R150', 'BRIDGESTONE', 'Highway'],
            ['GY-RM4A', 'RM4A', 'GOODYEAR', 'Mining Haul'],
            ['CONTI-HSR2', 'HSR2', 'CONTINENTAL', 'Highway'],
            ['GTR-GDL617', 'GDL617', 'GTRADIAL', 'Highway'],
        ];

        foreach ($patterns as [$code, $name, $brandCode, $application]) {
            TyrePattern::firstOrCreate(
                ['code' => $code],
                ['name' => $name, 'tyre_brand_id' => $brandIds[$brandCode], 'application' => $application]
            );
        }

        $sizes = [
            ['27.00R49', 1620, null, '49'],
            ['24.00R35', 1470, null, '35'],
            ['12.00R24', 315, 80, '24'],
            ['295/80R22.5', 295, 80, '22.5'],
            ['11R22.5', 279, null, '22.5'],
        ];

        foreach ($sizes as [$code, $width, $aspect, $rim]) {
            TyreSize::firstOrCreate(['code' => $code], ['width_mm' => $width, 'aspect_ratio' => $aspect, 'rim_diameter' => $rim]);
        }

        foreach (['RADIAL' => 'Radial', 'BIAS' => 'Bias'] as $code => $name) {
            TyreType::firstOrCreate(['code' => $code], ['name' => $name]);
        }
    }

    private function seedLocationsAndPartners(): void
    {
        $siteA = Site::firstOrCreate(['code' => 'SITE-A'], ['name' => 'Mine Site Alpha', 'address' => 'Kalimantan Timur']);
        $siteB = Site::firstOrCreate(['code' => 'SITE-B'], ['name' => 'Mine Site Beta', 'address' => 'Sumatera Selatan']);
        Site::firstOrCreate(['code' => 'HQ'], ['name' => 'Central Workshop / HQ', 'address' => 'Jakarta']);

        Warehouse::firstOrCreate(['code' => 'WH-A'], ['name' => 'Site Alpha Main Warehouse', 'site_id' => $siteA->id]);
        Warehouse::firstOrCreate(['code' => 'WH-B'], ['name' => 'Site Beta Main Warehouse', 'site_id' => $siteB->id]);

        $customerA = Customer::firstOrCreate(['code' => 'CUST-SEJAHTERA'], ['name' => 'PT Tambang Sejahtera']);
        $customerB = Customer::firstOrCreate(['code' => 'CUST-BORNEO'], ['name' => 'PT Borneo Coal']);

        Project::firstOrCreate(
            ['code' => 'PRJ-ALPHA-PIT1'],
            ['name' => 'Alpha Pit 1 Overburden Removal', 'site_id' => $siteA->id, 'customer_id' => $customerA->id]
        );
        Project::firstOrCreate(
            ['code' => 'PRJ-BETA-PIT2'],
            ['name' => 'Beta Pit 2 Coal Hauling', 'site_id' => $siteB->id, 'customer_id' => $customerB->id]
        );

        Supplier::firstOrCreate(['code' => 'SUP-SUMBERBAN'], ['name' => 'PT Sumber Ban Indonesia']);
        Supplier::firstOrCreate(['code' => 'SUP-GLOBALTYRE'], ['name' => 'PT Global Tyre Nusantara']);

        RetreadVendor::firstOrCreate(['code' => 'RTV-VIPAL'], ['name' => 'PT Vipal Retreading']);
        RetreadVendor::firstOrCreate(['code' => 'RTV-BANDAG'], ['name' => 'PT Bandag Indonesia']);
    }

    private function seedReasonsAndTypes(): void
    {
        $sets = [
            FailureCode::class => [
                ['OVERLOAD', 'Overload'],
                ['UNDERINFLATION', 'Underinflation'],
                ['IMPACT', 'Impact Damage'],
                ['ROAD-HAZARD', 'Road Hazard'],
                ['MFG-DEFECT', 'Manufacturing Defect'],
            ],
            DamageType::class => [
                ['CUT', 'Cut'],
                ['PUNCTURE', 'Puncture'],
                ['SIDEWALL-BULGE', 'Sidewall Bulge'],
                ['TREAD-SEPARATION', 'Tread Separation'],
                ['BEAD-DAMAGE', 'Bead Damage'],
            ],
            RemovalReason::class => [
                ['WORN-OUT', 'Worn Out'],
                ['DAMAGED', 'Damaged'],
                ['ROTATION', 'Rotation'],
                ['RETREAD', 'Sent for Retread'],
                ['END-OF-LIFE', 'End of Life'],
            ],
            ScrapReason::class => [
                ['NON-REPAIRABLE', 'Non-Repairable Damage'],
                ['BELOW-MIN-TREAD', 'Below Minimum Tread Depth'],
                ['CASING-FAILURE', 'Casing Failure'],
            ],
            RepairType::class => [
                ['PUNCTURE-REPAIR', 'Puncture Repair'],
                ['SECTION-REPAIR', 'Section Repair'],
                ['VULCANIZING', 'Vulcanizing'],
            ],
        ];

        foreach ($sets as $model => $rows) {
            foreach ($rows as [$code, $name]) {
                $model::firstOrCreate(['code' => $code], ['name' => $name]);
            }
        }
    }

    private function seedInspectionChecklists(): void
    {
        $daily = InspectionChecklist::firstOrCreate(
            ['code' => 'DAILY-PREOP'],
            ['name' => 'Daily Pre-Operation Checklist', 'applies_to' => 'daily']
        );
        foreach ([
            'Visual check for cuts and bulges',
            'Check tyre pressure',
            'Check for embedded objects',
            'Check wheel nuts / rim condition',
        ] as $i => $label) {
            $daily->items()->firstOrCreate(['label' => $label], ['sort_order' => $i + 1, 'is_required' => true]);
        }

        $periodic = InspectionChecklist::firstOrCreate(
            ['code' => 'PERIODIC-INSPECTION'],
            ['name' => 'Periodic Inspection Checklist', 'applies_to' => 'periodic']
        );
        foreach ([
            'Tread depth measurement (all positions)',
            'Sidewall inspection',
            'Valve stem / cap condition',
            'Rim and wheel condition',
            'Torque check on wheel nuts',
        ] as $i => $label) {
            $periodic->items()->firstOrCreate(['label' => $label], ['sort_order' => $i + 1, 'is_required' => true]);
        }
    }

    private function seedSettingsDefaults(): void
    {
        CompanyProfile::firstOrCreate(['name' => 'MotorSights Fleet Tyre Management'], [
            'legal_name' => 'PT MotorSights Fleet Indonesia',
            'address' => 'Jakarta, Indonesia',
            'email' => 'motorsightsfleet@gmail.com',
        ]);

        BarcodeRfidConfig::firstOrCreate(['code_prefix' => 'TYR'], [
            'code_length' => 12,
            'symbology' => 'code128',
            'auto_generate' => true,
        ]);

        $configs = [
            'default_currency' => 'IDR',
            'rotation_interval_km' => '10000',
            'inspection_interval_days' => '7',
            'tread_depth_replace_threshold_mm' => '4',
            'tread_depth_rotation_threshold_mm' => '8',
        ];

        foreach ($configs as $key => $value) {
            SystemConfiguration::firstOrCreate(['key' => $key], ['value' => $value, 'group' => 'general']);
        }
    }

    private function seedApprovalWorkflows(): void
    {
        $po = ApprovalWorkflow::firstOrCreate(
            ['code' => 'PO-APPROVAL'],
            ['name' => 'Purchase Order Approval', 'module' => 'procurement']
        );
        $po->steps()->firstOrCreate(['step_order' => 1], ['role_name' => 'Warehouse Staff', 'description' => 'Initial review']);
        $po->steps()->firstOrCreate(['step_order' => 2], ['role_name' => 'Fleet Manager', 'description' => 'Final approval']);

        $scrap = ApprovalWorkflow::firstOrCreate(
            ['code' => 'SCRAP-APPROVAL'],
            ['name' => 'Scrap Tyre Approval', 'module' => 'disposal']
        );
        $scrap->steps()->firstOrCreate(['step_order' => 1], ['role_name' => 'Inspector', 'description' => 'Propose scrap']);
        $scrap->steps()->firstOrCreate(['step_order' => 2], ['role_name' => 'Fleet Manager', 'description' => 'Approve scrap']);
    }
}
