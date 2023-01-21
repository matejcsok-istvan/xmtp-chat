import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Client } from "@xmtp/xmtp-js";
import { useCallback, useEffect, useState } from "react";
import { useWalletStore } from "@/utils/store";
import { useAccount, useSigner } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { shallow } from "zustand/shallow";

export default function Home() {
  const {
    setWallet,
    wallet,
    client,
    setClient,
    messages,
    setMessages,
    resetMessages,
  } = useWalletStore(
    (state) => ({
      setWallet: state.setWallet,
      wallet: state.wallet,
      client: state.xmtpClient,
      setClient: state.setXmtpClient,
      messages: state.messages,
      setMessages: state.setMessages,
      resetMessages: state.resetMessages,
    }),
    shallow
  );

  const [peer, setPeer] = useState<string>("");

  const { data: signer } = useSigner();
  const { address } = useAccount();

  useEffect(() => {
    if (!signer) {
      return;
    }
    setWallet(signer);
  }, [signer]);

  useEffect(() => {
    if (!wallet || client) {
      return;
    }
    (async () => {
      const xmtp = await Client.create(wallet, { env: "production" });
      setClient(xmtp);
    })();
  }, [wallet]);

  const { data: queryMessages, isLoading: messagesLoading } = useQuery(
    ["messages", peer],
    async () => {
      if (!peer || !client) {
        return [];
      }
      const conversation = await client.conversations.newConversation(peer);
      return await conversation.messages();
    }
  );

  const [id, setId] = useState<string>("");
  useEffect(() => {
    if (!peer || !client) {
      return;
    }
    (async () => {
      const conversation = await client.conversations.newConversation(peer);
      for await (const message of await conversation.streamMessages()) {
        console.log("stream", { messages });
        setMessages([
          {
            content: message.content,
            senderAddress: message.senderAddress,
            id: message.id,
          },
        ]);
        break;
      }
    })();
  }, [peer, client, messages]);

  useEffect(() => {
    const chat = document.getElementById("chat");
    if (!chat) {
      return;
    }
    chat.scrollTop = chat.scrollHeight;
  }, [messages]);

  const {
    data: conversations,
    isLoading: convoLoading,
    refetch,
  } = useQuery(["conversations"], async () => {
    if (!client) {
      return [];
    }
    const conversations = await client.conversations.list();
    return await Promise.all(
      conversations
        .filter((convo) => convo.peerAddress !== address)
        .map(async (convo) => {
          const preview = await convo.messages({ limit: 1 });
          return {
            preview: preview[0]?.content,
            peerAddress: convo.peerAddress,
          };
        })
    );
  });

  useEffect(() => {
    if (!client) {
      return;
    }
    refetch();
  }, [client]);

  useEffect(() => {
    if (!queryMessages || messagesLoading) {
      return;
    }
    resetMessages();
    setMessages(
      queryMessages.map((item) => ({
        content: item.content,
        senderAddress: item.senderAddress,
        id: item.id,
      }))
    );
  }, [queryMessages, messagesLoading]);

  const [content, setContent] = useState<string>("");

  const handleInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const content = event.target.value;
      setContent(content);
    },
    []
  );

  const handleInputKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (client && event.key === "Enter") {
        const conversation = await client.conversations.newConversation(peer);
        await conversation.send(content);
        setContent("");
      }
    },
    [content, peer]
  );

  const handleSendMessage = useCallback(async () => {
    if (!client) {
      return;
    }
    const conversation = await client.conversations.newConversation(peer);
    await conversation.send(content);
    setContent("");
  }, [content, peer]);

  return (
    <div style={{ padding: "1rem" }}>
      <ConnectButton />
      <div style={{ display: "flex", flexDirection: "row", gap: "2rem" }}>
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          {convoLoading
            ? "loading..."
            : conversations?.map((convo, index) => {
                return (
                  <div
                    onClick={() => setPeer(convo.peerAddress)}
                    key={index}
                    style={{
                      maxWidth: "25rem",
                      display: "flex",
                      flexDirection: "column",
                      padding: "1rem",
                      border: "1px solid grey",
                      borderRadius: "4px",
                      background:
                        convo.peerAddress === peer ? "lightGrey" : "white",
                      cursor: "pointer",
                    }}
                  >
                    <div>{convo.peerAddress}</div>
                    <div>{convo.preview}</div>
                  </div>
                );
              })}
        </div>
        <div
          id="chat"
          style={{
            maxHeight: "50rem",
            overflowY: "scroll",
            padding: "1rem",
            border: "1px solid lightgrey",
            borderRadius: "4px",
          }}
        >
          <div>
            {messagesLoading
              ? "loading..."
              : messages.map((message, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "1rem",
                      border: "1px solid grey",
                      padding: "1rem",
                      borderRadius: "4px",
                      maxWidth: "max-content",
                      marginLeft:
                        message.senderAddress === address ? "5rem" : "",
                      background:
                        message.senderAddress === address
                          ? "lightgrey"
                          : "lightblue",
                    }}
                  >
                    <div>{message.senderAddress}</div>
                    <div>{message.content}</div>
                  </div>
                ))}
          </div>
          <div>
            <input
              value={content}
              style={{
                padding: "1rem",
                width: "20rem",
                borderRadius: "4px",
                marginRight: "2rem",
              }}
              onChange={(e) => handleInput(e)}
              onKeyDown={(e) => handleInputKeyDown(e)}
            />
            <button onClick={handleSendMessage}>send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
