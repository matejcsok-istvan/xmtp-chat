import type { AppProps } from "next/app";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiConfig, configureChains, createClient } from "wagmi";
import { mainnet, polygon, optimism, arbitrum } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import "@rainbow-me/rainbowkit/styles.css";

export default function App({ Component, pageProps }: AppProps) {
  const queryClient = new QueryClient();
  const { chains, provider } = configureChains(
    [mainnet, polygon, optimism, arbitrum],
    [
      alchemyProvider({ apiKey: "vwx7pu35u53sm4mi0p47csxqg94u8vde" }),
      publicProvider(),
    ]
  );

  const { connectors } = getDefaultWallets({
    appName: "Relay Receiver Example App",
    chains,
  });

  const wagmiClient = createClient({
    autoConnect: false,
    connectors,
    provider,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <Component {...pageProps} />
            <ReactQueryDevtools initialIsOpen={false} />
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}
