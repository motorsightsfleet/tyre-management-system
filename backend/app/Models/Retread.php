<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Retread extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'tyre_id', 'retread_vendor_id', 'cost', 'sent_date', 'received_date',
        'retread_count_after', 'warranty_months', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'sent_date' => 'date',
            'received_date' => 'date',
            'cost' => 'decimal:2',
        ];
    }

    public function tyre(): BelongsTo
    {
        return $this->belongsTo(Tyre::class);
    }

    public function retreadVendor(): BelongsTo
    {
        return $this->belongsTo(RetreadVendor::class);
    }
}
