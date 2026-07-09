<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tyre extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'serial_number', 'barcode_code', 'rfid_code', 'tyre_brand_id', 'tyre_pattern_id',
        'tyre_size_id', 'tyre_type_id', 'supplier_id', 'manufacture_date', 'tread_depth_new_mm',
        'cost', 'status', 'current_warehouse_id', 'current_vehicle_id', 'current_tyre_position_id',
        'retread_count', 'photo_url', 'warranty_months', 'purchased_at',
    ];

    protected function casts(): array
    {
        return [
            'manufacture_date' => 'date',
            'purchased_at' => 'date',
            'tread_depth_new_mm' => 'decimal:2',
            'cost' => 'decimal:2',
        ];
    }

    public function tyreBrand(): BelongsTo
    {
        return $this->belongsTo(TyreBrand::class);
    }

    public function tyrePattern(): BelongsTo
    {
        return $this->belongsTo(TyrePattern::class);
    }

    public function tyreSize(): BelongsTo
    {
        return $this->belongsTo(TyreSize::class);
    }

    public function tyreType(): BelongsTo
    {
        return $this->belongsTo(TyreType::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function currentWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'current_warehouse_id');
    }

    public function currentVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'current_vehicle_id');
    }

    public function currentTyrePosition(): BelongsTo
    {
        return $this->belongsTo(TyrePosition::class, 'current_tyre_position_id');
    }

    public function installations(): HasMany
    {
        return $this->hasMany(TyreInstallation::class);
    }

    public function currentInstallation(): HasOne
    {
        return $this->hasOne(TyreInstallation::class)->whereNull('removed_at')->latestOfMany('installed_at');
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(Inspection::class);
    }

    public function repairs(): HasMany
    {
        return $this->hasMany(Repair::class);
    }

    public function retreads(): HasMany
    {
        return $this->hasMany(Retread::class);
    }

    public function warrantyClaims(): HasMany
    {
        return $this->hasMany(WarrantyClaim::class);
    }

    public function scrapRecord(): HasOne
    {
        return $this->hasOne(ScrapRecord::class);
    }

    public function lostRecord(): HasOne
    {
        return $this->hasOne(LostRecord::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(TyreEvent::class)->orderByDesc('event_date');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }
}
