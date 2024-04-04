import {
  getWorkspaceViaEdge,
  incrementWorkspaceAIUsage,
} from "@/lib/planetscale";
import { getSearchParams } from "@dub/utils";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { internal_runWithWaitUntil as waitUntil } from "next/dist/server/web/internal-edge-wait-until";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

// POST /api/ai/link – Generate a shortlink key from a prompt using AI
export async function POST(req: NextRequest) {
  const searchParams = getSearchParams(req.url);
  const { workspaceId } = searchParams;
  const workspace = await getWorkspaceViaEdge(workspaceId);

  if (!workspace) {
    return new Response("Workspace not found", { status: 404 });
  }

  if (workspace.aiUsage > workspace.aiLimit) {
    return new Response(
      "Exceeded AI usage limit. Upgrade to a higher plan to get more AI credits.",
      { status: 429 },
    );
  }

  try {
    const { prompt } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant and only answer in short link keys, e.g. you receive a question like 'What is the shortlink for meta-title Notion and meta-description The all in one workspace?' and you respond with e.g. 'notion-workspace'. Try to combine them in a shortlink that makes sense and is easy to share on social media. Don't use any special characters or spaces and only response with keys less than 20 characters long. If it makes sense, try to use acronyms/initials, e.g. techcrunch -> tc, github -> gh.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
      top_p: 1,
      frequency_penalty: 2,
      presence_penalty: 2,
    });

    const stream = OpenAIStream(response);

    waitUntil(async () => await incrementWorkspaceAIUsage(workspaceId));

    return new StreamingTextResponse(stream);
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
