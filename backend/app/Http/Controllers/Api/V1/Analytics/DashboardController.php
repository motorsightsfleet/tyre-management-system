<?php

namespace App\Http\Controllers\Api\V1\Analytics;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use App\Models\Tyre;
use App\Models\TyreInstallation;
use App\Models\Vehicle;
use App\Services\Analytics\CostAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(private readonly CostAnalyticsService $cost) {}

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
}
