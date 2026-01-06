import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const iceServers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
};

export function useWebRTC(roomId, userId) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [reaction, setReaction] = useState(null);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [remoteHandRaised, setRemoteHandRaised] = useState(false);
    const [remoteReaction, setRemoteReaction] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);

    const pc = useRef(null);
    const channel = useRef(null);
    const screenStream = useRef(null);
    const userStream = useRef(null);


    useEffect(() => {
        if (!roomId || !userId) return;

        const initWebRTC = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                userStream.current = stream;

                // Set initial states
                stream.getVideoTracks().forEach(t => t.enabled = isCameraOn);
                stream.getAudioTracks().forEach(t => t.enabled = isMicOn);

                setLocalStream(stream);

                pc.current = new RTCPeerConnection(iceServers);

                stream.getTracks().forEach((track) => {
                    pc.current.addTrack(track, stream);
                });

                pc.current.ontrack = (event) => {
                    setRemoteStream(event.streams[0]);
                };

                pc.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        channel.current.send({
                            type: "broadcast",
                            event: "ice-candidate",
                            payload: { candidate: event.candidate, senderId: userId },
                        });
                    }
                };

                channel.current = supabase.channel(`call:${roomId}`, {
                    config: { broadcast: { self: false } },
                });

                channel.current
                    .on("broadcast", { event: "offer" }, async ({ payload }) => {
                        if (payload.senderId === userId) return;
                        await pc.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
                        const answer = await pc.current.createAnswer();
                        await pc.current.setLocalDescription(answer);
                        channel.current.send({
                            type: "broadcast",
                            event: "answer",
                            payload: { answer, senderId: userId },
                        });
                    })
                    .on("broadcast", { event: "answer" }, async ({ payload }) => {
                        if (payload.senderId === userId) return;
                        await pc.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
                    })
                    .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
                        if (payload.senderId === userId) return;
                        try {
                            await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
                        } catch (e) {
                            console.error("Error adding ice candidate", e);
                        }
                    })
                    .on("broadcast", { event: "signal" }, ({ payload }) => {
                        if (payload.senderId === userId) return;
                        if (payload.type === "reaction") {
                            setRemoteReaction(payload.data);
                            setTimeout(() => setRemoteReaction(null), 3000);
                        }
                        if (payload.type === "hand-raise") {
                            setRemoteHandRaised(payload.data);
                        }
                    })
                    .subscribe(async (status) => {
                        if (status === "SUBSCRIBED") {
                            const offer = await pc.current.createOffer();
                            await pc.current.setLocalDescription(offer);
                            channel.current.send({
                                type: "broadcast",
                                event: "offer",
                                payload: { offer, senderId: userId },
                            });
                        }
                    });
            } catch (err) {
                console.error("WebRTC init error:", err);
            }
        };

        initWebRTC();

        return () => {
            userStream.current?.getTracks().forEach((track) => track.stop());
            screenStream.current?.getTracks().forEach((track) => track.stop());
            pc.current?.close();
            if (channel.current) supabase.removeChannel(channel.current);
        };
    }, [roomId, userId]);

    const toggleCamera = () => {
        const newState = !isCameraOn;
        if (userStream.current) {
            userStream.current.getVideoTracks().forEach(t => t.enabled = newState);
        }
        setIsCameraOn(newState);
    };

    const toggleMic = () => {
        const newState = !isMicOn;
        if (userStream.current) {
            userStream.current.getAudioTracks().forEach(t => t.enabled = newState);
        }
        setIsMicOn(newState);
    };

    const sendSignal = (type, data) => {
        if (channel.current) {
            channel.current.send({
                type: "broadcast",
                event: "signal",
                payload: { type, data, senderId: userId },
            });
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStream.current = stream;
                const videoTrack = stream.getVideoTracks()[0];
                const sender = pc.current.getSenders().find((s) => s.track.kind === "video");
                if (sender) sender.replaceTrack(videoTrack);
                videoTrack.onended = () => stopScreenShare();
                setLocalStream(stream);
                setIsScreenSharing(true);
            } catch (err) {
                console.error("Error starting screen share:", err);
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = () => {
        if (screenStream.current) {
            screenStream.current.getTracks().forEach(track => track.stop());
            screenStream.current = null;
        }
        const videoTrack = userStream.current.getVideoTracks()[0];
        // Ensure camera state is preserved
        videoTrack.enabled = isCameraOn;

        const sender = pc.current.getSenders().find((s) => s.track.kind === "video");
        if (sender) sender.replaceTrack(videoTrack);
        setLocalStream(userStream.current);
        setIsScreenSharing(false);
    };

    const raiseHand = (state) => {
        setIsHandRaised(state);
        sendSignal("hand-raise", state);
    };

    const sendReaction = (emoji) => {
        setReaction(emoji);
        sendSignal("reaction", emoji);
        setTimeout(() => setReaction(null), 3000);
    };

    return {
        localStream,
        remoteStream,
        isScreenSharing,
        toggleScreenShare,
        isCameraOn,
        toggleCamera,
        isMicOn,
        toggleMic,
        isHandRaised,
        raiseHand,
        remoteHandRaised,
        reaction,
        remoteReaction,
        sendReaction
    };

}
