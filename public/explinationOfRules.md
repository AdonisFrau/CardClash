
# Original UNO-Style Character Card Game Specification

Build a multiplayer card game inspired by UNO, but completely original and themed around characters with power levels.

## Core Idea

Players join a room and compete by playing character cards onto a stack. Each character has a hidden power level stored in a JSON file. Players do not see the power level directly; they must judge whether a card can beat the current top card based on the character’s name and image.

The goal is to be the first player to get rid of all cards, and when a player is down to their last card, they must activate a special final-boss state before playing it.

---

## Card Categories / Types

There are 8 card types:

* Anime
* Animals
* Politicians
* Countries
* Celebrities
* Cartoons
* Other
* Everything

Each type is represented by a different color:

* Anime = blue
* Animals = red
* Politicians = green
* Countries = yellow
* Celebrities = brown
* Cartoons = purple
* Other = pink
* Everything = navy blue

These types are visible on the cards and are part of how cards are organized and identified.

remmeber all types, characters, images, power levles are all stored in public in img dir and Character.json

---

## Card Design

Each character card should look like a clean collectible card:

* A visible white outline/stroke around the card
* The character image shown in the main card area
* The image should have about 50% transparency
* The character’s name should appear at the bottom in white text
* The card color should match its assigned type color
* The layout should be simple, readable, and stylish

Character data comes from a JSON file in the public folder. Each character entry includes:

* Name
* Type
* Image
* Power level as an integer

The image folder is also inside the public folder.

---

## Hidden Power System

Every character has a power level stored in the JSON file.

Players cannot see the number directly in-game.

They must decide whether a card can beat the current top card only by looking at the name and image.

Example:

* If someone plays John Cena with power level 500, the next player must play a character with a power level higher than 500.
* If a player plays a weaker card, the play fails.

This hidden-information system is one of the main mechanics of the game.

---

## Main Gameplay Loop

Players begin with 7 cards each.

A single character card is placed on the stack at the start of the game.

Then the game continues in turns:

1. The current player chooses a card from their hand.
2. They try to place it on top of the current stack card.
3. The card must have a higher power level than the previous card in order to succeed.
4. If the card wins, it becomes the new top card and the turn passes to the next player.
5. If the card loses, it remains on the stack and the player draws +2 cards.

If a player does not have any card that can beat the current one, they must draw 3 cards.

---

## Stack Reset / Round Reset

After one full round, meaning after all players have taken a turn in the loop, the stack should automatically receive a new random character card.

This is important so power levels do not keep climbing forever.

This reset prevents the stack from becoming impossible over time and keeps the game moving.

---

## Special Power Cards

There are also special cards represented in black using Font Awesome icons.

These are not regular character cards and have special effects.

### Special Cards:

* Block
* Loopback
* +2
* +4

### Block

Blocks the next player’s turn.

### Loopback

Reverses the direction of play.

### +2 Card

Forces a player to draw 2 cards.

Important rule:
The +2 card must match the current type, meaning it is not a neutral black card. Instead, it takes on a random type and shows that type on the card.

### +4 Card

Works the same way as +2, except it forces 4 cards instead of 2.

It also follows the same type-matching rule, meaning it is not just a universal black card; it still belongs to one of the eight card types.

### Stacking Draw Cards

If a player places a +2 on top of a +2, the effect stacks and passes to the next player.

For example:

* +2 on +2 = next player draws 4 total
* +4 on +2 = next player draws 6 total
* The draw penalty keeps summing up as long as stackable draw cards are played

---

## Losing a Play

If a player plays a card and it turns out to be weaker than the card already on the stack:

* The card stays on the stack
* The player must draw +2 cards

There should be a maximum hand limit of 100 cards.

If a player is already at 100 cards, any additional drawn cards are ignored and not added to the hand.

---

## Final Boss Mode

When a player only has 1 card left, they must press a special button.

That button stays visible for 1 second.

If they fail to press it in time, they draw +2 cards as punishment.

If they press it in time:

* Final Boss Mode activates
* This state is shown on all players’ screens
* The player is now in the last phase of the game

If that player successfully plays their final card after entering Final Boss Mode, the game ends immediately.

All players then see a screen announcing who won.

---

## Multiplayer Room System

The game should support both solo and multiplayer play.

When a user enters the website, they should be prompted with:

* Multiplayer
* Solo

### If they choose Multiplayer:

They are prompted to enter a name.

Then they can choose:

* Join Room
* Make Room

### Make Room

If the player makes a room:

* A 5-letter room code is generated
* This code can be shared with other players
* Other players use the code to join that room

### Join Room

If the player chooses to join a room:

* They are prompted to enter the room code
* If the code is valid, they join that specific room
* This should work using a websocket-style connection, similar to Kahoot-style room joining

---

## Player Identity

Players are identified by the name they enter.

If two players use the same name, the system should automatically make them unique by adding a random 4-number combo after the name.

Example:

* Alex
* Alex4921

This avoids name conflicts in multiplayer rooms.

---

## Game Flow in Multiplayer

The room owner can start the game manually using a Start Game button.

Once started:

* All players in the room are placed into the match
* The turn system begins
* Every player sees the current state of the game in real time
* Card plays, draws, blocks, direction changes, and final boss mode must sync across all connected players

---

## Data Structure / Asset Setup

The game should use:

* A public `img` folder for card images
* A JSON file for all character definitions
* A power level integer for each character
* Type information for each character
* Special card definitions separate from normal character cards

The JSON should act as the source of truth for all character cards.

---

## Important Gameplay Rules Summary

* Players start with 7 cards
* One random card begins on the stack
* Only higher power cards can beat the current stack card
* Players cannot see power levels directly
* If a player cannot beat the card, they draw 3 cards
* If a play fails, the card stays and the player draws 2 cards
* After a full round, the stack gets a new random card
* Special cards can block, reverse, and force draws
* +2 and +4 can stack
* Draw cards must respect type-matching rules
* Hand size caps at 100 cards
* Final Boss Mode triggers when a player has 1 card left
* The final card ends the game and declares the winner
* Multiplayer uses room codes and live sync

---

## Optional Implementation Note

The cleanest way to build this is with:

* A frontend for card display, hand management, room UI, and animations
* A lightweight backend or websocket server for room state and live multiplayer syncing
* A shared game state system so all players see the same stack, turn order, and penalties

The room host can be the authority for game start, turn order, and card validation, or the server can manage all state centrally for consistency.

Make a txt folder with all the TODOs in the txt anbd will be the progress manager add a check emoji if such is done; make sure to test test test all the time, use the browser you have tro see weatehr it works an dconsole everything, make sure it all works.

