<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\InitialStockEntry;
use App\Models\Tyre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InitialStockEntryController extends Controller
{
    private const RELATIONS = ['tyre', 'warehouse', 'enteredBy'];

    public function index(Request $request): JsonResponse
    {
        $query = InitialStockEntry::query()->with(self::RELATIONS);

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->input('warehouse_id'));
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->latest('entry_date')->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(), 'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'entry_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'serial_number' => ['required', 'string', 'max:150'],
            'barcode_code' => ['nullable', 'string', 'max:100'],
            'tyre_brand_id' => ['required', 'exists:tyre_brands,id'],
            'tyre_pattern_id' => ['nullable', 'exists:tyre_patterns,id'],
            'tyre_size_id' => ['required', 'exists:tyre_sizes,id'],
            'tyre_type_id' => ['required', 'exists:tyre_types,id'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'tread_depth_new_mm' => ['nullable', 'numeric', 'min:0'],
        ]);

        $entry = DB::transaction(function () use ($data, $request) {
            $tyre = Tyre::create([
                'serial_number' => $data['serial_number'],
                'barcode_code' => $data['barcode_code'] ?? null,
                'tyre_brand_id' => $data['tyre_brand_id'],
                'tyre_pattern_id' => $data['tyre_pattern_id'] ?? null,
                'tyre_size_id' => $data['tyre_size_id'],
                'tyre_type_id' => $data['tyre_type_id'],
                'cost' => $data['cost'] ?? 0,
                'tread_depth_new_mm' => $data['tread_depth_new_mm'] ?? null,
                'status' => 'in_stock',
                'current_warehouse_id' => $data['warehouse_id'],
                'purchased_at' => $data['entry_date'],
            ]);

            $entry = InitialStockEntry::create([
                'tyre_id' => $tyre->id,
                'warehouse_id' => $data['warehouse_id'],
                'entered_by' => $request->user()->id,
                'entry_date' => $data['entry_date'],
                'notes' => $data['notes'] ?? null,
            ]);

            $tyre->events()->create([
                'event_type' => 'opening_balance',
                'event_date' => $data['entry_date'],
                'ref_type' => InitialStockEntry::class,
                'ref_id' => $entry->id,
                'user_id' => $request->user()->id,
            ]);

            return $entry;
        });

        return response()->json(['data' => $entry->load(self::RELATIONS)], 201);
    }
}
