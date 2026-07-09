<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TyreBrand extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = ['code', 'name', 'country_of_origin', 'description', 'status'];

    public function tyrePatterns(): HasMany
    {
        return $this->hasMany(TyrePattern::class);
    }

    public function tyres(): HasMany
    {
        return $this->hasMany(Tyre::class);
    }
}
