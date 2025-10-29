'use client'
import Header from "@/components/Header";
import DisplayForm from "@/components/DisplayForm";

export default function DisplayEventsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex flex-col px-4 md:px-12 py-6 space-y-10 pt-24">
        <DisplayForm />
      </div>

      {/* <Footer /> */}
    </main>
  );
}
