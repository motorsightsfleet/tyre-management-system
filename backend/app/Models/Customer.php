<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use Auditable, HasFactory, SoftDeletes;

    protected $fillable = ['code', 'name', 'contact_name', 'phone', 'email', 'address', 'status'];

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }
}
