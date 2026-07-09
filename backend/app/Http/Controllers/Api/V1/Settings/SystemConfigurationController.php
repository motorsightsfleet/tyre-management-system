<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\SystemConfiguration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemConfigurationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SystemConfiguration::query();

        if ($request->filled('group')) {
            $query->where('group', $request->string('group'));
        }

        return response()->json(['data' => $query->orderBy('key')->get()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'configs' => ['required', 'array'],
            'configs.*.key' => ['required', 'string'],
            'configs.*.value' => ['nullable', 'string'],
            'configs.*.group' => ['nullable', 'string'],
        ]);

        foreach ($data['configs'] as $config) {
            SystemConfiguration::updateOrCreate(
                ['key' => $config['key']],
                ['value' => $config['value'] ?? null, 'group' => $config['group'] ?? null]
            );
        }

        return response()->json(['data' => SystemConfiguration::orderBy('key')->get()]);
    }
}
