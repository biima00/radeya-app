<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Semua user terautentikasi bisa melihat user lain di tenant-nya
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        return $user->org_id === $model->org_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->role === 'ADMIN'; // Hanya ADMIN yang boleh membuat user baru
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        return $user->role === 'ADMIN' && $user->org_id === $model->org_id; // Hanya ADMIN dari organisasi yang sama
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, User $model): bool
    {
        return $user->role === 'ADMIN' && $user->org_id === $model->org_id && $user->id !== $model->id; // Tidak boleh menghapus diri sendiri
    }
}
