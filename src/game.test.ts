import { createCanvas } from "@napi-rs/canvas";
import { ConstantClock, createEngine } from "@clockwyrks/simple-2d";
import { describe, expect, it } from "vitest";
import {
  BALL_R,
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  HOLD_TIME,
  P1_X1,
  SERVE_SPEED,
} from "./constants";
import { BACKGROUND, game } from "./game";

async function setup(stepMs = 8) {
  const canvas = createCanvas(1280, 720);
  const events = new EventTarget();
  const engine = createEngine({
    canvas: canvas as unknown as HTMLCanvasElement,
    width: 1280,
    height: 720,
    game,
    background: BACKGROUND,
    clock: new ConstantClock(stepMs),
    surface: {
      cssWidth: () => 1280,
      cssHeight: () => 720,
      dpr: () => 1,
      events: () => events,
    },
  });
  await engine.initialize();
  return engine;
}

describe("Carom simulation", () => {
  it("serves after the hold, using the posed sign and receiver", async () => {
    const engine = await setup();
    const d = engine.debug;
    engine.apply((s) => d.setScreen(s, "countdown"));
    engine.apply((s) => d.setBallServeSign(s, -1));
    engine.apply((s) => d.setBallHoldTimer(s, 0.008));
    await engine.advance(1);
    const s = d.snapshot(engine.state);
    expect(s.screen).toBe("playing");
    expect(s.ball?.held).toBe(false);
    expect(s.ball?.x).toBe(FIELD_CX);
    expect(s.ball?.y).toBe(FIELD_CY);
    expect(s.ball?.speed).toBeCloseTo(SERVE_SPEED);
    expect(s.ball?.vx).toBeLessThan(0);
    expect(s.ball?.vy).toBeLessThan(0);
    engine.destroy();
  });

  it("resolves paddle contact and adds spin from actual paddle motion", async () => {
    const engine = await setup();
    const d = engine.debug;
    engine.apply((s) => d.setScreen(s, "playing"));
    engine.apply((s) => d.setBallHeld(s, false));
    engine.apply((s) => d.setBallPosition(s, P1_X1 + BALL_R + 2, FIELD_CY));
    engine.apply((s) => d.setBallVelocity(s, -SERVE_SPEED, 0));
    engine.apply((s) => d.setPaddleDriven(s, "left", true));
    engine.apply((s) => d.setPaddleVy(s, "left", 200));
    await engine.advance(1);
    const ball = d.snapshot(engine.state).ball;
    expect(ball?.vx).toBeGreaterThan(0);
    expect(ball?.speed).toBeGreaterThan(SERVE_SPEED);
    expect(ball?.spin).toBeGreaterThan(0);
    engine.destroy();
  });

  it("scores, parks, and serves toward the receiver", async () => {
    const engine = await setup();
    const d = engine.debug;
    engine.apply((s) => d.setScreen(s, "playing"));
    engine.apply((s) => d.setBallHeld(s, false));
    engine.apply((s) => d.setBallPosition(s, 1280 + BALL_R - 1, FIELD_H / 2));
    engine.apply((s) => d.setBallVelocity(s, 500, 0));
    await engine.advance(1);
    const s = d.snapshot(engine.state);
    expect(s.score).toEqual({ p1: 1, p2: 0 });
    expect(s.receiver).toBe("right");
    expect(s.screen).toBe("countdown");
    expect(s.ball?.holdTimer).toBe(HOLD_TIME);
    engine.destroy();
  });

  it("keeps debug poses immutable and rejects a missing ball", async () => {
    const engine = await setup();
    const d = engine.debug;
    const before = engine.state;
    engine.apply((s) => d.clearWorld(s));
    expect(before.ball).not.toBeNull();
    expect(d.snapshot(engine.state).ball).toBeNull();
    expect(() => engine.apply((s) => d.setBallSpin(s, 90))).toThrow(/no ball/);
    engine.destroy();
  });
});

describe("field and match rules", () => {
  it("reflects from the top wall without changing speed or spin", async () => {
    const engine = await setup();
    const d = engine.debug;
    engine.apply((s) => d.setScreen(s, "playing"));
    engine.apply((s) => d.setBallHeld(s, false));
    engine.apply((s) => d.setBallPosition(s, FIELD_CX, BALL_R + 1));
    engine.apply((s) => d.setBallVelocity(s, 0, -500));
    engine.apply((s) => d.setBallSpin(s, 0));
    await engine.advance(1);
    const ball = d.snapshot(engine.state).ball;
    expect(ball?.y).toBe(BALL_R);
    expect(ball?.vy).toBe(500);
    expect(ball?.speed).toBe(500);
    engine.destroy();
  });

  it("requires a two-point lead at match point", async () => {
    const engine = await setup();
    const d = engine.debug;
    const point = async () => {
      engine.apply((s) => d.setScreen(s, "playing"));
      engine.apply((s) => d.setBallHeld(s, false));
      engine.apply((s) => d.setBallPosition(s, 1280 + BALL_R - 1, FIELD_CY));
      engine.apply((s) => d.setBallVelocity(s, 500, 0));
      await engine.advance(1);
    };
    engine.apply((s) => d.setScore(s, 10, 10));
    await point();
    expect(d.snapshot(engine.state).screen).toBe("countdown");
    await point();
    expect(d.snapshot(engine.state).screen).toBe("matchover");
    expect(d.snapshot(engine.state).winner).toBe("left");
    engine.destroy();
  });
});
