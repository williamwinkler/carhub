import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import HomePage from "./_components/HomePage";
import Navbar from "./_components/Navbar";
import { getQueryClient, serverTrpc } from "./_trpc/server";

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

export default async function Home() {
  const queryClient = getQueryClient();

  // Prefetch data on the server using tRPC
  const [manufacturers, featuredCars] = await Promise.all([
    serverTrpc.carManufacturers.list.query(),
    serverTrpc.cars.list.query({ limit: 6, skip: 0 }),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HomePage
          initialManufacturers={manufacturers.items}
          initialFeaturedCars={featuredCars.items}
        />
      </HydrationBoundary>
    </div>
  );
}
