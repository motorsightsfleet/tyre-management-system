<?php

namespace App\Http\Controllers\Api\V1\MasterData;

use App\Http\Controllers\Api\V1\CrudController;
use App\Models\InspectionChecklist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class InspectionChecklistController extends CrudController
{
    protected string $modelClass = InspectionChecklist::class;

    protected array $searchable = ['code', 'name'];

    protected array $sortable = ['id', 'code', 'name', 'status'];

    protected array $filterable = ['status', 'applies_to'];

    protected array $with = ['items'];

    protected function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', $this->uniqueRule('code', $id)],
            'name' => ['required', 'string', 'max:150'],
            'applies_to' => ['required', Rule::in(['daily', 'periodic', 'pressure', 'tread', 'damage', 'general'])],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'items' => ['sometimes', 'array'],
            'items.*.label' => ['required_with:items', 'string', 'max:255'],
            'items.*.is_required' => ['sometimes', 'boolean'],
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $items = $data['items'] ?? null;
        unset($data['items']);

        $checklist = DB::transaction(function () use ($data, $items) {
            $checklist = InspectionChecklist::create($data);
            $this->syncItems($checklist, $items);

            return $checklist;
        });

        return response()->json(['data' => $checklist->load('items')], 201);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $checklist = InspectionChecklist::query()->findOrFail($id);
        $data = $request->validate($this->rules($checklist->getKey()));
        $items = $data['items'] ?? null;
        unset($data['items']);

        DB::transaction(function () use ($checklist, $data, $items) {
            $checklist->update($data);
            $this->syncItems($checklist, $items);
        });

        return response()->json(['data' => $checklist->fresh('items')]);
    }

    private function syncItems(InspectionChecklist $checklist, ?array $items): void
    {
        if ($items === null) {
            return;
        }

        $checklist->items()->delete();

        foreach ($items as $index => $item) {
            $checklist->items()->create([
                'sort_order' => $index + 1,
                'label' => $item['label'],
                'is_required' => $item['is_required'] ?? true,
            ]);
        }
    }
}
