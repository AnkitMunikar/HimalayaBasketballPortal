'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from './AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const navigate = (path) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full bg-[#2e0052] text-white px-4 md:px-12 py-4 flex items-center justify-between z-50 shadow-md">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden focus:outline-none"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? <XMarkIcon className="h-7 w-7" /> : <Bars3Icon className="h-7 w-7" />}
        </button>
        <ul className="hidden md:flex space-x-6 text-white font-medium">
          <li><span onClick={() => navigate('/')} className="cursor-pointer hover:text-blue-400">Home</span></li>
          {/* <li><span onClick={() => navigate('/schedule')} className="cursor-pointer hover:text-blue-400">Schedule</span></li>
          <li><span onClick={() => navigate('/stats')} className="cursor-pointer hover:text-blue-400">Stats</span></li> */}
          {user?.role === 'event_organizer' && (
            <>
              <li><span onClick={() => navigate('/organizer')} className="cursor-pointer hover:text-blue-400">Organizer Dashboard</span></li>
              <li><span onClick={() => navigate('/organizer/create')} className="cursor-pointer hover:text-blue-400">Create Events</span></li>
            </>
          )}
          {user?.role === 'coach' && (
            <li><span onClick={() => navigate('/coach')} className="cursor-pointer hover:text-blue-400">Coach Dashboard</span></li>
          )}
          {user?.role === 'admin' && (
            <li><span onClick={() => navigate('/admin/dashboard')} className="cursor-pointer hover:text-blue-400">Admin Panel</span></li>
          )}
          {user?.role === 'player' && (
            <li><span onClick={() => navigate('/player/dashboard')} className="cursor-pointer hover:text-blue-400">Dashboard</span></li>
          )}
          <li><span onClick={() => navigate('/Aboutus')} className="cursor-pointer hover:text-blue-400">About us</span></li>
        </ul>
      </div>

      <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 z-10">
        <img src="/logohim.png" alt="Logo" className="h-28 w-auto object-contain drop-shadow-lg" />
      </div>

      <div className="hidden sm:flex items-center space-x-4">
        {!user ? (
          <>
            <button onClick={() => navigate('/Signup')} className="bg-violet-800 p-2 px-3 rounded-3xl text-sm hover:bg-blue-500">Sign up</button>
            <button onClick={() => navigate('/Login')} className="bg-violet-800 p-2 px-3 rounded-3xl text-sm hover:bg-blue-500">Log in</button>
          </>
        ) : (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">Welcome, {user.name || user.username}</span>
            <button onClick={handleLogout} className="bg-red-600 p-2 px-3 rounded-3xl text-sm hover:bg-red-700">Logout</button>
          </div>
        )}
      </div>

      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#2e0052] shadow-md md:hidden">
          <ul className="flex flex-col space-y-4 p-4 text-white font-medium">
            <li><span onClick={() => navigate('/')} className="cursor-pointer hover:text-blue-400">Home</span></li>
            {/* <li><span onClick={() => navigate('/schedule')} className="cursor-pointer hover:text-blue-400">Schedule</span></li>
            <li><span onClick={() => navigate('/stats')} className="cursor-pointer hover:text-blue-400">Stats</span></li> */}
            {user?.role === 'event_organizer' && (
              <>
                <li><span onClick={() => navigate('/organizer')} className="cursor-pointer hover:text-blue-400">Organizer Dashboard</span></li>
                <li><span onClick={() => navigate('/organizer/create')} className="cursor-pointer hover:text-blue-400">Create Events</span></li>
              </>
            )}
            {user?.role === 'coach' && (
              <li><span onClick={() => navigate('/coach')} className="cursor-pointer hover:text-blue-400">Coach Dashboard</span></li>
            )}
            {user?.role === 'admin' && (
              <li><span onClick={() => navigate('/admin/dashboard')} className="cursor-pointer hover:text-blue-400">Admin Panel</span></li>
            )}
            {user?.role === 'player' && (
              <li><span onClick={() => navigate('/player/dashboard')} className="cursor-pointer hover:text-blue-400">Dashboard</span></li>
            )}
            <li><span onClick={() => navigate('/aboutus')} className="cursor-pointer hover:text-blue-400">About us</span></li>
            {!user ? (
              <>
                <li><span onClick={() => navigate('/signup')} className="cursor-pointer hover:text-blue-400">Sign up</span></li>
                <li><span onClick={() => navigate('/login')} className="cursor-pointer hover:text-blue-400">Log in</span></li>
              </>
            ) : (
              <>
                <li><span className="text-gray-300 text-sm">Welcome, {user.name || user.username}</span></li>
                <li><span onClick={handleLogout} className="cursor-pointer hover:text-red-400">Logout</span></li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}