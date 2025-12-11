import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getUserIdentity } from './users';

// Query: Get pending requests FOR the current communicator
export const getPendingRequestsForCommunicator = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    const requests = await ctx.db
      .query('connectionRequests')
      .withIndex('by_communicator', (q) => q.eq('communicatorId', identity.subject))
      .collect();

    // Filter to only pending and get caregiver profiles
    const pendingRequests = await Promise.all(
      requests
        .filter((req) => req.status === 'pending')
        .map(async (req) => {
          const caregiverProfile = await ctx.db
            .query('profiles')
            .withIndex('by_user_id', (q) => q.eq('userId', req.caregiverId))
            .first();

          return {
            _id: req._id,
            caregiverId: req.caregiverId,
            createdAt: req.createdAt,
            caregiver: caregiverProfile
              ? {
                fullName: caregiverProfile.fullName,
                email: caregiverProfile.email,
              }
              : null,
          };
        })
    );

    return pendingRequests;
  },
});

// Query: Get sent requests BY the current caregiver
export const getSentRequestsForCaregiver = query({
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    const requests = await ctx.db
      .query('connectionRequests')
      .withIndex('by_caregiver', (q) => q.eq('caregiverId', identity.subject))
      .collect();

    // Filter to only pending and get communicator profiles
    const pendingRequests = await Promise.all(
      requests
        .filter((req) => req.status === 'pending')
        .map(async (req) => {
          const communicatorProfile = await ctx.db
            .query('profiles')
            .withIndex('by_user_id', (q) => q.eq('userId', req.communicatorId))
            .first();

          return {
            _id: req._id,
            communicatorId: req.communicatorId,
            createdAt: req.createdAt,
            communicator: communicatorProfile
              ? {
                fullName: communicatorProfile.fullName,
                email: communicatorProfile.email,
              }
              : null,
          };
        })
    );

    return pendingRequests;
  },
});

// Mutation: Create a connection request (caregiver requests to add communicator)
export const createConnectionRequest = mutation({
  args: {
    communicatorId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const caregiverId = identity.subject;

    // Verify the caregiver has the correct role
    const caregiverProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', caregiverId))
      .first();

    if (!caregiverProfile || caregiverProfile.role !== 'caregiver') {
      throw new Error('Only caregivers can send connection requests');
    }

    // Verify the communicator exists and has communicator role
    const communicatorProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', args.communicatorId))
      .first();

    if (!communicatorProfile) {
      throw new Error('User not found');
    }

    if (communicatorProfile.role !== 'communicator') {
      throw new Error('Can only send requests to communicators');
    }

    // Check if already connected
    const existingClient = await ctx.db
      .query('caregiverClients')
      .withIndex('by_caregiver', (q) => q.eq('caregiverId', caregiverId))
      .collect();

    const alreadyConnected = existingClient.find(
      (rel) => rel.communicatorId === args.communicatorId
    );

    if (alreadyConnected) {
      throw new Error('Already connected to this client');
    }

    // Check if pending request already exists
    const existingRequests = await ctx.db
      .query('connectionRequests')
      .withIndex('by_caregiver', (q) => q.eq('caregiverId', caregiverId))
      .collect();

    const pendingRequest = existingRequests.find(
      (req) => req.communicatorId === args.communicatorId && req.status === 'pending'
    );

    if (pendingRequest) {
      throw new Error('Connection request already pending');
    }

    // Create the request
    return await ctx.db.insert('connectionRequests', {
      caregiverId,
      communicatorId: args.communicatorId,
      status: 'pending',
      createdAt: Date.now(),
    });
  },
});

// Mutation: Accept a connection request (communicator accepts)
export const acceptConnectionRequest = mutation({
  args: {
    requestId: v.id('connectionRequests'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Verify the current user is the communicator
    if (request.communicatorId !== identity.subject) {
      throw new Error('Not authorized to accept this request');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is no longer pending');
    }

    // Create the caregiverClients relationship
    await ctx.db.insert('caregiverClients', {
      caregiverId: request.caregiverId,
      communicatorId: request.communicatorId,
      createdAt: Date.now(),
    });

    // Delete the request (or update status to accepted)
    await ctx.db.delete(args.requestId);

    return { success: true };
  },
});

// Mutation: Reject a connection request (communicator rejects)
export const rejectConnectionRequest = mutation({
  args: {
    requestId: v.id('connectionRequests'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Verify the current user is the communicator
    if (request.communicatorId !== identity.subject) {
      throw new Error('Not authorized to reject this request');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is no longer pending');
    }

    // Delete the request
    await ctx.db.delete(args.requestId);

    return { success: true };
  },
});

// Mutation: Cancel a connection request (caregiver cancels their own request)
export const cancelConnectionRequest = mutation({
  args: {
    requestId: v.id('connectionRequests'),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Verify the current user is the caregiver who sent it
    if (request.caregiverId !== identity.subject) {
      throw new Error('Not authorized to cancel this request');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is no longer pending');
    }

    // Delete the request
    await ctx.db.delete(args.requestId);

    return { success: true };
  },
});
