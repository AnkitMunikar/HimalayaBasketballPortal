'use client';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const router = useRouter();

  const navigate = (path) => {
    router.push(path);
  };

  return (
    <footer className="bg-[#2e0052] text-white py-8 px-4 md:px-12 flex flex-col md:flex-row items-center justify-between shadow-md">
      <div className="flex flex-col items-center md:items-start mb-6 md:mb-0">
        <img src="/logohim.png" alt="Logo" className="h-16 w-auto object-contain mb-4" />
      </div>

      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-12">
        <ul className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-sm font-medium">
          <li>
            <span onClick={() => navigate('/')} className="cursor-pointer hover:text-blue-400">
              Home
            </span>
          </li>
          <li>
            <span onClick={() => navigate('/schedule')} className="cursor-pointer hover:text-blue-400">
              Schedule
            </span>
          </li>
          <li>
            <span onClick={() => navigate('/Aboutus')} className="cursor-pointer hover:text-blue-400">
              About Us
            </span>
          </li>
          <li>
            <span onClick={() => navigate('/contact')} className="cursor-pointer hover:text-blue-400">
              Contact
            </span>
          </li>
        </ul>
      </div>
    </footer>
  );
}