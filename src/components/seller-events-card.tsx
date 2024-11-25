"use client";

import { useStorageUrl } from "@/lib/utils";
import { Doc } from "@convex/_generated/dataModel";
import { Metrics } from "@convex/events";
import {
  Ban,
  Banknote,
  CalendarDays,
  Edit,
  InfoIcon,
  Ticket,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { Fragment } from "react";
import CancelEventButton from "./cancel-event-button";

type Props = {
  event: Doc<"events"> & {
    metrics: Metrics;
  };
};

const SellerEventsCard = ({ event }: Props) => {
  const imageUrl = useStorageUrl(event.imageStorageId);
  const isPastEvent = event.eventDate < Date.now();

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border ${event.isCancelled ? "border-red-200" : "border-gray-200"} overflow-hidden`}
    >
      <div className="p-6">
        <div className="flex items-start gap-6">
          {imageUrl && (
            <div className="relative w-40 h-40 rounded-lg overflow-hidden shrink-0">
              <Image
                src={imageUrl}
                alt={event.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {event.name}
                </h3>
                <p className="mt-1 text-gray-500">{event.description}</p>
                {event.isCancelled && (
                  <div className="mt-2 flex items-center gap-2 text-red-600">
                    <Ban className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Event Cancelled and Refunded
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isPastEvent && !event.isCancelled && (
                  <Fragment>
                    <Link
                      href={`/seller/events/${event._id}/edit`}
                      className="shrink-0 flex items-center gap-2 px-4 py-2
                        text-sm font-medium text-gray-700 bg-gray-100 rounded-lg
                        hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>

                    <CancelEventButton eventId={event._id} />
                  </Fragment>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Ticket className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {event.isCancelled ? "Tickets Refunded" : "Tickets Sold"}
                  </span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {event.isCancelled ? (
                    <Fragment>
                      {event.metrics.refundedTickets}
                      <span className="text-sm text-gray-500 font-normal">
                        / {event.totalTickets} Refunded
                      </span>
                    </Fragment>
                  ) : (
                    <Fragment>
                      {event.metrics.soldTickets}
                      <span className="text-sm text-gray-500 font-normal">
                        / {event.totalTickets} Sold
                      </span>
                    </Fragment>
                  )}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-sm font-medium">Date</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(event.eventDate).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Banknote className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {event.isCancelled ? "Amount Refunded" : "Revenue"}
                  </span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  ${" "}
                  {event.isCancelled
                    ? event.metrics.refundedTickets * event.price
                    : event.metrics.revenue}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <InfoIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {event.isCancelled
                    ? "Cancelled"
                    : isPastEvent
                      ? "Ended"
                      : "Active"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerEventsCard;
