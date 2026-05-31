<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cycle extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'animal',
        'scale',
        'mode',
        'data',
        'org_id',
    ];

    protected $casts = [
        'scale' => 'integer',
        'data' => 'array',
    ];

    public function org(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'org_id');
    }
}
