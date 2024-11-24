"use client";

import { useStorageUrl } from "@/lib/utils";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import React from "react";
import Spinner from "./spinner";
import Image from "next/image";
import { CalendarDays, IdCard, MapPin, TicketIcon, User } from "lucide-react";
import QRCode from "react-qr-code";

type TicketProps = {
  ticketId: Id<"tickets">;
};

const Ticket = ({ ticketId }: TicketProps) => {
  const ticket = useQuery(api.tickets.getTicketWithDetails, { ticketId });
  const user = useQuery(api.users.getUserById, {
    userId: ticket?.userId ?? "",
  });

  const imageUrl = useStorageUrl(ticket?.event?.imageStorageId);

  if (!ticket || !ticket.event || !user) {
    return <Spinner />;
  }

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-xl border ${ticket.event?.isCancelled ? "border-red-200" : "border-gray-100"}`}
    >
      <div className="relative">
        {imageUrl && (
          <div className="relative w-full aspect-[21/9]">
            <Image
              src={imageUrl}
              alt={ticket.event.name}
              fill
              className={`object-cover object-center ${ticket.event?.isCancelled && "opacity-50"}`}
              priority
            />
            <div className="absolute inset-0 bg-graident-to-b from-black/50 to-black/90" />
          </div>
        )}
        <div
          className={`px-6 py-4 ${imageUrl ? "absolute bottom-0 left-0 right-0" : ticket.event?.isCancelled ? "bg-red-600" : "bg-blue-600"}`}
        >
          <h2
            className={`text-2xl font-bold ${imageUrl || !imageUrl ? "text-white" : "text-black"}`}
          >
            {ticket.event.name}
          </h2>
          {ticket.event?.isCancelled && (
            <p className="text-red-300 mt-1">This event has been cancelled!</p>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center text-gray-600">
              <CalendarDays
                className={`w-5 h-5 mr-3 ${ticket.event?.isCancelled ? "text-red-600" : "text-blue-600"}`}
              />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">
                  {new Date(ticket.event.eventDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <MapPin
                className={`w-5 h-5 mr-3 ${ticket.event?.isCancelled ? "text-red-600" : "text-blue-600"}`}
              />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{ticket.event.location}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <User
                className={`w-5 h-5 mr-3 ${ticket.event?.isCancelled ? "text-red-600" : "text-blue-600"}`}
              />
              <div>
                <p className="text-sm text-gray-500">Ticket Holder</p>
                <p className="font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <IdCard
                className={`w-5 h-5 mr-3 ${ticket.event?.isCancelled ? "text-red-600" : "text-blue-600"}`}
              />
              <div>
                <p className="text-sm text-gray-500">Ticket Holder ID</p>
                <p className="font-medium">{user.userId}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <TicketIcon
                className={`w-5 h-5 mr-3 ${ticket.event?.isCancelled ? "text-red-600" : "text-blue-600"}`}
              />
              <div>
                <p className="text-sm text-gray-500">Ticket Price</p>
                <p className="font-medium">{ticket.event.price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border-l border-gray-200 pl-6">
            <div
              className={`bg-gray-100 p-4 rounded-lg ${ticket.event?.isCancelled && "opacity-50"}`}
            >
              <QRCode value={ticket._id} className="w-32 h-32" />
            </div>
            <p className="mt-2 text-sm text-gray-500 break-all text-center max-w-[200px] md:max-w-full">
              Ticket ID: {ticket._id}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Important Information
          </h3>
          {ticket.event.isCancelled ? (
            <p className="text-sm text-red-600">
              This event has been cancelled. A refund will be processed if it
              has&apos;nt been already.
            </p>
          ) : (
            <ul className="text-sm text-gray-600 space-y-1 list-disc">
              <li>Please arrive 30 minutes before the event.</li>
              <li>Have your QR Ticket ready for scanning.</li>
              <li>This ticket is Non-Refundable.</li>
            </ul>
          )}
        </div>
      </div>

      <div className={`${ticket.event?.isCancelled ? "bg-red-50" : "bg-gray-50"} px-6 py-4 flex justify-between items-center`}>
        <span className="text-sm text-gray-500">
            Purchase Date: {new Date(ticket.purchasedOn).toLocaleString()}
        </span>
        <span className={`text-sm font-medium ${ticket.event?.isCancelled ? "text-red-600" : "text-blue-600"}`}>
            {ticket.event?.isCancelled ? "Cancelled" : "Valid Ticket"}
        </span>
      </div>
    </div>
  );
};

export default Ticket;
