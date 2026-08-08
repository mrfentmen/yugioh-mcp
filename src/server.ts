import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  YugiohError,
  formatCard,
  getBanlist,
  getCardById,
  searchCardsByArchetype,
  searchCardsByName,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "yugioh-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_cards",
    "Search Yu-Gi-Oh! cards by exact name.",
    { name: z.string().describe("Card name, e.g. 'Blue-Eyes White Dragon'") },
    async ({ name }) => {
      try {
        const cards = await searchCardsByName(name)
        if (cards.length === 0) return text(`No Yu-Gi-Oh! card named "${name}".`)
        return text(`Cards matching "${name}":\n\n${cards.map((c, i) => formatCard(c, i)).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_by_archetype",
    "Search Yu-Gi-Oh! cards by archetype (e.g. 'Blue-Eyes', 'Dark Magician', 'Branded').",
    { archetype: z.string().describe("Archetype name"), limit: z.number().int().min(1).max(30).default(10) },
    async ({ archetype, limit }) => {
      try {
        const cards = await searchCardsByArchetype(archetype)
        if (cards.length === 0) return text(`No archetype "${archetype}" found.`)
        return text(
          `Cards in archetype "${archetype}" (${cards.length} total, showing ${Math.min(limit, cards.length)}):\n\n` +
            cards.slice(0, limit).map((c, i) => formatCard(c, i)).join("\n\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_card",
    "Get a single card by numeric id (from search results).",
    { id: z.number().int().describe("Card id, e.g. 89631139") },
    async ({ id }) => {
      try {
        const card = await getCardById(id)
        if (!card) return text(`No Yu-Gi-Oh! card with id ${id}.`)
        return text(formatCard(card))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_banlist",
    "Get the current TCG/OCG forbidden & limited list.",
    { format: z.enum(["tcg", "ocg", "goat"]).default("tcg").describe("Banlist format") },
    async ({ format }) => {
      try {
        const list = await getBanlist(format)
        if (list.length === 0) return text(`Empty ${format.toUpperCase()} banlist.`)
        const grouped = new Map<string, string[]>()
        for (const e of list) {
          const status = format === "ocg" ? e.ocg : format === "goat" ? e.goat : e.tcg
          const key = status || "?"
          if (!grouped.has(key)) grouped.set(key, [])
          grouped.get(key)!.push(e.name)
        }
        const out: string[] = []
        for (const [status, names] of grouped) {
          out.push(`${status.toUpperCase()} (${names.length}):\n  ${names.join(", ")}`)
        }
        return text(`${format.toUpperCase()} banlist:\n\n${out.join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof YugiohError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
