<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\GoodsReceipt;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockMovement;
use App\Models\Tyre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GoodsReceiptController extends Controller
{
    private const RELATIONS = ['purchaseOrder', 'warehouse', 'receivedBy', 'items.tyre'];

    public function index(Request $request): JsonResponse
    {
        $query = GoodsReceipt::query()->with(['purchaseOrder', 'warehouse', 'receivedBy']);

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->input('warehouse_id'));
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->latest('receipt_date')->paginate($perPage)->withQueryString();

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
        return response()->json(['data' => GoodsReceipt::with(self::RELATIONS)->findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'purchase_order_id' => ['nullable', 'exists:purchase_orders,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'receipt_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_order_item_id' => ['nullable', 'exists:purchase_order_items,id'],
            'items.*.serial_number' => ['required', 'string', 'max:150'],
            'items.*.tyre_brand_id' => ['required_without:items.*.purchase_order_item_id', 'nullable', 'exists:tyre_brands,id'],
            'items.*.tyre_pattern_id' => ['nullable', 'exists:tyre_patterns,id'],
            'items.*.tyre_size_id' => ['required_without:items.*.purchase_order_item_id', 'nullable', 'exists:tyre_sizes,id'],
            'items.*.tyre_type_id' => ['required_without:items.*.purchase_order_item_id', 'nullable', 'exists:tyre_types,id'],
            'items.*.cost' => ['required', 'numeric', 'min:0'],
        ]);

        $receipt = DB::transaction(function () use ($data, $request) {
            $items = $data['items'];
            unset($data['items']);

            $receipt = GoodsReceipt::create([
                ...$data,
                'code' => 'GR-'.now()->format('Y').'-'.str_pad((string) (GoodsReceipt::whereYear('created_at', now()->year)->count() + 1), 4, '0', STR_PAD_LEFT),
                'received_by' => $request->user()->id,
            ]);

            foreach ($items as $item) {
                $poItem = isset($item['purchase_order_item_id'])
                    ? PurchaseOrderItem::find($item['purchase_order_item_id'])
                    : null;

                $tyre = Tyre::create([
                    'serial_number' => $item['serial_number'],
                    'tyre_brand_id' => $item['tyre_brand_id'] ?? $poItem?->tyre_brand_id,
                    'tyre_pattern_id' => $item['tyre_pattern_id'] ?? $poItem?->tyre_pattern_id,
                    'tyre_size_id' => $item['tyre_size_id'] ?? $poItem?->tyre_size_id,
                    'tyre_type_id' => $item['tyre_type_id'] ?? $poItem?->tyre_type_id,
                    'supplier_id' => $receipt->purchaseOrder?->supplier_id,
                    'cost' => $item['cost'],
                    'status' => 'in_stock',
                    'current_warehouse_id' => $receipt->warehouse_id,
                    'purchased_at' => $receipt->receipt_date,
                ]);

                $receipt->items()->create([
                    'purchase_order_item_id' => $poItem?->id,
                    'tyre_id' => $tyre->id,
                    'serial_number' => $tyre->serial_number,
                    'cost' => $item['cost'],
                ]);

                $poItem?->increment('received_quantity');

                StockMovement::create([
                    'tyre_id' => $tyre->id,
                    'movement_type' => 'receipt',
                    'to_warehouse_id' => $receipt->warehouse_id,
                    'user_id' => $request->user()->id,
                    'moved_at' => now(),
                    'notes' => "Received via {$receipt->code}",
                ]);

                $tyre->events()->create([
                    'event_type' => 'received',
                    'event_date' => $receipt->receipt_date,
                    'ref_type' => GoodsReceipt::class,
                    'ref_id' => $receipt->id,
                    'user_id' => $request->user()->id,
                ]);
            }

            if ($po = $receipt->purchaseOrder) {
                $allReceived = $po->items()->whereColumn('received_quantity', '<', 'quantity')->doesntExist();
                $po->update(['status' => $allReceived ? 'received' : 'partially_received']);
            }

            return $receipt;
        });

        return response()->json(['data' => $receipt->load(self::RELATIONS)], 201);
    }
}
