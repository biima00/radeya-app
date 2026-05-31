<?php

namespace Database\Factories;

use App\Models\Cycle;
use Illuminate\Database\Eloquent\Factories\Factory;

class CycleFactory extends Factory
{
    protected $model = Cycle::class;

    public function definition(): array
    {
        return [
            'name' => 'Cycle ' . ucfirst(fake()->word()),
            'animal' => fake()->randomElement(['Cow', 'Sheep', 'Chicken', 'Goat', 'Fish']),
            'scale' => fake()->numberBetween(1, 100),
            'mode' => fake()->randomElement(['AUTOMATIC', 'MANUAL', 'HYBRID']),
            'data' => [
                'temp' => fake()->numberBetween(18, 35) . 'C',
                'humidity' => fake()->numberBetween(40, 80) . '%',
                'status' => fake()->randomElement(['OK', 'WARNING', 'CRITICAL']),
                'last_checked' => now()->subMinutes(fake()->numberBetween(5, 120))->toDateTimeString(),
            ],
        ];
    }
}
