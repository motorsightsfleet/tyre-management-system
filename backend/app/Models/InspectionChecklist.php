<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InspectionChecklist extends Model
{
    use Auditable, HasFactory, SoftDeletes;

    protected $fillable = ['code', 'name', 'applies_to', 'description', 'status'];

    public function items(): HasMany
    {
        return $this->hasMany(InspectionChecklistItem::class)->orderBy('sort_order');
    }
}
