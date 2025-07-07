This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## n8n Agent Chat Frontend

This is a Next.js frontend for interacting with your n8n agent via webhook. It supports:

- Text input
- Voice input (speech-to-text using OpenAI Whisper API)
- Sending messages to your n8n webhook
- Rendering markdown responses from n8n

### Setup

1. **Set your n8n webhook URL and OpenAI API key**

   In `src/app/Chat.tsx`, set:
   ```ts
   const N8N_WEBHOOK_URL = "https://your-n8n-webhook-url";
   const OPENAI_API_KEY = "sk-...";
   ```
   You can use environment variables or a config file for production.

2. **Run the app**
   ```bash
   npm run dev
   ```

3. **Usage**
   - Type a message or hold the mic button to record your voice.
   - The voice will be transcribed to text using OpenAI and shown in the input field.
   - Press Enter or click Send to send the message to your n8n agent.
   - Markdown responses from n8n will be rendered in the chat.

---

**Note:**
- The OpenAI API key is required for voice-to-text (STT) functionality.
- The n8n webhook should accept a POST with `{ chatInput: "..." }` and return a JSON with an `output` field.
- The frontend automatically detects whether the output is markdown or plain text and renders it appropriately.
