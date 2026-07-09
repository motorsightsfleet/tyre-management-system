<?php

namespace App\Services\Tyre;

use App\Models\StockMovement;
use App\Models\Tyre;
use App\Models\TyreInstallation;
use App\Models\TyreRotation;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Owns the tyre lifecycle state transitions (install / remove / rotate) as
 * atomic operations so a tyre's status, its current location, its open
 * tyre_installations row, and its tyre_events audit trail can never drift
 * out of sync with each other.
 */
class TyreLifecycleService
{
    private const INSTALLABLE_STATUSES = ['in_stock', 'retreaded'];

    public function install(Tyre $tyre, Vehicle $vehicle, int $tyrePositionId, ?User $actor, ?string $notes = null): TyreInstallation
    {
        return DB::transaction(function () use ($tyre, $vehicle, $tyrePositionId, $actor, $notes) {
            $tyre->refresh();

            if (! in_array($tyre->status, self::INSTALLABLE_STATUSES, true)) {
                throw ValidationException::withMessages([
                    'tyre_id' => ["Tyre {$tyre->serial_number} is not available to install (status: {$tyre->status})."],
                ]);
            }

            $this->assertPositionFree($vehicle->id, $tyrePositionId);

            $fromWarehouseId = $tyre->current_warehouse_id;

            $installation = TyreInstallation::create([
                'tyre_id' => $tyre->id,
                'vehicle_id' => $vehicle->id,
                'tyre_position_id' => $tyrePositionId,
                'installed_by' => $actor?->id,
                'installed_at' => now(),
                'odometer_km_at_install' => $vehicle->odometer_km,
                'engine_hours_at_install' => $vehicle->engine_hours,
                'notes' => $notes,
            ]);

            $tyre->update([
                'status' => 'installed',
                'current_vehicle_id' => $vehicle->id,
                'current_tyre_position_id' => $tyrePositionId,
                'current_warehouse_id' => null,
            ]);

            StockMovement::create([
                'tyre_id' => $tyre->id,
                'movement_type' => 'install',
                'from_warehouse_id' => $fromWarehouseId,
                'vehicle_id' => $vehicle->id,
                'user_id' => $actor?->id,
                'moved_at' => now(),
                'notes' => "Installed on {$vehicle->code}",
            ]);

            $tyre->events()->create([
                'event_type' => 'installed',
                'event_date' => now(),
                'ref_type' => TyreInstallation::class,
                'ref_id' => $installation->id,
                'user_id' => $actor?->id,
                'notes' => $notes,
            ]);

            return $installation;
        });
    }

    public function remove(Tyre $tyre, int $warehouseId, ?int $removalReasonId, ?User $actor, ?string $notes = null): TyreInstallation
    {
        return DB::transaction(function () use ($tyre, $warehouseId, $removalReasonId, $actor, $notes) {
            $tyre->refresh();
            $installation = $this->activeInstallation($tyre->id);

            if (! $installation) {
                throw ValidationException::withMessages([
                    'tyre_id' => ["Tyre {$tyre->serial_number} is not currently installed."],
                ]);
            }

            $vehicle = $installation->vehicle;

            $installation->update([
                'removed_at' => now(),
                'removed_by' => $actor?->id,
                'odometer_km_at_removal' => $vehicle->odometer_km,
                'engine_hours_at_removal' => $vehicle->engine_hours,
                'removal_reason_id' => $removalReasonId,
                'notes' => $notes ?? $installation->notes,
            ]);

            $tyre->update([
                'status' => 'in_stock',
                'current_vehicle_id' => null,
                'current_tyre_position_id' => null,
                'current_warehouse_id' => $warehouseId,
            ]);

            StockMovement::create([
                'tyre_id' => $tyre->id,
                'movement_type' => 'remove',
                'to_warehouse_id' => $warehouseId,
                'vehicle_id' => $vehicle->id,
                'user_id' => $actor?->id,
                'moved_at' => now(),
                'notes' => $notes,
            ]);

            $tyre->events()->create([
                'event_type' => 'removed',
                'event_date' => now(),
                'ref_type' => TyreInstallation::class,
                'ref_id' => $installation->id,
                'user_id' => $actor?->id,
                'notes' => $notes,
            ]);

            return $installation->fresh();
        });
    }

    /**
     * Atomically re-position N currently-installed tyres. Powers Rotation,
     * Change Position, and drag-and-drop swap in the interactive axle view —
     * a swap is simply two moves that target each other's original position.
     *
     * @param  array<int, array{tyre_id: int, vehicle_id: int, tyre_position_id: int}>  $moves
     */
    public function rotate(array $moves, ?User $actor, ?string $notes = null): TyreRotation
    {
        if (count($moves) < 1) {
            throw ValidationException::withMessages(['moves' => ['At least one move is required.']]);
        }

        return DB::transaction(function () use ($moves, $actor, $notes) {
            $rotation = TyreRotation::create([
                'vehicle_id' => $moves[0]['vehicle_id'],
                'performed_by' => $actor?->id,
                'rotation_date' => now(),
                'notes' => $notes,
            ]);
            $rotation->update(['code' => 'ROT-'.str_pad((string) $rotation->id, 6, '0', STR_PAD_LEFT)]);

            // Free every source position first so a same-vehicle position swap
            // doesn't collide with itself mid-transaction.
            $installations = [];
            foreach ($moves as $move) {
                $tyre = Tyre::query()->findOrFail($move['tyre_id']);
                $installation = $this->activeInstallation($tyre->id);

                if (! $installation) {
                    throw ValidationException::withMessages([
                        'tyre_id' => ["Tyre {$tyre->serial_number} is not currently installed."],
                    ]);
                }

                $installation->update([
                    'removed_at' => now(),
                    'removed_by' => $actor?->id,
                    'odometer_km_at_removal' => $installation->vehicle->odometer_km,
                    'engine_hours_at_removal' => $installation->vehicle->engine_hours,
                    'tyre_rotation_id' => $rotation->id,
                ]);

                $installations[] = ['tyre' => $tyre, 'move' => $move];
            }

            foreach ($installations as ['tyre' => $tyre, 'move' => $move]) {
                $vehicle = Vehicle::query()->findOrFail($move['vehicle_id']);
                $this->assertPositionFree($vehicle->id, $move['tyre_position_id']);

                $newInstallation = TyreInstallation::create([
                    'tyre_id' => $tyre->id,
                    'vehicle_id' => $vehicle->id,
                    'tyre_position_id' => $move['tyre_position_id'],
                    'installed_by' => $actor?->id,
                    'installed_at' => now(),
                    'odometer_km_at_install' => $vehicle->odometer_km,
                    'engine_hours_at_install' => $vehicle->engine_hours,
                    'tyre_rotation_id' => $rotation->id,
                    'notes' => $notes,
                ]);

                $tyre->update([
                    'current_vehicle_id' => $vehicle->id,
                    'current_tyre_position_id' => $move['tyre_position_id'],
                ]);

                StockMovement::create([
                    'tyre_id' => $tyre->id,
                    'movement_type' => 'rotate',
                    'vehicle_id' => $vehicle->id,
                    'user_id' => $actor?->id,
                    'moved_at' => now(),
                    'notes' => "Rotated via {$rotation->code}",
                ]);

                $tyre->events()->create([
                    'event_type' => 'rotated',
                    'event_date' => now(),
                    'ref_type' => TyreInstallation::class,
                    'ref_id' => $newInstallation->id,
                    'user_id' => $actor?->id,
                    'notes' => $notes,
                ]);
            }

            return $rotation->fresh('installations');
        });
    }

    private function activeInstallation(int $tyreId): ?TyreInstallation
    {
        return TyreInstallation::query()
            ->where('tyre_id', $tyreId)
            ->whereNull('removed_at')
            ->latest('installed_at')
            ->first();
    }

    private function assertPositionFree(int $vehicleId, int $tyrePositionId): void
    {
        $occupied = TyreInstallation::query()
            ->where('vehicle_id', $vehicleId)
            ->where('tyre_position_id', $tyrePositionId)
            ->whereNull('removed_at')
            ->exists();

        if ($occupied) {
            throw ValidationException::withMessages([
                'tyre_position_id' => ['That position is already occupied. Remove or rotate the existing tyre first.'],
            ]);
        }
    }
}
