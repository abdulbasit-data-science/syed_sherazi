import Chat from "./Chat";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center"> Agent Chat</h1>
        <Chat />
      </div>
    </main>
  );
}
