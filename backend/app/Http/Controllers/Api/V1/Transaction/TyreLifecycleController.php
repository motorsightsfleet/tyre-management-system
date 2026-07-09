<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\Tyre;
use Illuminate\Http\JsonResponse;

class TyreLifecycleController extends Controller
{
    public function history(int $tyreId): JsonResponse
    {
        $tyre = Tyre::with([
            'tyreBrand', 'tyrePattern', 'tyreSize', 'tyreType', 'supplier',
            'currentVehicle', 'currentTyrePosition', 'currentWarehouse',
            'installations.vehicle', 'installations.tyrePosition', 'installations.removalReason',
            'inspections.tyrePosition', 'inspections.inspectedBy',
            'repairs.repairType', 'repairs.vendor',
            'retreads.retreadVendor',
            'warrantyClaims.supplier',
            'scrapRecord.scrapReason',
            'lostRecord',
        ])->findOrFail($tyreId);

        return response()->json(['data' => $tyre]);
    }

    public function timeline(int $tyreId): JsonResponse
    {
        $tyre = Tyre::findOrFail($tyreId);

        $events = $tyre->events()
            ->with('user:id,name')
            ->orderByDesc('event_date')
            ->get()
            ->map(fn ($event) => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'event_date' => $event->event_date,
                'user' => $event->user?->name,
                'notes' => $event->notes,
                'reference' => $event->reference(),
            ]);

        return response()->json(['data' => $events]);
    }
}
