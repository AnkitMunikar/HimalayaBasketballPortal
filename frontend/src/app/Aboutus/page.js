'use client';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Trophy, Users, Calendar, MapPin, Shield, CreditCard, Target, Zap, Mail, Phone } from 'lucide-react';

export default function AboutUsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-[#2e0052] via-purple-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 container mx-auto px-4 md:px-8 text-center max-w-4xl">
          <div className="inline-flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 text-amber-300 text-sm font-medium">
            <Trophy className="w-5 h-5" />
            <span>Basketball Event & Community Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight font-fjalla-one mb-6">
            HIMALAYA Basketball Portal
          </h1>
          <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto leading-relaxed">
            We connect players, coaches, and organizers across Nepal—bringing tournaments, leagues, and basketball events to one place. Register events, enroll teams, and grow the game together.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-fjalla-one text-center mb-12">
            Our Mission & Vision
          </h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-10 h-10 text-[#2e0052]" />
                <h3 className="text-xl font-bold text-gray-900 font-fjalla-one">Mission</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                To make basketball events easy to discover, register, and manage. We give organizers tools to create and get events approved, coaches a simple way to enroll teams, and players a clear path to compete—all with secure payments and a single, trusted platform.
              </p>
            </div>
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-10 h-10 text-amber-600" />
                <h3 className="text-xl font-bold text-gray-900 font-fjalla-one">Vision</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                A thriving basketball ecosystem in Nepal where every tournament and league is visible, every team can sign up with confidence, and payments are safe and transparent. We aim to be the go-to platform for basketball events and community growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-fjalla-one text-center mb-4">
            What We Offer
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Whether you organize events, coach a team, or play—the platform is built for you.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-100 transition-all">
              <div className="w-14 h-14 rounded-xl bg-[#2e0052] text-white flex items-center justify-center mb-5">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-fjalla-one mb-3">Event Organizers</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Create and submit tournaments or leagues. Add venue, dates, payment (free or paid), max teams, and upload logos and venue receipts. Events go through admin approval, then go live for coaches and players to see and enroll.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Event creation & approval workflow</li>
                <li>• Logo & document uploads</li>
                <li>• Manage your events in one dashboard</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-100 transition-all">
              <div className="w-14 h-14 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-5">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-fjalla-one mb-3">Coaches</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Browse approved events, enroll your teams, and add player details (name, DOB, jersey, position). For paid events, complete registration securely with Khalti. Track all your enrollments and team details in your coach dashboard.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Browse events (recent first)</li>
                <li>• Team enrollment with player roster</li>
                <li>• Secure payment via Khalti</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-100 transition-all">
              <div className="w-14 h-14 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-5">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-fjalla-one mb-3">Players & Fans</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Discover upcoming events and tournaments. See event details, venues, dates, and payment info. Players are registered by their coaches; you can follow events and stay in the loop as part of the HIMALAYA basketball community.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Discover events and venues</li>
                <li>• Clear event info and dates</li>
                <li>• Community-focused experience</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works & Features */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-fjalla-one text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-50 border border-gray-100">
              <span className="w-12 h-12 rounded-full bg-[#2e0052] text-white flex items-center justify-center font-bold text-lg mb-3">1</span>
              <h4 className="font-bold text-gray-900 mb-2">Sign Up</h4>
              <p className="text-sm text-gray-600">Register as Organizer, Coach, or Player. Verify your email to get started.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-50 border border-gray-100">
              <span className="w-12 h-12 rounded-full bg-[#2e0052] text-white flex items-center justify-center font-bold text-lg mb-3">2</span>
              <h4 className="font-bold text-gray-900 mb-2">Events</h4>
              <p className="text-sm text-gray-600">Organizers create events; admins approve. Events go live for everyone to see.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-50 border border-gray-100">
              <span className="w-12 h-12 rounded-full bg-[#2e0052] text-white flex items-center justify-center font-bold text-lg mb-3">3</span>
              <h4 className="font-bold text-gray-900 mb-2">Enroll</h4>
              <p className="text-sm text-gray-600">Coaches enroll teams, add players. Pay for events securely with Khalti when required.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-50 border border-gray-100">
              <span className="w-12 h-12 rounded-full bg-[#2e0052] text-white flex items-center justify-center font-bold text-lg mb-3">4</span>
              <h4 className="font-bold text-gray-900 mb-2">Play</h4>
              <p className="text-sm text-gray-600">Show up at the venue. Compete, connect, and grow the game.</p>
            </div>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-6 rounded-xl border border-gray-200 bg-gray-50/50">
              <Shield className="w-8 h-8 text-[#2e0052] flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Secure & Verified</h4>
                <p className="text-sm text-gray-600">Email verification, strong passwords, and admin-approved events so you can trust what you see.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-xl border border-gray-200 bg-gray-50/50">
              <CreditCard className="w-8 h-8 text-[#2e0052] flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Khalti Payments</h4>
                <p className="text-sm text-gray-600">Pay for events safely with Khalti. Free events don’t require payment—just enroll.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-xl border border-gray-200 bg-gray-50/50">
              <MapPin className="w-8 h-8 text-[#2e0052] flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Nepal-Focused</h4>
                <p className="text-sm text-gray-600">Built for Nepali cities and venues. Find events near you and grow the local basketball scene.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-fjalla-one text-center mb-4">
            Contact Us
          </h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto mb-10">
            Have questions or need support? Reach out via email or phone.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center sm:items-stretch">
            <a
              href="mailto:anki.mk56@gmail.com"
              className="flex items-center gap-4 p-6 rounded-xl bg-white border border-gray-200 shadow-md hover:shadow-lg hover:border-[#2e0052]/30 transition-all w-full sm:max-w-xs"
            >
              <div className="w-12 h-12 rounded-full bg-[#2e0052] text-white flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900 font-semibold break-all">anki.mk56@gmail.com</p>
              </div>
            </a>
            <a
              href="tel:98000000"
              className="flex items-center gap-4 p-6 rounded-xl bg-white border border-gray-200 shadow-md hover:shadow-lg hover:border-[#2e0052]/30 transition-all w-full sm:max-w-xs"
            >
              <div className="w-12 h-12 rounded-full bg-[#2e0052] text-white flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-gray-900 font-semibold">98000000</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#2e0052] via-purple-900 to-slate-900 text-white">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-fjalla-one mb-4">
            Join the HIMALAYA Basketball Community
          </h2>
          <p className="text-purple-100 text-lg mb-8">
            Create an account, verify your email, and start discovering or organizing basketball events today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/Signup')}
              className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-xl font-bold bg-amber-500 text-gray-900 hover:bg-amber-400 transition-colors shadow-lg"
            >
              Join Our Community
            </button>
            <button
              onClick={() => router.push('/Login')}
              className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-xl font-bold bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 transition-colors"
            >
              Log In
            </button>
          </div>
          <p className="mt-6 text-sm text-purple-200">
            Already have an account? Log in to access your dashboard and events.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
