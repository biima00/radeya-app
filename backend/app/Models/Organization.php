<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'plan',
        'subscription_active',
        'subscription_end',
    ];

    protected $casts = [
        'subscription_active' => 'boolean',
        'subscription_end' => 'datetime',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'org_id');
    }

    public function cycles(): HasMany
    {
        return $this->hasMany(Cycle::class, 'org_id');
    }
}
