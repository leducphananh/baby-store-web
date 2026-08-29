import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/features/auth/components/login-form'

function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-linear-to-b from-pastel-pink/40 via-background to-info/20 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <img
          src="/branding/favicon.png"
          alt="Baby Wale"
          className="size-28 rounded-full object-cover shadow-soft"
        />

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Baby Wale</CardTitle>
            <CardDescription>Đăng nhập để quản lý cửa hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { LoginPage }
