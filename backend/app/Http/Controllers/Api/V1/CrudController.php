<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Generic list/search/filter/sort/paginate + CRUD for simple, schema-driven
 * entities (mostly Master Data and Settings lookups). Subclasses configure
 * behaviour via properties/hooks instead of re-implementing controller logic.
 */
abstract class CrudController extends Controller
{
    /** @var class-string<Model> */
    protected string $modelClass;

    /** @var string[] columns matched with a partial/ILIKE search */
    protected array $searchable = [];

    /** @var string[] columns allowed in ?sort_by= */
    protected array $sortable = ['id'];

    /** @var string[] columns allowed as exact-match filters (?field=value) */
    protected array $filterable = ['status'];

    /** @var string[] relations to eager load */
    protected array $with = [];

    protected string $defaultSort = 'id';

    protected string $defaultSortDir = 'desc';

    protected bool $softDeletable = true;

    public function index(Request $request): JsonResponse
    {
        $query = $this->baseQuery($request);

        if ($request->filled('search') && $this->searchable !== []) {
            $term = '%'.$request->string('search')->trim().'%';
            $query->where(function (Builder $q) use ($term) {
                foreach ($this->searchable as $field) {
                    $q->orWhere($field, 'ilike', $term);
                }
            });
        }

        foreach ($this->filterable as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        $sortBy = $request->input('sort_by', $this->defaultSort);
        $sortDir = strtolower((string) $request->input('sort_dir', $this->defaultSortDir)) === 'asc' ? 'asc' : 'desc';

        if (! in_array($sortBy, $this->sortable, true)) {
            $sortBy = $this->defaultSort;
        }

        $query->orderBy($sortBy, $sortDir);

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));

        $paginator = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, int|string $id): JsonResponse
    {
        $query = $this->modelClass::query();

        if ($this->with !== []) {
            $query->with($this->with);
        }

        if ($this->softDeletable) {
            $query->withTrashed();
        }

        $model = $query->findOrFail($id);

        return response()->json(['data' => $model]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        $model = $this->modelClass::create($data);

        return response()->json(['data' => $model], 201);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $model = $this->modelClass::query()->findOrFail($id);

        $data = $request->validate($this->rules($model->getKey()));

        $model->update($data);

        return response()->json(['data' => $model->fresh()]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $model = $this->modelClass::query()->findOrFail($id);
        $model->delete();

        return response()->json(null, 204);
    }

    public function restore(int|string $id): JsonResponse
    {
        $model = $this->modelClass::withTrashed()->findOrFail($id);
        $model->restore();

        return response()->json(['data' => $model]);
    }

    protected function baseQuery(Request $request): Builder
    {
        $query = $this->modelClass::query();

        if ($this->with !== []) {
            $query->with($this->with);
        }

        if ($this->softDeletable) {
            if ($request->boolean('only_trashed')) {
                $query->onlyTrashed();
            } elseif ($request->boolean('with_trashed')) {
                $query->withTrashed();
            }
        }

        return $query;
    }

    /**
     * @return array<string, mixed>
     */
    protected function rules(?int $id = null): array
    {
        return [];
    }

    protected function tableName(): string
    {
        return (new $this->modelClass)->getTable();
    }

    protected function uniqueRule(string $column, ?int $ignoreId = null): string
    {
        $rule = 'unique:'.$this->tableName().','.$column;

        return $ignoreId ? $rule.','.$ignoreId : $rule;
    }
}
