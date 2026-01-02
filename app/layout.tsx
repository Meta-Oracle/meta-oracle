import './globals.css'

export const metadata = {
  title: 'META-ORACLE Crypto Terminal',
  description: 'Real-time cryptocurrency market analysis terminal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}