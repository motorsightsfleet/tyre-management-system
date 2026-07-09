<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScrapRecord extends Model
{
    use Auditable, HasFactory;

    protected $fillable = [
        'tyre_id', 'scrap_reason_id', 'scrapped_by', 'approved_by',
        'scrap_date', 'final_tread_depth_mm', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'scrap_date' => 'date',
            'final_tread_depth_mm' => 'decimal:2',
        ];
    }

    public function tyre(): BelongsTo
    {
        return $this->belongsTo(Tyre::class);
    }

    public function scrapReason(): BelongsTo
    {
        return $this->belongsTo(ScrapReason::class);
    }

    public function scrappedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scrapped_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
