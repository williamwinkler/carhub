import { notFound } from "next/navigation";
import { getServerTrpc } from "../../_trpc/server";
import UserCarsClient from "./UserCarsClient";

const LIMIT = 12;

export default async function UserCarsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const serverTrpc = await getServerTrpc();

  // Fetch profile user and current user in parallel
  const [profileUserResult, currentUserResult] = await Promise.allSettled([
    serverTrpc.accounts.getByUsername.query({ username }),
    serverTrpc.accounts.getMe.query(),
  ]);

  // Handle user not found with proper 404
  if (profileUserResult.status === "rejected") {
    notFound();
  }

  const profileUser = profileUserResult.value;
  const currentUser =
    currentUserResult.status === "fulfilled" ? currentUserResult.value : null;
  const isOwnProfile = currentUser?.id === profileUser.id;

  // Fetch cars for the profile user
  const carsData = await serverTrpc.cars.getCarsByUserId.query({
    userId: profileUser.id,
    skip: 0,
    limit: LIMIT,
  });

  return (
    <UserCarsClient
      userId={profileUser.id}
      profileUser={profileUser}
      isOwnProfile={isOwnProfile}
      initialCars={carsData.items}
      totalItems={carsData.meta.totalItems}
    />
  );
}
