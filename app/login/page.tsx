import LoginForm from '@/components/LoginForm'

type LoginSearchParams = Promise<{ mode?: string | string[]; auth?: string | string[] }>

export default async function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  const params = await searchParams
  const mode = params.mode === 'signup' ? 'signup' : 'login'
  return <LoginForm initialMode={mode} authFailed={params.auth === 'failed'} />
}
