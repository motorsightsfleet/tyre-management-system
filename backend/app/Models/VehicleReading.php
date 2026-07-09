<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleReading extends Model
{
    protected $fillable = ['vehicle_id', 'reading_date', 'odometer_km', 'engine_hours', 'recorded_by'];

    protected function casts(): array
    {
        return [
            'reading_date' => 'date',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
