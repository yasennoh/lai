import './globals.css'
import type { Metadata } from 'next'
import ClientLayout from './ClientLayout'
import { LanguageProvider } from './components/LanguageContext'
import { CurrencyProvider } from './components/CurrencyContext'
import { ThemeProvider } from './components/ThemeContext'

export const metadata: Metadata = {
  title: 'Insurance System CRM',
  description: 'Complete Insurance Management System with CRM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body suppressHydrationWarning>
        <LanguageProvider>
          <CurrencyProvider>
            <ThemeProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </ThemeProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

