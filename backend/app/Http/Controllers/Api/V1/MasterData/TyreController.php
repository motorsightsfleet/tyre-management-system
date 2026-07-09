<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Controller;
use App\Models\BarcodeRfidConfig;
use App\Models\Tyre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TyreController extends Controller
{
    private const RELATIONS = [
        'tyreBrand', 'tyrePattern', 'tyreSize', 'tyreType', 'supplier',
        'currentWarehouse', 'currentVehicle', 'currentTyrePosition',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Tyre::query()->with(self::RELATIONS);

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->trim().'%';
            $query->where(function ($q) use ($term) {
                $q->where('serial_number', 'ilike', $term)
                    ->orWhere('barcode_code', 'ilike', $term)
                    ->orWhere('rfid_code', 'ilike', $term);
            });
        }

        foreach (['status', 'tyre_brand_id', 'tyre_size_id', 'current_warehouse_id', 'current_vehicle_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        $sortBy = in_array($request->input('sort_by'), ['id', 'serial_number', 'status', 'cost', 'created_at'], true)
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
        $tyre = Tyre::with([
            ...self::RELATIONS,
            'installations.tyrePosition', 'installations.vehicle',
            'inspections' => fn ($q) => $q->latest('inspected_at')->limit(20),
            'repairs', 'retreads', 'warrantyClaims', 'scrapRecord', 'lostRecord',
            'events' => fn ($q) => $q->limit(50),
        ])->findOrFail($id);

        return response()->json(['data' => $tyre]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tyre = Tyre::query()->findOrFail($id);

        $data = $request->validate([
            'tyre_brand_id' => ['sometimes', 'exists:tyre_brands,id'],
            'tyre_pattern_id' => ['nullable', 'exists:tyre_patterns,id'],
            'tyre_size_id' => ['sometimes', 'exists:tyre_sizes,id'],
            'tyre_type_id' => ['sometimes', 'exists:tyre_types,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'manufacture_date' => ['nullable', 'date'],
            'tread_depth_new_mm' => ['nullable', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'photo_url' => ['nullable', 'string', 'max:500'],
            'warranty_months' => ['nullable', 'integer', 'min:0'],
            'barcode_code' => ['nullable', 'string', 'max:100', Rule::unique('tyres', 'barcode_code')->ignore($id)],
            'rfid_code' => ['nullable', 'string', 'max:100', Rule::unique('tyres', 'rfid_code')->ignore($id)],
        ]);

        $tyre->update($data);

        return response()->json(['data' => $tyre->fresh(self::RELATIONS)]);
    }

    public function lookupByCode(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string']]);

        $tyre = Tyre::with(self::RELATIONS)
            ->where('barcode_code', $data['code'])
            ->orWhere('rfid_code', $data['code'])
            ->orWhere('serial_number', $data['code'])
            ->first();

        if (! $tyre) {
            return response()->json(['message' => 'No tyre found for that code.'], 404);
        }

        return response()->json(['data' => $tyre]);
    }

    public function generateBarcode(int $id): JsonResponse
    {
        $tyre = Tyre::query()->findOrFail($id);

        if ($tyre->barcode_code) {
            return response()->json(['data' => $tyre]);
        }

        $config = BarcodeRfidConfig::query()->firstOrCreate([]);

        do {
            $code = $config->code_prefix.str_pad((string) random_int(0, 10 ** ($config->code_length - strlen($config->code_prefix)) - 1), $config->code_length - strlen($config->code_prefix), '0', STR_PAD_LEFT);
        } while (Tyre::where('barcode_code', $code)->exists());

        $tyre->update(['barcode_code' => $code]);

        return response()->json(['data' => $tyre]);
    }
}
