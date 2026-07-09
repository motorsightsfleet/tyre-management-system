<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\V1\CrudController;
use App\Models\TyrePattern;
use Illuminate\Validation\Rule;

class TyrePatternController extends CrudController
{
    protected string $modelClass = TyrePattern::class;

    protected array $searchable = ['code', 'name'];

    protected array $sortable = ['id', 'code', 'name', 'status'];

    protected array $filterable = ['status', 'tyre_brand_id'];

    protected array $with = ['tyreBrand'];

    protected function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', $this->uniqueRule('code', $id)],
            'name' => ['required', 'string', 'max:150'],
            'tyre_brand_id' => ['required', 'exists:tyre_brands,id'],
            'application' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
