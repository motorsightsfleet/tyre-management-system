<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\Retread;
use App\Models\Tyre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RetreadController extends Controller
{
    private const RELATIONS = ['tyre', 'retreadVendor'];

    public function index(Request $request): JsonResponse
    {
        $query = Retread::query()->with(self::RELATIONS);

        if ($request->filled('tyre_id')) {
            $query->where('tyre_id', $request->input('tyre_id'));
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->latest('sent_date')->paginate($perPage)->withQueryString();

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
        return response()->json(['data' => Retread::with(self::RELATIONS)->findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tyre_id' => ['required', 'exists:tyres,id'],
            'retread_vendor_id' => ['required', 'exists:retread_vendors,id'],
            'cost' => ['required', 'numeric', 'min:0'],
            'sent_date' => ['required', 'date'],
            'received_date' => ['nullable', 'date', 'after_or_equal:sent_date'],
            'warranty_months' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $retread = DB::transaction(function () use ($data, $request) {
            $tyre = Tyre::findOrFail($data['tyre_id']);
            $data['retread_count_after'] = $tyre->retread_count + 1;

            $retread = Retread::create($data);

            if (! empty($data['received_date'])) {
                $tyre->update(['status' => 'retreaded', 'retread_count' => $data['retread_count_after']]);

                $tyre->events()->create([
                    'event_type' => 'retreaded',
                    'event_date' => $data['received_date'],
                    'ref_type' => Retread::class,
                    'ref_id' => $retread->id,
                    'user_id' => $request->user()->id,
                ]);
            } else {
                $tyre->update(['status' => 'in_repair']);
            }

            return $retread;
        });

        return response()->json(['data' => $retread->load(self::RELATIONS)], 201);
    }
}
