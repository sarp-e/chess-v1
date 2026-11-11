# Online Rooms — Design

Date: 2026-09-29
Status: approved design, not yet implemented
Branch plan: build on `feat/join-by-code` (PR #10), merge together

## Goal

Replace the one-off "Create Game" invite with a **room**: two players join once by
code and play as many games as they like, with a running series score. Random
matchmaking ("Find Opponent") is unchanged and keeps producing single games.

## Decisions

| Question | Decision |
|---|---|
| Scope | Rooms replace Create Game. Matchmaking untouched. |
| Next game | Both players click "Play again". |
| Membership | Exactly 2 seats, rejoinable. A third person with the code is refused. |
| Series score | Yes — wins / losses / draws within the room. |
| Token farming | Cap token-awarding games per room per day. |

## Data model

New table:

```sql
rooms(
  id          uuid pk default gen_random_uuid(),
  code        text not null unique,          -- default public.generate_game_code()
  seat_a_id   uuid not null,                 -- creator
  seat_b_id   uuid,                          -- null until someone joins
  ready_a     boolean not null default false,
  ready_b     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
)
```

`games` gains:

```sql
room_id     uuid references public.rooms(id) on delete cascade,  -- null for matchmaking games
game_number int                                                   -- 1-based within the room, null otherwise
unique (room_id, game_number)
```

Seats are named `a`/`b`, not `white`/`black`, because **colors alternate**:
game `N` has white = `seat_a_id` when `N` is odd, `seat_b_id` when `N` is even.
This is derived from `game_number`, so no extra state is stored.

`generate_game_code()` already exists from the join-by-code migration and is
reused verbatim for room codes.

### What happens to `games.code`

The join-by-code migration (`20260926120000`) put `code` on `games`. Rooms move
that responsibility to `rooms`, so the rooms migration **drops `games.code`** and
its unique constraint. `generate_game_code()` is kept.

That migration is already applied to production, so the column must be dropped by
a new forward migration rather than by un-applying the old one.

## RPCs

All are `SECURITY DEFINER` with `set search_path = public`, matching the existing
token-economy functions. They exist to make multi-step operations atomic and to
avoid broad read policies.

### `join_room_by_code(p_code text) returns uuid`

Resolves a code to a room and claims a seat. Returns the room id, or null.

1. Return null if `auth.uid()` is null.
2. `select ... from rooms where code = upper(trim(p_code)) for update`.
3. If the caller already holds a seat, return the room id (this is the rejoin path).
4. If `seat_b_id` is null, set it to `auth.uid()`, then **create game 1**
   (`room_id`, `game_number = 1`, `white_id = seat_a_id`, `black_id = seat_b_id`,
   `status = 'active'`) and return the room id.
5. Otherwise the room is full — return null.

Creating game 1 inside this call means there is no "both players ready" handshake
to lose on entry, and no race between the two clients.

Because the lookup happens inside the function, **`rooms` needs no public select
policy at all**. This closes the hole on `main`, where any signed-in user can read
every waiting game and therefore enumerate codes.

### `set_room_ready(p_room_id uuid) returns uuid`

Marks the caller ready for the next game. Returns the new game id, or null.

1. Return null unless the caller holds a seat.
2. Return null if the room has an unfinished game.
3. Set `ready_a` or `ready_b` for the caller's seat.
4. If both are now true: create the next game
   (`game_number = max(game_number) + 1`, colors alternated as above,
   `status = 'active'`), clear both ready flags, return the new game id.
5. Otherwise return null.

The ready flags live on the row rather than in a broadcast so they survive a
refresh, and the create-game step is atomic, so both clients can call this
simultaneously without producing two games.

### `award_online_win(p_game_id uuid)` — modified

Add a room cap before awarding. After the existing checks pass and the game
belongs to a room, count that room's games that are `finished`, have
`tokens_awarded = true`, and whose `updated_at` falls on the current UTC date.
For such a game `updated_at` is the moment tokens were claimed, since setting
`tokens_awarded` is the last write it receives. If that count is already **3**,
mark the game claimed but award 0.

Matchmaking games (`room_id is null`) are unaffected.

## RLS

`rooms`:

- **select**: `auth.uid() in (seat_a_id, seat_b_id)` — members only. Joining goes
  through the RPC, which bypasses RLS.
- **insert**: `auth.uid() = seat_a_id`.
- **update**: none. Seats and ready flags are only ever written by the RPCs.

`games`: the existing policies still apply. Room games are created by RPCs with
both players set and `status = 'active'`, so they never rely on the
`status = 'waiting'` read policy. The `join waiting game` policy stays for
matchmaking.

## Routes and UI

| Route | Purpose |
|---|---|
| `/play/room/:code` | The room. Renders the current game, or the waiting/between-games panel. |
| `/play/online/:gameId` | Unchanged. Matchmaking games. |

Using the code in the URL makes the invite link and the code the same string, so
the waiting screen has **one** thing to share instead of today's separate
copy-link and copy-code buttons.

**Lobby** (`OnlineLobbyPage`): "Create Game" becomes "Create Room" and navigates
to `/play/room/:code`. The bottom-left "Join with code" box from PR #10 stays,
but calls `join_room_by_code` and navigates to the room. "Find Opponent" is
untouched.

**Room page** (`RoomPage`, new) has three states:

- *Waiting* — one seat empty. Show the code, a copy button, and "Waiting for
  opponent". Poll the room every 2s.
- *Playing* — render the board via the existing game hook.
- *Between games* — show the result, the series score, and a "Play again" button
  that calls `set_room_ready`. Show whether the opponent is ready. Poll every 2s
  so the non-initiating client picks up the new game.

Polling at 2s matches the existing waiting-room behaviour in `useOnlineGame`.

**Refused join**: a third person opening the code gets "This room is full",
with a link back to the lobby.

## Series score

Computed client-side from the room's finished games — no stored counter to drift.
One query per room: `select result, white_id, black_id, game_number from games
where room_id = ... and status = 'finished'`, then tally against the viewer's id.

## Client code changes

| File | Change |
|---|---|
| `src/lib/supabase.ts` | Add `RoomRow`; drop `code` from `GameRow`; add `room_id`, `game_number`. |
| `src/lib/gameCode.ts` | `findWaitingGameByCode` is replaced by a `joinRoomByCode` wrapper over the RPC. `normalizeGameCode` is kept. |
| `src/hooks/useRoom.ts` (new) | Loads the room, polls while waiting or between games, exposes seats, current game id, ready state, score, and `playAgain`. |
| `src/hooks/useOnlineGame.ts` | Remove `code` and `requestRematch`/`rematchGameId` — superseded by the room. Keep everything else. |
| `src/pages/RoomPage.tsx` (new) | The three states above, reusing `ChessBoard` and the existing panel components. |
| `src/pages/OnlineGamePage.tsx` | Drop the code/rematch UI. Stays as the matchmaking game page. |
| `src/pages/OnlineLobbyPage.tsx` | Create Room; join box calls the new RPC. |
| `src/App.tsx` | Add the `/play/room/:code` route behind `RequireAuth`. |

## Testing

The repo has no test runner, so verification is manual plus SQL-level checks.

1. **Migration applies cleanly** — `supabase db push` against a database with
   existing `games` rows, including rows carrying the now-dropped `code`.
2. **Two accounts, one room**: create, join by code, play a game to a result,
   both click Play again, second game starts with colors swapped, score updates.
3. **Rejoin**: refresh mid-game and between games; the seat is kept in both cases.
4. **Third person** with the code is refused.
5. **Race**: both clients click Play again simultaneously — exactly one game is
   created (`unique (room_id, game_number)` is the backstop).
6. **Token cap**: play four quick decided games in one room on the same day; the
   fourth awards 0.
7. **Regression**: Find Opponent still works and still awards tokens.

**This all depends on the Supabase REST API being reachable again** — it has been
returning no response since 2026-09-27 while the CLI's direct Postgres path
worked. Nothing here can be verified until that is resolved.

## Out of scope

- Spectators.
- Rooms with more than two seats, or rotating seats.
- Room chat.
- Deleting or expiring old rooms.
- Persisting a score across different rooms with the same opponent.

## Risks

- **`games.code` is dropped two days after being added.** The column is only read
  by unmerged branch code, so nothing on `main` breaks, but production carries a
  migration for a design that never shipped.
- **The token cap is a policy guess.** 3 per room per day is a starting number,
  not a measured one; it lives in one place in SQL and is cheap to change.
- **Polling, not realtime.** Two 2s polls per room is consistent with the existing
  code and costs little at this scale, but it is not free if rooms sit open for
  hours. Switching to the existing realtime publication is a later option.
