/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as boardTiles from "../boardTiles.js";
import type * as caregiverClients from "../caregiverClients.js";
import type * as connectionRequests from "../connectionRequests.js";
import type * as conversationHistory from "../conversationHistory.js";
import type * as migrations from "../migrations.js";
import type * as phraseBoards from "../phraseBoards.js";
import type * as phrases from "../phrases.js";
import type * as profiles from "../profiles.js";
import type * as symbols from "../symbols.js";
import type * as typingSessions from "../typingSessions.js";
import type * as userSettings from "../userSettings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  boardTiles: typeof boardTiles;
  caregiverClients: typeof caregiverClients;
  connectionRequests: typeof connectionRequests;
  conversationHistory: typeof conversationHistory;
  migrations: typeof migrations;
  phraseBoards: typeof phraseBoards;
  phrases: typeof phrases;
  profiles: typeof profiles;
  symbols: typeof symbols;
  typingSessions: typeof typingSessions;
  userSettings: typeof userSettings;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
