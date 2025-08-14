"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function DisplayEvents() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/enroll/list/")
      .then((res) => {
        setEvents(res.data);
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
      });
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center">All Events</h1>
      <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-violet-700">{event.name}</h2>
            <p><strong>Date:</strong> {event.date}</p>
            <p><strong>Venue:</strong> {event.venue}</p>
            <p><strong>Category:</strong> {event.gender}</p>
            <p><strong>Level:</strong> {event.level}</p>
            <p><strong>Type:</strong> {event.duration_type}</p>
            <p><strong>Payment:</strong> {event.payment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
