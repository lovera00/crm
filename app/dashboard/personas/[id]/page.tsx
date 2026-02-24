import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import FichaPersona from "./ficha-persona";

interface PersonaDetailsPageProps {
  params: Promise<{ id: string }>;
}

async function getUser() {
  const session = await auth();
  if (!session?.user) return null;
  return {
    role: session.user.role as 'gestor' | 'supervisor' | 'administrador',
  };
}

export default async function PersonaDetailsPage({ params }: PersonaDetailsPageProps) {
  const { id } = await params;
  const personaId = parseInt(id, 10);
  
  if (isNaN(personaId)) {
    notFound();
  }
  
  const user = await getUser();
  
  if (!user) {
    notFound();
  }

  return <FichaPersona personaId={personaId} user={user} />;
}
