import { Signer } from "ethers";
import { Client } from "@xmtp/xmtp-js";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface IWalletStore {
  messages: Array<{ content: string; senderAddress: string; id: string }>;
  setMessages: (
    messages: Array<{ content: string; senderAddress: string; id: string }>
  ) => void;
  resetMessages: () => void;
  wallet: Signer | null;
  setWallet: (wallet: Signer) => void;
  xmtpClient: Client | null;
  setXmtpClient: (client: Client) => void;
}

const store = create<IWalletStore, [["zustand/devtools", IWalletStore]]>(
  devtools(
    (set) => ({
      messages: [],
      setMessages: (messages) =>
        set((state) => ({
          messages: [
            ...state.messages,
            ...(state.messages.some((mes) => mes.id === messages[0].id)
              ? []
              : messages),
          ],
        })),
      resetMessages: () => set(() => ({ messages: [] })),
      wallet: null,
      setWallet: (wallet: Signer) => set(() => ({ wallet: wallet })),
      xmtpClient: null,
      setXmtpClient: (client: Client) => set(() => ({ xmtpClient: client })),
    }),
    { name: "walletStore" }
  )
);

export const useWalletStore = store;
