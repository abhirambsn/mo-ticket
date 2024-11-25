"use client";

import { refundEventTickets } from "@/actions/refund-event-tickets";
import { useToast } from "@/hooks/use-toast";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type CancelEventButtonProps = {
  eventId: Id<"events">;
};

const CancelEventButton = ({ eventId }: CancelEventButtonProps) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const cancelEvent = useMutation(api.events.cancelEvent);

  const handleCancel = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this event? All Tickets will be refunded and event will be CANCELLED. This Action is IRREVERSIBLE."
      )
    )
      return;

    setIsCancelling(true);

    try {
      await refundEventTickets(eventId);
      await cancelEvent({ eventId });
      toast({
        title: "Event Cancelled",
        description:
          "Event has been cancelled and all tickets have been refunded.",
      });
      router.push("/seller/events");
    } catch (error) {
      console.error("Failed to cancel event", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel event",
      });
    } finally {
      setIsCancelling(false);
    }
  };
  return (
    <button
      onClick={handleCancel}
      disabled={isCancelling}
      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-900 transition-colors rounded-lg hover:bg-red-50"
    >
      <Ban className="w-4 h-4" />
      <span>{isCancelling ? "Processing..." : "Cancel Event"}</span>
    </button>
  );
};

export default CancelEventButton;
