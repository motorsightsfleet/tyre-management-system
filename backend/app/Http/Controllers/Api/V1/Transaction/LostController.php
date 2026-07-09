<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\LostRecord;
use App\Models\Tyre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LostController extends Controller
{
    private const RELATIONS = ['tyre', 'reportedBy'];

    public function index(Request $request): JsonResponse
    {
        $query = LostRecord::query()->with(self::RELATIONS);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->latest('reported_date')->paginate($perPage)->withQueryString();

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
        return response()->json(['data' => LostRecord::with(self::RELATIONS)->findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tyre_id' => ['required', 'exists:tyres,id'],
            'reported_date' => ['required', 'date'],
            'last_seen_location' => ['nullable', 'string', 'max:255'],
            'cost_writeoff' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['reported_by'] = $request->user()->id;

        $record = DB::transaction(function () use ($data, $request) {
            $tyre = Tyre::findOrFail($data['tyre_id']);
            $record = LostRecord::create($data);

            $tyre->update([
                'status' => 'lost',
                'current_vehicle_id' => null,
                'current_tyre_position_id' => null,
            ]);

            $tyre->events()->create([
                'event_type' => 'lost',
                'event_date' => $record->reported_date,
                'ref_type' => LostRecord::class,
                'ref_id' => $record->id,
                'user_id' => $request->user()->id,
            ]);

            return $record;
        });

        return response()->json(['data' => $record->load(self::RELATIONS)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $record = LostRecord::query()->findOrFail($id);
        $data = $request->validate([
            'status' => ['required', Rule::in(['reported', 'investigating', 'closed'])],
            'notes' => ['nullable', 'string'],
        ]);
        $record->update($data);

        return response()->json(['data' => $record->fresh(self::RELATIONS)]);
    }
}
