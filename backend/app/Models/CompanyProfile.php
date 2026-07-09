<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;

class CompanyProfile extends Model
{
    use Auditable;

    protected $table = 'company_profile';

    protected $fillable = ['name', 'legal_name', 'address', 'tax_id', 'phone', 'email', 'logo_url'];
}
