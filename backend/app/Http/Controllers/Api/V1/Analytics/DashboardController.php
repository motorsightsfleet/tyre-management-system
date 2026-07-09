<?php

namespace App\Http\Controllers\Api\V1\Analytics;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use App\Models\PurchaseOrder;
use App\Models\Tyre;
use App\Models\TyreInstallation;
use App\Models\Vehicle;
use App\Services\Analytics\CostAnalyticsService;
use App\Services\Tyre\TyreHealthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(
        private readonly CostAnalyticsService $cost,
        private readonly TyreHealthService $health,
    ) {}

    public function kpis(): JsonResponse
    {
        $breakdown = $this->cost->perVehicleBreakdown();
        $fleetSummary = $this->cost->fleetSummary($breakdown);

        $byStatus = Tyre::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $closedInstallations = TyreInstallation::query()->whereNotNull('removed_at')->get();
        $avgLifetimeKm = $closedInstallations->isEmpty() ? 0 : round(
            $closedInstallations->avg(fn ($i) => max(0, $i->odometer_km_at_removal - $i->odometer_km_at_install)), 0
        );

        $monthlyCostTrend = TyreInstallation::query()
            ->selectRaw("to_char(installed_at, 'YYYY-MM') as month, count(*) as installs")
            ->groupBy('month')->orderBy('month')->get();

        $brandComparison = DB::table('tyres')
            ->join('tyre_brands', 'tyres.tyre_brand_id', '=', 'tyre_brands.id')
            ->selectRaw('tyre_brands.name as brand, count(*) as total')
            ->groupBy('tyre_brands.name')->get();

        $patternComparison = DB::table('tyres')
            ->join('tyre_patterns', 'tyres.tyre_pattern_id', '=', 'tyre_patterns.id')
            ->selectRaw('tyre_patterns.name as pattern, count(*) as total')
            ->groupBy('tyre_patterns.name')->get();

        $failureAnalysis = Inspection::query()
            ->whereNotNull('failure_code_id')
            ->join('failure_codes', 'inspections.failure_code_id', '=', 'failure_codes.id')
            ->selectRaw('failure_codes.name as failure_code, count(*) as total')
            ->groupBy('failure_codes.name')->get();

        $topCostVehicles = $breakdown->sortByDesc('total_cost')->take(5)->map(fn ($row) => [
            'vehicle' => $row['vehicle']->code,
            'total_cost' => $row['total_cost'],
        ])->values();

        return response()->json(['data' => [
            'kpis' => [
                'total_vehicles' => Vehicle::count(),
                'total_tyres' => Tyre::count(),
                'installed_tyres' => $byStatus->get('installed', 0),
                'warehouse_stock' => $byStatus->get('in_stock', 0),
                'scrap_tyres' => $byStatus->get('scrapped', 0),
                'average_tyre_lifetime_km' => $avgLifetimeKm,
                'cost_per_km' => $fleetSummary['cost_per_km'],
                'cost_per_hour' => $fleetSummary['cost_per_hour'],
                'upcoming_inspections' => Inspection::query()->where('inspected_at', '<', now()->subDays(7))->count(),
                'upcoming_rotations' => TyreInstallation::query()->whereNull('removed_at')
                    ->where('installed_at', '<', now()->subDays(90))->count(),
                'monthly_tyre_cost' => $fleetSummary['total_cost'],
            ],
            'charts' => [
                'tyre_lifecycle' => $byStatus,
                'monthly_cost_trend' => $monthlyCostTrend,
                'brand_comparison' => $brandComparison,
                'pattern_comparison' => $patternComparison,
                'failure_analysis' => $failureAnalysis,
                'tyre_utilization' => $byStatus,
            ],
            'top_cost_vehicles' => $topCostVehicles,
        ]]);
    }

    public function fleetOverview(): JsonResponse
    {
        $byCategory = DB::table('vehicles')
            ->join('vehicle_categories', 'vehicles.vehicle_category_id', '=', 'vehicle_categories.id')
            ->selectRaw('vehicle_categories.name as category, count(*) as total')
            ->groupBy('vehicle_categories.name')->get();

        $byStatus = Vehicle::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        $bySite = DB::table('vehicles')
            ->join('sites', 'vehicles.site_id', '=', 'sites.id')
            ->selectRaw('sites.name as site, count(*) as total')
            ->groupBy('sites.name')->get();

        $tyresPerVehicle = Vehicle::query()->withCount('currentTyres')->get()
            ->map(fn ($v) => [
                'vehicle' => $v->code,
                'category' => $v->vehicleCategory?->name,
                'status' => $v->status,
                'odometer_km' => $v->odometer_km,
                'engine_hours' => $v->engine_hours,
                'tyre_count' => $v->current_tyres_count,
            ]);

        return response()->json(['data' => [
            'total_vehicles' => Vehicle::count(),
            'by_category' => $byCategory,
            'by_status' => $byStatus,
            'by_site' => $bySite,
            'avg_odometer_km' => round((float) Vehicle::query()->avg('odometer_km'), 0),
            'avg_engine_hours' => round((float) Vehicle::query()->avg('engine_hours'), 0),
            'vehicles' => $tyresPerVehicle->values(),
        ]]);
    }

    public function tyreHealth(): JsonResponse
    {
        $installed = Tyre::with(['tyreBrand', 'currentVehicle'])->where('status', 'installed')->get();

        $distribution = ['healthy' => 0, 'inspection_due' => 0, 'rotation_due' => 0, 'replace' => 0, 'scrapped' => 0];
        $atRisk = [];

        foreach ($installed as $tyre) {
            $status = $this->health->statusFor($tyre);
            $distribution[$status] = ($distribution[$status] ?? 0) + 1;

            if (in_array($status, ['replace', 'rotation_due', 'inspection_due'], true)) {
                $atRisk[] = [
                    'tyre_id' => $tyre->id,
                    'serial_number' => $tyre->serial_number,
                    'brand' => $tyre->tyreBrand?->name,
                    'vehicle' => $tyre->currentVehicle?->code,
                    'health_status' => $status,
                ];
            }
        }

        return response()->json(['data' => [
            'total_installed' => $installed->count(),
            'distribution' => $distribution,
            'at_risk' => collect($atRisk)->sortBy(fn ($r) => match ($r['health_status']) {
                'replace' => 0, 'rotation_due' => 1, default => 2,
            })->take(50)->values(),
        ]]);
    }

    public function upcomingActivities(): JsonResponse
    {
        $installed = Tyre::with(['currentVehicle'])->where('status', 'installed')->get();
        $activities = [];

        foreach ($installed as $tyre) {
            $status = $this->health->statusFor($tyre);
            $lastInspection = $tyre->inspections()->latest('inspected_at')->first();

            if ($status === 'replace') {
                $activities[] = [
                    'type' => 'replacement', 'severity' => 'high',
                    'title' => "Replace tyre {$tyre->serial_number}",
                    'subtitle' => "Vehicle {$tyre->currentVehicle?->code} · tread depth critical",
                    'date' => $lastInspection?->inspected_at,
                ];
            } elseif ($status === 'rotation_due') {
                $activities[] = [
                    'type' => 'rotation', 'severity' => 'medium',
                    'title' => "Rotation due for {$tyre->serial_number}",
                    'subtitle' => "Vehicle {$tyre->currentVehicle?->code}",
                    'date' => $lastInspection?->inspected_at,
                ];
            } elseif ($status === 'inspection_due') {
                $activities[] = [
                    'type' => 'inspection', 'severity' => 'low',
                    'title' => "Inspection overdue for {$tyre->serial_number}",
                    'subtitle' => "Vehicle {$tyre->currentVehicle?->code}",
                    'date' => $lastInspection?->inspected_at,
                ];
            }
        }

        $pendingOrders = PurchaseOrder::with('supplier')
            ->whereIn('status', ['submitted', 'approved', 'partially_received'])
            ->get()
            ->map(fn ($po) => [
                'type' => 'purchase_order', 'severity' => 'low',
                'title' => "PO {$po->code} awaiting receipt",
                'subtitle' => "Supplier {$po->supplier?->name} · expected ".($po->expected_date ?? '—'),
                'date' => $po->expected_date,
            ]);

        $activities = collect($activities)->merge($pendingOrders)
            ->sortBy(fn ($a) => match ($a['severity']) {
                'high' => 0, 'medium' => 1, default => 2
            })
            ->take(100)->values();

        return response()->json(['data' => $activities]);
    }
}
