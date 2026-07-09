<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\Tyre;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockInventoryController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $query = Tyre::query()->where('status', 'in_stock');

        if ($request->filled('warehouse_id')) {
            $query->where('current_warehouse_id', $request->input('warehouse_id'));
        }

        $byWarehouse = (clone $query)
            ->selectRaw('current_warehouse_id, count(*) as total')
            ->groupBy('current_warehouse_id')
            ->get()
            ->map(function ($row) {
                return [
                    'warehouse' => Warehouse::find($row->current_warehouse_id)?->name,
                    'warehouse_id' => $row->current_warehouse_id,
                    'total' => $row->total,
                ];
            });

        $byBrand = (clone $query)
            ->selectRaw('tyre_brand_id, count(*) as total')
            ->groupBy('tyre_brand_id')
            ->with('tyreBrand:id,name')
            ->get()
            ->map(fn ($row) => ['brand' => $row->tyreBrand?->name, 'total' => $row->total]);

        return response()->json([
            'data' => [
                'total_in_stock' => (clone $query)->count(),
                'by_warehouse' => $byWarehouse,
                'by_brand' => $byBrand,
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Tyre::with(['tyreBrand', 'tyrePattern', 'tyreSize', 'tyreType', 'currentWarehouse'])
            ->where('status', 'in_stock');

        if ($request->filled('warehouse_id')) {
            $query->where('current_warehouse_id', $request->input('warehouse_id'));
        }

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->trim().'%';
            $query->where('serial_number', 'ilike', $term);
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->orderByDesc('id')->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(), 'total' => $paginator->total(),
            ],
        ]);
    }
}
