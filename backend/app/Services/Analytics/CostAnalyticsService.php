<?php

namespace App\Services\Analytics;

use App\Models\Tyre;
use App\Models\TyreInstallation;
use App\Models\Vehicle;
use Illuminate\Support\Collection;

/**
 * Shared cost-per-km / cost-per-hour breakdown that powers every
 * "Cost per X" analytics and report screen (vehicle, fleet, site, project).
 */
class CostAnalyticsService
{
    /**
     * @return Collection<int, array{
     *     vehicle: Vehicle, total_cost: float, odometer_km: int, engine_hours: int,
     *     cost_per_km: float, cost_per_hour: float
     * }>
     */
    public function perVehicleBreakdown(?int $siteId = null, ?int $projectId = null): Collection
    {
        $vehicles = Vehicle::query()
            ->when($siteId, fn ($q) => $q->where('site_id', $siteId))
            ->when($projectId, fn ($q) => $q->where('project_id', $projectId))
            ->with(['site', 'project', 'vehicleCategory'])
            ->get();

        return $vehicles->map(function (Vehicle $vehicle) {
            $tyreIds = TyreInstallation::query()
                ->where('vehicle_id', $vehicle->id)
                ->distinct()
                ->pluck('tyre_id');

            $tyres = Tyre::query()->whereIn('id', $tyreIds)->with(['repairs', 'retreads'])->get();

            $totalCost = $tyres->sum(function (Tyre $tyre) {
                return (float) $tyre->cost
                    + $tyre->repairs->sum('cost')
                    + $tyre->retreads->sum('cost');
            });

            return [
                'vehicle' => $vehicle,
                'tyre_count' => $tyres->count(),
                'total_cost' => round($totalCost, 2),
                'odometer_km' => $vehicle->odometer_km,
                'engine_hours' => $vehicle->engine_hours,
                'cost_per_km' => $vehicle->odometer_km > 0 ? round($totalCost / $vehicle->odometer_km, 2) : 0,
                'cost_per_hour' => $vehicle->engine_hours > 0 ? round($totalCost / $vehicle->engine_hours, 2) : 0,
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function fleetSummary(Collection $breakdown): array
    {
        $totalCost = $breakdown->sum('total_cost');
        $totalKm = $breakdown->sum('odometer_km');
        $totalHours = $breakdown->sum('engine_hours');

        return [
            'total_cost' => round($totalCost, 2),
            'total_km' => $totalKm,
            'total_hours' => $totalHours,
            'cost_per_km' => $totalKm > 0 ? round($totalCost / $totalKm, 2) : 0,
            'cost_per_hour' => $totalHours > 0 ? round($totalCost / $totalHours, 2) : 0,
            'vehicle_count' => $breakdown->count(),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function groupBy(Collection $breakdown, string $relation, string $labelField = 'name'): Collection
    {
        return $breakdown
            ->groupBy(fn ($row) => $row['vehicle']->{$relation}?->id ?? 'unassigned')
            ->map(function (Collection $rows, $key) use ($relation, $labelField) {
                $label = $key === 'unassigned' ? 'Unassigned' : $rows->first()['vehicle']->{$relation}?->{$labelField};
                $summary = $this->fleetSummary($rows);

                return ['group' => $label, ...$summary];
            })
            ->values();
    }
}
