<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Repair extends Model
{
    use Auditable, HasFactory;

    protected $fillable = [
        'tyre_id', 'repair_type_id', 'vendor_id', 'cost', 'tread_before_mm',
        'tread_after_mm', 'repaired_by', 'repair_date', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'repair_date' => 'date',
            'cost' => 'decimal:2',
            'tread_before_mm' => 'decimal:2',
            'tread_after_mm' => 'decimal:2',
        ];
    }

    public function tyre(): BelongsTo
    {
        return $this->belongsTo(Tyre::class);
    }

    public function repairType(): BelongsTo
    {
        return $this->belongsTo(RepairType::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'vendor_id');
    }

    public function repairedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'repaired_by');
    }
}
