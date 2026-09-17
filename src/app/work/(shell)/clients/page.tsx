import { redirect } from "next/navigation";
import { ClientsManager } from "@/components/work/ClientsManager";
import { getWorkSession, requireWorkManager } from "@/lib/work/auth.server";
import { listClientsWithRetainers } from "@/lib/work/clients.server";
import { isOwnerRole } from "@/lib/work/roles";

export default async function WorkClientsPage() {
  const session = await getWorkSession();
  if (!session) {
    return null;
  }

  try {
    await requireWorkManager();
  } catch {
    redirect("/work");
  }

  const clientsRaw = await listClientsWithRetainers();
  const isOwner = isOwnerRole(session.profile.role);
  const clients = isOwner
    ? clientsRaw
    : clientsRaw.map((client) =>
        client.retainer
          ? {
              ...client,
              retainer: { ...client.retainer, hourlyRate: 0 },
            }
          : client,
      );

  return (
    <ClientsManager clients={clients} role={session.profile.role} />
  );
}
