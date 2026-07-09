<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\ScrapRecord;
use App\Models\Tyre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScrapController extends Controller
{
    private const RELATIONS = ['tyre', 'scrapReason', 'scrappedBy', 'approvedBy'];

    public function index(Request $request): JsonResponse
    {
        $query = ScrapRecord::query()->with(self::RELATIONS);

        if ($request->filled('scrap_reason_id')) {
            $query->where('scrap_reason_id', $request->input('scrap_reason_id'));
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->latest('scrap_date')->paginate($perPage)->withQueryString();

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
        return response()->json(['data' => ScrapRecord::with(self::RELATIONS)->findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tyre_id' => ['required', 'exists:tyres,id'],
            'scrap_reason_id' => ['required', 'exists:scrap_reasons,id'],
            'approved_by' => ['nullable', 'exists:users,id'],
            'scrap_date' => ['required', 'date'],
            'final_tread_depth_mm' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['scrapped_by'] = $request->user()->id;

        $record = DB::transaction(function () use ($data, $request) {
            $tyre = Tyre::findOrFail($data['tyre_id']);

            $record = ScrapRecord::create($data);

            $tyre->update([
                'status' => 'scrapped',
                'current_vehicle_id' => null,
                'current_tyre_position_id' => null,
                'current_warehouse_id' => null,
            ]);

            $tyre->events()->create([
                'event_type' => 'scrapped',
                'event_date' => $record->scrap_date,
                'ref_type' => ScrapRecord::class,
                'ref_id' => $record->id,
                'user_id' => $request->user()->id,
            ]);

            return $record;
        });

        return response()->json(['data' => $record->load(self::RELATIONS)], 201);
    }
}
