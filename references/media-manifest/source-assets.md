# Source asset provenance

The actual user-provided source files live in the conversation workspace and must be copied locally to `media/source/` before Codex's first media build. This handoff package contains mockups, **not** original MP4/PNG files; to simplify local setup a separate original media ZIP can be provided.

| Desired local alias | Original uploaded file | Purpose |
| --- | --- | --- |
| `media/source/master-original.mp4` | `RUEGG_Cinematic_Master_1080p(1).mp4` | Accepted 23.416667s Master |
| `media/source/room-v3-original.mp4` | `hallway to room.mp4` | Accepted 5.183333s Room Branch V3 |
| `media/source/b0-reconstructed-original.png` | `B0 Reconstructed(1).png` | Approved high-detail hallway still |

The already accepted HTML ZIP PoC and its separate reverse MP4 are NOT in the current upload. Derived reverse from V3 is specified in `docs/02-media.md` as a repeatable replacement. Do not assume reverse source is already in repo or in Notion.
