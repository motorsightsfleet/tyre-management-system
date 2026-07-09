<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockAdjustmentController extends Controller
{
    private const RELATIONS = ['tyre', 'warehouse', 'adjustedBy'];

    public function index(Request $request): JsonResponse
    {
        $query = StockAdjustment::query()->with(self::RELATIONS);

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->input('warehouse_id'));
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->latest('adjustment_date')->paginate($perPage)->withQueryString();

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
            'tyre_id' => ['required', 'exists:tyres,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'reason' => ['required', 'string', 'max:255'],
            'adjustment_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['adjusted_by'] = $request->user()->id;
        $adjustment = StockAdjustment::create($data);

        return response()->json(['data' => $adjustment->load(self::RELATIONS)], 201);
    }
}
