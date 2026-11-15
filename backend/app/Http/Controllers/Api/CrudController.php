<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

abstract class CrudController extends Controller
{
    /** @return class-string<Model> */
    abstract protected function modelClass(): string;

    /** @return array<string, mixed> */
    abstract protected function rules(?string $id = null): array;

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
        $item = $class::create($validated);

        return response()->json($this->toCamel($item->toArray()), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $class = $this->modelClass();
        $item = $class::findOrFail($id);

        $snakeInput = $this->toSnake($request->all());
        $validated = validator($snakeInput, $this->rules($id))->validate();
        $item->update($validated);

        return response()->json($this->toCamel($item->fresh()->toArray()));
    }

    public function destroy(string $id): JsonResponse
    {
        $class = $this->modelClass();
        $item = $class::findOrFail($id);
        $item->delete();

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
