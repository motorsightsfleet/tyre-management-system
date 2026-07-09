<?php

namespace App\Http\Controllers\Api\V1\Reports;

use App\Exports\GenericArrayExport;
use App\Http\Controllers\Controller;
use App\Models\GoodsReceipt;
use App\Models\Inspection;
use App\Models\PurchaseOrder;
use App\Models\Repair;
use App\Models\Retread;
use App\Models\ScrapRecord;
use App\Models\Tyre;
use App\Models\TyreInstallation;
use App\Models\TyreRotation;
use App\Services\Analytics\CostAnalyticsService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    /** @var array<string, string> */
    private const REPORTS = [
        'inventory' => 'Inventory Report',
        'purchase' => 'Purchase Report',
        'installation' => 'Installation Report',
        'removal' => 'Removal Report',
        'rotation' => 'Rotation Report',
        'inspection' => 'Inspection Report',
        'repair' => 'Repair Report',
        'retread' => 'Retread Report',
        'scrap' => 'Scrap Report',
        'lifecycle' => 'Tyre Lifecycle Report',
        'cost-per-km' => 'Cost per KM Report',
        'cost-per-hour' => 'Cost per Hour Report',
        'cost-per-vehicle' => 'Cost per Vehicle Report',
        'brand-comparison' => 'Brand Comparison',
    ];

    public function __construct(private readonly CostAnalyticsService $cost) {}

    public function show(string $key, Request $request): \Illuminate\Http\JsonResponse
    {
        [$title, $headings, $rows] = $this->resolve($key, $request);

        return response()->json(['data' => ['title' => $title, 'headings' => $headings, 'rows' => $rows]]);
    }

    public function export(string $key, Request $request): Response
    {
        [$title, $headings, $rows] = $this->resolve($key, $request);
        $format = $request->input('format', 'xlsx');
        $filename = $key.'-'.now()->format('Ymd-His');

        if ($format === 'pdf') {
            return Pdf::loadView('reports.generic', compact('title', 'headings', 'rows'))->download("{$filename}.pdf");
        }

        return Excel::download(new GenericArrayExport($rows, $headings, $title), "{$filename}.xlsx");
    }

    /**
     * @return array{0: string, 1: array<int, string>, 2: array<int, array<string, mixed>>}
     */
    private function resolve(string $key, Request $request): array
    {
        if (! array_key_exists($key, self::REPORTS)) {
            throw ValidationException::withMessages(['key' => ["Unknown report: {$key}"]]);
        }

        $title = self::REPORTS[$key];

        $rows = match ($key) {
            'inventory' => Tyre::with(['tyreBrand', 'tyreSize', 'currentWarehouse'])->where('status', 'in_stock')->get()
                ->map(fn ($t) => [
                    'Serial Number' => $t->serial_number,
                    'Brand' => $t->tyreBrand?->name,
                    'Size' => $t->tyreSize?->code,
                    'Warehouse' => $t->currentWarehouse?->name,
                    'Cost' => (float) $t->cost,
                ])->all(),

            'purchase' => PurchaseOrder::with('supplier')->get()->map(fn ($po) => [
                'Code' => $po->code,
                'Supplier' => $po->supplier?->name,
                'Status' => $po->status,
                'Order Date' => (string) $po->order_date,
                'Total Amount' => (float) $po->total_amount,
            ])->all(),

            'installation' => TyreInstallation::with(['tyre', 'vehicle', 'tyrePosition'])->whereNull('removed_at')->get()
                ->map(fn ($i) => [
                    'Tyre Serial' => $i->tyre?->serial_number,
                    'Vehicle' => $i->vehicle?->code,
                    'Position' => $i->tyrePosition?->code,
                    'Installed At' => (string) $i->installed_at,
                    'Odometer at Install' => $i->odometer_km_at_install,
                ])->all(),

            'removal' => TyreInstallation::with(['tyre', 'vehicle', 'tyrePosition', 'removalReason'])->whereNotNull('removed_at')->get()
                ->map(fn ($i) => [
                    'Tyre Serial' => $i->tyre?->serial_number,
                    'Vehicle' => $i->vehicle?->code,
                    'Position' => $i->tyrePosition?->code,
                    'Removed At' => (string) $i->removed_at,
                    'Reason' => $i->removalReason?->name,
                    'KM Run' => max(0, $i->odometer_km_at_removal - $i->odometer_km_at_install),
                ])->all(),

            'rotation' => TyreRotation::with('vehicle')->get()->map(fn ($r) => [
                'Code' => $r->code,
                'Vehicle' => $r->vehicle?->code,
                'Date' => (string) $r->rotation_date,
                'Notes' => $r->notes,
            ])->all(),

            'inspection' => Inspection::with(['tyre', 'vehicle', 'inspectedBy'])->latest('inspected_at')->limit(500)->get()
                ->map(fn ($i) => [
                    'Tyre Serial' => $i->tyre?->serial_number,
                    'Vehicle' => $i->vehicle?->code,
                    'Type' => $i->type,
                    'Tread Depth (mm)' => $i->tread_depth_mm,
                    'Pressure (psi)' => $i->pressure_psi,
                    'Inspected At' => (string) $i->inspected_at,
                    'Inspector' => $i->inspectedBy?->name,
                ])->all(),

            'repair' => Repair::with(['tyre', 'repairType', 'vendor'])->get()->map(fn ($r) => [
                'Tyre Serial' => $r->tyre?->serial_number,
                'Repair Type' => $r->repairType?->name,
                'Vendor' => $r->vendor?->name,
                'Cost' => (float) $r->cost,
                'Repair Date' => (string) $r->repair_date,
            ])->all(),

            'retread' => Retread::with(['tyre', 'retreadVendor'])->get()->map(fn ($r) => [
                'Tyre Serial' => $r->tyre?->serial_number,
                'Vendor' => $r->retreadVendor?->name,
                'Cost' => (float) $r->cost,
                'Sent Date' => (string) $r->sent_date,
                'Received Date' => (string) $r->received_date,
            ])->all(),

            'scrap' => ScrapRecord::with(['tyre', 'scrapReason'])->get()->map(fn ($s) => [
                'Tyre Serial' => $s->tyre?->serial_number,
                'Reason' => $s->scrapReason?->name,
                'Scrap Date' => (string) $s->scrap_date,
                'Final Tread (mm)' => $s->final_tread_depth_mm,
                'Tyre Cost Written Off' => (float) ($s->tyre?->cost ?? 0),
            ])->all(),

            'lifecycle' => Tyre::with(['tyreBrand', 'currentVehicle'])->get()->map(fn ($t) => [
                'Serial Number' => $t->serial_number,
                'Brand' => $t->tyreBrand?->name,
                'Status' => $t->status,
                'Current Vehicle' => $t->currentVehicle?->code,
                'Retread Count' => $t->retread_count,
                'Cost' => (float) $t->cost,
            ])->all(),

            'cost-per-km' => $this->cost->perVehicleBreakdown()->map(fn ($row) => [
                'Vehicle' => $row['vehicle']->code,
                'Total Cost' => $row['total_cost'],
                'Odometer (km)' => $row['odometer_km'],
                'Cost per KM' => $row['cost_per_km'],
            ])->all(),

            'cost-per-hour' => $this->cost->perVehicleBreakdown()->map(fn ($row) => [
                'Vehicle' => $row['vehicle']->code,
                'Total Cost' => $row['total_cost'],
                'Engine Hours' => $row['engine_hours'],
                'Cost per Hour' => $row['cost_per_hour'],
            ])->all(),

            'cost-per-vehicle' => $this->cost->perVehicleBreakdown()->map(fn ($row) => [
                'Vehicle' => $row['vehicle']->code,
                'Tyre Count' => $row['tyre_count'],
                'Total Cost' => $row['total_cost'],
            ])->all(),

            'brand-comparison' => Tyre::query()
                ->join('tyre_brands', 'tyres.tyre_brand_id', '=', 'tyre_brands.id')
                ->selectRaw('tyre_brands.name as brand, count(*) as tyre_count, avg(tyres.cost) as avg_cost')
                ->groupBy('tyre_brands.name')
                ->get()
                ->map(fn ($row) => [
                    'Brand' => $row->brand,
                    'Tyre Count' => (int) $row->tyre_count,
                    'Avg Cost' => round((float) $row->avg_cost, 2),
                ])->all(),

            default => [],
        };

        $headings = $rows === [] ? [] : array_keys($rows[0]);

        return [$title, $headings, $rows];
    }
}
