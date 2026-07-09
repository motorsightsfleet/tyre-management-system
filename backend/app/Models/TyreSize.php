<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TyreSize extends Model
{
    use Auditable, HasFactory, SoftDeletes;

    protected $fillable = ['code', 'width_mm', 'aspect_ratio', 'rim_diameter', 'description', 'status'];

    public function tyres(): HasMany
    {
        return $this->hasMany(Tyre::class);
    }
}
