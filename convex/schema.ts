import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Mirrors Snapshot in adapters/types.ts. Optional TS fields are v.optional —
// ingest scripts must omit them (undefined is not a Convex value), not send null.
export const snapshotValidator = v.object({
  benchmark: v.object({
    slug: v.string(),
    name: v.string(),
    tagline: v.string(),
    owner: v.object({
      name: v.string(),
      xHandle: v.optional(v.string()),
      url: v.optional(v.string()),
    }),
    siteUrl: v.optional(v.string()),
    repoUrl: v.string(),
    license: v.optional(v.string()),
    scoreLabel: v.string(),
    direction: v.union(v.literal("higher-better"), v.literal("lower-better")),
    scoreExplainer: v.string(),
    curatedNote: v.optional(v.string()),
  }),
  retrievedAt: v.string(),
  sourceGeneratedAt: v.optional(v.string()),
  sourceDataUrl: v.string(),
  entries: v.array(
    v.object({
      rank: v.number(),
      model: v.string(),
      org: v.optional(v.string()),
      variant: v.optional(v.string()),
      score: v.number(),
      display: v.string(),
      extras: v.optional(
        v.array(v.object({ label: v.string(), value: v.string() })),
      ),
    }),
  ),
});

export default defineSchema({
  snapshots: defineTable({
    slug: v.string(),
    data: snapshotValidator,
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),
});
