import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  DocumentVaultClient,
  type VaultDocument,
} from "@/components/portal/document-vault-client";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/portal");

  const docs = await prisma.document.findMany({
    where: { userId: session.userId },
    orderBy: { uploadedAt: "desc" },
  });

  const documents: VaultDocument[] = docs.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    url: d.url,
    status: d.status,
    version: d.version,
    expiryDate: d.expiryDate,
    uploadedAt: d.uploadedAt.toISOString(),
  }));

  return <DocumentVaultClient initialDocuments={documents} />;
}
