<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\V1\CrudController;
use App\Models\Project;
use Illuminate\Validation\Rule;

class ProjectController extends CrudController
{
    protected string $modelClass = Project::class;

    protected array $searchable = ['code', 'name'];

    protected array $sortable = ['id', 'code', 'name', 'status', 'start_date', 'end_date'];

    protected array $filterable = ['status', 'site_id', 'customer_id'];

    protected array $with = ['site', 'customer'];

    protected function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', $this->uniqueRule('code', $id)],
            'name' => ['required', 'string', 'max:150'],
            'site_id' => ['nullable', 'exists:sites,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
