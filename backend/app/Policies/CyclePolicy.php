<?php

namespace App\Policies;

use App\Models\Cycle;
use App\Models\User;

class CyclePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Cycle $cycle): bool
    {
        return $user->org_id === $cycle->org_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true; // Semua user di tenant bisa membuat Cycle
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Cycle $cycle): bool
    {
        return $user->org_id === $cycle->org_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Cycle $cycle): bool
    {
        return $user->role === 'ADMIN' && $user->org_id === $cycle->org_id; // Hanya ADMIN tenant yang bisa menghapus Cycle
    }
}
