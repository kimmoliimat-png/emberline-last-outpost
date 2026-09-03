import * as Phaser from "phaser";
import { RunScene } from "./RunScene";
import type { RunConfig } from "./RunScene";

export function createRunGame(parent: HTMLElement, config: RunConfig): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1080,
    height: 1920,
    backgroundColor: "#1a1008",
    banner: false,
    audio: { disableWebAudio: true },
    fps: { target: 60, min: 30 },
    render: { antialias: true, roundPixels: false, powerPreference: "high-performance" },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1080,
      height: 1920,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    input: { activePointers: 2 },
    scene: [new RunScene(config)],
  });
  window.__emberGame = game;
  // Preview iframes often report hidden/blur; Phaser sleeps the RAF. Keep the sim awake.
  const loop = game.loop as Phaser.Core.TimeStep & { sleep: () => void; wake: (stamp?: boolean) => void };
  loop.sleep = () => undefined;
  const stayUp = () => {
    try {
      loop.wake(true);
    } catch {
      /* older phaser */
    }
    try {
      game.scale.refresh();
    } catch {
      /* not booted yet */
    }
    if (game.isPaused) game.resume();
  };
  stayUp();
  game.events.on("hidden", stayUp);
  game.events.on("visible", stayUp);
  game.events.on("blur", stayUp);
  game.events.on("pause", stayUp);
  game.events.once("ready", stayUp);
  const id = window.setInterval(stayUp, 400);
  game.events.once("destroy", () => window.clearInterval(id));
  return game;
}
