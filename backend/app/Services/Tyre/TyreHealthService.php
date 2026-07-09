<?php

namespace App\Services\Tyre;

use App\Models\Tyre;

class TyreHealthService
{
    public function statusFor(Tyre $tyre): string
    {
        if ($tyre->status === 'scrapped') {
            return 'scrapped';
        }

        $lastInspection = $tyre->inspections()->latest('inspected_at')->first();

        if ($lastInspection?->tread_depth_mm !== null) {
            if ($lastInspection->tread_depth_mm <= 4) {
                return 'replace';
            }
            if ($lastInspection->tread_depth_mm <= 8) {
                return 'rotation_due';
            }
        }

        if (! $lastInspection || $lastInspection->inspected_at->lt(now()->subDays(7))) {
            return 'inspection_due';
        }

        return 'healthy';
    }
}
