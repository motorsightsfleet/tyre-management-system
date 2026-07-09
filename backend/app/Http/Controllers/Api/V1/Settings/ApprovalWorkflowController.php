<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Api\V1\CrudController;
use App\Models\ApprovalWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApprovalWorkflowController extends CrudController
{
    protected string $modelClass = ApprovalWorkflow::class;

    protected array $searchable = ['code', 'name', 'module'];

    protected array $sortable = ['id', 'code', 'name', 'module'];

    protected array $filterable = ['module', 'is_active'];

    protected array $with = ['steps'];

    protected bool $softDeletable = false;

    protected function rules(?int $id = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', $this->uniqueRule('code', $id)],
            'name' => ['required', 'string', 'max:150'],
            'module' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'steps' => ['sometimes', 'array'],
            'steps.*.role_name' => ['required_with:steps', 'string', 'max:150'],
            'steps.*.description' => ['nullable', 'string'],
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $steps = $data['steps'] ?? null;
        unset($data['steps']);

        $workflow = DB::transaction(function () use ($data, $steps) {
            $workflow = ApprovalWorkflow::create($data);
            $this->syncSteps($workflow, $steps);

            return $workflow;
        });

        return response()->json(['data' => $workflow->load('steps')], 201);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $workflow = ApprovalWorkflow::query()->findOrFail($id);
        $data = $request->validate($this->rules($workflow->getKey()));
        $steps = $data['steps'] ?? null;
        unset($data['steps']);

        DB::transaction(function () use ($workflow, $data, $steps) {
            $workflow->update($data);
            $this->syncSteps($workflow, $steps);
        });

        return response()->json(['data' => $workflow->fresh('steps')]);
    }

    private function syncSteps(ApprovalWorkflow $workflow, ?array $steps): void
    {
        if ($steps === null) {
            return;
        }

        $workflow->steps()->delete();

        foreach ($steps as $index => $step) {
            $workflow->steps()->create([
                'step_order' => $index + 1,
                'role_name' => $step['role_name'],
                'description' => $step['description'] ?? null,
            ]);
        }
    }
}
