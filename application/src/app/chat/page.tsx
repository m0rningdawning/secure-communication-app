"use client";

import { encryptMessage, decryptMessage } from "@/lib/cryptoUtils";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HiLogout, HiUserGroup, HiTrash } from "react-icons/hi";
import { io } from "socket.io-client";

// TODO
// - Fix message allignment
// - Fix encryption bugs
// - Fix initial convo selection and other convo fetch bugs

const socket = io("http://localhost:8888", {
  path: "/api/socket",
  transports: ["websocket"],
  timeout: 30000,
});

export default function ChatPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPublicKey, setRecipientPublicKey] = useState("");
  const [recipientUsername, setRecipientUsername] = useState("");
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("Browse File");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");

    if (!token || !userId || !email) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
      fetchConversations(userId);
      socket.emit("join", email);
    }

    socket.on("receiveMessage", async (message) => {
      try {
        const decryptedMessage = await decryptMessage(
          localStorage.getItem("privateKey"),
          message.content
        );
        setMessages((prevMessages) => [
          ...prevMessages,
          { ...message, content: decryptedMessage },
        ]);
      } catch (error) {
        console.error("Error receiving message:", error);
        const userId = localStorage.getItem("userId");
        fetchConversations(userId);
      }
    });

    socket.on("connect_error", async (err) => {
      console.log(`connect_error due to ${err.message}`);
      await fetch("/api/socket");
    });

    socket.on("userOnline", (email) => {
      setOnlineUsers((prev) => new Map(prev).set(email, true));
    });

    socket.on("userOffline", (email) => {
      setOnlineUsers((prev) => {
        const updated = new Map(prev);
        updated.delete(email);
        return updated;
      });
    });

    socket.on("fileTransferRequest", ({ file, senderEmail }) => {
      if (window.confirm(`Accept file from ${senderEmail}?`)) {
        socket.emit("acceptFile", { file, senderEmail, recipientEmail: email });
        const element = document.createElement("a");
        element.href = URL.createObjectURL(
          new Blob([file.content], { type: file.type })
        );
        element.download = file.name;
        document.body.appendChild(element);
        element.click();
      } else {
        socket.emit("declineFile", {
          file,
          senderEmail,
          recipientEmail: email,
        });
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("userOnline");
      socket.off("userOffline");
      socket.off("fileTransferRequest");
    };
  }, [router]);

  const fetchConversations = async (userId) => {
    try {
      const response = await fetch("/api/conversations", {
        headers: {
          "x-user-id": userId,
        },
      });
      const data = await response.json();

      if (response.ok) {
        const privateKey = localStorage.getItem("privateKey");
        if (!privateKey) {
          console.error("Private key not found in localStorage");
          return;
        }

        const decryptedConversations = await Promise.all(
          data.conversations.map(async (conversation) => {
            try {
              const decryptedMessages = await Promise.all(
                conversation.messages.map(async (message) => {
                  try {
                    const decryptedContent = await decryptMessage(
                      privateKey,
                      message.content
                    );
                    return { ...message, content: decryptedContent };
                  } catch (error) {
                    console.error(
                      `Error decrypting message ${message.id}:`,
                      error
                    );
                    return message;
                  }
                })
              );

              return { ...conversation, messages: decryptedMessages };
            } catch (error) {
              console.error(
                `Error processing conversation ${conversation.id}:`,
                error
              );
              return conversation;
            }
          })
        );

        setConversations((prevConversations) => {
          const updatedConversations = decryptedConversations.reduce(
            (acc, conversation) => {
              const existingIndex = acc.findIndex(
                (c) => c.id === conversation.id
              );
              if (existingIndex !== -1) {
                acc[existingIndex] = conversation;
              } else {
                acc.push(conversation);
              }
              return acc;
            },
            [...prevConversations]
          );

          return updatedConversations;
        });
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    // socket.emit("disconnect");
    router.push("/login");
  };

  const addRecipient = async () => {
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch(`/api/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId, recipientEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        const recipient = data.conversation.participants.find(
          (p) => p.email !== localStorage.getItem("email")
        );
        setRecipientPublicKey(recipient.publicKey);
        setRecipientEmail(recipient.email);
        setRecipientUsername(recipient.username);
        setCurrentConversationId(data.conversation.id);
        setShowAddRecipientModal(false);
        setConversations((prevConversations) => [
          ...prevConversations,
          data.conversation,
        ]);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ conversationId }),
      });
      const data = await response.json();
      if (response.ok) {
        setConversations(conversations.filter((c) => c.id !== conversationId));
        setCurrentConversationId(null);
        setMessages([]);
        setRecipientUsername("");
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) {
      console.error("Cannot send a blank message");
      return;
    }

    const userId = parseInt(localStorage.getItem("userId"));
    const email = localStorage.getItem("email");

    if (!recipientPublicKey || !currentConversationId) {
      console.error("Recipient public key or conversation ID not set");
      return;
    }

    try {
      const encryptedMessage = await encryptMessage(
        recipientPublicKey,
        message
      );

      socket.emit("sendMessage", {
        conversationId: currentConversationId,
        message: encryptedMessage,
        senderId: userId,
        recipientEmail,
      });

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          senderEmail: email,
          receiverEmail: recipientEmail,
          content: message,
          timestamp: new Date().toISOString(),
        },
      ]);
      setNewMessage("");
    } catch (error) {
      console.error("Error encrypting message:", error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
    }
  };

  const sendFile = () => {
    if (!selectedFile) {
      console.error("No file selected");
      return;
    }

    const userId = parseInt(localStorage.getItem("userId"));
    const senderEmail = localStorage.getItem("email");

    if (!currentConversationId) {
      console.error("Conversation ID not set");
      return;
    }

    const fileData = {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
      content: selectedFile,
    };

    socket.emit("sendFile", {
      conversationId: currentConversationId,
      file: fileData,
      senderId: userId,
      senderEmail,
      recipientEmail,
    });

    setSelectedFile(null);
    setSelectedFileName("Browse File");
  };

  return isAuthenticated ? (
    <div className="flex flex-col h-screen bg-[#00172e] relative">
      <header className="flex items-center justify-between p-4 bg-[#001846] text-white">
        <div className="text-lg font-semibold">
          <span className="text-purple-600">Secure</span> Chat
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-2 text-sm hover:underline"
        >
          <HiLogout className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex flex-col w-64 bg-[#00236a] p-4">
          <h2 className="text-lg font-semibold mb-4">Conversations</h2>
          <ul className="flex-1 overflow-y-auto space-y-2">
            {conversations.map((conversation) => (
              <li
                key={conversation.id}
                className="p-2 bg-[#5e199b] rounded hover:bg-[#6d2aa8] cursor-pointer flex justify-between items-center"
                onClick={() => {
                  if (currentConversationId === conversation.id) return;
                  setCurrentConversationId(conversation.id);
                  const recipient = conversation.participants.find(
                    (p) => p.email !== localStorage.getItem("email")
                  );
                  setRecipientPublicKey(recipient.publicKey);
                  setRecipientEmail(recipient.email);
                  setRecipientUsername(recipient.username);
                  setMessages(conversation.messages);
                }}
              >
                <span>
                  {
                    conversation.participants.find(
                      (p) => p.email !== localStorage.getItem("email")
                    ).username
                  }
                  {onlineUsers.has(
                    conversation.participants.find(
                      (p) => p.email !== localStorage.getItem("email")
                    ).email
                  ) && <span className="text-green-500 ml-2">online</span>}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <HiTrash className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setShowAddRecipientModal(true)}
            className="flex items-center mt-4 px-3 py-2 bg-[#5e199b] text-white rounded hover:bg-[#6d2aa8]"
          >
            <HiUserGroup className="w-5 h-5 mr-2" />
            Add Recipient
          </button>
        </aside>

        <main className="flex flex-col flex-1 bg-center bg-no-repeat bg-cover bg-[url('/imgs/chat2_blur.png')]">
          <div className="flex items-center justify-between p-4 bg-opacity-90 backdrop-blur-3xl shadow-md">
            <h2 className="text-lg font-semibold text-white">
              Chat with {recipientUsername}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`self-${
                  msg.senderEmail === localStorage.getItem("email")
                    ? "end"
                    : "start"
                } max-w-xs p-2 ${
                  msg.senderEmail === localStorage.getItem("email")
                    ? "bg-[#1942bc] text-white"
                    : "bg-[#002a54] text-white"
                } rounded-lg`}
              >
                <div>{msg.content}</div>
                <div className="text-xs text-gray-400">
                  {format(new Date(msg.timestamp), "p, MMM d, yyyy")}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-opacity-90 backdrop-blur-3xl shadow-md">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage(newMessage);
                }
              }}
              className="w-full p-2 rounded-lg bg-[#00236a] focus:outline-none focus:ring focus:ring-blue-300"
            />
            <button
              onClick={() => sendMessage(newMessage)}
              className="mt-2 w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200 transform hover:scale-105 focus:scale-105"
            >
              Send
            </button>
            <div className="flex items-center mt-2 space-x-2">
              <label className="flex-1 flex items-center justify-center bg-[#00236a] text-white py-2 px-4 rounded-md cursor-pointer hover:bg-[#003a8c] focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200 transform hover:scale-105 focus:scale-105">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {selectedFileName}
              </label>
              <button
                onClick={sendFile}
                className="bg-[#7b3fa0] text-white py-2 px-4 rounded-md hover:bg-[#8c4bb3] focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200 transform hover:scale-105 focus:scale-105"
              >
                Send File
              </button>
            </div>
          </div>
        </main>
      </div>

      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsDrawerOpen(false)}
        ></div>
      )}
      <div
        className={`fixed inset-y-0 right-0 transform ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 bg-[#00172e] w-3/4 md:hidden z-50`}
      >
        <header className="flex items-center justify-between p-4 bg-[#00236a]">
          <h2 className="text-xl font-bold">Users</h2>
          <button onClick={() => setIsDrawerOpen(false)}>Close</button>
        </header>
        <ul className="p-4 space-y-2">
          <li className="p-2 rounded bg-[#5e199b]">User 1</li>
          <li className="p-2 rounded bg-[#5e199b]">User 2</li>
          <li className="p-2 rounded bg-[#5e199b]">User 3</li>
        </ul>
        <button className="flex items-center mt-4 px-3 py-2 bg-[#5e199b] text-white rounded hover:bg-[#6d2aa8]">
          <HiUserGroup className="w-5 h-5 mr-2" />
          Add Recipient
        </button>
      </div>

      {!isDrawerOpen && (
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="fixed bottom-24 right-6 md:hidden p-3 rounded-full bg-blue-600 text-white shadow-lg z-50"
        >
          Users
        </button>
      )}

      {showAddRecipientModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#001846] p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add Recipient</h2>
            <input
              type="email"
              placeholder="Recipient's email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="text-black w-full p-2 mb-4 border rounded-lg"
            />
            <button
              onClick={addRecipient}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200 transform hover:scale-105 focus:scale-105"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddRecipientModal(false)}
              className="mt-2 w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 transform hover:scale-105 focus:scale-105"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;
}
