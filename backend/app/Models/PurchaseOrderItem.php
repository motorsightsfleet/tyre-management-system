<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id', 'tyre_brand_id', 'tyre_pattern_id', 'tyre_size_id',
        'tyre_type_id', 'quantity', 'unit_price', 'received_quantity',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
        ];
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function tyreBrand(): BelongsTo
    {
        return $this->belongsTo(TyreBrand::class);
    }

    public function tyrePattern(): BelongsTo
    {
        return $this->belongsTo(TyrePattern::class);
    }

    public function tyreSize(): BelongsTo
    {
        return $this->belongsTo(TyreSize::class);
    }

    public function tyreType(): BelongsTo
    {
        return $this->belongsTo(TyreType::class);
    }
}
