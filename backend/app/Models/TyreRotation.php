<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TyreRotation extends Model
{
    protected $fillable = ['code', 'vehicle_id', 'performed_by', 'rotation_date', 'notes'];

    protected function casts(): array
    {
        return [
            'rotation_date' => 'datetime',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function installations(): HasMany
    {
        return $this->hasMany(TyreInstallation::class);
    }
}
