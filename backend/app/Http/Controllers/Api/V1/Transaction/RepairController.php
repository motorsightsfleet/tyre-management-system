<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\Repair;
use App\Models\Tyre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RepairController extends Controller
{
    private const RELATIONS = ['tyre', 'repairType', 'vendor', 'repairedBy'];

    public function index(Request $request): JsonResponse
    {
        $query = Repair::query()->with(self::RELATIONS);

        if ($request->filled('tyre_id')) {
            $query->where('tyre_id', $request->input('tyre_id'));
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->latest('repair_date')->paginate($perPage)->withQueryString();

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
        return response()->json(['data' => Repair::with(self::RELATIONS)->findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tyre_id' => ['required', 'exists:tyres,id'],
            'repair_type_id' => ['required', 'exists:repair_types,id'],
            'vendor_id' => ['nullable', 'exists:suppliers,id'],
            'cost' => ['required', 'numeric', 'min:0'],
            'tread_before_mm' => ['nullable', 'numeric', 'min:0'],
            'tread_after_mm' => ['nullable', 'numeric', 'min:0'],
            'repair_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'completed' => ['sometimes', 'boolean'],
        ]);

        $completed = $data['completed'] ?? true;
        unset($data['completed']);
        $data['repaired_by'] = $request->user()->id;

        $repair = DB::transaction(function () use ($data, $completed, $request) {
            $tyre = Tyre::findOrFail($data['tyre_id']);
            $repair = Repair::create($data);

            $tyre->update(['status' => $completed ? 'in_stock' : 'in_repair']);

            $tyre->events()->create([
                'event_type' => 'repaired',
                'event_date' => $repair->repair_date,
                'ref_type' => Repair::class,
                'ref_id' => $repair->id,
                'user_id' => $request->user()->id,
            ]);

            return $repair;
        });

        return response()->json(['data' => $repair->load(self::RELATIONS)], 201);
    }
}
