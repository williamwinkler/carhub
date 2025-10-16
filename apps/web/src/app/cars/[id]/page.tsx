import { getServerTrpc } from "../../_trpc/server";
import type { Car } from "../../_trpc/types";
import CarDetailClient from "./CarDetailClient";

type CarDetailPageProps = {
  params: Promise<{
    id: Car["id"];
  }>;
};

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  const { id } = await params;

  try {
    const serverTrpc = await getServerTrpc();
    const car = await serverTrpc.cars.getById.query({ id });

    return <CarDetailClient initialCar={car} />;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "data" in error) {
      const trpcError = error as { data?: { code?: string } };
      if (trpcError.data?.code === "NOT_FOUND") {
        return <div>Car not found</div>;
      }
    }
    throw error;
  }
}
