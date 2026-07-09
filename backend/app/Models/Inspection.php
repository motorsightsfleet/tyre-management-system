<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inspection extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'tyre_id', 'vehicle_id', 'tyre_position_id', 'inspection_checklist_id', 'type',
        'tread_depth_mm', 'pressure_psi', 'temperature_c', 'damage_type_id', 'failure_code_id',
        'checklist_results', 'photos', 'notes', 'inspected_by', 'inspected_at',
    ];

    protected function casts(): array
    {
        return [
            'checklist_results' => 'array',
            'photos' => 'array',
            'inspected_at' => 'datetime',
            'tread_depth_mm' => 'decimal:2',
            'pressure_psi' => 'decimal:2',
            'temperature_c' => 'decimal:2',
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

    public function inspectionChecklist(): BelongsTo
    {
        return $this->belongsTo(InspectionChecklist::class);
    }

    public function damageType(): BelongsTo
    {
        return $this->belongsTo(DamageType::class);
    }

    public function failureCode(): BelongsTo
    {
        return $this->belongsTo(FailureCode::class);
    }

    public function inspectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspected_by');
    }
}
