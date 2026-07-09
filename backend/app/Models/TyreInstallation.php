<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TyreInstallation extends Model
{
    protected $fillable = [
        'tyre_id', 'vehicle_id', 'tyre_position_id', 'installed_by', 'installed_at',
        'odometer_km_at_install', 'engine_hours_at_install', 'removed_at', 'removed_by',
        'odometer_km_at_removal', 'engine_hours_at_removal', 'removal_reason_id',
        'tyre_rotation_id', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'installed_at' => 'datetime',
            'removed_at' => 'datetime',
        ];
    }

    public function tyre(): BelongsTo
    {
        return $this->belongsTo(Tyre::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function tyrePosition(): BelongsTo
    {
        return $this->belongsTo(TyrePosition::class);
    }

    public function installedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installed_by');
    }

    public function removedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'removed_by');
    }

    public function removalReason(): BelongsTo
    {
        return $this->belongsTo(RemovalReason::class);
    }

    public function tyreRotation(): BelongsTo
    {
        return $this->belongsTo(TyreRotation::class);
    }

    public function isActive(): bool
    {
        return $this->removed_at === null;
    }
}
