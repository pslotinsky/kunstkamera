# 18. Options and settings

**Status:** DRAFT

## Description

Keep the player's sound choices between sessions. Today the switches and volumes set in Options last until the page is reloaded.

The rest of the original options list is already covered or cancelled. Sound switches and volumes exist ([13](./13-audio.md), [16](./16-new-game-and-advisors.md)), and so does Quit to Title ([17](./17-save-and-load.md)).

## Functionality

- Remember the All sounds switch and the Music and Sound effects switches and volumes in this browser, and restore them at launch, before the title music starts.
- Remember a change as it is made: a switch when it is flipped, a volume when its slider is released. Closing Options is not required.
- Settings belong to the player and the browser, never to a campaign. Loading a save changes none, and saving stores none.
- If settings cannot be read or stored, play on with the defaults and keep the choices for the session. Nothing is announced: no progress is at stake.

## Research

### What was cancelled, and why

- **Message speed.** In Gemfire it sets how fast text is typed out. Gemstorm shows text whole and waits for a click, so the setting has nothing to act on. Scaling the timed pauses instead was considered: they are already short (400 ms for a computer turn, about 2 s for a rival march), and the wait a player feels is dismissing rival reports one at a time. That is a question of how events are told ([15](./15-events.md)), not a setting.
- **Battle animation.** Its two uses are already served: Auto and Skip run a battle without waiting on it ([08-5](./08-5-the-tactical-ai.md)), and the system's reduced-motion preference stills the walk and the clash ([08-3](./08-3-blows-and-casualties.md)). The walk shows the route taken and the clash shows who struck whom, so switching them off for speed would make a battle harder to follow.
- **Hand the game to the computer.** A player who is done with a campaign quits, and the save slots keep it. Watching the computer finish needs it to take every decision the house is asked for, reports that close unattended, and an answer to a campaign that reaches a standstill. Entrust already hands over the provinces a player does not want to run ([12](./12-strategic-ai.md)).

### Where the settings live

- **With the saves.** Settings would then change when a save is loaded, and a player who never saves would never keep them.
- **Once per browser, apart from the saves.** They follow the player across campaigns and survive a new game. Chosen.

## Persistence

Sound settings are stored once per browser under their own key, apart from the save slots. Unreadable settings fall back to the defaults and are replaced at the next change. They carry no version: there is one shape, and a future one can be told apart by its fields.

## Tests

- **Remembered.** Set the switches and volumes, start again on a fresh board, and find them restored.
- **As it is made.** Flip a switch and release a slider with Options still open; both are stored.
- **Defaults.** Nothing stored, unreadable settings, or blocked storage leaves the defaults and raises no error.
- **Apart from saves.** Storing settings leaves every save slot as it was.
