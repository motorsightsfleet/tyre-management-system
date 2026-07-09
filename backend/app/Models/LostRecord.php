<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LostRecord extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'tyre_id', 'reported_by', 'reported_date', 'last_seen_location',
        'cost_writeoff', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'reported_date' => 'date',
            'cost_writeoff' => 'decimal:2',
        ];
    }

    public function tyre(): BelongsTo
    {
        return $this->belongsTo(Tyre::class);
    }

    public function reportedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
