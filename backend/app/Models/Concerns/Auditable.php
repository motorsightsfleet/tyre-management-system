<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(fn ($model) => $model->recordAudit('created', [], $model->getAttributes()));

        static::updated(function ($model) {
            $changes = $model->getChanges();
            unset($changes['updated_at']);

            if (empty($changes)) {
                return;
            }

            $original = collect($changes)->keys()
                ->mapWithKeys(fn ($key) => [$key => $model->getOriginal($key)])
                ->toArray();

            $model->recordAudit('updated', $original, $changes);
        });

        static::deleted(fn ($model) => $model->recordAudit('deleted', $model->getAttributes(), []));
    }

    protected function recordAudit(string $action, array $old, array $new): void
    {
        AuditLog::query()->create([
            'user_id' => Auth::id(),
            'action' => $action,
            'auditable_type' => static::class,
            'auditable_id' => $this->getKey(),
            'old_values' => $old ?: null,
            'new_values' => $new ?: null,
            'ip_address' => Request::ip(),
        ]);
    }
}
