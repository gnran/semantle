"use client";

import { createConfig, http, WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

// App metadata for Base Account
const METADATA = {
  name: "Semantle",
  iconImageUrl: "https://semantle.vercel.app/favicon1.png",
};

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    farcasterMiniApp(),
    baseAccount({
      appName: METADATA.name,
      appLogoUrl: METADATA.iconImageUrl,
    }),
  ],
});

const queryClient = new QueryClient();

export default function Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
