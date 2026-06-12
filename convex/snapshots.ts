import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { snapshotValidator } from "./schema";

const snapshotDoc = v.object({
  _id: v.id("snapshots"),
  _creationTime: v.number(),
  slug: v.string(),
  data: snapshotValidator,
  updatedAt: v.number(),
});

// All snapshots, for the site to render. ~8-15 docs, well under read limits.
export const list = query({
  args: {},
  returns: v.array(snapshotDoc),
  handler: async (ctx) => {
    return await ctx.db.query("snapshots").collect();
  },
});

// Called by the Node ingest scripts. Guarded by INGEST_SECRET.
export const upsert = mutation({
  args: {
    secret: v.string(),
    slug: v.string(),
    data: snapshotValidator,
  },
  returns: v.id("snapshots"),
  handler: async (ctx, args) => {
    const expected = process.env.INGEST_SECRET;
    if (!expected) {
      throw new Error("INGEST_SECRET is not set on the deployment");
    }
    if (args.secret !== expected) {
      throw new Error("Invalid ingest secret");
    }

    const existing = await ctx.db
      .query("snapshots")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    const updatedAt = Date.now();
    if (existing !== null) {
      await ctx.db.replace(existing._id, {
        slug: args.slug,
        data: args.data,
        updatedAt,
      });
      return existing._id;
    }
    return await ctx.db.insert("snapshots", {
      slug: args.slug,
      data: args.data,
      updatedAt,
    });
  },
});

// Admin helper for removing a snapshot (e.g. a retired benchmark or a test
// doc). Internal only — run via `npx convex run snapshots:removeBySlug`.
export const removeBySlug = internalMutation({
  args: { slug: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("snapshots")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing === null) {
      return false;
    }
    await ctx.db.delete(existing._id);
    return true;
  },
});
