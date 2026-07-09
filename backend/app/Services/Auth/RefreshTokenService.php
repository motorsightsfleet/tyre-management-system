<?php

namespace App\Services\Auth;

use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie;

class RefreshTokenService
{
    /**
     * @return array{0: string, 1: Cookie}
     */
    public function issue(User $user, Request $request): array
    {
        $raw = Str::random(80);

        RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $raw),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'ip_address' => $request->ip(),
            'expires_at' => now()->addMinutes((int) config('jwt.refresh_ttl')),
        ]);

        return [$raw, $this->cookie($raw)];
    }

    public function findValid(string $raw): ?RefreshToken
    {
        return RefreshToken::query()
            ->where('token_hash', hash('sha256', $raw))
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();
    }

    public function revoke(string $raw): void
    {
        $this->findValid($raw)?->update(['revoked_at' => now()]);
    }

    public function cookie(?string $raw): Cookie
    {
        return cookie(
            name: env('REFRESH_TOKEN_COOKIE', 'refresh_token'),
            value: $raw ?? '',
            minutes: $raw ? (int) config('jwt.refresh_ttl') : -1,
            path: '/api/v1/auth',
            domain: null,
            secure: app()->environment('production'),
            httpOnly: true,
            raw: false,
            sameSite: 'lax'
        );
    }
}
