# yugioh mcp

MCP server for **YGOPRODeck**, the Yu Gi Oh! card database.

## Tools

| Tool | What it does |
|---|---|
| `search_cards` | Exact name card search (full stats, prices, banlist status) |
| `search_by_archetype` | Cards in an archetype (Blue Eyes, Branded, Dark Magician…) |
| `get_card` | Card by numeric id |
| `get_banlist` | Current TCG / OCG / GOAT forbidden & limited list, grouped by status |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
search_cards { name: "blue-eyes white dragon" }
get_banlist { format: "tcg" }
```

Keyless. Prints ATK/DEF, level/link rating, card prices (TCGplayer/Cardmarket/eBay), and TCG/OCG banlist status per card.
