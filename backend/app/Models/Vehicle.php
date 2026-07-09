<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use Auditable, HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'plate_number', 'vehicle_model_id', 'vehicle_category_id',
        'axle_configuration_id', 'site_id', 'project_id', 'customer_id',
        'odometer_km', 'engine_hours', 'status', 'commissioned_at',
    ];

    protected function casts(): array
    {
        return [
            'commissioned_at' => 'date',
        ];
    }

    public function vehicleModel(): BelongsTo
    {
        return $this->belongsTo(VehicleModel::class);
    }

    public function vehicleCategory(): BelongsTo
    {
        return $this->belongsTo(VehicleCategory::class);
    }

    public function axleConfiguration(): BelongsTo
    {
        return $this->belongsTo(AxleConfiguration::class);
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function readings(): HasMany
    {
        return $this->hasMany(VehicleReading::class);
    }

    public function tyreInstallations(): HasMany
    {
        return $this->hasMany(TyreInstallation::class);
    }

    public function currentInstallations(): HasMany
    {
        return $this->hasMany(TyreInstallation::class)->whereNull('removed_at');
    }

    public function tyreRotations(): HasMany
    {
        return $this->hasMany(TyreRotation::class);
    }

    public function currentTyres(): HasMany
    {
        return $this->hasMany(Tyre::class, 'current_vehicle_id');
    }
}
