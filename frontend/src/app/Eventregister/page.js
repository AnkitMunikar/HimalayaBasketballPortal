'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventRegister from '../Coach/Dashboard/Eventregister';
export default function Eventregister() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <EventRegister/>
      <div>
        <Footer/>
      </div>
    </main>
  );
}

