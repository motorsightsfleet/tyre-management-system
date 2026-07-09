<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\CompanyProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyProfileController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => CompanyProfile::query()->firstOrCreate([])]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'legal_name' => ['nullable', 'string', 'max:150'],
            'address' => ['nullable', 'string'],
            'tax_id' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:150'],
            'logo_url' => ['nullable', 'string', 'max:500'],
        ]);

        $profile = CompanyProfile::query()->firstOrCreate([]);
        $profile->update($data);

        return response()->json(['data' => $profile->fresh()]);
    }
}
