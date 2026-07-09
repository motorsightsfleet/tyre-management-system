<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\Tyre;
use App\Models\WarrantyClaim;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WarrantyClaimController extends Controller
{
    private const RELATIONS = ['tyre', 'supplier', 'failureCode'];

    public function index(Request $request): JsonResponse
    {
        $query = WarrantyClaim::query()->with(self::RELATIONS);

        foreach (['tyre_id', 'supplier_id', 'status'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->latest('claim_date')->paginate($perPage)->withQueryString();

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
        return response()->json(['data' => WarrantyClaim::with(self::RELATIONS)->findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $tyre = Tyre::findOrFail($data['tyre_id']);

        $claim = WarrantyClaim::create($data);

        $tyre->events()->create([
            'event_type' => 'warranty_claim',
            'event_date' => $claim->claim_date,
            'ref_type' => WarrantyClaim::class,
            'ref_id' => $claim->id,
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['data' => $claim->load(self::RELATIONS)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $claim = WarrantyClaim::query()->findOrFail($id);
        $data = $request->validate($this->rules());
        $claim->update($data);

        return response()->json(['data' => $claim->fresh(self::RELATIONS)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'tyre_id' => ['required', 'exists:tyres,id'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'failure_code_id' => ['nullable', 'exists:failure_codes,id'],
            'claim_date' => ['required', 'date'],
            'reason' => ['required', 'string'],
            'status' => ['sometimes', Rule::in(['submitted', 'approved', 'rejected', 'resolved'])],
            'resolution' => ['nullable', 'string'],
            'cost_recovered' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
