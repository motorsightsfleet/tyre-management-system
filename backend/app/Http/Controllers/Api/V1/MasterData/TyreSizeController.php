<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\V1\CrudController;
use App\Models\TyreSize;
use Illuminate\Validation\Rule;

class TyreSizeController extends CrudController
{
    protected string $modelClass = TyreSize::class;

    protected array $searchable = ['code'];

    protected array $sortable = ['id', 'code', 'status'];

    protected function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', $this->uniqueRule('code', $id)],
            'width_mm' => ['nullable', 'integer', 'min:0'],
            'aspect_ratio' => ['nullable', 'integer', 'min:0'],
            'rim_diameter' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
