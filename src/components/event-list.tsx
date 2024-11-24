"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import React, { Fragment } from "react";
import Spinner from "./spinner";
import { CalendarDays, Ticket } from "lucide-react";
import EventCard from "./event-card";

const EventList = () => {
  const events = useQuery(api.events.get);

  if (!events) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner
          title="Loading Events"
          subtitle="Please wait while events are fetched..."
        />
      </div>
    );
  }

  const upcomingEvents = events
    .filter((event) => event.eventDate > Date.now())
    .sort((a, b) => a.eventDate - b.eventDate);

  const pastEvents = events
    .filter((event) => event.eventDate <= Date.now())
    .sort((a, b) => b.eventDate - a.eventDate);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
          <p className="mt-2 text-gray-600">
            Discover &amp; book tickets for amazing events.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarDays className="w-5 h-5" />
            <span className="font-medium">{upcomingEvents.length} Events</span>
          </div>
        </div>
      </div>
      {upcomingEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {upcomingEvents.map((event) => (
            <EventCard key={event._id} eventId={event._id} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-12 text-center mb-12">
          <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg text-gray-900 font-medium">
            No upcoming events.
          </h3>
          <p className="text-gray-600 mt-1">Check back later for new events.</p>
        </div>
      )}

      {pastEvents.length > 0 && (
        <Fragment>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map(event => (
                    <EventCard key={event._id} eventId={event._id} />
                ))}
            </div>
        </Fragment>
      )}
    </div>
  );
};

export default EventList;