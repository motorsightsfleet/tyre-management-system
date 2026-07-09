<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Role::with('permissions')->orderBy('name')->get()]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => Role::with('permissions')->findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150', Rule::unique('roles', 'name')],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::in(RolePermissionSeeder::PERMISSIONS)],
        ]);

        $role = Role::create(['name' => $data['name'], 'guard_name' => 'api']);
        $role->syncPermissions($data['permissions'] ?? []);

        return response()->json(['data' => $role->load('permissions')], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150', Rule::unique('roles', 'name')->ignore($role->id)],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::in(RolePermissionSeeder::PERMISSIONS)],
        ]);

        $role->update(['name' => $data['name']]);

        if (array_key_exists('permissions', $data)) {
            $role->syncPermissions($data['permissions']);
        }

        return response()->json(['data' => $role->fresh('permissions')]);
    }

    public function destroy(int $id): JsonResponse
    {
        Role::findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    public function permissions(): JsonResponse
    {
        return response()->json(['data' => Permission::orderBy('name')->pluck('name')]);
    }
}
