// 'use client';
// import Header from '@/components/Header';
// import RegisterForm from '@/components/RegisterForm';

// export default function SignupPage() {
//   return (
//     <main className="min-h-screen flex flex-col bg-gray-50">
//       <Header />
//       <RegisterForm />
//     </main>
//   );
// }

"use client";
import { useState } from "react";
import api from "@/utils/api";

export default function SignupPage() {
  const [form, setForm] = useState({
    username: "", email: "", confirm_email: "",
    password: "", confirm_password: "",
    role: "player", name: "", phone: ""
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("signup/", form);
      setMessage("Registered successfully! Now login.");
    } catch (err) {
      setMessage("Error: " + JSON.stringify(err.response.data));
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Signup</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="name" placeholder="Full Name" className="border p-2 w-full" onChange={handleChange}/>
        <input name="username" placeholder="Username" className="border p-2 w-full" onChange={handleChange}/>
        <input type="email" name="email" placeholder="Email" className="border p-2 w-full" onChange={handleChange}/>
        <input type="email" name="confirm_email" placeholder="Confirm Email" className="border p-2 w-full" onChange={handleChange}/>
        <input type="password" name="password" placeholder="Password" className="border p-2 w-full" onChange={handleChange}/>
        <input type="password" name="confirm_password" placeholder="Confirm Password" className="border p-2 w-full" onChange={handleChange}/>
        <input name="phone" placeholder="Phone" className="border p-2 w-full" onChange={handleChange}/>
        <select name="role" className="border p-2 w-full" onChange={handleChange}>
          <option value="event_organizer">Event Organizer</option>
          <option value="coach">Coach</option>
          <option value="player">Player</option>
        </select>
        <button className="bg-blue-600 text-white p-2 w-full rounded">Register</button>
      </form>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}

import axios from 'axios';