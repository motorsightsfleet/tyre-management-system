<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VehicleController extends Controller
{
    private const RELATIONS = ['vehicleModel', 'vehicleCategory', 'axleConfiguration', 'site', 'project', 'customer'];

    public function index(Request $request): JsonResponse
    {
        $query = Vehicle::query()->with(self::RELATIONS);

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->trim().'%';
            $query->where(function ($q) use ($term) {
                $q->where('code', 'ilike', $term)->orWhere('plate_number', 'ilike', $term);
            });
        }

        foreach (['status', 'vehicle_category_id', 'site_id', 'project_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        $sortBy = in_array($request->input('sort_by'), ['id', 'code', 'status', 'odometer_km'], true)
            ? $request->input('sort_by') : 'id';
        $sortDir = strtolower((string) $request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $paginator = $query->orderBy($sortBy, $sortDir)->paginate($perPage)->withQueryString();

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
        return response()->json(['data' => Vehicle::with([...self::RELATIONS, 'readings' => fn ($q) => $q->latest('reading_date')->limit(12)])->findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $vehicle = Vehicle::create($data);

        return response()->json(['data' => $vehicle->load(self::RELATIONS)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $vehicle = Vehicle::query()->findOrFail($id);
        $data = $request->validate($this->rules($vehicle->getKey()));
        $vehicle->update($data);

        return response()->json(['data' => $vehicle->fresh(self::RELATIONS)]);
    }

    public function destroy(int $id): JsonResponse
    {
        Vehicle::query()->findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('vehicles', 'code')->ignore($id)],
            'plate_number' => ['nullable', 'string', 'max:50'],
            'vehicle_model_id' => ['required', 'exists:vehicle_models,id'],
            'vehicle_category_id' => ['required', 'exists:vehicle_categories,id'],
            'axle_configuration_id' => ['required', 'exists:axle_configurations,id'],
            'site_id' => ['nullable', 'exists:sites,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'odometer_km' => ['sometimes', 'integer', 'min:0'],
            'engine_hours' => ['sometimes', 'integer', 'min:0'],
            'status' => ['required', Rule::in(['active', 'maintenance', 'inactive'])],
            'commissioned_at' => ['nullable', 'date'],
        ];
    }
}
