import * as Phaser from "phaser";
import {
  DESIGN_H,
  DESIGN_W,
  LANE_X,
  MAX_TOWERS,
  ROAD_LEFT,
  ROAD_RIGHT,
  TOWER_SLOTS,
  stageById,
  starsFor,
  themeOf,
  towerCost,
  type SpawnEvent,
  type StageDef,
  type ThemeVisual,
} from "../data/catalog";
import { audio } from "../audio";
import type { RunHud, RunResult } from "../store";

export interface RunBonuses {
  maxHp: number;
  damage: number;
  fireRate: number;
  scrapFind: number;
  lootMult: number;
}

export interface RunConfig {
  stageId: string;
  bonuses: RunBonuses;
  muted: boolean;
  onHud: (hud: RunHud) => void;
  onFinish: (result: RunResult) => void;
}

type Kind = SpawnEvent["kind"] | "bullet" | "impact";

interface SpriteData {
  kind: Kind;
  hp: number;
  hits: number;
  dmg: number;
  heat: number;
  scrap: number;
  lane: number;
  consumed: boolean;
  buff?: "overclock" | "plating";
}

const PLAYER_Y = 1608;
const PLAYER_SIZE = 136;
const FEET_ORIGIN = 0.88;

const DEADZONE = 18;
const HEAT_COOL = 22;
const HEAT_FIRE = 38;
const OVERHEAT_RESET = 38;
const BULLET_SPEED = 1080;
const MOVE_SPEED = 540;
const TOWER_RANGE = 1080;
const TOWER_SIZE = 148;
const TOWER_BURST = 3;
const TOWER_SHOT_GAP = 0.08;
const TOWER_RELOAD = 0.46;

const MARCH_MUL: Record<string, number> = {
  ash: 1,
  spike: 0.88,
  drum: 1.42,
  pool: 0.7,
  barrel: 0.78,
  plate: 0.68,
  pylons: 0,
};

export class RunScene extends Phaser.Scene {
  private cfg!: RunConfig;
  private stage!: StageDef;
  private player!: Phaser.Physics.Arcade.Sprite;
  private road!: Phaser.GameObjects.Image;
  private sky!: Phaser.GameObjects.Image;
  private mobs!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private fx!: Phaser.Physics.Arcade.Group;
  private towers!: Phaser.Physics.Arcade.Group;
  private keys!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    leftArr: Phaser.Input.Keyboard.Key;
    rightArr: Phaser.Input.Keyboard.Key;
    build: Phaser.Input.Keyboard.Key;
  };
  private hpFill!: Phaser.GameObjects.Rectangle;
  private heatFill!: Phaser.GameObjects.Rectangle;
  private heatCap!: Phaser.GameObjects.Rectangle;
  private distFill!: Phaser.GameObjects.Rectangle;
  private scrapText!: Phaser.GameObjects.Text;
  private warnText!: Phaser.GameObjects.Text;
  private tipText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private spark!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dirt!: Phaser.GameObjects.Particles.ParticleEmitter;
  private motes!: Phaser.GameObjects.Particles.ParticleEmitter;
  private bootShadow!: Phaser.GameObjects.Ellipse;
  private muzzleFx!: Phaser.GameObjects.Sprite;
  private theme!: ThemeVisual;

  private hp = 100;
  private maxHp = 100;
  private heat = 0;
  private overheated = false;
  private everOverheated = false;
  private salvage = 0;
  private scrap = 0;
  private distance = 0;
  private spawnIndex = 0;
  private fireCd = 0;
  private iFrames = 0;
  private inFire = false;
  private ended = false;
  private hudAcc = 0;
  private buffRate = 1;
  private buffArmor = 0;
  private buffName: string | null = null;
  private swipeOrigin = 0;
  private aimOrigin = 0;
  private swiping = false;
  private trauma = 0;
  private lastTip: string | null = null;
  private qaKeys: string[] | null = null;
  private lastBoom = 0;
  private spawningDone = false;
  private moveDir = 0;
  private towerCount = 0;
  private buildLock = false;
  private recoil = 0;

  constructor(cfg: RunConfig) {
    super("run");
    this.cfg = cfg;
  }

  init() {
    this.stage = stageById(this.cfg.stageId);
    this.theme = themeOf(this.stage);
    this.maxHp = this.cfg.bonuses.maxHp;
    this.hp = this.maxHp;
    this.heat = 0;
    this.overheated = false;
    this.everOverheated = false;
    this.salvage = 0;
    this.scrap = 0;
    this.distance = 0;
    this.spawnIndex = 0;
    this.fireCd = 0;
    this.iFrames = 0;
    this.inFire = false;
    this.ended = false;
    this.hudAcc = 0;
    this.buffRate = 1;
    this.buffArmor = 0;
    this.buffName = null;
    this.swiping = false;
    this.trauma = 0;
    this.lastTip = null;
    this.qaKeys = null;
    this.lastBoom = 0;
    this.spawningDone = false;
    this.moveDir = 0;
    this.towerCount = 0;
    this.buildLock = false;
    this.recoil = 0;
    audio.setMuted(this.cfg.muted);
  }

  preload() {
    const cx = DESIGN_W / 2;
    const cy = DESIGN_H / 2;
    this.add.rectangle(cx, cy, DESIGN_W, DESIGN_H, 0x100c09);
    this.add
      .text(cx, cy - 40, "EMBERLINE", {
        fontFamily: "Teko, sans-serif",
        fontSize: "64px",
        color: "#f4b942",
      })
      .setOrigin(0.5);
    const track = this.add.rectangle(cx, cy + 40, 420, 8, 0x3a3228).setOrigin(0.5);
    const fill = this.add.rectangle(track.x - 210, cy + 40, 0, 8, 0xf4b942).setOrigin(0, 0.5);
    this.load.on("progress", (p: number) => {
      fill.width = 420 * p;
    });

    this.load.image("road", this.theme.road);
    this.load.image("sky", "/game/sky.jpg");
    this.load.image("tower", "/game/tower.png?v=td1");
    this.load.spritesheet("towerBuild", "/game/tower-build.png?v=raise1", { frameWidth: 256, frameHeight: 256 });
    this.load.image("spike", "/game/heatspike.png?v=rear1");
    this.load.image("drum", "/game/drum.png?v=rear1");
    this.load.image("pool", "/game/pool.png?v=rear1");
    this.load.image("barrel", "/game/barrel.png?v=rear1");
    this.load.image("plate", "/game/plate.png?v=rear1");
    this.load.image("pylon", "/game/pylon.png?v=rear1");
    this.load.spritesheet("soldier", "/game/soldier.png?v=ha1", { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("soldierIdle", "/game/soldier-idle.png?v=ha1", { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("soldierShoot", "/game/soldier-shoot.png?v=ha1", { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("ashwalker", "/game/ashwalker.png?v=walk2", { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("muzzle", "/game/muzzle.png?v=fx2", { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("bullet", "/game/bullet.png", { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet("impact", "/game/impact.png?v=fx2", { frameWidth: 256, frameHeight: 256 });
  }

  create() {
    for (const key of ["ash-walk", "soldier-walk", "soldier-idle", "soldier-shoot", "muzzle-flash", "bullet-spin", "boom", "tower-raise"]) {
      if (this.anims.exists(key)) this.anims.remove(key);
    }
    this.anims.create({
      key: "ash-walk",
      frames: this.anims.generateFrameNumbers("ashwalker", { frames: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1] }),
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({
      key: "soldier-walk",
      frames: this.anims.generateFrameNumbers("soldier", { start: 0, end: 11 }),
      frameRate: 16,
      repeat: -1,
    });
    this.anims.create({
      key: "soldier-idle",
      frames: this.anims.generateFrameNumbers("soldierIdle", { start: 0, end: 3 }),
      frameRate: 9,
      repeat: -1,
    });
    this.anims.create({
      key: "soldier-shoot",
      frames: this.anims.generateFrameNumbers("soldierShoot", { start: 0, end: 7 }),
      frameRate: 18,
      repeat: -1,
    });
    this.anims.create({
      key: "muzzle-flash",
      frames: this.anims.generateFrameNumbers("muzzle", { start: 0, end: 3 }),
      frameRate: 22,
      repeat: 0,
    });
    this.anims.create({
      key: "bullet-spin",
      frames: this.anims.generateFrameNumbers("bullet", { start: 0, end: 3 }),
      frameRate: 14,
      repeat: -1,
    });
    this.anims.create({
      key: "tower-raise",
      frames: this.anims.generateFrameNumbers("towerBuild", { start: 0, end: 3 }),
      frameRate: 5,
      repeat: 0,
    });
    this.anims.create({
      key: "boom",
      frames: this.anims.generateFrameNumbers("impact", { start: 0, end: 3 }),
      frameRate: 18,
      repeat: 0,
    });

    const g = this.add.graphics();
    g.fillStyle(this.theme.spark, 1);
    g.fillCircle(6, 6, 6);
    g.generateTexture("spark", 12, 12);
    g.clear();
    g.fillStyle(0x6b4424, 1);
    g.fillCircle(5, 5, 5);
    g.generateTexture("dirt", 10, 10);
    g.clear();
    g.fillStyle(this.theme.mote, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture("mote", 6, 6);
    g.destroy();

    this.sky = this.add.image(DESIGN_W / 2, 90, "sky").setDisplaySize(DESIGN_W, 180).setDepth(0).setVisible(false);
    this.road = this.add
      .image(DESIGN_W / 2, DESIGN_H / 2, "road")
      .setDisplaySize(DESIGN_W, DESIGN_H)
      .setDepth(1);
    this.add.rectangle(90, DESIGN_H / 2, 180, DESIGN_H, this.theme.shoulder, 0.5).setDepth(2);
    this.add.rectangle(990, DESIGN_H / 2, 180, DESIGN_H, this.theme.shoulder, 0.5).setDepth(2);
    this.add.rectangle(DESIGN_W / 2, DESIGN_H / 2, DESIGN_W, DESIGN_H, this.theme.overlay, this.theme.overlayAlpha).setDepth(2.2);
    this.add.rectangle(DESIGN_W / 2, 70, DESIGN_W, 140, 0x100c09, 0.18).setDepth(2.3);

    this.mobs = this.physics.add.group({ maxSize: 140, allowGravity: false, runChildUpdate: false });
    this.bullets = this.physics.add.group({ maxSize: 180, allowGravity: false });
    this.fx = this.physics.add.group({ maxSize: 36, allowGravity: false });
    this.towers = this.physics.add.group({ maxSize: MAX_TOWERS, allowGravity: false });

    this.player = this.physics.add.sprite(DESIGN_W / 2, PLAYER_Y, "soldierShoot", 0);
    this.player.setDepth(12);
    this.player.setOrigin(0.5, FEET_ORIGIN);
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);
    const cbody = this.player.body as Phaser.Physics.Arcade.Body;
    cbody.setSize(96, 120, true);
    cbody.setOffset((256 - 96) / 2, 256 - 120 - 12);
    cbody.setAllowGravity(false);
    cbody.setImmovable(true);
    this.player.play("soldier-shoot");
    for (const key of ["soldier", "soldierIdle", "soldierShoot", "ashwalker", "muzzle", "towerBuild", "tower"]) {
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }

    this.spark = this.add.particles(0, 0, "spark", {
      speed: { min: 50, max: 140 },
      lifespan: 220,
      scale: { start: 0.45, end: 0 },
      alpha: { start: 1, end: 0 },
      frequency: 48,
      emitting: false,
      quantity: 2,
      blendMode: "ADD",
      angle: { min: -110, max: -70 },
    });
    this.spark.setDepth(14);

    this.dirt = this.add.particles(0, 0, "dirt", {
      speed: { min: 50, max: 220 },
      lifespan: 640,
      scale: { start: 1.1, end: 0.15 },
      alpha: { start: 0.9, end: 0 },
      gravityY: 420,
      emitting: false,
      quantity: 1,
      angle: { min: 230, max: 310 },
    });
    this.dirt.setDepth(13);

    this.motes = this.add.particles(0, 0, "mote", {
      x: { min: 220, max: 860 },
      y: { min: 80, max: DESIGN_H - 200 },
      speedY: { min: 22, max: 88 },
      speedX: { min: -22, max: 22 },
      lifespan: 3200,
      scale: { start: 1.15, end: 0.08 },
      alpha: { start: 0.55, end: 0 },
      frequency: 48,
      quantity: 1,
      blendMode: "ADD",
    });
    this.motes.setDepth(4);

    this.muzzleFx = this.add.sprite(0, 0, "muzzle", 0);
    this.muzzleFx.setVisible(false);
    this.muzzleFx.setDepth(15);
    this.muzzleFx.setBlendMode(Phaser.BlendModes.ADD);
    this.muzzleFx.setDisplaySize(96, 120);
    this.muzzleFx.setOrigin(0.5, 0.92);
    this.muzzleFx.on("animationcomplete", () => this.muzzleFx.setVisible(false));

    this.bootShadow = this.add.ellipse(this.player.x, this.player.y + 4, 70, 22, 0x000000, 0.4);
    this.bootShadow.setDepth(11);

    this.physics.add.overlap(this.bullets, this.mobs, (b, m) =>
      this.onBulletHit(b as Phaser.Physics.Arcade.Sprite, m as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(this.player, this.mobs, (_c, m) => this.onConvoyHit(m as Phaser.Physics.Arcade.Sprite));

    const kb = this.input.keyboard!;
    this.keys = {
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      leftArr: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      rightArr: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      build: kb.addKey(Phaser.Input.Keyboard.KeyCodes.T),
    };

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.swiping = true;
      this.swipeOrigin = p.worldX;
      this.aimOrigin = this.player.x;
    });
    this.input.on("pointerup", () => {
      this.swiping = false;
    });

    this.buildHud();
    this.flashWarn("HOLD THE LINE");
    this.wireControlsProbe();
    this.game.canvas.setAttribute("tabindex", "0");
    this.game.canvas.focus();
    this.events.once("shutdown", () => this.cleanup());
    this.pushHud();
  }

  tryBuildTower(): boolean {
    if (this.ended || this.towerCount >= MAX_TOWERS) return false;
    const cost = towerCost(this.towerCount);
    if (this.scrap < cost) return false;
    const slot = TOWER_SLOTS[this.towerCount];
    const t = this.towers.get(slot.x, slot.y, "tower") as Phaser.Physics.Arcade.Sprite | null;
    if (!t) return false;
    this.scrap -= cost;
    t.enableBody(true, slot.x, slot.y, true, true);
    t.setTexture("tower");
    t.anims.stop();
    t.setActive(true).setVisible(true).setAlpha(1).setDepth(8);
    t.setOrigin(0.5, 0.55);
    t.setDisplaySize(TOWER_SIZE * 0.28, TOWER_SIZE * 0.28);
    t.setData("building", true);
    t.setData("cd", 99);
    t.setData("burst", 0);
    const body = t.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setSize(t.frame.width * 0.5, t.frame.height * 0.5, true);
    }
    this.dirt.explode(18, slot.x, slot.y + 8);
    this.spark.explode(8, slot.x, slot.y - 6);
    this.trauma = Math.min(1, this.trauma + 0.4);
    this.tweens.add({
      targets: t,
      displayWidth: TOWER_SIZE,
      displayHeight: TOWER_SIZE,
      duration: 920,
      ease: "Back.easeOut",
      onComplete: () => {
        if (!t.active) return;
        t.setTexture("tower");
        t.setOrigin(0.5, 0.55);
        t.setDisplaySize(TOWER_SIZE, TOWER_SIZE);
        t.setData("building", false);
        t.setData("cd", 0.2);
        this.flashWarn(this.towerCount === 1 ? "GUN TOWER ONLINE" : `TOWER ${this.towerCount} ONLINE`);
        audio.buff();
      },
    });
    this.towerCount += 1;
    this.flashWarn("RAISING TOWER");
    audio.buff();
    this.pushHud();
    return true;
  }

  private wireControlsProbe() {
    window.__controlsTest = {
      getYaw: () => 0,
      getSpeed: () => Math.abs(this.moveDir) * MOVE_SPEED,
      getX: () => this.player.x,
      setKeys: (codes: string[]) => {
        this.qaKeys = codes;
      },
    };
  }

  private buildHud() {
    const panel = this.add.rectangle(DESIGN_W / 2, 78, 1000, 128, 0x100c09, 0.72).setDepth(20);
    panel.setStrokeStyle(1, 0x3a3228, 0.9);
    this.add.rectangle(90, 54, 900, 14, 0x3a3228).setOrigin(0, 0.5).setDepth(21);
    this.hpFill = this.add.rectangle(90, 54, 900, 14, 0xd24a3c).setOrigin(0, 0.5).setDepth(22);
    this.add
      .text(90, 32, this.theme.region.toUpperCase(), {
        fontFamily: "Barlow, sans-serif",
        fontSize: "18px",
        color: "#a89880",
      })
      .setDepth(22);
    this.add.rectangle(90, 88, 420, 10, 0x3a3228).setOrigin(0, 0.5).setDepth(21);
    this.heatFill = this.add.rectangle(90, 88, 0, 10, 0xe85d04).setOrigin(0, 0.5).setDepth(22);
    this.heatCap = this.add.rectangle(90 + 420, 88, 3, 16, 0xf4b942).setOrigin(0.5, 0.5).setDepth(22);
    this.add
      .text(90, 104, "HEAT", {
        fontFamily: "Barlow, sans-serif",
        fontSize: "16px",
        color: "#a89880",
      })
      .setDepth(22);
    this.add.rectangle(90, 128, 900, 6, 0x3a3228).setOrigin(0, 0.5).setDepth(21);
    this.distFill = this.add.rectangle(90, 128, 0, 6, 0xf4b942).setOrigin(0, 0.5).setDepth(22);

    this.nameText = this.add
      .text(200, 32, `${this.stage.index + 1}  ${this.stage.name.toUpperCase()}`, {
        fontFamily: "Teko, sans-serif",
        fontSize: "28px",
        color: "#f4b942",
      })
      .setOrigin(0, 0)
      .setDepth(22);
    this.scrapText = this.add
      .text(DESIGN_W - 90, 86, "SCRAP 0", {
        fontFamily: "Barlow, sans-serif",
        fontSize: "20px",
        color: "#f3ead8",
      })
      .setOrigin(1, 0.5)
      .setDepth(22);
    this.warnText = this.add
      .text(DESIGN_W / 2, 272, "", {
        fontFamily: "Teko, sans-serif",
        fontSize: "48px",
        color: "#e85d04",
      })
      .setOrigin(0.5)
      .setDepth(23)
      .setAlpha(0);
    this.tipText = this.add
      .text(DESIGN_W / 2, 202, "", {
        fontFamily: "Barlow, sans-serif",
        fontSize: "22px",
        color: "#f3ead8",
        align: "center",
        wordWrap: { width: 820 },
      })
      .setOrigin(0.5)
      .setDepth(23);
  }

  update(_time: number, delta: number) {
    if (this.ended) return;
    const dt = Math.min(delta, 100) / 1000;
    this.steer(dt);
    this.marchWorld(dt);
    this.spawnAhead();
    this.tickHeat(dt);
    this.autoFire(dt);
    this.towerFire(dt);
    this.pollBuild();
    this.recycleOffscreen();
    this.updateHudBars();
    this.iFrames = Math.max(0, this.iFrames - dt);
    this.trauma = Math.max(0, this.trauma - dt * 2.4);
    if (this.trauma > 0.16) {
      const shake = (this.trauma - 0.16) * (this.trauma - 0.16) * 12;
      this.cameras.main.setScroll((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    } else {
      this.cameras.main.setScroll(0, 0);
    }
    if (this.player) {
      this.player.setAlpha(this.iFrames > 0 ? 0.55 + 0.45 * Math.sin(_time / 40) : 1);
    }
    this.hudAcc += dt;
    if (this.hudAcc > 0.2) {
      this.hudAcc = 0;
      this.pushHud();
    }
    this.checkWin();
  }

  private leftHeld() {
    if (this.qaKeys) return this.qaKeys.includes("KeyA") || this.qaKeys.includes("ArrowLeft");
    return this.keys.left.isDown || this.keys.leftArr.isDown;
  }

  private rightHeld() {
    if (this.qaKeys) return this.qaKeys.includes("KeyD") || this.qaKeys.includes("ArrowRight");
    return this.keys.right.isDown || this.keys.rightArr.isDown;
  }

  private pollBuild() {
    const held = this.qaKeys ? this.qaKeys.includes("KeyT") : this.keys.build.isDown;
    if (held && !this.buildLock) {
      this.buildLock = true;
      this.tryBuildTower();
    }
    if (!held) this.buildLock = false;
  }

  private groundAt(y: number) {
    const t = Phaser.Math.Clamp((y - 80) / (PLAYER_Y - 80), 0, 1);
    const half = 170 + t * 120;
    return {
      left: DESIGN_W / 2 - half,
      right: DESIGN_W / 2 + half,
      scale: 0.58 + t * 0.42,
    };
  }

  private muzzlePos() {
    return {
      x: this.player.x + PLAYER_SIZE * 0.07,
      y: this.player.y - PLAYER_SIZE * 0.82,
    };
  }

  private playWarden() {
    const firing = !this.overheated;
    if (firing) this.player.anims.play("soldier-shoot", true);
    else if (this.moveDir !== 0) this.player.anims.play("soldier-walk", true);
    else this.player.anims.play("soldier-idle", true);
  }

  private steer(dt: number) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.recoil = Math.max(0, this.recoil - dt * 9);
    this.player.y = PLAYER_Y + this.recoil * 3;
    body.velocity.x = 0;
    body.velocity.y = 0;

    let dir = 0;
    if (this.leftHeld()) dir -= 1;
    if (this.rightHeld()) dir += 1;
    this.moveDir = dir;
    if (this.swiping) {
      const p = this.input.activePointer;
      const dx = p.worldX - this.swipeOrigin;
      if (Math.abs(dx) > DEADZONE) {
        const target = Phaser.Math.Clamp(this.aimOrigin + (dx - Math.sign(dx) * DEADZONE), ROAD_LEFT, ROAD_RIGHT);
        const k = 1 - Math.exp(-16 * dt);
        this.player.x += (target - this.player.x) * k;
        this.moveDir = Math.sign(target - this.player.x) || this.moveDir;
      }
    } else if (dir !== 0) {
      this.player.x += dir * MOVE_SPEED * dt;
    }
    this.player.x = Phaser.Math.Clamp(this.player.x, ROAD_LEFT + 28, ROAD_RIGHT - 28);
    this.bootShadow.setPosition(this.player.x, this.player.y + 6);
    this.player.setFlipX(false);
    this.playWarden();
    const muz = this.muzzlePos();
    this.spark.setPosition(muz.x, muz.y);
    if (this.muzzleFx.visible) {
      this.muzzleFx.setPosition(muz.x, muz.y);
      this.muzzleFx.setFlipX(false);
    }
  }

  private marchWorld(dt: number) {
    this.distance += this.stage.scroll * dt;
    this.inFire = false;
    const px = this.player.x;
    const children = this.mobs.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const s of children) {
      if (!s.active) continue;
      const data = this.dataOf(s);
      const mul = MARCH_MUL[data.kind] ?? 1;
      const close = s.y > PLAYER_Y - 420 ? 1.18 : 1;
      const mop = this.spawningDone && this.distance >= this.stage.length ? 1.3 : 1;
      const speed = this.stage.march * mul * close * mop;
      s.y += speed * dt;
      const g = this.groundAt(s.y);
      if ((data.kind === "ash" || data.kind === "spike" || data.kind === "drum") && s.y > PLAYER_Y - 640) {
        const pull = data.kind === "drum" ? 20 : 28;
        const dx = px - s.x;
        if (Math.abs(dx) > 12) s.x += Math.sign(dx) * pull * dt;
      }
      s.x = Phaser.Math.Clamp(s.x, g.left + 10, g.right - 10);
      this.plantSprite(s, g.scale);
      if (data.kind === "drum") s.rotation += dt * 3.2;
      if (data.kind === "ash" && s.anims.currentAnim?.key !== "ash-walk") s.play("ash-walk");
      const label = s.getData("label") as Phaser.GameObjects.Text | undefined;
      if (label) label.setPosition(s.x, s.y - 28 * g.scale);
      if (data.kind === "pool" && this.physics.overlap(this.player, s)) this.inFire = true;
    }
    const shots = this.bullets.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const b of shots) {
      if (!b.active) continue;
      const vx = (b.getData("vx") as number) || 0;
      const vy = (b.getData("vy") as number) || -BULLET_SPEED;
      b.x += vx * dt;
      b.y += vy * dt;
    }
  }

  private spawnAhead() {
    if (this.spawningDone) return;
    while (this.spawnIndex < this.stage.spawns.length) {
      const ev = this.stage.spawns[this.spawnIndex];
      if (ev.at > this.distance + 40) break;
      this.spawnIndex += 1;
      this.spawnEvent(ev);
    }
    if (this.spawnIndex >= this.stage.spawns.length) this.spawningDone = true;
  }

  private spawnEvent(ev: SpawnEvent) {
    if (ev.kind === "pylons") {
      this.makeMob("pylon", LANE_X[0], 520, {
        kind: "pylons",
        hp: 1,
        hits: 0,
        dmg: 0,
        heat: 0,
        scrap: 0,
        lane: 0,
        consumed: false,
        buff: "overclock",
      });
      this.makeMob("pylon", LANE_X[2], 520, {
        kind: "pylons",
        hp: 1,
        hits: 0,
        dmg: 0,
        heat: 0,
        scrap: 0,
        lane: 2,
        consumed: false,
        buff: "plating",
      });
      this.flashWarn("PYLONS — SHOOT TO CLAIM");
      return;
    }

    const n = ev.count ?? 1;
    if (ev.kind === "ash" && n >= 8) this.flashWarn("HORDE INBOUND");

    const cols = ev.kind === "ash" ? (n >= 5 ? 5 : n) : Math.max(1, ev.lanes.length);
    for (let i = 0; i < n; i++) {
      const lane = ev.lanes[i % ev.lanes.length];
      let x: number;
      let y: number;
      if (ev.kind === "ash") {
        const col = i % cols;
        const rank = Math.floor(i / cols);
        const y0 = 360 - rank * 86;
        const g = this.groundAt(y0);
        const span = g.right - g.left;
        x = g.left + ((col + 0.5) / cols) * span + (Math.random() * 16 - 8);
        y = y0;
      } else {
        const y0 = 340 - Math.floor(i / cols) * 78;
        const g = this.groundAt(y0);
        const laneT = (LANE_X[lane] - ROAD_LEFT) / (ROAD_RIGHT - ROAD_LEFT);
        x = g.left + laneT * (g.right - g.left) + (Math.random() * 18 - 9);
        y = y0;
      }
      this.spawnOne(ev, lane, x, y);
    }
  }

  private spawnOne(ev: SpawnEvent, lane: number, x: number, y: number) {
    if (ev.kind === "ash") {
      this.makeMob("ashwalker", x, y, {
        kind: "ash",
        hp: this.stage.ashHp,
        hits: 0,
        dmg: 10,
        heat: 0,
        scrap: 2,
        lane,
        consumed: false,
      });
    } else if (ev.kind === "spike") {
      this.makeMob("spike", x, y, {
        kind: "spike",
        hp: 5,
        hits: 0,
        dmg: 16,
        heat: 6,
        scrap: 2,
        lane,
        consumed: false,
      });
    } else if (ev.kind === "drum") {
      this.makeMob("drum", x, y, {
        kind: "drum",
        hp: 4,
        hits: 0,
        dmg: 20,
        heat: 4,
        scrap: 2,
        lane,
        consumed: false,
      });
    } else if (ev.kind === "pool") {
      this.makeMob("pool", x, y, {
        kind: "pool",
        hp: 4,
        hits: 0,
        dmg: 0,
        heat: HEAT_FIRE,
        scrap: 0,
        lane,
        consumed: false,
      });
    } else if (ev.kind === "barrel") {
      this.makeMob("barrel", x, y, {
        kind: "barrel",
        hp: 3,
        hits: 0,
        dmg: 0,
        heat: 0,
        scrap: 4,
        lane,
        consumed: false,
      });
    } else if (ev.kind === "plate") {
      const hits = ev.hits ?? 3;
      const s = this.makeMob("plate", x, y, {
        kind: "plate",
        hp: hits,
        hits,
        dmg: 0,
        heat: 0,
        scrap: 5,
        lane,
        consumed: false,
      });
      if (s) {
        const label = this.add
          .text(s.x, s.y - 28, String(hits), {
            fontFamily: "Teko, sans-serif",
            fontSize: "42px",
            color: "#f4b942",
          })
          .setOrigin(0.5)
          .setDepth(9);
        s.setData("label", label);
      }
    }
  }

  private plantSprite(s: Phaser.Physics.Arcade.Sprite, scale?: number) {
    const gScale = scale ?? this.groundAt(s.y).scale;
    const bw = (s.getData("bw") as number) || 96;
    const bh = (s.getData("bh") as number) || 96;
    const originY = (s.getData("originY") as number) ?? FEET_ORIGIN;
    if (s.originY !== originY) s.setOrigin(0.5, originY);
    const sx = (bw * gScale) / 256;
    const sy = (bh * gScale) / 256;
    if (Math.abs(s.scaleX - sx) > 0.004 || Math.abs(s.scaleY - sy) > 0.004) {
      s.setScale(sx, sy);
    }
    s.setDepth(5 + s.y * 0.004);
    const shadow = s.getData("shadow") as Phaser.GameObjects.Ellipse | undefined;
    if (shadow) {
      shadow.setPosition(s.x, s.y + 4);
      shadow.setSize(bw * gScale * 0.48, Math.max(8, 14 * gScale));
      shadow.setDepth(4.5 + s.y * 0.004);
      shadow.setAlpha(0.28 + gScale * 0.2);
    }
  }

  private makeMob(key: string, x: number, y: number, data: SpriteData): Phaser.Physics.Arcade.Sprite | null {
    const s = this.mobs.get(x, y, key) as Phaser.Physics.Arcade.Sprite | null;
    if (!s) return null;
    s.enableBody(true, x, y, true, true);
    s.setTexture(key);
    s.setActive(true).setVisible(true).setAlpha(1).clearTint().setRotation(0);
    const sizes: Record<string, [number, number]> = {
      ashwalker: [92, 128],
      spike: [58, 88],
      drum: [64, 72],
      pool: [120, 72],
      barrel: [64, 78],
      plate: [84, 84],
      pylon: [52, 90],
    };
    const [w, h] = sizes[key] ?? [88, 88];
    s.setData("bw", w);
    s.setData("bh", h);
    s.setData("originY", key === "pool" ? 0.55 : FEET_ORIGIN);
    const body = s.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) body.setSize(s.frame.width * 0.46, s.frame.height * 0.55, true);
    s.anims.stop();
    s.setData("kind", data.kind);
    s.setData("hp", data.hp);
    s.setData("hits", data.hits);
    s.setData("dmg", data.dmg);
    s.setData("heat", data.heat);
    s.setData("scrap", data.scrap);
    s.setData("lane", data.lane);
    s.setData("consumed", false);
    s.setData("buff", data.buff ?? null);
    if (key === "ashwalker") {
      let shadow = s.getData("shadow") as Phaser.GameObjects.Ellipse | undefined;
      if (!shadow || !shadow.scene) {
        shadow = this.add.ellipse(x, y + 4, 52, 12, 0x000000, 0.4);
        s.setData("shadow", shadow);
      }
      shadow.setVisible(true);
      s.play("ash-walk");
      s.anims.setProgress(Math.random());
      if (this.theme.ashTint) s.setTint(this.theme.ashTint);
      this.dirt.explode(4, x, y);
    } else {
      const shadow = s.getData("shadow") as Phaser.GameObjects.Ellipse | undefined;
      if (shadow) shadow.setVisible(false);
    }
    const g = this.groundAt(s.y);
    s.x = Phaser.Math.Clamp(s.x, g.left + 10, g.right - 10);
    this.plantSprite(s);
    if (key === "pool") s.setDepth(3);
    return s;
  }

  private dataOf(s: Phaser.Physics.Arcade.Sprite): SpriteData {
    return {
      kind: s.getData("kind") as Kind,
      hp: s.getData("hp") as number,
      hits: s.getData("hits") as number,
      dmg: s.getData("dmg") as number,
      heat: s.getData("heat") as number,
      scrap: s.getData("scrap") as number,
      lane: s.getData("lane") as number,
      consumed: Boolean(s.getData("consumed")),
      buff: s.getData("buff") as SpriteData["buff"],
    };
  }

  private recycle(s: Phaser.Physics.Arcade.Sprite) {
    const label = s.getData("label") as Phaser.GameObjects.Text | undefined;
    if (label) {
      label.destroy();
      s.setData("label", undefined);
    }
    const shadow = s.getData("shadow") as Phaser.GameObjects.Ellipse | undefined;
    if (shadow) shadow.setVisible(false);
    s.disableBody(true, true);
  }

  private recycleOffscreen() {
    for (const s of this.mobs.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (s.active && s.y > DESIGN_H + 120) this.recycle(s);
    }
    for (const b of this.bullets.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!b.active) continue;
      if (b.y < -80 || b.y > DESIGN_H + 80 || b.x < 40 || b.x > DESIGN_W - 40) this.recycleBullet(b);
    }
  }

  private tickHeat(dt: number) {
    if (this.inFire) this.heat += HEAT_FIRE * dt;
    else this.heat -= HEAT_COOL * dt;
    this.heat = Phaser.Math.Clamp(this.heat, 0, 100);
    if (this.heat >= 100 && !this.overheated) {
      this.overheated = true;
      this.everOverheated = true;
      audio.overheat();
      this.flashWarn("GUNS OVERHEAT");
    }
    if (this.overheated && this.heat <= OVERHEAT_RESET) this.overheated = false;
  }

  private autoFire(dt: number) {
    this.fireCd -= dt;
    if (this.overheated || this.fireCd > 0) return;
    const rate = 0.155 / (this.cfg.bonuses.fireRate * this.buffRate);
    this.fireCd = rate;
    this.recoil = 1;
    const muz = this.muzzlePos();
    this.muzzleFx.setPosition(muz.x, muz.y);
    this.muzzleFx.setVisible(true);
    this.muzzleFx.setFlipX(false);
    this.muzzleFx.play("muzzle-flash");
    this.spark.explode(5, muz.x, muz.y);
    this.spawnBullet(muz.x, muz.y - 6);
    if (this.buffRate > 1.2) {
      this.spawnBullet(muz.x + 18, muz.y - 4);
      this.spawnBullet(muz.x - 18, muz.y - 4);
    }
    audio.shot();
  }

  private towerFire(dt: number) {
    const list = this.towers.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const t of list) {
      if (!t.active || t.getData("building")) continue;
      const cd = ((t.getData("cd") as number) || 0) - dt;
      if (cd > 0) {
        t.setData("cd", cd);
        continue;
      }
      const target = this.nearestThreat(t.x, t.y);
      if (!target) {
        t.setData("burst", 0);
        t.setData("cd", 0);
        continue;
      }
      const burst = ((t.getData("burst") as number) || 0) + 1;
      this.spawnBullet(t.x, t.y - TOWER_SIZE * 0.32, target.x, target.y, 1);
      if (burst === 1) audio.shot();
      if (burst >= TOWER_BURST) {
        t.setData("burst", 0);
        t.setData("cd", TOWER_RELOAD);
      } else {
        t.setData("burst", burst);
        t.setData("cd", TOWER_SHOT_GAP);
      }
    }
  }

  private nearestThreat(x: number, y: number): Phaser.Physics.Arcade.Sprite | null {
    let best: Phaser.Physics.Arcade.Sprite | null = null;
    let bestD = TOWER_RANGE * TOWER_RANGE;
    for (const s of this.mobs.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!s.active) continue;
      const kind = s.getData("kind") as Kind;
      if (kind !== "ash" && kind !== "spike" && kind !== "drum" && kind !== "pool") continue;
      const dx = s.x - x;
      const dy = s.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }

  private spawnBullet(x: number, y: number, tx?: number, ty?: number, pierce = 0) {
    const b = this.bullets.get(x, y, "bullet") as Phaser.Physics.Arcade.Sprite | null;
    if (!b) return;
    b.enableBody(true, x, y, true, true);
    b.setTexture("bullet");
    b.setActive(true).setVisible(true).setDepth(7);
    b.setDisplaySize(pierce > 0 ? 34 : 28, pierce > 0 ? 34 : 28);
    b.body?.setSize(28, 36);
    if (tx !== undefined && ty !== undefined) {
      const dx = tx - x;
      const dy = ty - y;
      const len = Math.hypot(dx, dy) || 1;
      b.setData("vx", (dx / len) * BULLET_SPEED);
      b.setData("vy", (dy / len) * BULLET_SPEED);
    } else {
      b.setData("vx", 0);
      b.setData("vy", -BULLET_SPEED);
    }
    b.setData("pierce", pierce > 0 ? pierce : this.buffRate > 1.2 ? 1 : 0);
    b.setData("lastHit", null);
    b.play("bullet-spin");
    b.setBlendMode(Phaser.BlendModes.ADD);
    b.setRotation(0);
  }

  private recycleBullet(b: Phaser.Physics.Arcade.Sprite) {
    b.disableBody(true, true);
  }

  private onBulletHit(b: Phaser.Physics.Arcade.Sprite, m: Phaser.Physics.Arcade.Sprite) {
    if (!b.active || !m.active) return;
    if (b.getData("lastHit") === m) return;
    const d = this.dataOf(m);
    if (d.kind === "pylons") {
      this.recycleBullet(b);
      if (d.consumed) return;
      m.setData("consumed", true);
      this.applyBuff(d.buff ?? "overclock");
      this.recycle(m);
      return;
    }
    b.setData("lastHit", m);
    const pierce = (b.getData("pierce") as number) || 0;
    if (pierce > 0) b.setData("pierce", pierce - 1);
    else this.recycleBullet(b);

    const hp = (m.getData("hp") as number) - this.cfg.bonuses.damage;
    m.setData("hp", hp);
    if (d.kind !== "ash") {
      m.setTint(0xffc070);
      this.time.delayedCall(55, () => {
        if (m.active) m.clearTint();
      });
    }
    const label = m.getData("label") as Phaser.GameObjects.Text | undefined;
    if (label) label.setText(String(Math.max(0, Math.ceil(hp))));
    audio.hit();
    if (hp <= 0) this.killMob(m);
  }

  private killMob(m: Phaser.Physics.Arcade.Sprite) {
    const d = this.dataOf(m);
    const gain = Math.round(d.scrap * this.cfg.bonuses.scrapFind);
    this.scrap += gain;
    this.salvage += 1;
    this.popFx(m.x, m.y);
    if (gain > 0) this.floatText(m.x, m.y, `+${gain}`);
    if (this.time.now - this.lastBoom > 50) {
      audio.boom();
      this.lastBoom = this.time.now;
    }
    this.trauma = Math.min(1, this.trauma + (d.kind === "ash" ? 0.03 : 0.18));
    this.recycle(m);
  }

  private onConvoyHit(m: Phaser.Physics.Arcade.Sprite) {
    if (!m.active || this.ended) return;
    const d = this.dataOf(m);
    if (d.kind === "pool") return;
    if (d.kind === "pylons") {
      if (d.consumed) return;
      m.setData("consumed", true);
      this.applyBuff(d.buff ?? "overclock");
      this.recycle(m);
      return;
    }
    if (d.kind === "barrel") {
      this.killMob(m);
      return;
    }
    if (d.kind === "plate") return;
    if (this.iFrames > 0) return;
    const dmg = Math.max(4, d.dmg - this.buffArmor);
    this.hp -= dmg;
    this.iFrames = 0.48;
    this.heat = Math.min(100, this.heat + d.heat);
    this.trauma = Math.min(1, this.trauma + 0.55);
    this.cameras.main.flash(80, 180, 40, 20);
    audio.hurt();
    this.floatText(this.player.x, this.player.y - PLAYER_SIZE * 0.9, `-${dmg}`, "#d24a3c");
    if (this.hp <= 0) {
      this.hp = 0;
      this.end(false);
    }
  }

  private applyBuff(kind: "overclock" | "plating") {
    audio.buff();
    if (kind === "overclock") {
      this.buffRate = 1.45;
      this.buffName = "Overclock";
      this.flashWarn("OVERCLOCK");
    } else {
      this.buffArmor = 8;
      this.maxHp += 20;
      this.hp = Math.min(this.maxHp, this.hp + 18);
      this.buffName = "Plating";
      this.flashWarn("PLATING");
    }
  }

  private popFx(x: number, y: number) {
    const s = this.fx.get(x, y, "impact") as Phaser.Physics.Arcade.Sprite | null;
    if (!s) return;
    s.enableBody(true, x, y, true, true);
    s.setActive(true).setVisible(true).setDepth(10);
    s.setDisplaySize(170, 170);
    s.setBlendMode(Phaser.BlendModes.ADD);
    s.play("boom");
    s.once("animationcomplete", () => s.disableBody(true, true));
  }

  private floatText(x: number, y: number, msg: string, color = "#f4b942") {
    const t = this.add
      .text(x, y, msg, { fontFamily: "Teko, sans-serif", fontSize: "36px", color })
      .setOrigin(0.5)
      .setDepth(24);
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 0,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => t.destroy(),
    });
  }

  private flashWarn(msg: string) {
    this.warnText.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.warnText);
    this.tweens.add({ targets: this.warnText, alpha: 0, delay: 500, duration: 400 });
  }

  private threatCount() {
    let n = 0;
    for (const s of this.mobs.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!s.active) continue;
      const kind = s.getData("kind") as Kind;
      if (kind === "ash" || kind === "spike" || kind === "drum" || kind === "pool") n += 1;
    }
    return n;
  }

  private checkWin() {
    if (this.distance < this.stage.length) return;
    if (this.threatCount() === 0) this.end(true);
  }

  private updateHudBars() {
    this.hpFill.width = 900 * (this.hp / this.maxHp);
    this.heatFill.width = 420 * (this.heat / 100);
    this.heatFill.fillColor = this.overheated ? 0xd24a3c : 0xe85d04;
    this.distFill.width = 900 * Math.min(1, this.distance / this.stage.length);
    this.scrapText.setText(
      this.towerCount >= MAX_TOWERS ? `SCRAP ${this.scrap}` : `SCRAP ${this.scrap}  ·  T ${towerCost(this.towerCount)}`,
    );
    this.warnText.setText(this.overheated ? "GUNS OVERHEAT" : this.warnText.text);
    if (this.overheated) this.warnText.setAlpha(0.7 + 0.3 * Math.sin(this.game.loop.frame));
    const tip = this.tutorialTip();
    if (tip !== this.lastTip) {
      this.lastTip = tip;
      this.tipText.setText(tip ?? "");
    }
  }

  private tutorialTip(): string | null {
    if (!this.stage.tutorial) return this.buffName ? this.buffName : null;
    if (this.distance < 700) return "A / D or swipe to strafe. Your rifle fires on its own.";
    if (this.distance < 1600) return "Sweep the line. Closest Ashwalkers first.";
    if (this.distance < 2500) return "Kills drop scrap. A gun tower costs 22 scrap — hold the line first.";
    if (this.distance < 3400) return "Ember Pools stoke Heat. Snuff them or guns seize at 100.";
    if (this.distance < 4300) return "Raise a tower and it will chew the horde for you.";
    if (this.distance < 5200) return "Breaker Plates take numbered hits. Empty them for scrap.";
    if (this.distance < 6100) return "Heat Spikes are armored. Burn them down.";
    if (this.distance < 7000) return "Choice Pylons: shoot LEFT for Overclock, RIGHT for Plating.";
    return "Three towers max. Hold the line until the last rank falls.";
  }

  private pushHud() {
    const cost = towerCost(this.towerCount);
    const canBuild = this.towerCount < MAX_TOWERS && this.scrap >= cost;
    const hud: RunHud = {
      hp: this.hp,
      maxHp: this.maxHp,
      heat: this.heat,
      overheated: this.overheated,
      scrap: this.scrap,
      progress: Math.min(1, this.distance / this.stage.length),
      buff: this.buffName,
      tip: this.tutorialTip(),
      towers: this.towerCount,
      towerCost: cost,
      canBuild,
    };
    this.cfg.onHud(hud);
    let closest = 9999;
    let n = 0;
    for (const s of this.mobs.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!s.active) continue;
      const kind = s.getData("kind") as Kind;
      if (kind === "ash" || kind === "spike" || kind === "drum" || kind === "pool") {
        n += 1;
        if (s.y < closest) closest = s.y;
      }
    }
    if (typeof window !== "undefined") {
      window.__emberline = {
        screen: "run",
        hp: this.hp,
        heat: Math.round(this.heat),
        stage: this.stage.id,
        x: Math.round(this.player.x),
        distance: Math.round(this.distance),
        mobs: n,
        closest: closest === 9999 ? null : Math.round(closest),
        towers: this.towerCount,
        scrap: this.scrap,
        canBuild,
        tryBuild: () => this.tryBuildTower(),
        grantScrap: (n: number) => {
          this.scrap += n;
          this.pushHud();
        },
      };
    }
  }

  private end(won: boolean) {
    if (this.ended) return;
    this.ended = true;
    this.spark.stop();
    this.muzzleFx.setVisible(false);
    if (won) audio.win();
    else audio.fail();
    const hpRatio = this.hp / this.maxHp;
    const stars = won ? starsFor(hpRatio, this.salvage, this.everOverheated) : 0;
    const loot = this.cfg.bonuses.lootMult;
    const result: RunResult = {
      stageId: this.stage.id,
      won,
      stars,
      hp: Math.max(0, this.hp),
      maxHp: this.maxHp,
      salvage: this.salvage,
      scrap: Math.round((this.scrap + (won ? this.stage.scrap : this.stage.scrap * 0.2)) * loot),
      ember: Math.round((won ? this.stage.ember : 2) * loot),
      rations: won ? this.stage.rations : 0,
      xp: won ? this.stage.xp : 8,
      overheated: this.everOverheated,
      distance: this.distance,
      length: this.stage.length,
    };
    this.time.delayedCall(650, () => this.cfg.onFinish(result));
  }

  private cleanup() {
    if (window.__controlsTest) delete window.__controlsTest;
    this.mobs.clear(true, true);
    this.bullets.clear(true, true);
    this.fx.clear(true, true);
    this.towers.clear(true, true);
  }
}

declare global {
  interface Window {
    __emberline?: {
      screen: string;
      hp: number;
      heat: number;
      stage?: string;
      x?: number;
      distance?: number;
      mobs?: number;
      closest?: number | null;
      towers?: number;
      scrap?: number;
      canBuild?: boolean;
      tryBuild?: () => boolean;
      grantScrap?: (n: number) => void;
      enter?: () => void;
    };
    __emberGame?: Phaser.Game;
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      setKeys: (codes: string[]) => void;
    };
  }
}
