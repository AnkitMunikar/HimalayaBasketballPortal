'use client';
import { useRouter } from 'next/navigation';

export default function About() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-800 text-center mb-6">About Hoop Source</h1>
        
        <div className="space-y-4 text-gray-600">
          <p>
            Hoop Source is a community platform dedicated to connecting basketball enthusiasts—players, coaches, and event organizers—across the globe. Our mission is to foster a vibrant, inclusive space where everyone can share their passion for the game, find opportunities to play, coach, or organize events, and grow together as a community.
          </p>
          <p>
            Whether you're a player looking for your next game, a coach sharing expertise, or an event organizer bringing people together, Hoop Source provides the tools and connections to make it happen. We believe in the power of basketball to unite people, inspire growth, and create lasting memories.
          </p>
          <p>
            Join us today and become part of a community that lives and breathes basketball. From local pickup games to professional coaching networks, Hoop Source is your home for everything hoops.
          </p>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/signup')}
            className="inline-block py-2 px-4 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700"
          >
            Join Our Community
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already a member?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:underline"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}