'use client';
import Header from '@/components/Header';
import LoginForm from '@/components/LoginForm';
import Footer from '@/components/Footer';
export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <LoginForm />
      <div>
        <Footer/>
      </div>
    </main>
  );
}

