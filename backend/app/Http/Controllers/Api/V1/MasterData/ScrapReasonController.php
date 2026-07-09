<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\V1\CrudController;
use App\Models\ScrapReason;
use Illuminate\Validation\Rule;

class ScrapReasonController extends CrudController
{
    protected string $modelClass = ScrapReason::class;

    protected array $searchable = ['code', 'name'];

    protected array $sortable = ['id', 'code', 'name', 'status'];

    protected function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', $this->uniqueRule('code', $id)],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
