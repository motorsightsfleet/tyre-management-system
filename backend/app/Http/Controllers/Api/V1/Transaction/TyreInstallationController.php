<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\Tyre;
use App\Models\Vehicle;
use App\Services\Tyre\TyreLifecycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TyreInstallationController extends Controller
{
    public function __construct(private readonly TyreLifecycleService $lifecycle) {}

    public function axleView(int $vehicleId): JsonResponse
    {
        $vehicle = Vehicle::with(['axleConfiguration', 'vehicleModel', 'vehicleCategory'])->findOrFail($vehicleId);

        $tyres = Tyre::with(['tyreBrand', 'tyrePattern', 'tyreSize'])
            ->where('current_vehicle_id', $vehicle->id)
            ->get()
            ->keyBy('current_tyre_position_id');

        $positions = collect($vehicle->axleConfiguration->layout)->map(function (array $position) use ($tyres) {
            $tyre = $tyres->get($position['tyre_position_id']);

            return [
                ...$position,
                'tyre' => $tyre ? [
                    'id' => $tyre->id,
                    'serial_number' => $tyre->serial_number,
                    'barcode_code' => $tyre->barcode_code,
                    'brand' => $tyre->tyreBrand?->name,
                    'pattern' => $tyre->tyrePattern?->name,
                    'size' => $tyre->tyreSize?->code,
                    'status' => $tyre->status,
                    'health_status' => $this->healthStatus($tyre),
                ] : null,
            ];
        });

        return response()->json([
            'data' => [
                'vehicle' => $vehicle,
                'positions' => $positions,
            ],
        ]);
    }

    private function healthStatus(Tyre $tyre): string
    {
        $lastInspection = $tyre->inspections()->latest('inspected_at')->first();

        if ($tyre->status === 'scrapped') {
            return 'scrapped';
        }

        if ($lastInspection?->tread_depth_mm !== null) {
            if ($lastInspection->tread_depth_mm <= 4) {
                return 'replace';
            }
            if ($lastInspection->tread_depth_mm <= 8) {
                return 'rotation_due';
            }
        }

        if (! $lastInspection || $lastInspection->inspected_at->lt(now()->subDays(7))) {
            return 'inspection_due';
        }

        return 'healthy';
    }

    public function install(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tyre_id' => ['required', 'exists:tyres,id'],
            'vehicle_id' => ['required', 'exists:vehicles,id'],
            'tyre_position_id' => ['required', 'exists:tyre_positions,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $tyre = Tyre::findOrFail($data['tyre_id']);
        $vehicle = Vehicle::findOrFail($data['vehicle_id']);

        $installation = $this->lifecycle->install(
            $tyre, $vehicle, $data['tyre_position_id'], $request->user(), $data['notes'] ?? null
        );

        return response()->json(['data' => $installation->load('tyre', 'vehicle', 'tyrePosition')], 201);
    }

    public function remove(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tyre_id' => ['required', 'exists:tyres,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'removal_reason_id' => ['nullable', 'exists:removal_reasons,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $tyre = Tyre::findOrFail($data['tyre_id']);

        $installation = $this->lifecycle->remove(
            $tyre, $data['warehouse_id'], $data['removal_reason_id'] ?? null, $request->user(), $data['notes'] ?? null
        );

        return response()->json(['data' => $installation->load('tyre', 'vehicle', 'tyrePosition')]);
    }

    public function rotate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'moves' => ['required', 'array', 'min:1'],
            'moves.*.tyre_id' => ['required', 'exists:tyres,id'],
            'moves.*.vehicle_id' => ['required', 'exists:vehicles,id'],
            'moves.*.tyre_position_id' => ['required', 'exists:tyre_positions,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $rotation = $this->lifecycle->rotate($data['moves'], $request->user(), $data['notes'] ?? null);

        return response()->json(['data' => $rotation], 201);
    }
}
