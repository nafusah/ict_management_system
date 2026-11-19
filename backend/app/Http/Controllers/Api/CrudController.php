<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppUser;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

abstract class CrudController extends Controller
{
    /** @return class-string<Model> */
    abstract protected function modelClass(): string;

    /** @return array<string, mixed> */
    abstract protected function rules(?string $id = null): array;

    protected function entityType(): string
    {
        return Str::snake(class_basename($this->modelClass()));
    }

    protected function itemLabel(Model $item): string
    {
        return (string) ($item->getAttribute('name')
            ?? $item->getAttribute('label')
            ?? $item->getAttribute('model')
            ?? $item->getAttribute('service_name')
            ?? $item->getKey());
    }

    protected function currentUser(Request $request): ?AppUser
    {
        /** @var AppUser|null */
        return $request->attributes->get('app_user');
    }

    public function index(): JsonResponse
    {
        $class = $this->modelClass();
        $items = $class::query()->orderBy('id')->get()->map(fn (Model $m) => $this->toCamel($m->toArray()));

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $snakeInput = $this->toSnake($request->all());
        $validated = validator($snakeInput, $this->rules())->validate();

        $class = $this->modelClass();
        $item = null;
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            try {
                $item = $class::create($validated);
                break;
            } catch (UniqueConstraintViolationException $e) {
                // طلبان متزامنان حصلا على نفس الرقم؛ نعيد المحاولة برقم جديد
                if ($attempt === 5) {
                    throw $e;
                }
                usleep(random_int(20_000, 120_000));
            }
        }

        AuditLog::record(
            $this->currentUser($request),
            'created',
            $this->entityType(),
            (string) $item->getKey(),
            'إضافة: '.$this->itemLabel($item),
            null,
            $item->toArray(),
            $request,
        );

        return response()->json($this->toCamel($item->toArray()), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $class = $this->modelClass();
        $item = $class::findOrFail($id);
        $before = $item->toArray();

        $snakeInput = $this->toSnake($request->all());
        $validated = validator($snakeInput, $this->rules($id))->validate();
        $item->update($validated);
        $after = $item->fresh()->toArray();

        AuditLog::record(
            $this->currentUser($request),
            'updated',
            $this->entityType(),
            (string) $item->getKey(),
            'تعديل: '.$this->itemLabel($item),
            $before,
            $after,
            $request,
        );

        return response()->json($this->toCamel($after));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $class = $this->modelClass();
        $item = $class::findOrFail($id);
        $before = $item->toArray();
        $label = $this->itemLabel($item);
        $item->delete();

        AuditLog::record(
            $this->currentUser($request),
            'deleted',
            $this->entityType(),
            $id,
            'حذف: '.$label,
            $before,
            null,
            $request,
        );

        return response()->json(['deleted' => true]);
    }

    /** @param array<string, mixed> $data */
    protected function toSnake(array $data): array
    {
        $out = [];
        foreach ($data as $key => $value) {
            $out[Str::snake($key)] = $value;
        }
        return $out;
    }

    /** @param array<string, mixed> $data */
    protected function toCamel(array $data): array
    {
        $out = [];
        foreach ($data as $key => $value) {
            if (in_array($key, ['created_at', 'updated_at'], true)) {
                continue;
            }
            $out[Str::camel($key)] = $value;
        }
        return $out;
    }
}
