<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;

class BarcodeRfidConfig extends Model
{
    use Auditable;

    protected $fillable = ['code_prefix', 'code_length', 'symbology', 'auto_generate'];

    protected function casts(): array
    {
        return [
            'auto_generate' => 'boolean',
        ];
    }
}
