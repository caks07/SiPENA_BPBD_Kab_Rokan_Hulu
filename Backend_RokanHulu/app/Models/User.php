<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
    protected $table = 'users';
    protected $fillable = ['name','username','password','role_id','kecamatan_id','is_active'];
    protected $hidden = ['password','remember_token'];

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }
}
