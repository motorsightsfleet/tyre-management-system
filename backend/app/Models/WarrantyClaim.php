<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarrantyClaim extends Model
{
    use Auditable, HasFactory;

    protected $fillable = [
        'tyre_id', 'supplier_id', 'failure_code_id', 'claim_date', 'reason',
        'status', 'resolution', 'cost_recovered',
    ];

    protected function casts(): array
    {
        return [
            'claim_date' => 'date',
            'cost_recovered' => 'decimal:2',
        ];
    }

    public function tyre(): BelongsTo
    {
        return $this->belongsTo(Tyre::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function failureCode(): BelongsTo
    {
        return $this->belongsTo(FailureCode::class);
    }
}
