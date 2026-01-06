import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useSupabaseAuth";
import { SendIcon, UserIcon } from "lucide-react";

function SupabaseChat({ roomId, onMessageReceived }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const { user } = useAuth();
    const chatEndRef = useRef(null);
    const onMessageReceivedRef = useRef(onMessageReceived);

    useEffect(() => {
        onMessageReceivedRef.current = onMessageReceived;
    }, [onMessageReceived]);

    useEffect(() => {
        if (!roomId || !user) return;

        // 1. Fetch History
        const fetchHistory = async () => {
            const { data, error } = await supabase
                .from("messages")
                .select(`*, sender:users(name, profile_image)`)
                .eq("session_id", roomId)
                .order("created_at", { ascending: true });

            if (data) {
                setMessages(data.map(m => ({
                    id: m.id,
                    text: m.content,
                    senderId: m.user_id,
                    senderName: m.sender?.name || "Unknown",
                    senderAvatar: m.sender?.profile_image,
                    timestamp: m.created_at
                })));
            }
        };
        fetchHistory();

        // 2. Subscribe to DB Changes
        const channel = supabase.channel(`chat:${roomId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${roomId}` },
                async (payload) => {
                    const newMsg = payload.new;
                    // Ideally fetch sender details, but for speed we can optimistically guess or refetch
                    // For now, let's just refetch sender info or assume it's current user if match?
                    // Actually, Realtime payload doesn't contain JOINs.
                    // We need to fetch the user info for this message OR rely on optimistic UI if it's us.
                    // Let's do a quick fetch for the single message with join:
                    const { data } = await supabase.from("messages").select(`*, sender:users(name, profile_image)`).eq("id", newMsg.id).single();
                    if (data) {
                        const formatted = {
                            id: data.id,
                            text: data.content,
                            senderId: data.user_id,
                            senderName: data.sender?.name || "Unknown",
                            senderAvatar: data.sender?.profile_image,
                            timestamp: data.created_at
                        };
                        setMessages((prev) => {
                            if (prev.some(m => m.id === formatted.id)) return prev;
                            return [...prev, formatted];
                        });
                        if (onMessageReceivedRef.current) onMessageReceivedRef.current(formatted);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, user]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Optimistic UI? 
        // Better to just insert and let the subscription handle the UI update to avoid dups.
        // But for "smoothness", optimistic is better. 
        // Let's just Insert.

        const { error } = await supabase.from("messages").insert({
            session_id: roomId,
            user_id: user.id,
            content: newMessage
        });

        if (error) {
            console.error("Failed to send", error);
        }

        setNewMessage("");
    };

    return (
        <div className="flex flex-col h-full bg-base-100 rounded-2xl overflow-hidden border border-base-300">
            {/* Header */}
            <div className="p-4 border-b border-base-200 bg-base-200/50">
                <h3 className="font-bold flex items-center gap-2">
                    <div className="size-2 bg-success rounded-full animate-pulse"></div>
                    Live Session Chat
                </h3>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 text-center p-8">
                        <SendIcon className="size-12 mb-2" />
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.senderId === user.id ? "items-end" : "items-start"}`}
                    >
                        <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[10px] font-bold opacity-50 uppercase tracking-wider">
                                {msg.senderName}
                            </span>
                        </div>
                        <div
                            className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${msg.senderId === user.id
                                ? "bg-primary text-primary-content rounded-tr-none"
                                : "bg-base-200 text-base-content rounded-tl-none"
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef}></div>
            </div>

            {/* Input area */}
            <form onSubmit={sendMessage} className="p-4 border-t border-base-200 bg-base-200/30">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="input input-bordered flex-1 rounded-xl bg-base-100"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-square rounded-xl shadow-lg">
                        <SendIcon className="size-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SupabaseChat;
