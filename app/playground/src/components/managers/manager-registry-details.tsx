"use client";

import { ManagerRecord } from "@/protocol/atoms";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { Address } from "../onchain/address";
import { useConnection } from "../onchain/connection-context";
import { useProtocol } from "../onchain/protocol-context";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const ManagerRegistryDetails = memo((props: { 
  registry: ManagerRecord; 
  currentUserAddress?: string;
}) => {
  const { protocol } = useProtocol();
  const { connection } = useConnection();
  
  const { data: registryData, isPending: isLoading, error } = useQuery({
    queryKey: ["managerRegistry", props.registry.address],
    queryFn: async () => {
      console.log("Fetching manager registry at address:", props.registry.address);
      try {
        const result = await protocol.hyroProtocol.fetchMaybeManagerRegistry(connection, props.registry.address);
        console.log("Manager registry fetch result:", result);
        return result;
      } catch (err) {
        console.error("Error fetching manager registry:", err);
        throw err;
      }
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manager Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manager Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">Error loading registry: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  if (!registryData || !registryData.exists) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manager Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Registry not found on-chain. The registry may not have been initialized yet.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manager Registry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-1">
          <div className="font-semibold">Address</div>
          <Address>{props.registry.address}</Address>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="font-semibold">Admin</div>
          <Address>{registryData.data.admin}</Address>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="font-semibold">Total Managers</div>
          <div>{registryData.data.totalManagers}</div>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="font-semibold">Total AUM</div>
          <div>{registryData.data.totalAum.toString()} lamports</div>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="font-semibold">Created At</div>
          <div>{new Date(Number(registryData.data.createdAt)).toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );
});

ManagerRegistryDetails.displayName = "ManagerRegistryDetails";

export { ManagerRegistryDetails };
