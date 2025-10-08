"use client";

interface TicketCardProps {
  ticket: {
    id: string;
    titulo: string;
    estado: string;
    prioridad?: string;
    fecha_creacion?: string;
  };
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const statusColor = {
    ACTIVO: "bg-green-100 text-green-700",
    PAUSADO: "bg-yellow-100 text-yellow-700",
    COMPLETADO: "bg-blue-100 text-blue-700",
    CANCELADO: "bg-red-100 text-red-700",
  }[ticket.estado] || "bg-gray-100 text-gray-700";

  return (
    <div className="p-3 rounded-lg border border-gray-200 shadow-sm bg-white hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{ticket.titulo}</h3>
        <span
          className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor}`}
        >
          {ticket.estado}
        </span>
      </div>

      <p className="text-xs text-gray-500 mt-1">
        Ticket ID: {ticket.id} •{" "}
        {ticket.fecha_creacion
          ? new Date(ticket.fecha_creacion).toLocaleDateString()
          : "No date"}
      </p>

      {ticket.prioridad && (
        <p className="text-xs mt-2">
          <span className="font-medium">Priority:</span> {ticket.prioridad}
        </p>
      )}
    </div>
  );
}
