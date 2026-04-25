// Tavily wrapper for the demo agent.
// The agent first tries Tavily for fast web grounding. If it can't
// confidently answer, it falls back to GroundTruth and pays a human.

import { tavily } from "@tavily/core";

const apiKey = process.env.TAVILY_API_KEY;

export const tavilyClient = apiKey ? tavily({ apiKey }) : null;

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function searchWeb(query: string): Promise<TavilySearchResult[]> {
  if (!tavilyClient) return [];
  const res = await tavilyClient.search(query, {
    searchDepth: "basic",
    maxResults: 3,
  });
  return res.results as TavilySearchResult[];
}
