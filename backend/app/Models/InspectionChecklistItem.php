<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionChecklistItem extends Model
{
    protected $fillable = ['inspection_checklist_id', 'sort_order', 'label', 'is_required'];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
        ];
    }

    public function inspectionChecklist(): BelongsTo
    {
        return $this->belongsTo(InspectionChecklist::class);
    }
}
