"use client";

import Ticket from "@/components/ticket";
import { useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import Link from "next/link";
import { redirect, useParams } from "next/navigation";
import React, { useEffect } from "react";

function TicketPage() {
  const params = useParams();
  const { user } = useUser();
  const ticket = useQuery(api.tickets.getTicketWithDetails, {
    ticketId: params.id as Id<"tickets">,
  });

  useEffect(() => {
    if (!user) redirect("/");
    if (!ticket || !(ticket.userId === user.id)) redirect("/tickets");
    if (!ticket.event) redirect("/tickets");
  }, [user, ticket]);

  if (!ticket || !ticket.event) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w 4xl mx-auto">
        <div className="mb-8 space-y-8">
          <div className="flex items-center justify-between">
            <Link
              href="/tickets"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Tickets
            </Link>
            <div className="flex items-center gap-4">
              <button
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors
                rounded-lg hover:bg-gray-100"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Save</span>
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors
                rounded-lg hover:bg-gray-100"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Share</span>
              </button>
            </div>
          </div>

          <div
            className={`bg-white p-6 rounded-lg shadow-sm border ${ticket.event?.isCancelled ? "border-red-200" : "border-gray-100"}`}
          >
            <h1 className="text-2xl font-bold text-gray-900">
              {ticket.event.name}
            </h1>
            <p className="mt-1 text-gray-600">
              {new Date(ticket.event.eventDate).toLocaleString()} at{" "}
              {ticket.event.location}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  ticket.event.isCancelled
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {ticket.event.isCancelled ? "Cancelled" : "Valid Ticket"}
              </span>
              <span className="text-sm text-gray-500">
                Purchased on {new Date(ticket.purchasedOn).toLocaleString()}
              </span>
            </div>

            {ticket.event.isCancelled && (
              <p className="mt-4 text-sm text-red-600">
                This event has been cancelled. A refund will be processed if it
                has&apos;nt been already.
              </p>
            )}
          </div>
        </div>

        <Ticket ticketId={ticket._id} />

        <div
          className={`mt-8 rounded-lg p-4 ${
            ticket.event.isCancelled
              ? "bg-red-50 border-red-600 border"
              : "bg-blue-50 border-blue-600 border"
          }`}
        >
          <h3
            className={`text-sm font-medium ${
              ticket.event.isCancelled ? "text-red-900" : "text-blue-900"
            }`}
          >
            Need Help?
          </h3>
          <p
            className={`mt-1 text-sm ${
              ticket.event.isCancelled ? "text-red-700" : "text-blue-700"
            }`}
          >
            {ticket.event.isCancelled
              ? "For questions about refunds or cancellations, please contact our support team at help@moticket.com"
              : "If you have any issues with your ticket, please contact our support team at help@moticket.com"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TicketPage;
