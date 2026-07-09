<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\V1\CrudController;
use App\Models\VehicleModel;
use Illuminate\Validation\Rule;

class VehicleModelController extends CrudController
{
    protected string $modelClass = VehicleModel::class;

    protected array $searchable = ['code', 'name'];

    protected array $sortable = ['id', 'code', 'name', 'status'];

    protected array $filterable = ['status', 'vehicle_category_id'];

    protected array $with = ['vehicleCategory'];

    protected function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', $this->uniqueRule('code', $id)],
            'name' => ['required', 'string', 'max:150'],
            'vehicle_category_id' => ['required', 'exists:vehicle_categories,id'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
