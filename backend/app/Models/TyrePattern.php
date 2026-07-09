<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TyrePattern extends Model
{
    use Auditable, HasFactory, SoftDeletes;

    protected $fillable = ['code', 'name', 'tyre_brand_id', 'application', 'description', 'status'];

    public function tyreBrand(): BelongsTo
    {
        return $this->belongsTo(TyreBrand::class);
    }

    public function tyres(): HasMany
    {
        return $this->hasMany(Tyre::class);
    }
}
