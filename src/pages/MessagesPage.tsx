import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Conversation {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  last_message: string;
  last_time: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
      const toUser = searchParams.get("to");
      if (toUser) openConversation(toUser);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dm-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          if (selectedUser && (msg.sender_id === selectedUser || msg.receiver_id === selectedUser)) {
            setMessages(prev => [...prev, msg]);
          }
          fetchConversations();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedUser]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    const { data: allMessages } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!allMessages || allMessages.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Group by conversation partner
    const convMap = new Map<string, { last_message: string; last_time: string; unread: number }>();
    for (const msg of allMessages) {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, {
          last_message: msg.content,
          last_time: msg.created_at,
          unread: 0,
        });
      }
      if (msg.receiver_id === user.id && !msg.read) {
        const entry = convMap.get(partnerId)!;
        entry.unread++;
      }
    }

    // Fetch profiles
    const partnerIds = Array.from(convMap.keys());
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", partnerIds);

    const convos: Conversation[] = partnerIds.map(pid => {
      const prof = profiles?.find((p: any) => p.user_id === pid);
      const entry = convMap.get(pid)!;
      return {
        user_id: pid,
        display_name: prof?.display_name || "Unknown",
        avatar_url: prof?.avatar_url || null,
        ...entry,
      };
    });

    setConversations(convos);
    setLoading(false);
  };

  const openConversation = async (userId: string) => {
    setSelectedUser(userId);

    // Fetch profile info
    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", userId)
      .single();
    setSelectedName(prof?.display_name || "User");
    setSelectedAvatar(prof?.avatar_url || null);

    // Fetch messages
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user!.id})`)
      .order("created_at", { ascending: true });

    setMessages(data || []);

    // Mark as read
    await supabase
      .from("direct_messages")
      .update({ read: true })
      .eq("sender_id", userId)
      .eq("receiver_id", user!.id)
      .eq("read", false);

    fetchConversations();
  };

  const sendMessage = async () => {
    if (!user || !selectedUser || !newMessage.trim()) return;
    setSending(true);
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: user.id,
      receiver_id: selectedUser,
      content: newMessage.trim(),
    });
    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Please sign in to use messages.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversation List */}
      <div className={`w-full md:w-80 border-r border-border/40 flex flex-col ${selectedUser ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-border/40">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-8">Loading...</p>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-xs text-muted-foreground">No conversations yet</p>
              <p className="text-[10px] text-muted-foreground mt-1">Browse talent to start messaging</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.user_id}
                onClick={() => openConversation(conv.user_id)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/40 transition-colors text-left ${
                  selectedUser === conv.user_id ? "bg-secondary/60" : ""
                }`}
              >
                {conv.avatar_url ? (
                  <img src={conv.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {conv.display_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{conv.display_name}</span>
                    {conv.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center flex-shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{conv.last_message}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedUser ? "hidden md:flex" : "flex"}`}>
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="p-3 border-b border-border/40 flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedUser(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              {selectedAvatar ? (
                <img src={selectedAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {selectedName.charAt(0)}
                </div>
              )}
              <span className="text-sm font-semibold">{selectedName}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    msg.sender_id === user.id
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary/80 text-foreground rounded-bl-md"
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-[9px] mt-1 ${msg.sender_id === user.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/40 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                className="flex-1"
              />
              <Button variant="hero" size="icon" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
