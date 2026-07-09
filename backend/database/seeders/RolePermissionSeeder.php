<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public const PERMISSIONS = [
        'master.view', 'master.manage',
        'transaction.procurement.view', 'transaction.procurement.manage',
        'transaction.warehouse.view', 'transaction.warehouse.manage',
        'transaction.installation.view', 'transaction.installation.manage',
        'transaction.inspection.view', 'transaction.inspection.manage',
        'transaction.maintenance.view', 'transaction.maintenance.manage',
        'transaction.disposal.view', 'transaction.disposal.manage',
        'analytics.view',
        'reports.view', 'reports.export',
        'settings.view', 'settings.manage',
        'users.manage',
    ];

    public const ROLE_PERMISSIONS = [
        'Super Admin' => self::PERMISSIONS,
        'Fleet Manager' => [
            'master.view', 'master.manage',
            'transaction.procurement.view', 'transaction.procurement.manage',
            'transaction.warehouse.view', 'transaction.warehouse.manage',
            'transaction.installation.view', 'transaction.installation.manage',
            'transaction.inspection.view', 'transaction.inspection.manage',
            'transaction.maintenance.view', 'transaction.maintenance.manage',
            'transaction.disposal.view', 'transaction.disposal.manage',
            'analytics.view', 'reports.view', 'reports.export',
        ],
        'Warehouse Staff' => [
            'master.view',
            'transaction.procurement.view', 'transaction.procurement.manage',
            'transaction.warehouse.view', 'transaction.warehouse.manage',
            'reports.view',
        ],
        'Inspector' => [
            'master.view',
            'transaction.installation.view', 'transaction.installation.manage',
            'transaction.inspection.view', 'transaction.inspection.manage',
            'reports.view',
        ],
        'Viewer' => [
            'master.view',
            'transaction.procurement.view',
            'transaction.warehouse.view',
            'transaction.installation.view',
            'transaction.inspection.view',
            'transaction.maintenance.view',
            'transaction.disposal.view',
            'analytics.view',
            'reports.view',
        ],
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission, 'api');
        }

        foreach (self::ROLE_PERMISSIONS as $roleName => $permissions) {
            $role = Role::findOrCreate($roleName, 'api');
            $role->syncPermissions($permissions);
        }

        $admin = User::firstOrCreate(
            ['email' => 'motorsightsfleet@gmail.com'],
            ['name' => 'Super Admin', 'password' => 'password', 'is_active' => true]
        );
        $admin->assignRole('Super Admin');

        $fleetManager = User::firstOrCreate(
            ['email' => 'fleet.manager@tms.local'],
            ['name' => 'Fleet Manager', 'password' => 'password', 'is_active' => true]
        );
        $fleetManager->assignRole('Fleet Manager');

        $warehouseStaff = User::firstOrCreate(
            ['email' => 'warehouse.staff@tms.local'],
            ['name' => 'Warehouse Staff', 'password' => 'password', 'is_active' => true]
        );
        $warehouseStaff->assignRole('Warehouse Staff');

        $inspector = User::firstOrCreate(
            ['email' => 'inspector@tms.local'],
            ['name' => 'Tyre Inspector', 'password' => 'password', 'is_active' => true]
        );
        $inspector->assignRole('Inspector');

        $viewer = User::firstOrCreate(
            ['email' => 'viewer@tms.local'],
            ['name' => 'Viewer', 'password' => 'password', 'is_active' => true]
        );
        $viewer->assignRole('Viewer');
    }
}
