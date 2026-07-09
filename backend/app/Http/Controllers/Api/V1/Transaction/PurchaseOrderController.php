<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PurchaseOrderController extends Controller
{
    private const RELATIONS = ['supplier', 'warehouse', 'requestedBy', 'items.tyreBrand', 'items.tyrePattern', 'items.tyreSize', 'items.tyreType'];

    public function index(Request $request): JsonResponse
    {
        $query = PurchaseOrder::query()->with(['supplier', 'warehouse', 'requestedBy']);

        foreach (['status', 'supplier_id', 'warehouse_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        if ($request->filled('search')) {
            $query->where('code', 'ilike', '%'.$request->string('search')->trim().'%');
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->latest('order_date')->paginate($perPage)->withQueryString();

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
        return response()->json(['data' => PurchaseOrder::with([...self::RELATIONS, 'goodsReceipts'])->findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'order_date' => ['required', 'date'],
            'expected_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.tyre_brand_id' => ['required', 'exists:tyre_brands,id'],
            'items.*.tyre_pattern_id' => ['nullable', 'exists:tyre_patterns,id'],
            'items.*.tyre_size_id' => ['required', 'exists:tyre_sizes,id'],
            'items.*.tyre_type_id' => ['required', 'exists:tyre_types,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $po = DB::transaction(function () use ($data, $request) {
            $items = $data['items'];
            unset($data['items']);

            $total = collect($items)->sum(fn ($item) => $item['quantity'] * $item['unit_price']);

            $po = PurchaseOrder::create([
                ...$data,
                'code' => 'PO-'.now()->format('Y').'-'.str_pad((string) (PurchaseOrder::whereYear('created_at', now()->year)->count() + 1), 4, '0', STR_PAD_LEFT),
                'requested_by' => $request->user()->id,
                'status' => 'draft',
                'total_amount' => $total,
            ]);

            foreach ($items as $item) {
                $po->items()->create($item);
            }

            return $po;
        });

        return response()->json(['data' => $po->load(self::RELATIONS)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $po = PurchaseOrder::query()->findOrFail($id);

        $data = $request->validate([
            'supplier_id' => ['sometimes', 'exists:suppliers,id'],
            'warehouse_id' => ['nullable', 'exists:warehouses,id'],
            'order_date' => ['sometimes', 'date'],
            'expected_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $po->update($data);

        return response()->json(['data' => $po->fresh(self::RELATIONS)]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $po = PurchaseOrder::query()->findOrFail($id);

        $data = $request->validate([
            'status' => ['required', Rule::in(['draft', 'submitted', 'approved', 'partially_received', 'received', 'cancelled'])],
        ]);

        $po->update($data);

        return response()->json(['data' => $po->fresh(self::RELATIONS)]);
    }

    public function destroy(int $id): JsonResponse
    {
        $po = PurchaseOrder::query()->findOrFail($id);

        if ($po->status !== 'draft') {
            return response()->json(['message' => 'Only draft purchase orders can be deleted.'], 422);
        }

        $po->delete();

        return response()->json(null, 204);
    }
}
