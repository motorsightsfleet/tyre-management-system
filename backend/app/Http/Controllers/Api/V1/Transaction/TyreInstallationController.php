<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\Tyre;
use App\Models\Vehicle;
use App\Services\Tyre\TyreHealthService;
use App\Services\Tyre\TyreLifecycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TyreInstallationController extends Controller
{
    public function __construct(
        private readonly TyreLifecycleService $lifecycle,
        private readonly TyreHealthService $health,
    ) {}

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
                    'health_status' => $this->health->statusFor($tyre),
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
