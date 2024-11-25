"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import React from "react";
import SellerEventsCard from "./seller-events-card";

export default function SellerEventList() {
  const { user } = useUser();
  const events = useQuery(api.events.getSellerEvents, {
    userId: user?.id ?? "",
  });

  if (!events) return null;

  const upcomingEvents = events.filter((event) => event.eventDate > Date.now());
  const pastEvents = events.filter((event) => event.eventDate <= Date.now());
  return (
    <div className="mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Upcoming Events
        </h2>
        <div className="grid grid-cols-1 gap-6">
          {upcomingEvents.map((event) => (
            <SellerEventsCard key={event._id} event={event} />
          ))}
          {upcomingEvents.length === 0 && (
            <p className="text-gray-500">No upcoming events.</p>
          )}
        </div>
      </div>

      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Events</h2>
          <div className="grid grid-cols-1 gap-6">
            {pastEvents.map((event) => (
              <SellerEventsCard key={event._id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
