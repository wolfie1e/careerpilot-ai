"use client";

import { useRef, useState, useCallback } from "react";

type RecordingState = "idle" | "recording" | "stopped";

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<RecordingState>("idle");
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    chunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const mr = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.start(250);
    setState("recording");
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, []);

  const stop = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (timerRef.current) clearInterval(timerRef.current);
      const mr = mediaRecorderRef.current;
      if (!mr) { resolve(new Blob()); return; }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setState("stopped");
        resolve(blob);
      };
      mr.stop();
    });
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setState("idle");
    setSeconds(0);
  }, []);

  return { state, seconds, start, stop, reset };
}
