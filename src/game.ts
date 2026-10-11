import type { Game, UpdateApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  BALL_R,
  BINDINGS,
  CAROM_DEBUG_VERSION,
  CUES,
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  MATCHOVER_ITEMS,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  NET_X,
  OBSTACLE_CENTERS,
  OBSTACLE_HH,
  OBSTACLE_HW,
  OBSTACLE_H,
  OBSTACLE_W,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X1,
  PADDLE_HALF,
  PADDLE_H,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
  PADDLE_SPEED,
  PADDLE_W,
  PAUSE_ITEMS,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPEED_CAP,
  SPEED_MULT,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAIL_TIME,
  WIN_LEAD,
  WIN_SCORE,
} from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
  readonly pointerPress?: {
    readonly id: number;
    readonly index: number;
    readonly screen: Screen;
  } | null;
}
export interface CaromSnapshot extends Omit<
  CaromState,
  "ball" | "pointerPress"
> {
  readonly version: number;
  readonly ball: (BallState & { readonly speed: number }) | null;
}
export interface CaromDebugApi {
  readonly version: number;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, index: number): CaromState;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  setScreen(s: DeepReadonly<CaromState>, screen: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, mode: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, index: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, index: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    screen: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, side: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, side: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, side: Side, cy: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, side: Side, vy: number): CaromState;
  setPaddleDriven(
    s: DeepReadonly<CaromState>,
    side: Side,
    driven: boolean,
  ): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    vx: number,
    vy: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, spin: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, held: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, seconds: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, sign: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, muted: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): CaromSnapshot;
  menuItemRect(
    s: DeepReadonly<CaromState>,
    index: number,
  ): { x: number; y: number; w: number; h: number } | null;
}
export const BACKGROUND = "#080f1c";
const CYAN = "#47e2df";
const CORAL = "#ff796b";
const GOLD = "#f6ca70";
const WHITE = "#eaf2f4";
const MUTED = "#7891a3";
const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));
const signDraw = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const parkBall = (): BallState => ({
  x: FIELD_CX,
  y: FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: HOLD_TIME,
  serveSign: signDraw(),
  trail: [],
});
const paddle = (): PaddleState => ({
  cy: FIELD_CY,
  vy: 0,
  driven: false,
  drivenVy: 0,
});
const obstacles = (): ObstacleState[] =>
  OBSTACLE_CENTERS.map((c, index) => ({ index, cx: c.x, cy: c.y }));
function initial(muted: boolean): CaromState {
  return {
    screen: "title",
    mode: "solo",
    menuIndex: 0,
    titleIndex: 0,
    resumeScreen: "playing",
    score: { p1: 0, p2: 0 },
    winner: null,
    paddles: { left: paddle(), right: paddle() },
    ai: { tracking: true, movement: true },
    receiver: "left",
    ball: parkBall(),
    obstacles: obstacles(),
    simTime: 0,
    muted,
    pointerPress: null,
  };
}
function copy(s: DeepReadonly<CaromState>): CaromState {
  return {
    ...s,
    paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
    ai: { ...s.ai },
    score: { ...s.score },
    ball: s.ball ? { ...s.ball, trail: [...s.ball.trail] } : null,
    obstacles: s.obstacles.map((o) => ({ ...o })),
  };
}
function withBall(
  s: DeepReadonly<CaromState>,
  changes: Partial<BallState>,
): CaromState {
  if (!s.ball) throw new Error("Carom: no ball on field");
  return {
    ...copy(s),
    ball: { ...s.ball, trail: [...s.ball.trail], ...changes },
  };
}
function withPaddle(
  s: DeepReadonly<CaromState>,
  side: Side,
  changes: Partial<PaddleState>,
): CaromState {
  return {
    ...copy(s),
    paddles: { ...s.paddles, [side]: { ...s.paddles[side], ...changes } },
  };
}
function start(s: DeepReadonly<CaromState>, mode: Mode): CaromState {
  return {
    ...copy(s),
    screen: "countdown",
    mode,
    resumeScreen: "playing",
    menuIndex: 0,
    score: { p1: 0, p2: 0 },
    winner: null,
    receiver: "left",
    ball: parkBall(),
    paddles: {
      left: { ...s.paddles.left, cy: FIELD_CY, vy: 0 },
      right: { ...s.paddles.right, cy: FIELD_CY, vy: 0 },
    },
    pointerPress: null,
  };
}
function title(s: DeepReadonly<CaromState>): CaromState {
  return {
    ...initial(s.muted),
    titleIndex: s.titleIndex,
    menuIndex: s.titleIndex,
    simTime: s.simTime,
  };
}
function itemCount(screen: Screen): number {
  return screen === "title"
    ? TITLE_ITEMS.length
    : screen === "howto"
      ? 1
      : screen === "paused"
        ? PAUSE_ITEMS.length
        : screen === "matchover"
          ? MATCHOVER_ITEMS.length
          : 0;
}
function itemRect(
  screen: Screen,
  index: number,
): { x: number; y: number; w: number; h: number } | null {
  const count = itemCount(screen);
  if (!Number.isInteger(index) || index < 0 || index >= count) return null;
  const top =
    screen === "title"
      ? 346
      : screen === "howto"
        ? 584
        : screen === "paused"
          ? 343
          : 408;
  return { x: FIELD_CX - 190, y: top + index * 69, w: 380, h: 56 };
}
function inside(
  x: number,
  y: number,
  r: { x: number; y: number; w: number; h: number },
): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
function hitItem(screen: Screen, x: number, y: number): number {
  for (let i = 0; i < itemCount(screen); i++) {
    const r = itemRect(screen, i);
    if (r && inside(x, y, r)) return i;
  }
  return -1;
}
function confirm(s: DeepReadonly<CaromState>): CaromState {
  if (s.screen === "title") {
    const selected = { ...copy(s), titleIndex: s.menuIndex };
    if (s.menuIndex === 0) return start(selected, "solo");
    if (s.menuIndex === 1) return start(selected, "versus");
    return { ...selected, screen: "howto", menuIndex: 0 };
  }
  if (s.screen === "howto") return title(s);
  if (s.screen === "paused")
    return s.menuIndex === 0
      ? { ...copy(s), screen: s.resumeScreen }
      : s.menuIndex === 1
        ? start(s, s.mode)
        : title(s);
  if (s.screen === "matchover")
    return s.menuIndex === 0 ? start(s, s.mode) : title(s);
  return copy(s);
}
function movePaddle(
  p: DeepReadonly<PaddleState>,
  vy: number,
  dt: number,
): PaddleState {
  const cy = clamp(p.cy + vy * dt, PADDLE_MIN_CY, PADDLE_MAX_CY);
  return {
    ...p,
    cy,
    vy: dt > 0 && cy !== p.cy + vy * dt ? (cy - p.cy) / dt : vy,
  };
}
function movePaddles(
  s: DeepReadonly<CaromState>,
  api: UpdateApi,
  dt: number,
): CaromState {
  const input = api.input;
  const leftAxis =
    (input.value("p1-down") ||
      (s.mode === "solo" ? input.value("p2-down") : 0)) -
    (input.value("p1-up") || (s.mode === "solo" ? input.value("p2-up") : 0));
  const rightAxis = input.value("p2-down") - input.value("p2-up");
  const left = movePaddle(
    s.paddles.left,
    s.paddles.left.driven ? s.paddles.left.drivenVy : leftAxis * PADDLE_SPEED,
    dt,
  );
  let rightVy = rightAxis * PADDLE_SPEED;
  if (s.mode === "solo") {
    const defending =
      s.ai.tracking &&
      s.screen === "playing" &&
      s.ball !== null &&
      s.ball.vx > 0;
    const target =
      defending && s.ball ? s.ball.y - s.ball.vy * AI_REACT : AI_HOME_Y;
    const diff = target - s.paddles.right.cy;
    const deadzone = defending ? AI_DEADZONE : AI_HOME_DEADZONE;
    rightVy =
      !s.ai.movement || Math.abs(diff) <= deadzone || dt <= 0
        ? 0
        : Math.sign(diff) * Math.min(AI_SPEED, Math.abs(diff) / dt);
  }
  const right = movePaddle(
    s.paddles.right,
    s.paddles.right.driven ? s.paddles.right.drivenVy : rightVy,
    dt,
  );
  return { ...copy(s), paddles: { left, right } };
}
type Face = "left" | "right" | "top" | "bottom";
function collide(
  b: BallState,
  r: { x0: number; x1: number; y0: number; y1: number },
): { ball: BallState; face: Face } | null {
  if (!(
    b.x > r.x0 - BALL_R &&
    b.x < r.x1 + BALL_R &&
    b.y > r.y0 - BALL_R &&
    b.y < r.y1 + BALL_R
  ))
    return null;
  const depths = [
    b.x - (r.x0 - BALL_R),
    r.x1 + BALL_R - b.x,
    b.y - (r.y0 - BALL_R),
    r.y1 + BALL_R - b.y,
  ];
  const n = depths.indexOf(Math.min(...depths));
  const face: Face = (["left", "right", "top", "bottom"] as Face[])[n];
  const ball = { ...b };
  if (face === "left")
    return {
      face,
      ball: { ...ball, x: r.x0 - BALL_R, vx: b.vx > 0 ? -b.vx : b.vx },
    };
  if (face === "right")
    return {
      face,
      ball: { ...ball, x: r.x1 + BALL_R, vx: b.vx < 0 ? -b.vx : b.vx },
    };
  if (face === "top")
    return {
      face,
      ball: { ...ball, y: r.y0 - BALL_R, vy: b.vy > 0 ? -b.vy : b.vy },
    };
  return {
    face,
    ball: { ...ball, y: r.y1 + BALL_R, vy: b.vy < 0 ? -b.vy : b.vy },
  };
}
function advanceBall(
  s: DeepReadonly<CaromState>,
  dt: number,
): { state: CaromState; cues: Set<string> } {
  const cues = new Set<string>();
  if (!s.ball || s.ball.held) return { state: copy(s), cues };
  let b: BallState = { ...s.ball, trail: [...s.ball.trail] };
  const speed = Math.hypot(b.vx, b.vy);
  const n = Math.max(1, Math.ceil((speed * dt) / MAX_SUBSTEP));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    const v = Math.hypot(b.vx, b.vy);
    if (v > 0) {
      const a = (b.spin / v) * h;
      const c = Math.cos(a),
        t = Math.sin(a);
      b = { ...b, vx: b.vx * c - b.vy * t, vy: b.vx * t + b.vy * c };
    }
    b = {
      ...b,
      spin: b.spin * 0.5 ** (h / SPIN_HALFLIFE),
      x: b.x + b.vx * h,
      y: b.y + b.vy * h,
    };
    if (b.y - BALL_R < 0 && b.vy < 0) {
      b = { ...b, y: BALL_R, vy: -b.vy };
      cues.add(CUES.wallBounce);
    } else if (b.y + BALL_R > FIELD_H && b.vy > 0) {
      b = { ...b, y: FIELD_H - BALL_R, vy: -b.vy };
      cues.add(CUES.wallBounce);
    }
    for (const side of ["left", "right"] as const) {
      const p = s.paddles[side];
      const r = {
        x0: side === "left" ? P1_X0 : P2_X0,
        x1: side === "left" ? P1_X1 : P2_X1,
        y0: p.cy - PADDLE_HALF,
        y1: p.cy + PADDLE_HALF,
      };
      const contact = collide(b, r);
      if (!contact) continue;
      b = contact.ball;
      if (contact.face === "top" || contact.face === "bottom") {
        cues.add(CUES.wallBounce);
        continue;
      }
      const a = clamp((b.y - p.cy) / PADDLE_HALF, -1, 1) * MAX_BOUNCE_ANGLE;
      const newSpeed = Math.min(Math.hypot(b.vx, b.vy) * SPEED_MULT, SPEED_CAP);
      b = {
        ...b,
        x: side === "left" ? P1_X1 + BALL_R : P2_X0 - BALL_R,
        vx: (side === "left" ? 1 : -1) * newSpeed * Math.cos(a),
        vy: newSpeed * Math.sin(a),
        spin: clamp(b.spin + p.vy * SPIN_FROM_PADDLE, -SPIN_CLAMP, SPIN_CLAMP),
      };
      cues.add(CUES.paddleHit);
    }
    for (const o of s.obstacles) {
      const contact = collide(b, {
        x0: o.cx - OBSTACLE_HW,
        x1: o.cx + OBSTACLE_HW,
        y0: o.cy - OBSTACLE_HH,
        y1: o.cy + OBSTACLE_HH,
      });
      if (contact) {
        b = contact.ball;
        cues.add(CUES.obstacleBounce);
      }
    }
  }
  return { state: { ...copy(s), ball: b }, cues };
}
function sample(s: DeepReadonly<CaromState>): CaromState {
  if (!s.ball) return copy(s);
  return withBall(s, {
    trail: [...s.ball.trail, { x: s.ball.x, y: s.ball.y, t: s.simTime }].filter(
      (p) => p.t >= s.simTime - TRAIL_TIME,
    ),
  });
}
function debugApi(): CaromDebugApi {
  return {
    version: CAROM_DEBUG_VERSION,
    clearWorld: (s) => ({ ...copy(s), ball: null, obstacles: [] }),
    spawnBall: (s) => ({ ...copy(s), ball: parkBall() }),
    spawnObstacle: (s, index) => {
      const c = OBSTACLE_CENTERS[index];
      if (!c) throw new Error(`Carom: no obstacle ${index}`);
      return {
        ...copy(s),
        obstacles: [
          ...s.obstacles
            .filter((o) => o.index !== index)
            .map((o) => ({ ...o })),
          { index, cx: c.x, cy: c.y },
        ].sort((a, b) => a.index - b.index),
      };
    },
    reset: (s) => initial(s.muted),
    reconcile: (s) => copy(s),
    setScreen: (s, screen) => ({ ...copy(s), screen }),
    setMode: (s, mode) => ({ ...copy(s), mode }),
    setMenuIndex: (s, menuIndex) => ({ ...copy(s), menuIndex }),
    setTitleIndex: (s, titleIndex) => ({ ...copy(s), titleIndex }),
    setResumeScreen: (s, resumeScreen) => ({ ...copy(s), resumeScreen }),
    setScore: (s, p1, p2) => ({ ...copy(s), score: { p1, p2 } }),
    setWinner: (s, winner) => ({ ...copy(s), winner }),
    setReceiver: (s, receiver) => ({ ...copy(s), receiver }),
    setPaddleCy: (s, side, cy) => withPaddle(s, side, { cy }),
    setPaddleVy: (s, side, drivenVy) => withPaddle(s, side, { drivenVy }),
    setPaddleDriven: (s, side, driven) => withPaddle(s, side, { driven }),
    setBallPosition: (s, x, y) => withBall(s, { x, y }),
    setBallVelocity: (s, vx, vy) => withBall(s, { vx, vy }),
    setBallSpin: (s, spin) => withBall(s, { spin }),
    setBallHeld: (s, held) => withBall(s, { held }),
    setBallHoldTimer: (s, holdTimer) => withBall(s, { holdTimer }),
    setBallServeSign: (s, serveSign) => withBall(s, { serveSign }),
    drawBallServeSign: (s) => withBall(s, { serveSign: signDraw() }),
    setAiTracking: (s, tracking) => ({ ...copy(s), ai: { ...s.ai, tracking } }),
    setAiMovement: (s, movement) => ({ ...copy(s), ai: { ...s.ai, movement } }),
    setMuted: (s, muted) => ({ ...copy(s), muted }),
    snapshot: (s) => ({
      version: CAROM_DEBUG_VERSION,
      screen: s.screen,
      mode: s.mode,
      menuIndex: s.menuIndex,
      titleIndex: s.titleIndex,
      resumeScreen: s.resumeScreen,
      score: { ...s.score },
      winner: s.winner,
      paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
      ai: { ...s.ai },
      receiver: s.receiver,
      obstacles: s.obstacles.map((o) => ({ ...o })),
      simTime: s.simTime,
      muted: s.muted,
      ball: s.ball
        ? {
            ...s.ball,
            trail: [...s.ball.trail],
            speed: Math.hypot(s.ball.vx, s.ball.vy),
          }
        : null,
    }),
    menuItemRect: (s, index) => itemRect(s.screen, index),
  };
}

export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api) {
    for (const action of ACTIONS)
      api.input.register(action, { keys: [...BINDINGS[action]] });
    api.audio.define(CUES.paddleHit, {
      wave: "triangle",
      freq: 510,
      freqTo: 780,
      gain: 0.18,
      durationMs: 85,
    });
    api.audio.define(CUES.wallBounce, {
      wave: "sine",
      freq: 280,
      freqTo: 190,
      gain: 0.13,
      durationMs: 75,
    });
    api.audio.define(CUES.obstacleBounce, {
      wave: "square",
      freq: 420,
      freqTo: 260,
      gain: 0.11,
      durationMs: 90,
    });
    api.audio.define(CUES.score, {
      wave: "triangle",
      freq: 620,
      freqTo: 930,
      gain: 0.19,
      durationMs: 260,
    });
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("mode", (s) => s.mode);
    api.diagnostics.register("score", (s) => `${s.score.p1} : ${s.score.p2}`);
    api.diagnostics.register("ball pos", (s) =>
      s.ball ? `${s.ball.x.toFixed(1)}, ${s.ball.y.toFixed(1)}` : "none",
    );
    api.diagnostics.register("ball vel", (s) =>
      s.ball ? `${s.ball.vx.toFixed(1)}, ${s.ball.vy.toFixed(1)}` : "none",
    );
    api.diagnostics.register("ball speed", (s) =>
      s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : "none",
    );
    api.diagnostics.register("ball spin", (s) => s.ball?.spin ?? "none");
    api.diagnostics.register(
      "left paddle",
      (s) => `${s.paddles.left.cy.toFixed(1)}, ${s.paddles.left.vy.toFixed(1)}`,
    );
    api.diagnostics.register(
      "right paddle",
      (s) =>
        `${s.paddles.right.cy.toFixed(1)}, ${s.paddles.right.vy.toFixed(1)}`,
    );
    return [initial(false), debugApi()];
  },
  update(state, api, dt) {
    let s: CaromState = { ...copy(state), simTime: state.simTime + dt };
    // A debug pose may set the readable mute bit between frames. Keep the bus in sync.
    if (api.audio.muted() !== s.muted) api.audio.setMuted(s.muted);
    if (api.input.pressed("mute")) api.audio.setMuted(!api.audio.muted());
    s = { ...s, muted: api.audio.muted() };
    const begun = state.screen;
    if (begun === "countdown" || begun === "playing") {
      if (api.input.pressed("pause"))
        s = { ...s, screen: "paused", resumeScreen: begun, menuIndex: 0 };
    } else if (begun === "paused") {
      const pause = api.input.pressed("pause"),
        back = api.input.pressed("back");
      if (pause || back) s = { ...s, screen: s.resumeScreen };
    } else if (begun === "howto" || begun === "matchover") {
      if (api.input.pressed("back")) s = title(s);
    }
    if (s.screen === begun && itemCount(begun)) {
      const up = api.input.pressed("p1-up") || api.input.pressed("p2-up");
      const down = api.input.pressed("p1-down") || api.input.pressed("p2-down");
      const keyboardConfirm = api.input.pressed("confirm");
      const count = itemCount(begun);
      if (up) s = { ...s, menuIndex: (s.menuIndex - 1 + count) % count };
      else if (down) s = { ...s, menuIndex: (s.menuIndex + 1) % count };
      else if (keyboardConfirm) s = confirm(s);
      if (s.screen === begun) {
        const hover = api.input.pointer();
        if (hover.device !== "touch") {
          const index = hitItem(begun, hover.x, hover.y);
          if (index >= 0 && (hover.x !== 0 || hover.y !== 0))
            s = { ...s, menuIndex: index };
        }
        for (const event of api.input.pointerSamples()) {
          if (
            event.device !== "touch" &&
            event.button !== "primary" &&
            event.type !== "move"
          )
            continue;
          const index = hitItem(begun, event.x, event.y);
          if (index >= 0) s = { ...s, menuIndex: index };
          if (event.type === "down")
            s = { ...s, pointerPress: { id: event.id, index, screen: begun } };
          if (event.type === "up") {
            const valid =
              s.pointerPress?.id === event.id &&
              s.pointerPress.index === index &&
              s.pointerPress.screen === begun &&
              index >= 0;
            s = { ...s, pointerPress: null };
            if (valid && !keyboardConfirm) {
              s = { ...s, menuIndex: index };
              s = confirm(s);
            }
          }
        }
      }
    }
    if (s.screen === "countdown" || s.screen === "playing") {
      s = movePaddles(s, api, dt);
      if (s.screen === "countdown" && s.ball) {
        const holdTimer = s.ball.holdTimer - dt;
        if (holdTimer <= 0) {
          const dir = s.receiver === "left" ? -1 : 1;
          s = withBall(s, {
            held: false,
            holdTimer: 0,
            vx: dir * SERVE_SPEED * Math.cos(SERVE_ANGLE),
            vy: s.ball.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE),
            trail: [],
          });
          s = { ...s, screen: "playing" };
        } else s = withBall(s, { holdTimer });
      } else if (s.screen === "playing" && s.ball) {
        const result = advanceBall(s, dt);
        s = sample(result.state);
        for (const cue of result.cues) api.audio.play(cue);
        if (s.ball && (s.ball.x - BALL_R > FIELD_W || s.ball.x + BALL_R < 0)) {
          const scorer: Side = s.ball.x - BALL_R > FIELD_W ? "left" : "right";
          const score = {
            p1: s.score.p1 + (scorer === "left" ? 1 : 0),
            p2: s.score.p2 + (scorer === "right" ? 1 : 0),
          };
          api.audio.play(CUES.score);
          const winning =
            scorer === "left"
              ? score.p1 >= WIN_SCORE && score.p1 - score.p2 >= WIN_LEAD
              : score.p2 >= WIN_SCORE && score.p2 - score.p1 >= WIN_LEAD;
          s = winning
            ? { ...s, score, winner: scorer, screen: "matchover", menuIndex: 0 }
            : {
                ...s,
                score,
                receiver: scorer === "left" ? "right" : "left",
                ball: parkBall(),
                screen: "countdown",
              };
        }
      }
      if (
        s.screen === "countdown" ||
        (s.screen === "playing" && state.screen === "countdown")
      )
        s = sample(s);
    }
    return s;
  },
  render(state, api) {
    const ctx = api.ctx;
    ctx.save();
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    const glow = ctx.createRadialGradient(
      FIELD_CX,
      FIELD_CY,
      50,
      FIELD_CX,
      FIELD_CY,
      700,
    );
    glow.addColorStop(0, "#14283b");
    glow.addColorStop(1, BACKGROUND);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    ctx.strokeStyle = "#38546a55";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, FIELD_W - 48, FIELD_H - 48);
    ctx.setLineDash([9, 15]);
    ctx.strokeStyle = "#7295a453";
    ctx.beginPath();
    ctx.moveTo(NET_X, 80);
    ctx.lineTo(NET_X, FIELD_H - 48);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#7295a43c";
    ctx.beginPath();
    ctx.arc(FIELD_CX, FIELD_CY, 80, 0, Math.PI * 2);
    ctx.stroke();
    const bar = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,
      blur: number,
    ): void => {
      ctx.save();
      ctx.shadowBlur = blur;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, Math.min(w / 2, 9));
      ctx.fill();
      ctx.restore();
    };
    for (const o of state.obstacles)
      bar(
        o.cx - OBSTACLE_W / 2,
        o.cy - OBSTACLE_H / 2,
        OBSTACLE_W,
        OBSTACLE_H,
        GOLD,
        20,
      );
    bar(
      P1_X0,
      state.paddles.left.cy - PADDLE_HALF,
      PADDLE_W,
      PADDLE_H,
      CYAN,
      25,
    );
    bar(
      P2_X0,
      state.paddles.right.cy - PADDLE_HALF,
      PADDLE_W,
      PADDLE_H,
      CORAL,
      25,
    );
    if (state.ball) {
      const trail = state.ball.trail;
      if (trail.length > 1) {
        ctx.lineCap = "round";
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1],
            b = trail[i];
          ctx.strokeStyle = `rgba(238,247,244,${((i / trail.length) * 0.5).toFixed(3)})`;
          ctx.lineWidth = 2 + (i / trail.length) * BALL_R;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.save();
      ctx.shadowColor = WHITE;
      ctx.shadowBlur = 24;
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const label = (
      text: string,
      x: number,
      y: number,
      size: number,
      color: string,
      align: CanvasTextAlign = "center",
      weight = 700,
    ): void => {
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.font = `${weight} ${size}px system-ui, sans-serif`;
      ctx.fillText(text, x, y);
    };
    const live = state.screen !== "title" && state.screen !== "howto";
    if (live) {
      label(String(state.score.p1), FIELD_CX - 108, 67, 50, CYAN);
      label(String(state.score.p2), FIELD_CX + 108, 67, 50, CORAL);
      label(
        state.mode === "solo" ? "SOLO  /  VS AI" : "VERSUS  /  LOCAL DUEL",
        FIELD_CX,
        FIELD_H - 32,
        14,
        MUTED,
        "center",
        600,
      );
    }
    if (state.screen === "countdown") {
      label("SERVE", FIELD_CX, 270, 17, GOLD);
      label(
        state.ball ? String(Math.max(1, Math.ceil(state.ball.holdTimer))) : "1",
        FIELD_CX,
        340,
        76,
        WHITE,
      );
    }
    const menu = (items: readonly string[], screen: Screen): void => {
      items.forEach((item, index) => {
        const r = itemRect(screen, index);
        if (!r) return;
        const active = state.menuIndex === index;
        ctx.fillStyle = active ? "#28475a" : "#102233dc";
        ctx.strokeStyle = active ? CYAN : "#42607288";
        ctx.lineWidth = active ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(r.x, r.y, r.w, r.h, 12);
        ctx.fill();
        ctx.stroke();
        label(item, FIELD_CX, r.y + r.h / 2, 21, active ? WHITE : MUTED);
      });
    };
    if (
      state.screen === "title" ||
      state.screen === "howto" ||
      state.screen === "paused" ||
      state.screen === "matchover"
    ) {
      ctx.fillStyle = "#080f1cd9";
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
      if (state.screen === "title") {
        label("A DUEL OF ANGLES", FIELD_CX, 124, 17, GOLD);
        label(TITLE_TEXT, FIELD_CX, 222, 104, WHITE, "center", 900);
        label("CURVE THE RALLY. FIND THE BANK.", FIELD_CX, 291, 18, MUTED);
        menu(TITLE_ITEMS, "title");
        label(
          "W / S  •  ↑ / ↓ TO MOVE     ENTER TO SELECT",
          FIELD_CX,
          661,
          15,
          MUTED,
        );
      } else if (state.screen === "howto") {
        label("HOW TO PLAY", FIELD_CX, 132, 54, WHITE);
        label("W / S moves the left paddle", FIELD_CX, 244, 24, CYAN);
        label(
          "↑ / ↓ moves the right paddle in Versus",
          FIELD_CX,
          294,
          24,
          CORAL,
        );
        label(
          "Move as you strike to bend the ball's path.",
          FIELD_CX,
          370,
          23,
          WHITE,
        );
        label(
          "Bank around the gold obstacles. First to 11, win by 2.",
          FIELD_CX,
          420,
          21,
          GOLD,
        );
        label("P or Esc pauses  •  M mutes", FIELD_CX, 474, 18, MUTED);
        menu(["BACK TO MENU"], "howto");
      } else if (state.screen === "paused") {
        label("PAUSED", FIELD_CX, 193, 64, WHITE);
        label("THE RALLY WAITS", FIELD_CX, 261, 17, MUTED);
        menu(PAUSE_ITEMS, "paused");
      } else {
        label(
          state.winner === "left" ? "PLAYER ONE WINS" : "PLAYER TWO WINS",
          FIELD_CX,
          202,
          55,
          state.winner === "left" ? CYAN : CORAL,
        );
        label(
          `${state.score.p1}  —  ${state.score.p2}`,
          FIELD_CX,
          294,
          54,
          WHITE,
        );
        menu(MATCHOVER_ITEMS, "matchover");
      }
    }
    ctx.restore();
  },
};
