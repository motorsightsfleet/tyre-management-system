<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\BarcodeRfidConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BarcodeRfidConfigController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => BarcodeRfidConfig::query()->firstOrCreate([])]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code_prefix' => ['required', 'string', 'max:20'],
            'code_length' => ['required', 'integer', 'min:6', 'max:32'],
            'symbology' => ['required', Rule::in(['code128', 'qr', 'ean13'])],
            'auto_generate' => ['sometimes', 'boolean'],
        ]);

        $config = BarcodeRfidConfig::query()->firstOrCreate([]);
        $config->update($data);

        return response()->json(['data' => $config->fresh()]);
    }
}
