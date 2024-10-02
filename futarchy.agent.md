# Harberger

This is a list of messages that can be sent by users. It doesn't include the messages that are received from the server.

## Common Fields

Each message has a set of common fields that are either optional or required, and they always have the same meaning across phases. Below are the descriptions and the expected types for these fields.

### Phase (Integer)
The phase number to which the message belongs. Phases are represented by integers (e.g., `0`, `1`, `2`).

### Round (Integer)
The current round number. This is an integer (e.g., `0`, `1`, `2`).

### Number (Integer)
The player number is used to uniquely identify a player. This is an integer between `1` and `12`. It corresponds to the player's role:
1. Owner
2. Developer
3. Owner
4. Owner
5. Owner
6. Owner
7. Speculator (Harberger and Futarchy)
8. Speculator (Harberger and Futarchy)
9. Speculator (Harberger and Futarchy)
10. Speculator (Harberger and Futarchy)
11. Speculator (Harberger and Futarchy)
12. Speculator (Harberger and Futarchy)

### Type (String)
The type of message, always a string (e.g., `"join"`, `"declare"`, `"post-order"`).

## Messages

### Phase Timeout
An event automatically triggered by the server when a phase's timeout occurs.

```
{
    "phase": 1,  # Integer
    "round": 0   # Integer
}
```

### Join
This event is triggered when a player joins or rejoins the game. The `gameId` is an integer, while the `recovery` token is a string. 

```
{
    "gameId": 149,              # Integer
    "type": "join",             # String
    "recovery": "5lmcp6739..."  # String (alphanumeric token)
}
```

## Phase 0

### Player is Ready
Players declare themselves ready to begin the game. The `gameId` is an integer.

```
{
    "gameId": 149,              # Integer
    "type": "player-is-ready"    # String
}
```

## Phase 1

In Phase 1, no specific actions are sent by players. This phase is for data presentation only.

## Phase 2

### Declaration
Each player owning a property should declare expected revenue for the round. The `declaration` is an array where:
- The first item (`0`) represents the status quo condition.
- The second item (`1`) represents the development of the project.
- The optional third item is reserved for future use (set to `0`).

All values in the `declaration` array are integers, representing expected revenue in the game.

```
{
    "gameId": 149,              # Integer
    "type": "declare",          # String
    "declaration": [
        598000,                 # Integer (Status quo condition)
        215000,                 # Integer (Development condition)
        0                       # Integer (Optional, currently unused)
    ]
}
```

## Phase 3

### Speculation
Speculators may challenge declarations made by property owners. The `snipe` array contains arrays of player numbers (integers) for each condition (`0` and `1`), representing which owners' declarations are being challenged.

```
{
    "gameId": 888,              # Integer
    "type": "done-speculating", # String
    "snipe": [
        [
            2,                  # Integer (Owner number)
            3                   # Integer (Owner number)
        ],
        [
            1                   # Integer (Owner number)
        ]
    ]
}
```

## Phases 4 & 5

These phases are waiting phases where no specific actions are expected from players.

## Phase 6

### Post Order
In the market phase, players can post orders to either buy (bid) or sell (ask) assets. The `order` object contains:
- `price`: An integer representing the price of the asset.
- `quantity`: Always `1` in the current setup.
- `condition`: An integer representing the condition (`0` for status quo, `1` for project development).
- `type`: A string that should be either `"ask"` (sell) or `"bid"` (buy).
- `now`: A boolean value indicating if the order should be executed immediately (`true`) or placed for future matching (`false`).

```
{
    "order": {
        "price": 3560,           # Integer (Price of the asset)
        "quantity": 1,           # Integer (Always 1)
        "condition": 0,          # Integer (0 for status quo, 1 for development)
        "type": "ask",           # String ("ask" for sell, "bid" for buy)
        "now": false             # Boolean (true for immediate execution, false to wait)
    },
    "gameId": 888,               # Integer
    "type": "post-order"         # String
}
```

### Cancel Order
A player can cancel an order they previously submitted. The `id` is the unique identifier for the order, which is an integer. The `condition` indicates the condition under which the order was placed (`0` or `1`).

```
{
    "order": {
        "id": 4,                 # Integer (Order ID)
        "condition": 0           # Integer (0 for status quo, 1 for development)
    },
    "gameId": 261,               # Integer
    "type": "cancel-order"       # String
}
```

## Phase 7

### Declaration
Once the winning condition is determined, a second declaration is made, but only for the winning condition. This is similar to Phase 2, but only the winning condition is required.

```
{
    "gameId": 149,               # Integer
    "type": "declare",           # String
    "declaration": [
        598000                  # Integer (Revenue for the winning condition)
    ]
}
```

## Phase 8

### Speculation
In this phase, another round of speculations occurs. Speculators may once again challenge property owners’ declarations. The format is the same as in Phase 3.

```
{
    "gameId": 888,               # Integer
    "type": "done-speculating",  # String
    "snipe": [
        [
            2,                  # Integer (Owner number)
            3                   # Integer (Owner number)
        ],
        []                      # No speculators for the second condition
    ]
}
```

## Phase 9

Players are shown their results, and the next round will begin after this phase.

---

### Summary of Input Types:
- **Integer**: Used for fields such as `gameId`, `price`, `quantity`, `round`, `phase`, and player numbers.
- **String**: Used for message types like `"join"`, `"declare"`, `"post-order"`, and `"cancel-order"`. Also used for the recovery token and order types (`"ask"`, `"bid"`).
- **Boolean**: Used in fields like `now` to determine whether to execute orders immediately (`true`) or place them for later matching (`false`).

This version of the README clarifies the expected types for all input values, making it easier for users to understand what kind of data to send in the messages.
