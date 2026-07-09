<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\V1\CrudController;
use App\Models\Supplier;
use Illuminate\Validation\Rule;

class SupplierController extends CrudController
{
    protected string $modelClass = Supplier::class;

    protected array $searchable = ['code', 'name', 'contact_name', 'email'];

    protected array $sortable = ['id', 'code', 'name', 'status'];

    protected function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', $this->uniqueRule('code', $id)],
            'name' => ['required', 'string', 'max:150'],
            'contact_name' => ['nullable', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
