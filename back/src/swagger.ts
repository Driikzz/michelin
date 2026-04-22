import type { OpenAPIV3 } from 'openapi-types';

const bearerAuth: OpenAPIV3.SecuritySchemeObject = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
};

const errorSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: { message: { type: 'string' } },
};

const tagSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
  },
};

const restaurantSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    michelin_rank: {
      type: 'string',
      enum: ['1_star', '2_stars', '3_stars', 'bib_gourmand', 'selected'],
      nullable: true,
    },
    price_category: { type: 'integer', minimum: 1, maximum: 4, nullable: true },
    city: { type: 'string', nullable: true },
    country: { type: 'string', nullable: true },
    latitude: { type: 'number', nullable: true },
    longitude: { type: 'number', nullable: true },
    images: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
  },
};

const hotelSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    michelin_rank: {
      type: 'string',
      enum: ['1_star', '2_stars', '3_stars', 'bib_gourmand', 'selected'],
      nullable: true,
    },
    price_category: { type: 'integer', minimum: 1, maximum: 4, nullable: true },
    city: { type: 'string', nullable: true },
    country: { type: 'string', nullable: true },
    latitude: { type: 'number', nullable: true },
    longitude: { type: 'number', nullable: true },
    images: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
  },
};

const userSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    username: { type: 'string' },
    email: { type: 'string', format: 'email' },
    xp: { type: 'integer' },
    level: { type: 'integer' },
    streak: { type: 'integer' },
    created_at: { type: 'string', format: 'date-time' },
  },
};

const playerSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    room_id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string', format: 'uuid', nullable: true },
    guest_id: { type: 'string', format: 'uuid', nullable: true },
    nickname: { type: 'string' },
    is_host: { type: 'boolean' },
    joined_at: { type: 'string', format: 'date-time' },
  },
};

const gameHistoryEntrySchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    room_id: { type: 'string', format: 'uuid', nullable: true },
    entity_id: { type: 'string', format: 'uuid' },
    entity_type: { type: 'string', enum: ['RESTAURANT', 'HOTEL'] },
    entity_name: { type: 'string' },
    entity_image: { type: 'string', nullable: true },
    entity_city: { type: 'string', nullable: true },
    xp_gained: { type: 'integer' },
    played_at: { type: 'string', format: 'date-time' },
    latitude: { type: 'number', nullable: true },
    longitude: { type: 'number', nullable: true },
  },
};

const roomSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    roomId: { type: 'string', format: 'uuid' },
    playerId: { type: 'integer' },
    gameMode: { type: 'string', enum: ['FAST', 'CLASSIC', 'CHAOS'] },
    entityType: { type: 'string', enum: ['RESTAURANT', 'HOTEL'] },
    status: { type: 'string', enum: ['WAITING', 'PLAYING', 'FINISHED'] },
    latitude: { type: 'number' },
    longitude: { type: 'number' },
    radiusKm: { type: 'number' },
    players: { type: 'array', items: { $ref: '#/components/schemas/Player' } },
  },
};

const searchQueryParams: OpenAPIV3.ParameterObject[] = [
  { name: 'lat', in: 'query', required: true, schema: { type: 'number' }, description: 'Latitude' },
  { name: 'lng', in: 'query', required: true, schema: { type: 'number' }, description: 'Longitude' },
  { name: 'radius', in: 'query', schema: { type: 'number', default: 5 }, description: 'Radius in km' },
  { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Text search on name' },
  { name: 'prices', in: 'query', schema: { type: 'string' }, description: 'Comma-separated price categories (e.g. 1,3)' },
  { name: 'tags', in: 'query', schema: { type: 'string' }, description: 'Comma-separated tag IDs (e.g. 1,3)' },
];

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Michelin Game API',
    version: '1.0.0',
    description:
      'REST + WebSocket backend for the Michelin multiplayer restaurant/hotel voting game.\n\n' +
      '## WebSocket\n' +
      'Connect to `ws://<host>/ws?token=<JWT>&roomId=<UUID>` (authenticated user) ' +
      'or `ws://<host>/ws?guestId=<UUID>&roomId=<UUID>` (guest).\n\n' +
      '**Events to send:**\n' +
      '- `room:join` — announce presence after connecting\n' +
      '- `room:start` — host starts the game (or transitions BUILDING → VOTING in CLASSIC mode)\n' +
      '- `game:vote` — `{ sessionId, entityId, vote: boolean }`\n' +
      '- `game:add_entity` — CLASSIC / BUILDING phase: `{ sessionId, entityId }`\n\n' +
      '**Events received:**\n' +
      '- `room:update` — player list / phase update\n' +
      '- `game:start` — `{ phase, sessionId, entities, entityType, timerSeconds?, timerEndsAt? }`\n' +
      '- `game:timer_update` — `{ remaining }`\n' +
      '- `game:vote_update` — `{ entityId, likeCount, entityType }`\n' +
      '- `game:end` — `{ winnerId, entity, entityType, wasRandom, xpAwards }`\n' +
      '- `error` — `{ message }`',
  },
  servers: [{ url: '/api', description: 'Current server' }],
  components: {
    securitySchemes: { bearerAuth },
    schemas: {
      Error: errorSchema,
      Tag: tagSchema,
      Restaurant: restaurantSchema,
      Hotel: hotelSchema,
      User: userSchema,
      Player: playerSchema,
      Room: roomSchema,
      GameHistoryEntry: gameHistoryEntrySchema,
    },
  },
  paths: {
    // ── Health ────────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Server is up',
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } } },
          },
        },
      },
    },

    // ── Auth ──────────────────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', example: 'testuser' },
                  email: { type: 'string', format: 'email', example: 'test@example.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Email already taken', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email + password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'test@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated',
            content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } },
          },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Users ─────────────────────────────────────────────────────────────────
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Get all users',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'User list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'User found', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Users — history ───────────────────────────────────────────────────────
    '/users/me/history': {
      get: {
        tags: ['Users'],
        summary: 'Get game history for the authenticated user (last 20 games)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Game history',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/GameHistoryEntry' } },
              },
            },
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Guests ────────────────────────────────────────────────────────────────
    '/guests': {
      post: {
        tags: ['Guests'],
        summary: 'Create an anonymous guest session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nickname'],
                properties: { nickname: { type: 'string', example: 'CoolGuest' } },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Guest created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    nickname: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Restaurants ───────────────────────────────────────────────────────────
    '/restaurants/search': {
      get: {
        tags: ['Restaurants'],
        summary: 'Search restaurants by location',
        parameters: searchQueryParams,
        responses: {
          '200': {
            description: 'Matching restaurants',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Restaurant' } } } },
          },
          '400': { description: 'Missing lat/lng', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/restaurants/tags': {
      get: {
        tags: ['Restaurants'],
        summary: 'Get all restaurant cuisine tags',
        responses: {
          '200': { description: 'Tag list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Tag' } } } } },
        },
      },
    },

    // ── Hotels ────────────────────────────────────────────────────────────────
    '/hotels/search': {
      get: {
        tags: ['Hotels'],
        summary: 'Search hotels by location',
        parameters: searchQueryParams,
        responses: {
          '200': {
            description: 'Matching hotels',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Hotel' } } } },
          },
          '400': { description: 'Missing lat/lng', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/hotels/nearby': {
      get: {
        tags: ['Hotels'],
        summary: 'Get hotels near a point (used on verdict page)',
        description: 'Returns 2–3 hotels within `radius` km of the given coordinates, optionally filtered by price category. Designed to suggest nearby hotels after a restaurant verdict.',
        parameters: [
          { name: 'lat', in: 'query', required: true, schema: { type: 'number' }, description: 'Latitude of the reference point (e.g. winning restaurant)' },
          { name: 'lng', in: 'query', required: true, schema: { type: 'number' }, description: 'Longitude of the reference point' },
          { name: 'radius', in: 'query', schema: { type: 'number', default: 5 }, description: 'Search radius in km (default 5)' },
          { name: 'prices', in: 'query', schema: { type: 'string' }, description: 'Comma-separated price categories to include, e.g. "2,3". Omit for no restriction.' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 3, maximum: 10 }, description: 'Max hotels to return (default 3, max 10)' },
        ],
        responses: {
          '200': {
            description: 'Nearby hotels',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    hotels: { type: 'array', items: { $ref: '#/components/schemas/Hotel' } },
                  },
                },
              },
            },
          },
          '400': { description: 'Missing lat/lng', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/hotels/tags': {
      get: {
        tags: ['Hotels'],
        summary: 'Get all hotel tags',
        responses: {
          '200': { description: 'Tag list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Tag' } } } } },
        },
      },
    },

    // ── Rooms ─────────────────────────────────────────────────────────────────
    '/rooms': {
      post: {
        tags: ['Rooms'],
        summary: 'Create a game room',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['gameMode', 'entityType', 'latitude', 'longitude'],
                properties: {
                  gameMode: { type: 'string', enum: ['FAST', 'CLASSIC', 'CHAOS'], example: 'FAST' },
                  entityType: { type: 'string', enum: ['RESTAURANT', 'HOTEL'], default: 'RESTAURANT' },
                  latitude: { type: 'number', example: 45.75 },
                  longitude: { type: 'number', example: 4.83 },
                  radiusKm: { type: 'number', default: 5, example: 5 },
                  priceFilters: {
                    type: 'array',
                    items: { type: 'integer', minimum: 1, maximum: 4 },
                    default: [],
                    description: 'Price categories to include (empty = all)',
                  },
                  tagIds: { type: 'array', items: { type: 'integer' }, default: [] },
                  nickname: { type: 'string', example: 'HostPlayer' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Room created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/rooms/{id}': {
      get: {
        tags: ['Rooms'],
        summary: 'Get room details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Room found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
          '404': { description: 'Room not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/rooms/{id}/join': {
      post: {
        tags: ['Rooms'],
        summary: 'Join a room (as authenticated user or guest)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        security: [{ bearerAuth: [] }, {}],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nickname'],
                properties: {
                  nickname: { type: 'string', example: 'Player2' },
                  guestId: { type: 'string', format: 'uuid', description: 'Required when joining as a guest (no Bearer token)' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Joined',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { playerId: { type: 'integer' }, roomId: { type: 'string', format: 'uuid' } },
                },
              },
            },
          },
          '404': { description: 'Room not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Already in room', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};
