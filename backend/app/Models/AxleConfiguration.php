<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AxleConfiguration extends Model
{
    use Auditable, HasFactory, SoftDeletes;

    protected $fillable = ['code', 'name', 'axle_count', 'layout', 'description', 'status'];

    protected function casts(): array
    {
        return [
            'layout' => 'array',
        ];
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }
}
