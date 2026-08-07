import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  if (isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  async function onSubmit(data: LoginForm) {
    setSubmitError(null)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back')
      navigate('/dashboard', { replace: true })
    } catch {
      setSubmitError('Invalid email or password.')
    }
  }

  return (
    <div className="from-background via-background to-accent/40 relative flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-br p-4">
      <div
        className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--primary), transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -right-32 -bottom-32 size-96 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--accent-2), transparent 70%)' }}
      />

      <Card className="relative w-full max-w-sm shadow-xl">
        <CardHeader className="items-center text-center">
          <div className="from-primary to-accent-2 text-primary-foreground shadow-primary/30 mb-2 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold shadow-lg">
            T
          </div>
          <CardTitle className="text-xl">Tyre Management System</CardTitle>
          <CardDescription>Sign in to manage your fleet's tyres</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" autoComplete="username" {...register('email')} />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
              {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
            </div>
            {submitError && <p className="text-destructive text-sm">{submitError}</p>}
            <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
