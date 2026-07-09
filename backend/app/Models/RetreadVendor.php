<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RetreadVendor extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = ['code', 'name', 'contact_name', 'phone', 'email', 'address', 'status'];
}
