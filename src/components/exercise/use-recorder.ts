"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type SR = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null };
const SpeechRec = (): (new () => SR) | null => (typeof window === "undefined" ? null : ((window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition ?? null));

/** MediaRecorder + optional live browser transcription + input level meter. */
export function useRecorder() {
  const stream = useRef<MediaStream | null>(null); const mr = useRef<MediaRecorder | null>(null); const chunks = useRef<Blob[]>([]);
  const recog = useRef<SR | null>(null); const wantRecog = useRef(false); const finalText = useRef(""); const analyser = useRef<AnalyserNode | null>(null); const ctx = useRef<AudioContext | null>(null);
  const [live, setLive] = useState(""); const [level, setLevel] = useState(0); const [recording, setRecording] = useState(false); const startedAt = useRef(0);
  const recogSupported = !!SpeechRec();

  const ensureMic = useCallback(async () => {
    if (stream.current?.active) return true;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("unsupported");
    stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    try { ctx.current = new AudioContext(); const src = ctx.current.createMediaStreamSource(stream.current); analyser.current = ctx.current.createAnalyser(); analyser.current.fftSize = 256; src.connect(analyser.current); } catch { analyser.current = null; }
    return true;
  }, []);
  useEffect(() => { if (!recording || !analyser.current) return; const d = new Uint8Array(analyser.current.frequencyBinCount); const id = setInterval(() => { analyser.current!.getByteTimeDomainData(d); let m = 0; for (const x of d) m = Math.max(m, Math.abs(x - 128)); setLevel(m / 128); }, 90); return () => clearInterval(id); }, [recording]);

  const startRecog = useCallback(() => {
    const R = SpeechRec(); if (!R) return; wantRecog.current = true;
    try { const r = new R(); r.lang = "en-CA"; r.continuous = true; r.interimResults = true;
      r.onresult = (e) => { let interim = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const res = e.results[i]; if (res.isFinal) finalText.current += (finalText.current ? " " : "") + res[0].transcript.trim(); else interim += res[0].transcript; } setLive(`${finalText.current} ${interim}`.trim()); };
      r.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") wantRecog.current = false; };
      r.onend = () => { if (wantRecog.current) { try { r.start(); } catch { /* restarting */ } } };
      r.start(); recog.current = r; } catch { recog.current = null; }
  }, []);
  const start = useCallback(() => {
    chunks.current = []; finalText.current = ""; setLive(""); startedAt.current = Date.now(); setRecording(true);
    if (stream.current?.active) { const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported?.(t)); const m = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined); m.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); }; m.start(500); mr.current = m; }
    startRecog();
  }, [startRecog]);
  const stop = useCallback(() => new Promise<{ blob: Blob | null; durationSec: number; transcript: string }>((resolve) => {
    wantRecog.current = false; try { recog.current?.stop(); } catch { /* ignore */ }
    setRecording(false); const durationSec = (Date.now() - startedAt.current) / 1000;
    const finish = (blob: Blob | null) => setTimeout(() => resolve({ blob, durationSec, transcript: finalText.current.trim() }), 400);
    const m = mr.current; if (m && m.state !== "inactive") { m.onstop = () => finish(new Blob(chunks.current, { type: m.mimeType || "audio/webm" })); m.stop(); } else finish(null);
  }), []);
  const release = useCallback(() => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; void ctx.current?.close().catch(() => {}); ctx.current = null; }, []);
  useEffect(() => () => { wantRecog.current = false; try { recog.current?.stop(); } catch { /* ignore */ } }, []);
  return { ensureMic, start, stop, release, live, level, recording, recogSupported, hasStream: () => !!stream.current?.active };
}
