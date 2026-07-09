<?php

namespace App\Http\Controllers\Api\V1\Analytics;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use App\Models\ScrapRecord;
use App\Models\Tyre;
use App\Models\TyreInstallation;
use App\Services\Analytics\CostAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function __construct(private readonly CostAnalyticsService $cost) {}

    public function costPerKm(Request $request): JsonResponse
    {
        $breakdown = $this->cost->perVehicleBreakdown($request->integer('site_id') ?: null, $request->integer('project_id') ?: null);

        return response()->json([
            'data' => [
                'summary' => $this->cost->fleetSummary($breakdown),
                'by_vehicle' => $breakdown->sortByDesc('cost_per_km')->values(),
            ],
        ]);
    }

    public function costPerHour(Request $request): JsonResponse
    {
        $breakdown = $this->cost->perVehicleBreakdown($request->integer('site_id') ?: null, $request->integer('project_id') ?: null);

        return response()->json([
            'data' => [
                'summary' => $this->cost->fleetSummary($breakdown),
                'by_vehicle' => $breakdown->sortByDesc('cost_per_hour')->values(),
            ],
        ]);
    }

    public function costPerVehicle(Request $request): JsonResponse
    {
        $breakdown = $this->cost->perVehicleBreakdown($request->integer('site_id') ?: null, $request->integer('project_id') ?: null);

        return response()->json(['data' => $breakdown->sortByDesc('total_cost')->values()]);
    }

    public function costPerFleet(): JsonResponse
    {
        $breakdown = $this->cost->perVehicleBreakdown();

        return response()->json(['data' => $this->cost->fleetSummary($breakdown)]);
    }

    public function costPerSite(): JsonResponse
    {
        $breakdown = $this->cost->perVehicleBreakdown();

        return response()->json(['data' => $this->cost->groupBy($breakdown, 'site')]);
    }

    public function costPerProject(): JsonResponse
    {
        $breakdown = $this->cost->perVehicleBreakdown();

        return response()->json(['data' => $this->cost->groupBy($breakdown, 'project')]);
    }

    public function brandPerformance(): JsonResponse
    {
        $rows = DB::table('tyres')
            ->join('tyre_brands', 'tyres.tyre_brand_id', '=', 'tyre_brands.id')
            ->selectRaw('tyre_brands.name as brand, count(*) as tyre_count, avg(tyres.cost) as avg_cost, sum(case when tyres.status = \'scrapped\' then 1 else 0 end) as scrapped_count')
            ->groupBy('tyre_brands.name')
            ->get()
            ->map(fn ($row) => [
                'brand' => $row->brand,
                'tyre_count' => (int) $row->tyre_count,
                'avg_cost' => round((float) $row->avg_cost, 2),
                'scrapped_count' => (int) $row->scrapped_count,
                'avg_lifetime_km' => $this->averageLifetimeKmForBrand($row->brand),
            ]);

        return response()->json(['data' => $rows]);
    }

    public function patternPerformance(): JsonResponse
    {
        $rows = DB::table('tyres')
            ->join('tyre_patterns', 'tyres.tyre_pattern_id', '=', 'tyre_patterns.id')
            ->selectRaw('tyre_patterns.name as pattern, count(*) as tyre_count, avg(tyres.cost) as avg_cost, sum(case when tyres.status = \'scrapped\' then 1 else 0 end) as scrapped_count')
            ->groupBy('tyre_patterns.name')
            ->get()
            ->map(fn ($row) => [
                'pattern' => $row->pattern,
                'tyre_count' => (int) $row->tyre_count,
                'avg_cost' => round((float) $row->avg_cost, 2),
                'scrapped_count' => (int) $row->scrapped_count,
            ]);

        return response()->json(['data' => $rows]);
    }

    public function tyreLifetime(): JsonResponse
    {
        $closed = TyreInstallation::query()->whereNotNull('removed_at')->get();

        $kmValues = $closed->map(fn ($i) => max(0, $i->odometer_km_at_removal - $i->odometer_km_at_install));
        $hourValues = $closed->map(fn ($i) => max(0, $i->engine_hours_at_removal - $i->engine_hours_at_install));

        return response()->json([
            'data' => [
                'sample_size' => $closed->count(),
                'avg_lifetime_km' => $closed->isEmpty() ? 0 : round($kmValues->avg(), 0),
                'avg_lifetime_hours' => $closed->isEmpty() ? 0 : round($hourValues->avg(), 0),
                'max_lifetime_km' => $kmValues->max() ?? 0,
                'min_lifetime_km' => $kmValues->min() ?? 0,
            ],
        ]);
    }

    public function tyreUtilization(): JsonResponse
    {
        $byStatus = Tyre::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $installed = $byStatus->get('installed', 0);
        $inStock = $byStatus->get('in_stock', 0);
        $total = $byStatus->sum();

        return response()->json([
            'data' => [
                'by_status' => $byStatus,
                'total_tyres' => $total,
                'utilization_rate' => ($installed + $inStock) > 0 ? round($installed / ($installed + $inStock) * 100, 1) : 0,
            ],
        ]);
    }

    public function failureAnalysis(): JsonResponse
    {
        $rows = Inspection::query()
            ->whereNotNull('failure_code_id')
            ->join('failure_codes', 'inspections.failure_code_id', '=', 'failure_codes.id')
            ->selectRaw('failure_codes.name as failure_code, count(*) as total')
            ->groupBy('failure_codes.name')
            ->orderByDesc('total')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function damageAnalysis(): JsonResponse
    {
        $rows = Inspection::query()
            ->whereNotNull('damage_type_id')
            ->join('damage_types', 'inspections.damage_type_id', '=', 'damage_types.id')
            ->selectRaw('damage_types.name as damage_type, count(*) as total')
            ->groupBy('damage_types.name')
            ->orderByDesc('total')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function scrapAnalysis(): JsonResponse
    {
        $rows = ScrapRecord::query()
            ->join('scrap_reasons', 'scrap_records.scrap_reason_id', '=', 'scrap_reasons.id')
            ->join('tyres', 'scrap_records.tyre_id', '=', 'tyres.id')
            ->selectRaw('scrap_reasons.name as scrap_reason, count(*) as total, sum(tyres.cost) as total_cost_written_off')
            ->groupBy('scrap_reasons.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'scrap_reason' => $row->scrap_reason,
                'total' => (int) $row->total,
                'total_cost_written_off' => round((float) $row->total_cost_written_off, 2),
            ]);

        return response()->json(['data' => $rows]);
    }

    private function averageLifetimeKmForBrand(string $brand): float
    {
        $tyreIds = Tyre::query()
            ->whereHas('tyreBrand', fn ($q) => $q->where('name', $brand))
            ->pluck('id');

        $closed = TyreInstallation::query()->whereIn('tyre_id', $tyreIds)->whereNotNull('removed_at')->get();

        if ($closed->isEmpty()) {
            return 0;
        }

        return round($closed->avg(fn ($i) => max(0, $i->odometer_km_at_removal - $i->odometer_km_at_install)), 0);
    }
}
