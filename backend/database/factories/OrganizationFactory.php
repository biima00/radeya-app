<?php

namespace Database\Factories;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrganizationFactory extends Factory
{
    protected $model = Organization::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'plan' => fake()->randomElement(['FREE', 'PRO', 'ENTERPRISE']),
            'subscription_active' => fake()->boolean(80), // 80% active
            'subscription_end' => fake()->optional(0.8)->dateTimeBetween('now', '+1 year'),
        ];
    }
}
