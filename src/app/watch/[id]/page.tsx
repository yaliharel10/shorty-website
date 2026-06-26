import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/Toast";
import { CinemaPlayer } from "@/components/CinemaPlayer";

type Props = { params: Promise<{ id: string }> };

export default async function WatchPage({ params }: Props) {
  const { id } = await params;

  return (
    <AuthProvider>
      <ToastProvider>
        <CinemaPlayer filmId={id} />
      </ToastProvider>
    </AuthProvider>
  );
}
