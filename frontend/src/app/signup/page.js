'use client'
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Register from "@/components/signup";
import Footer from "@/components/Footer";

export default function Signup() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      <div className=" pt-14">
        <Register/>
      </div>

      <Footer />
    </main>
  );
} 
 