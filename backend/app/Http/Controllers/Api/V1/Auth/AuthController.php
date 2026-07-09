<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Auth\RefreshTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly RefreshTokenService $refreshTokens) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        if (! $token = Auth::guard('api')->attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::guard('api')->user();

        if (! $user->is_active) {
            Auth::guard('api')->logout();

            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        [$rawRefreshToken, $cookie] = $this->refreshTokens->issue($user, $request);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user' => new UserResource($user),
        ])->withCookie($cookie);
    }

    public function refresh(Request $request): JsonResponse
    {
        $raw = $request->cookie(env('REFRESH_TOKEN_COOKIE', 'refresh_token'));

        if (! $raw || ! ($refreshToken = $this->refreshTokens->findValid($raw))) {
            return response()->json(['message' => 'Refresh token is invalid or expired.'], 401);
        }

        $refreshToken->update(['revoked_at' => now()]);
        $user = $refreshToken->user;

        $newAccessToken = Auth::guard('api')->login($user);
        [$newRaw, $cookie] = $this->refreshTokens->issue($user, $request);

        return response()->json([
            'access_token' => $newAccessToken,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user' => new UserResource($user),
        ])->withCookie($cookie);
    }

    public function logout(Request $request): JsonResponse
    {
        $raw = $request->cookie(env('REFRESH_TOKEN_COOKIE', 'refresh_token'));

        if ($raw) {
            $this->refreshTokens->revoke($raw);
        }

        try {
            Auth::guard('api')->logout();
        } catch (\Throwable) {
            // token already invalid/expired — nothing further to invalidate
        }

        return response()->json(['message' => 'Logged out.'])->withCookie($this->refreshTokens->cookie(null));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => new UserResource($request->user())]);
    }
}
