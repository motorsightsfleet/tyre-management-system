<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TyreEvent extends Model
{
    protected $fillable = ['tyre_id', 'event_type', 'event_date', 'ref_type', 'ref_id', 'user_id', 'payload', 'notes'];

    protected function casts(): array
    {
        return [
            'event_date' => 'datetime',
            'payload' => 'array',
        ];
    }

    public function tyre(): BelongsTo
    {
        return $this->belongsTo(Tyre::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reference(): ?Model
    {
        if (! $this->ref_type || ! $this->ref_id) {
            return null;
        }

        return $this->ref_type::find($this->ref_id);
    }
}
