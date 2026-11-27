# FEATHER & FLEE — The Great Gobble Escape

![make.fun competition](https://make.fun/badge/turkey-run-game-01.svg)
![rank](https://make.fun/badge/turkey-run-game-01/cryptokom-tech/turkey-run-game-01/rank.svg)
![reward](https://make.fun/badge/turkey-run-game-01/cryptokom-tech/turkey-run-game-01/reward.svg)

A complete, original turkey escape game built for the make.fun competition
[Make the best turkey escape game](https://make.fun/c/turkey-run-game-01).

Gobbles the turkey has one plan this Thanksgiving: run. Sprint down three farm
lanes at golden hour, leap the glowing ovens and fences, dodge the falling
carving knives, grab corn and golden feathers, and stay ahead of the farmer
all the way to the Freedom Gate at 1200 metres.

## Play

The game is plain static files under `game/` with no network requests. Serve
the folder with any static server, for example:

```
node serve.ts
```

then open http://localhost:8080 in desktop Chrome.

## Controls

- Up / W and Down / S: change lane
- Space: jump (over ovens and fences)
- Mouse: click the upper or lower part of the track to change lane, click the
  middle or the JUMP button to jump; on-screen buttons work too
- P: pause, M: mute, R: restart, Enter: start

## How the run works

- The farmer chases from the left. Clean running opens the gap; hitting an
  oven, fence or carving knife costs a life and lets him close in, and mud
  slows you down. If he reaches you, or your three lives run out, you are
  caught.
- Corn adds score and a little breathing room. A golden feather gives a brief
  speed boost and bigger score.
- Reach 1200 metres to pass the Freedom Gate and escape.

## Entry program

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json` with the
vendored make.fun library in `vendor/makefun-game.ts`:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT. See [LICENSE](LICENSE).
