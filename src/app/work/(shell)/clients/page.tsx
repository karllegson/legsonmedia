import { redirect } from "next/navigation";
import { ClientsManager } from "@/components/work/ClientsManager";
import { getWorkSession, requireWorkManager } from "@/lib/work/auth.server";
import { listClientsWithRetainers } from "@/lib/work/clients.server";

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

  const clients = await listClientsWithRetainers();

  return <ClientsManager clients={clients} />;
}
