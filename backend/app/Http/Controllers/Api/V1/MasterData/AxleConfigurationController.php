<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\V1\CrudController;
use App\Models\AxleConfiguration;
use Illuminate\Validation\Rule;

class AxleConfigurationController extends CrudController
{
    protected string $modelClass = AxleConfiguration::class;

    protected array $searchable = ['code', 'name'];

    protected array $sortable = ['id', 'code', 'name', 'axle_count', 'status'];

    protected function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', $this->uniqueRule('code', $id)],
            'name' => ['required', 'string', 'max:150'],
            'axle_count' => ['required', 'integer', 'min:1', 'max:10'],
            'layout' => ['required', 'array'],
            'layout.*.tyre_position_id' => ['required', 'exists:tyre_positions,id'],
            'layout.*.code' => ['required', 'string'],
            'layout.*.axle_no' => ['required', 'integer'],
            'layout.*.side' => ['required', Rule::in(['left', 'right'])],
            'layout.*.is_dual' => ['required', 'boolean'],
            'layout.*.is_spare' => ['required', 'boolean'],
            'layout.*.x' => ['required', 'numeric', 'min:0', 'max:100'],
            'layout.*.y' => ['required', 'numeric', 'min:0', 'max:100'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
