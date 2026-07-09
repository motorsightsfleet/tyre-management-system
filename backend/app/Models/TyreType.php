<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TyreType extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = ['code', 'name', 'description', 'status'];

    public function tyres(): HasMany
    {
        return $this->hasMany(Tyre::class);
    }
}
