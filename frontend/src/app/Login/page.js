'use client';
import Header from '@/components/Header';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <LoginForm />
    </main>
  );
}

