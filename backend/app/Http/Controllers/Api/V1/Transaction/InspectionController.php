<?php

namespace App\Http\Controllers\Api\V1\Transaction;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use App\Models\Tyre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InspectionController extends Controller
{
    private const RELATIONS = ['tyre', 'vehicle', 'tyrePosition', 'inspectionChecklist', 'damageType', 'failureCode', 'inspectedBy'];

    public function index(Request $request): JsonResponse
    {
        $query = Inspection::query()->with(self::RELATIONS);

        foreach (['tyre_id', 'vehicle_id', 'type', 'damage_type_id', 'failure_code_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        if ($request->filled('from')) {
            $query->whereDate('inspected_at', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('inspected_at', '<=', $request->date('to'));
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->latest('inspected_at')->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => Inspection::with(self::RELATIONS)->findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        $tyre = Tyre::findOrFail($data['tyre_id']);
        $data['inspected_by'] = $request->user()->id;
        $data['inspected_at'] = $data['inspected_at'] ?? now();

        $inspection = Inspection::create($data);

        $tyre->events()->create([
            'event_type' => 'inspected',
            'event_date' => $inspection->inspected_at,
            'ref_type' => Inspection::class,
            'ref_id' => $inspection->id,
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['data' => $inspection->load(self::RELATIONS)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $inspection = Inspection::query()->findOrFail($id);
        $data = $request->validate($this->rules());
        $inspection->update($data);

        return response()->json(['data' => $inspection->fresh(self::RELATIONS)]);
    }

    public function destroy(int $id): JsonResponse
    {
        Inspection::query()->findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'tyre_id' => ['required', 'exists:tyres,id'],
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
            'tyre_position_id' => ['nullable', 'exists:tyre_positions,id'],
            'inspection_checklist_id' => ['nullable', 'exists:inspection_checklists,id'],
            'type' => ['required', Rule::in(['daily', 'periodic', 'pressure', 'tread', 'damage'])],
            'tread_depth_mm' => ['nullable', 'numeric', 'min:0'],
            'pressure_psi' => ['nullable', 'numeric', 'min:0'],
            'temperature_c' => ['nullable', 'numeric'],
            'damage_type_id' => ['nullable', 'exists:damage_types,id'],
            'failure_code_id' => ['nullable', 'exists:failure_codes,id'],
            'checklist_results' => ['nullable', 'array'],
            'photos' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
            'inspected_at' => ['nullable', 'date'],
        ];
    }
}
