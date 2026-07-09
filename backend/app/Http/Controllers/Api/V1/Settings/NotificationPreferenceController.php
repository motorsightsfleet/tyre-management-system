<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->notificationPreferences()->get()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'preferences' => ['required', 'array'],
            'preferences.*.event_type' => ['required', 'string'],
            'preferences.*.channel' => ['required', 'string', 'in:app,email'],
            'preferences.*.enabled' => ['required', 'boolean'],
        ]);

        foreach ($data['preferences'] as $pref) {
            $request->user()->notificationPreferences()->updateOrCreate(
                ['event_type' => $pref['event_type'], 'channel' => $pref['channel']],
                ['enabled' => $pref['enabled']]
            );
        }

        return response()->json(['data' => $request->user()->notificationPreferences()->get()]);
    }
}
