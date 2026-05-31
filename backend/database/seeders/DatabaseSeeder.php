<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Buat Organisasi Default
        $org = \App\Models\Organization::create([
            'name' => 'Radeya Dev',
            'plan' => 'PRO',
            'subscription_active' => true,
            'subscription_end' => now()->addYear(),
        ]);

        // 2. Buat User Admin ke Organisasi tersebut
        User::create([
            'name' => 'Admin Radeya',
            'email' => 'admin@radeya.com',
            'password' => bcrypt('password'), // password default
            'role' => 'ADMIN',
            'org_id' => $org->id,
        ]);

        // 3. Buat Organisasi, User, dan Cycles Tambahan via Factory
        \App\Models\Organization::factory(10)->create()->each(function ($organization) {
            // Buat 5 User untuk setiap organisasi
            User::factory(5)->create([
                'org_id' => $organization->id,
                'role' => 'MEMBER',
            ]);

            // Buat 20 Cycle untuk setiap organisasi
            \App\Models\Cycle::factory(20)->create([
                'org_id' => $organization->id,
            ]);
        });
    }
}
