<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use Auditable, HasFactory, SoftDeletes;

    protected $fillable = ['code', 'name', 'site_id', 'address', 'status'];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function tyres(): HasMany
    {
        return $this->hasMany(Tyre::class, 'current_warehouse_id');
    }
}
