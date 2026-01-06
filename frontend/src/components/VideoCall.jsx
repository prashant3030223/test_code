import { useRef, useEffect, useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import {
    MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, UserIcon,
    GripVerticalIcon, MonitorIcon, HandIcon, SmileIcon,
    MaximizeIcon, MinimizeIcon, PictureInPictureIcon, CircleDotIcon, StopCircleIcon,
    DownloadIcon, XIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function VideoCall({ roomId, userId }) {
    const {
        localStream, remoteStream, isScreenSharing, toggleScreenShare,
        isHandRaised, raiseHand, remoteHandRaised,
        reaction, remoteReaction, sendReaction,
        isCameraOn, toggleCamera, isMicOn, toggleMic
    } = useWebRTC(roomId, userId);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const containerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [recordedChunks, setRecordedChunks] = useState([]);

    const [isRecording, setIsRecording] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Use a callback ref to handle dynamic mounting/unmounting
    const setLocalVideoRef = (node) => {
        if (node && localStream) {
            node.srcObject = localStream;
            node.play().catch(() => { });
        }
        localVideoRef.current = node;
    };

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(() => { });
        }
    }, [localStream]);


    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);


    const toggleFullscreen = () => {
        if (!isFullscreen) {
            containerRef.current.requestFullscreen?.() || containerRef.current.webkitRequestFullscreen?.();
        } else {
            document.exitFullscreen?.() || document.webkitExitFullscreen?.();
        }
        setIsFullscreen(!isFullscreen);
    };

    const togglePip = async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (remoteVideoRef.current) {
                await remoteVideoRef.current.requestPictureInPicture();
            }
        } catch (err) {
            toast.error("Picture-in-Picture not supported");
        }
    };

    const startRecording = () => {
        const stream = remoteStream || localStream;
        if (!stream) return;

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) setRecordedChunks((prev) => [...prev, e.data]);
        };

        mediaRecorder.onstop = () => {
            toast.success("Recording saved! Click download to get the file.");
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast.success("Recording started...");
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const downloadRecording = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = `session-recording-${Date.now()}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        setRecordedChunks([]);
    };

    const emojis = ["👍", "👏", "❤️", "😮", "😂", "🎉"];

    return (
        <div ref={containerRef} className="flex flex-col gap-3 h-full relative group font-sans">
            {/* Main Video Container (Remote) */}
            <div className="relative flex-1 bg-[#0f0f0f] rounded-3xl overflow-hidden border border-white/5 shadow-2xl overflow-hidden">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 to-black text-white/10">
                        <div className="size-20 rounded-full bg-white/[0.02] flex items-center justify-center border border-white/[0.05] mb-4">
                            <UserIcon className="size-10 animate-pulse" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Establishing Peer Link...</p>
                    </div>
                )}

                {/* Hand Raise Overlay (Remote) */}
                <AnimatePresence>
                    {remoteHandRaised && (
                        <motion.div
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 20, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            className="absolute top-20 left-6 z-30 bg-yellow-400 text-black px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg"
                        >
                            <HandIcon className="size-5 fill-black" />
                            Partner Raised Hand
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Reaction Overlay (Remote) */}
                <AnimatePresence>
                    {remoteReaction && (
                        <motion.div
                            initial={{ scale: 0, y: 100 }}
                            animate={{ scale: 1.5, y: -100 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-1/2 left-1/2 -translate-x-1/2 text-8xl z-40 pointer-events-none select-none"
                        >
                            {remoteReaction}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Local Reaction Preview */}
                <AnimatePresence>
                    {reaction && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute bottom-20 right-20 text-4xl z-40"
                        >
                            {reaction}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* DRAGGABLE LOCAL PREVIEW - Premium Floating Card */}
                <motion.div
                    drag
                    dragConstraints={containerRef}
                    dragElastic={0.1}
                    className="absolute bottom-4 right-4 w-36 aspect-[3/4] sm:aspect-video sm:w-44 bg-black/60 backdrop-blur-3xl rounded-[1.5rem] overflow-hidden border border-white/10 shadow-2xl z-30 cursor-grab active:cursor-grabbing group/local overflow-hidden ring-1 ring-white/5"
                >
                    <div className="absolute top-2 left-2 p-1 bg-black/40 rounded-lg opacity-0 group-hover/local:opacity-100 transition-opacity z-40 pointer-events-none">
                        <GripVerticalIcon className="size-3 text-white/70" />
                    </div>

                    {isHandRaised && (
                        <div className="absolute top-2 right-2 z-40 bg-yellow-400 p-1 rounded-full shadow-lg">
                            <HandIcon className="size-3 text-black fill-black" />
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {isCameraOn || isScreenSharing ? (
                            <motion.video
                                key="local-video"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                ref={setLocalVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover pointer-events-none ${!isScreenSharing ? 'mirror' : ''}`}
                            />
                        ) : (
                            <motion.div className="w-full h-full flex flex-col items-center justify-center pointer-events-none bg-neutral-900 text-white/20">
                                <VideoOffIcon className="size-6 mb-2" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Self Hidden</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Status Indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2.5 px-3 py-1.5 bg-black/60 backdrop-blur-2xl rounded-xl border border-white/10 z-20">
                    <div className={`size-2 rounded-full ${remoteStream ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">
                        {remoteStream ? 'Peer Connected' : 'Waiting...'}
                    </span>
                    {isRecording && (
                        <div className="flex items-center gap-2 text-[9px] font-black text-red-500 uppercase tracking-widest border-l border-white/10 pl-2.5">
                            <div className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                            REC
                        </div>
                    )}
                </div>
            </div>

            {/* PREMIUM GLASS CONTROLS */}
            <div className="bg-white/[0.03] backdrop-blur-3xl rounded-2xl p-2 flex items-center justify-between border border-white/[0.08] shadow-2xl">
                <div className="flex items-center gap-1">
                    {recordedChunks.length > 0 && !isRecording && (
                        <button onClick={downloadRecording} className="size-9 flex items-center justify-center text-green-500 hover:bg-green-500/10 rounded-xl transition-colors">
                            <DownloadIcon className="size-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleMic}
                        className={`size-10 rounded-xl transition-all flex items-center justify-center border ${!isMicOn ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70 hover:text-white'}`}
                    >
                        {isMicOn ? <MicIcon className="size-4" /> : <MicOffIcon className="size-4" />}
                    </button>

                    <button
                        onClick={toggleCamera}
                        disabled={isScreenSharing}
                        className={`size-10 rounded-xl transition-all flex items-center justify-center border ${isScreenSharing ? 'opacity-20 ' : !isCameraOn ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70 hover:text-white'}`}
                    >
                        {isCameraOn ? <VideoIcon className="size-4" /> : <VideoOffIcon className="size-4" />}
                    </button>

                    <button
                        onClick={toggleScreenShare}
                        className={`size-10 rounded-xl transition-all flex items-center justify-center border ${isScreenSharing ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70 hover:text-white'}`}
                    >
                        <MonitorIcon className="size-4" />
                    </button>

                    <div className="h-6 w-px bg-white/10 mx-1" />

                    <button
                        onClick={() => raiseHand(!isHandRaised)}
                        className={`size-10 rounded-xl transition-all flex items-center justify-center border ${isHandRaised ? 'bg-yellow-400 text-black border-none shadow-lg shadow-yellow-400/20' : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70 hover:text-white'}`}
                    >
                        <HandIcon className="size-4" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowReactions(!showReactions)}
                            className="size-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all"
                        >
                            <SmileIcon className="size-4" />
                        </button>

                        <AnimatePresence>
                            {showReactions && (
                                <motion.div
                                    initial={{ y: 0, opacity: 0, scale: 0.8 }}
                                    animate={{ y: -60, opacity: 1, scale: 1 }}
                                    exit={{ y: 0, opacity: 0, scale: 0.8 }}
                                    className="absolute left-1/2 -translate-x-1/2 bg-[#1a1a1a] p-1.5 rounded-2xl flex gap-1 shadow-2xl border border-white/10 backdrop-blur-3xl z-[100]"
                                >
                                    {emojis.map(e => (
                                        <button
                                            key={e}
                                            onClick={() => { sendReaction(e); setShowReactions(false); }}
                                            className="hover:scale-125 transition-transform text-xl p-1.5"
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`size-10 rounded-xl transition-all flex items-center justify-center border ${isRecording ? 'bg-red-500 border-none animate-pulse text-white' : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70 hover:text-white'}`}
                    >
                        {isRecording ? <StopCircleIcon className="size-4" /> : <CircleDotIcon className="size-4" />}
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={toggleFullscreen} className="size-9 flex items-center justify-center text-white/30 hover:text-white/70 rounded-xl transition-colors">
                        {isFullscreen ? <MinimizeIcon className="size-4" /> : <MaximizeIcon className="size-4" />}
                    </button>
                </div>
            </div>

            <style>{`
                .mirror { transform: scaleX(-1); }
            `}</style>
        </div>
    );
}

export default VideoCall;
