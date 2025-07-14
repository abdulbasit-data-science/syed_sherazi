"use client";
import React, { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Mic, Send } from "lucide-react";

// Use environment variables for config
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!N8N_WEBHOOK_URL || !OPENAI_API_KEY) {
  throw new Error("N8N_WEBHOOK_URL and OPENAI_API_KEY must be set in your environment variables.");
}

// Function to detect if content contains markdown
function isMarkdown(content: string): boolean {
  const markdownPatterns = [
    /^#+\s+/m,           // Headers
    /\*\*.*?\*\*/,       // Bold
    /\*.*?\*/,           // Italic
    /`.*?`/,             // Inline code
    /```[\s\S]*?```/,    // Code blocks
    /\[.*?\]\(.*?\)/,    // Links
    /^\s*[-*+]\s+/m,     // Unordered lists
    /^\s*\d+\.\s+/m,     // Ordered lists
    /^\s*>\s+/m,         // Blockquotes
    /^\|.*\|$/m,         // Tables
    /~~.*?~~/,           // Strikethrough
  ];
  
  return markdownPatterns.some(pattern => pattern.test(content));
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "agent"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea when input changes (typed or from STT)
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 128) + 'px';
    }
  }, [input]);

  // Handle sending text to n8n webhook
  async function sendMessage(text: string) {
    setMessages((msgs) => [...msgs, { role: "user", content: text }]);
    setLoading(true);
    setInput("");
    try {
      const res = await fetch(N8N_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatInput: text }),
      });
      
      let content: string;
      const contentType = res.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        // Handle JSON response
        const data = await res.json();
        content = data.output ?? String(data);
      } else {
        // Handle plain text response
        content = await res.text();
      }
      
      setMessages((msgs) => [...msgs, { role: "agent", content }]);
    } catch (e) {
      setMessages((msgs) => [...msgs, { role: "agent", content: "Error: " + String(e) }]);
    }
    setLoading(false);
  }

  // Handle voice recording and OpenAI STT
  async function startRecording() {
    try {
      setRecording(true);
      audioChunks.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        setRecording(false);
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        // OpenAI STT expects audio/wav, audio/mpeg, audio/mp3, audio/mp4, audio/m4a, audio/webm, or audio/mpga
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");
        formData.append("model", "whisper-1");
        try {
          const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${OPENAI_API_KEY!}` },
            body: formData,
          });
          const data = await resp.json();
          if (data.text) {
            setInput(data.text);
          } else {
            alert("Could not transcribe audio");
          }
        } catch (e) {
          alert("STT error: " + String(e));
        }
      };
      mediaRecorder.start();
    } catch (error) {
      setRecording(false);
      alert("Error accessing microphone: " + String(error));
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && input.trim() && !loading) {
      sendMessage(input.trim());
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-1 sm:px-0">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 shadow-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-[80vh] sm:h-[75vh] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-zinc-50 dark:from-zinc-900 to-white dark:to-zinc-950">
          {messages.length === 0 && (
            <div className="text-center text-zinc-400 pt-10 sm:pt-16 select-none text-sm sm:text-base">
              Start the conversation by typing or using the microphone!
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={
                  msg.role === "user"
                    ? "max-w-[90%] sm:max-w-[80%] bg-blue-600 text-white rounded-br-2xl rounded-t-2xl rounded-bl-md px-3 sm:px-4 py-2 text-sm sm:text-base shadow-md"
                    : "max-w-[90%] sm:max-w-[80%] bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-2xl rounded-t-2xl rounded-br-md px-3 sm:px-4 py-2 text-sm sm:text-base shadow"
                }
              >
                {msg.role === "agent" && isMarkdown(msg.content) ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[90%] sm:max-w-[80%] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-bl-2xl rounded-t-2xl rounded-br-md px-3 sm:px-4 py-2 text-sm sm:text-base shadow animate-pulse">
                Agent is typing...
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2 sm:p-4 flex gap-1 sm:gap-2 items-center sticky bottom-0">
          {!recording ? (
            <button
              className="p-2 sm:p-2.5 rounded-full border bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-blue-400 flex-shrink-0"
              onClick={startRecording}
              disabled={loading}
              aria-label="Start recording"
            >
              <Mic size={20} />
            </button>
          ) : (
            <button
              className="p-2 sm:p-2.5 rounded-full border bg-red-500 text-white hover:bg-red-600 transition-colors focus:ring-2 focus:ring-red-400 flex-shrink-0"
              onClick={stopRecording}
              disabled={loading}
              aria-label="Stop recording"
            >
              <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
            </button>
          )}
          <textarea
            ref={inputRef}
            className="flex-1 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 sm:px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition text-sm sm:text-base resize-none min-h-[40px] max-h-[120px] overflow-y-auto"
            placeholder="Type your message or use the mic..."
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-resize the textarea
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleInputKeyDown}
            disabled={loading}
            autoComplete="off"
            rows={1}
          />
          <button
            className="p-2 sm:p-2.5 rounded-full bg-blue-600 text-white disabled:bg-blue-300 hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-400 flex-shrink-0"
            onClick={() => input.trim() && sendMessage(input.trim())}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
} 