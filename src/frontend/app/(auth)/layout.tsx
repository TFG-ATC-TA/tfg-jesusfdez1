export const metadata = {
  title: 'LactoKeeper - Login',
  description: 'Página de autentificación de LactoKeeper',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>{children}</>
  )
}
