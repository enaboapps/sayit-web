import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getUserIdentity } from './users';

// Query: Get all clients for the current caregiver
export const getClients = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    const relationships = await ctx.db
      .query('caregiverClients')
      .withIndex('by_caregiver', (q) => q.eq('caregiverId', identity.subject))
      .collect();

    // Get profile details for each client
    const clients = await Promise.all(
      relationships.map(async (rel) => {
        const profile = await ctx.db
          .query('profiles')
          .withIndex('by_user_id', (q) => q.eq('userId', rel.communicatorId))
          .first();

        return {
          _id: rel._id,
          communicatorId: rel.communicatorId,
          createdAt: rel.createdAt,
          profile: profile
            ? {
                email: profile.email,
                fullName: profile.fullName,
              }
            : null,
        };
      })
    );

    return clients;
  },
});

// Query: Get the caregiver for the current communicator (if any)
export const getCaregiver = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return null;
    }

    const relationship = await ctx.db
      .query('caregiverClients')
      .withIndex('by_communicator', (q) => q.eq('communicatorId', identity.subject))
      .first();

    if (!relationship) {
      return null;
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', relationship.caregiverId))
      .first();

    return {
      _id: relationship._id,
      caregiverId: relationship.caregiverId,
      createdAt: relationship.createdAt,
      profile: profile
        ? {
            email: profile.email,
            fullName: profile.fullName,
          }
        : null,
    };
  },
});

// Mutation: Add a client by their user ID (used after invite acceptance or linking)
export const addClient = mutation({
  args: {
    communicatorId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify the caregiver has the correct role
    const caregiverProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', identity.subject))
      .first();

    if (!caregiverProfile || caregiverProfile.role !== 'caregiver') {
      throw new Error('Only caregivers can add clients');
    }

    // Verify the communicator exists
    const communicatorProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', args.communicatorId))
      .first();

    if (!communicatorProfile) {
      throw new Error('Communicator not found');
    }

    // Check if relationship already exists
    const existing = await ctx.db
      .query('caregiverClients')
      .withIndex('by_caregiver', (q) => q.eq('caregiverId', identity.subject))
      .collect();

    const alreadyLinked = existing.find(
      (rel) => rel.communicatorId === args.communicatorId
    );

    if (alreadyLinked) {
      throw new Error('Client is already linked');
    }

    // Create the relationship
    return await ctx.db.insert('caregiverClients', {
      caregiverId: identity.subject,
      communicatorId: args.communicatorId,
      createdAt: Date.now(),
    });
  },
});

// Mutation: Remove a client
export const removeClient = mutation({
  args: {
    communicatorId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Find the relationship
    const relationships = await ctx.db
      .query('caregiverClients')
      .withIndex('by_caregiver', (q) => q.eq('caregiverId', identity.subject))
      .collect();

    const relationship = relationships.find(
      (rel) => rel.communicatorId === args.communicatorId
    );

    if (!relationship) {
      throw new Error('Client relationship not found');
    }

    // Delete all shared boards for this client
    const sharedBoards = await ctx.db
      .query('sharedBoards')
      .withIndex('by_communicator', (q) => q.eq('communicatorId', args.communicatorId))
      .collect();

    const boardsToDelete = sharedBoards.filter(
      (sb) => sb.caregiverId === identity.subject
    );

    for (const board of boardsToDelete) {
      await ctx.db.delete(board._id);
    }

    // Delete the relationship
    await ctx.db.delete(relationship._id);
  },
});
