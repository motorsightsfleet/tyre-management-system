<?php

namespace App\Models;

use App\Models\Concerns\Auditable;

class CompanyProfile extends \Illuminate\Database\Eloquent\Model
{
    use Auditable;

    protected $table = 'company_profile';

    protected $fillable = ['name', 'legal_name', 'address', 'tax_id', 'phone', 'email', 'logo_url'];
}
