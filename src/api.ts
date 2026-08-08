/**
 * YGOPRODeck client — Yu-Gi-Oh! card database.
 * Docs: https://ygoprodeck.com/api-guide/ — keyless.
 */
const BASE = "https://db.ygoprodeck.com/api/v7"

export class YugiohError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "yugioh-mcp/1.0" },
  })
  if (!res.ok) throw new YugiohError(`YGOPRODeck error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface YgoCard {
  id: number
  name: string
  type: string
  frameType?: string
  desc: string
  race?: string
  attribute?: string
  archetype?: string
  level?: number
  atk?: number
  def?: number
  scale?: number
  linkval?: number
  linkmarkers?: string[]
  card_images?: { image_url?: string; image_url_small?: string }[]
  card_prices?: { tcgplayer_price?: string; cardmarket_price?: string; ebay_price?: string }[]
  banlist_info?: { ban_tcg?: string; ban_ocg?: string; ban_goat?: string }
  misc_info?: { beta?: boolean; views?: number }[]
}

export interface BanlistEntry {
  name: string
  id: number
  tcg: string
  ocg: string
  goat: string
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function searchCardsByName(name: string): Promise<YgoCard[]> {
  const data = await getJson<{ data?: any[] }>(`/cardinfo.php?name=${encodeURIComponent(name)}`)
  return (data.data ?? []).map(mapCard)
}

export async function searchCardsByArchetype(archetype: string): Promise<YgoCard[]> {
  const data = await getJson<{ data?: any[] }>(
    `/cardinfo.php?archetype=${encodeURIComponent(archetype)}`
  )
  return (data.data ?? []).map(mapCard)
}

export async function getCardById(id: number): Promise<YgoCard | null> {
  try {
    const data = await getJson<{ data?: any[] }>(`/cardinfo.php?id=${id}`)
    const c = (data.data ?? [])[0]
    return c ? mapCard(c) : null
  } catch {
    return null
  }
}

export async function getBanlist(banlist: "tcg" | "ocg" | "goat" = "tcg"): Promise<BanlistEntry[]> {
  // Docs: `banlist=tcg` returns every card with a TCG banlist status in
  // its banlist_info. The separate ban_tcg param no longer exists.
  const data = await getJson<{ data?: any[] }>(`/cardinfo.php?banlist=${banlist}`)
  return (data.data ?? [])
    .filter((c) => c.banlist_info)
    .map((c) => ({
      name: c.name ?? "?",
      id: c.id,
      tcg: c.banlist_info?.ban_tcg ?? "?",
      ocg: c.banlist_info?.ban_ocg ?? "?",
      goat: c.banlist_info?.ban_goat ?? "?",
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function mapCard(c: any): YgoCard {
  return {
    id: c.id,
    name: c.name ?? "?",
    type: c.type ?? "?",
    frameType: c.frameType,
    desc: c.desc ?? "",
    race: c.race,
    attribute: c.attribute,
    archetype: c.archetype,
    level: c.level,
    atk: c.atk,
    def: c.def,
    scale: c.scale,
    linkval: c.linkval,
    linkmarkers: c.linkmarkers,
    card_images: c.card_images,
    card_prices: c.card_prices,
    banlist_info: c.banlist_info,
    misc_info: c.misc_info,
  }
}

export function formatCard(c: YgoCard, index?: number): string {
  const head = `${index !== undefined ? `${index + 1}. ` : ""}${c.name} [${c.id}]`
  const attr = c.attribute ? ` ${c.attribute}` : ""
  const levelInfo =
    c.level !== undefined
      ? ` Level ${c.level}`
      : c.linkval !== undefined
        ? ` Link-${c.linkval}${c.linkmarkers?.length ? ` (${c.linkmarkers.join("→")})` : ""}`
        : ""
  const stats = [c.atk !== undefined ? `ATK/${c.atk}` : "", c.def !== undefined ? `DEF/${c.def}` : ""]
    .filter(Boolean)
    .join(" ")
  const ban = c.banlist_info?.ban_tcg ? ` · TCG banlist: ${c.banlist_info.ban_tcg}` : ""
  const price = c.card_prices?.[0]
  const lines = [
    head,
    `${c.type}${attr}${levelInfo}${c.race ? ` · ${c.race}` : ""}${c.archetype ? ` · ${c.archetype}` : ""}`,
    c.desc,
    stats,
    price
      ? `Price: TCGplayer $${price.tcgplayer_price ?? "—"} · Cardmarket €${price.cardmarket_price ?? "—"} · eBay $${price.ebay_price ?? "—"}`
      : "",
    c.banlist_info ? `Banlist: TCG ${c.banlist_info.ban_tcg ?? "—"} / OCG ${c.banlist_info.ban_ocg ?? "—"}` : "",
  ].filter(Boolean)
  if (c.card_images?.[0]?.image_url) lines.push(c.card_images[0].image_url)
  return lines.join("\n")
}


