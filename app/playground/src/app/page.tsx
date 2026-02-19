"use client";

import { Header } from "@/components/layouts/header";
import { useMounted } from "@/lib/utils";
import { HyroProtocol } from "../components/protocol/hyro-protocol";
import { ChallengesSection } from "../components/challenges/challenges-section";
import { ManagersSection } from "../components/managers/managers-section";
import { useWallet } from "@/components/wallet/wallet-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const isMounted = useMounted();
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState<"vaults" | "challenges" | "managers">("vaults");

  return isMounted ? (
    <div className="flex flex-col gap-0 min-h-screen">
      <Header wallet={wallet} />
      <div className="flex flex-row gap-2 border-b px-4 py-2 bg-gray-50">
        <Button
          variant={activeTab === "vaults" ? "default" : "outline"}
          onClick={() => setActiveTab("vaults")}
        >
          Vaults
        </Button>
        <Button
          variant={activeTab === "challenges" ? "default" : "outline"}
          onClick={() => setActiveTab("challenges")}
        >
          Challenge Templates
        </Button>
        <Button
          variant={activeTab === "managers" ? "default" : "outline"}
          onClick={() => setActiveTab("managers")}
        >
          Managers
        </Button>
      </div>
      {activeTab === "vaults" && <HyroProtocol />}
      {activeTab === "challenges" && <ChallengesSection />}
      {activeTab === "managers" && <ManagersSection />}
    </div>
  ) : null;
}
