<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use App\Models\StockTransfer;
use App\Models\Tyre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockTransferController extends Controller
{
    private const RELATIONS = ['fromWarehouse', 'toWarehouse', 'requestedBy', 'items.tyre'];

    public function index(Request $request): JsonResponse
    {
        $query = StockTransfer::query()->with(['fromWarehouse', 'toWarehouse', 'requestedBy']);

        foreach (['status', 'from_warehouse_id', 'to_warehouse_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->latest('transfer_date')->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(), 'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => StockTransfer::with(self::RELATIONS)->findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from_warehouse_id' => ['required', 'exists:warehouses,id', 'different:to_warehouse_id'],
            'to_warehouse_id' => ['required', 'exists:warehouses,id'],
            'transfer_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'tyre_ids' => ['required', 'array', 'min:1'],
            'tyre_ids.*' => ['required', 'exists:tyres,id'],
        ]);

        $transfer = DB::transaction(function () use ($data, $request) {
            $transfer = StockTransfer::create([
                'code' => 'TRF-'.now()->format('Y').'-'.str_pad((string) (StockTransfer::whereYear('created_at', now()->year)->count() + 1), 4, '0', STR_PAD_LEFT),
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id' => $data['to_warehouse_id'],
                'requested_by' => $request->user()->id,
                'status' => 'completed',
                'transfer_date' => $data['transfer_date'],
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['tyre_ids'] as $tyreId) {
                $tyre = Tyre::findOrFail($tyreId);

                if ($tyre->status !== 'in_stock' || $tyre->current_warehouse_id !== $data['from_warehouse_id']) {
                    throw ValidationException::withMessages([
                        'tyre_ids' => ["Tyre {$tyre->serial_number} is not in stock at the source warehouse."],
                    ]);
                }

                $transfer->items()->create(['tyre_id' => $tyre->id]);
                $tyre->update(['current_warehouse_id' => $data['to_warehouse_id']]);

                StockMovement::create([
                    'tyre_id' => $tyre->id,
                    'movement_type' => 'transfer',
                    'from_warehouse_id' => $data['from_warehouse_id'],
                    'to_warehouse_id' => $data['to_warehouse_id'],
                    'user_id' => $request->user()->id,
                    'moved_at' => now(),
                    'notes' => "Transferred via {$transfer->code}",
                ]);
            }

            return $transfer;
        });

        return response()->json(['data' => $transfer->load(self::RELATIONS)], 201);
    }
}
