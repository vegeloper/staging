import { notFound } from "next/navigation";

import MediaDetail from "@/components/admin/MediaDetail";
import { requireCmsUser } from "@/lib/auth";
import { canManageSite } from "@/lib/auth/rbac";
import { getMedia } from "@/lib/media/library";

export const dynamic = "force-dynamic";

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCmsUser(`/admin/media/${id}`);
  const asset = await getMedia(id);
  if (!asset) notFound();
  const { ownerId, ...item } = asset;

  return <MediaDetail asset={item} canManage={canManageSite(user.role) || ownerId === user.id} />;
}
