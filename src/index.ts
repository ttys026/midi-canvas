import MidiParser from "midi-parser-js";
import {
  MidiData,
  MidiEvent,
  MidiParseResult,
  ParseData,
} from "./typings/internal";

export interface BarStyle extends CanvasShadowStyles {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
}

export interface MidiInfo {
  max: number;
  min: number;
}

export interface MidiConfig {
  src: string;
  barStyle?: Partial<BarStyle>;
  activeStyle?: Partial<BarStyle>;
  visible?: boolean;
}

export interface Params {
  audio: string;
  container: HTMLElement;
  width: number | string;
  height: number | string;
  paddingVertical?: number;
  midis: MidiConfig[];
  shift?: (data: ParseData[][]) => ParseData[][];
}

const normalize = (base64: string) => {
  const leading = `data:audio/midi;base64,`;
  if (base64.startsWith(leading)) {
    return base64.slice(leading.length).trim();
  }
  return base64;
};

const parse = (base64: string): MidiParseResult => {
  const data = normalize(base64);
  const raw = MidiParser.parse(data);
  return raw;
};

const defaultBarStyle = { fillStyle: "#44444488", shadowBlur: 0 };
const defaultActiveStyle = {
  fillStyle: "#c246afc0",
  shadowColor: "#ee11ef",
  shadowBlur: 10,
};

export default class MidiCanvas {
  private raf = 0;
  private ready = false;
  public refresh = () => {};
  public config: Params = {
    audio: "",
    container: document.body,
    width: 400,
    height: 200,
    paddingVertical: 4,
    midis: [],
  };
  public audio = new Audio();
  private canvas: HTMLCanvasElement = document.createElement("canvas");

  constructor(params: Params) {
    this.config = {
      ...this.config,
      ...params,
    };
    this.prepare();
  }

  private prepareData = () => {
    let data = this.config.midis.map((midi) => {
      const { src } = midi;
      const raw = parse(src);
      const longest = raw.track.reduce((acc, ele) => {
        return acc.event.length > ele.event.length ? acc : ele;
      }, raw.track[0]);

      const events: MidiEvent[] = longest.event;

      const midiData = events
        .reduce(
          (acc, cur) => {
            acc.curTime += cur.deltaTime;
            const [note, velocity] = Array.isArray(cur.data)
              ? cur.data
              : [0, 0];

            if (cur.type === 9 && velocity !== 0) {
              acc.noteMap[note] = acc.curTime;
            } else if (cur.type === 8 || velocity === 0) {
              if (note in acc.noteMap && acc.noteMap[note] !== -1) {
                acc.parsed.push({
                  note: note,
                  start: acc.noteMap[note],
                  end: acc.curTime,
                });
              }
              acc.noteMap[note] = -1;
            }
            return acc;
          },
          {
            noteMap: {},
            curTime: 0,
            parsed: [],
          } as MidiData
        )
        .parsed.map((e) => {
          e.start /= raw.timeDivision * 2;
          e.end /= raw.timeDivision * 2;
          return e;
        });

      return midiData;
    });

    const midiInfo = { max: -1, min: 255 };

    if (this.config.shift) {
      try {
        data = this.config.shift(data);
      } catch (e) {
        console.error(e);
      }
    }

    data.forEach((track) => {
      track.forEach((midiData) => {
        const { note } = midiData;
        if (note > midiInfo.max) midiInfo.max = note;
        if (note < midiInfo.min) midiInfo.min = note;
      });
    });

    midiInfo.max += 1; // we need [min, max] so max should add 1 else we will get [min, max)

    return { info: midiInfo, data };
  };

  private prepareCanvas = () => {
    const { canvas, config } = this;
    const { container, width, height } = config;
    if (width && Number.isFinite(width)) {
      canvas.style.width = `${width}px`;
    } else if (width) {
      canvas.style.width = width as string;
    } else {
      canvas.style.width = "100%";
    }

    if (height && Number.isFinite(height)) {
      canvas.style.height = `${height}px`;
    } else if (height) {
      canvas.style.height = height as string;
    } else {
      canvas.style.height = "100%";
    }

    const dpr = window.devicePixelRatio || 1;
    container.appendChild(canvas);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("get context failed");
    }

    ctx.scale(dpr, dpr);

    return {
      canvas,
      ctx,
      rect,
    };
  };

  private prepareAudio = () => {
    this.audio.src = this.config.audio;
    return { audio: this.audio };
  };

  private drawFrame = ({
    ctx,
    audio,
    midiData,
    width,
    height,
  }: {
    ctx: CanvasRenderingContext2D;
    audio: HTMLAudioElement;
    midiData: ReturnType<InstanceType<typeof MidiCanvas>["prepareData"]>;
    width: number;
    height: number;
  }) => {
    const verticalPaddingRatio = Math.max(
      1 - ((this.config.paddingVertical ?? 4) * 2) / height,
      0.8
    );
    const { info, data } = midiData;
    const { min, max } = info;
    const avg = (height / (max - min)) * verticalPaddingRatio;
    const baseHeight = height - avg;

    this.raf = requestAnimationFrame(() => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      data.forEach((midi, index) => {
        if (this.config.midis[index].visible === false) {
          return;
        }
        Object.entries(
          this.config.midis[index].barStyle || defaultBarStyle
        ).forEach(([key, value]) => {
          // @ts-ignore
          ctx[key] = value;
        });

        const { currentTime } = audio;
        const inside = midi.filter(
          (e) => e.end >= currentTime - 4000 && e.start <= currentTime + 4000
        );
        const highLight = inside.filter(
          (e) => e.start <= currentTime && e.end >= currentTime
        );

        inside.forEach((e) => {
          const x = (e.start - currentTime) * 50 + width / 2;
          const y = baseHeight - (e.note - min) * avg;
          const w = (e.end - e.start) * 50;
          ctx.fillRect(x, y * verticalPaddingRatio, w, avg);
        });

        Object.entries(
          this.config.midis[index].activeStyle || defaultActiveStyle
        ).forEach(([key, value]) => {
          // @ts-ignore
          ctx[key] = value;
        });

        highLight.forEach((e) => {
          const x = (e.start - currentTime) * 50 + width / 2;
          const y = baseHeight - (e.note - min) * avg;
          const w = (e.end - e.start) * 50;
          ctx.fillRect(x, y * verticalPaddingRatio, w, avg);
        });
      });

      if (this.audio.paused) {
        cancelAnimationFrame(this.raf);
      } else {
        this.drawFrame({ ctx, audio, midiData, width, height });
      }
    });
  };

  private prepare = () => {
    if (this.ready) {
      return this.audio;
    }
    const { audio } = this.prepareAudio();
    const midiData = this.prepareData();
    const { ctx, rect } = this.prepareCanvas();

    audio.addEventListener("timeupdate", () => {
      this.refresh();
    });
    audio.addEventListener("play", () => {
      cancelAnimationFrame(this.raf);
      this.drawFrame({
        ctx,
        audio,
        midiData,
        width: rect.width,
        height: rect.height,
      });
    });
    audio.addEventListener("pause", () => {
      cancelAnimationFrame(this.raf);
    });

    this.refresh = () => {
      if (this.audio.paused) {
        this.drawFrame({
          ctx,
          audio,
          midiData,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    this.refresh();
    this.ready = true;

    return audio;
  };

  public destroy = () => {
    this.ready = false;
    cancelAnimationFrame(this.raf);
    this.audio.pause();
    this.audio = new Audio();
    this.canvas.remove();
    this.canvas = document.createElement("canvas");
    this.refresh = () => {};
  };
}
