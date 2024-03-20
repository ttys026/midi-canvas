import MidiParser from "midi-parser-js";

export interface BarStyle extends CanvasShadowStyles {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
}

export interface Params {
  midi: string;
  audio: string;
  container: HTMLElement;
  width: number | string;
  height: number | string;
  barStyle?: Partial<BarStyle>;
  activeStyle?: Partial<BarStyle>;
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

export default class MidiCanvas {
  private raf = 0;
  private ready = false;
  private config: Params = {
    midi: "",
    audio: "",
    container: document.body,
    width: 400,
    height: 200,
    barStyle: { fillStyle: "#44444488", shadowBlur: 0 },
    activeStyle: {
      fillStyle: "#c246afc0",
      shadowColor: "#ee11ef",
      shadowBlur: 10,
    },
  };
  public audio = new Audio();

  constructor(params: Params) {
    this.config = {
      ...this.config,
      ...params,
    };
    this.prepare();
  }

  private prepareData = () => {
    const raw = parse(this.config.midi);
    const longest = raw.track.reduce((acc, ele) => {
      return acc.event.length > ele.event.length ? acc : ele;
    }, raw.track[0]);

    const events: MidiEvent[] = longest.event;
    const midiInfo = { max: -1, min: 255, avg: 0 };
    const midiData = events
      .reduce(
        (acc, cur) => {
          acc.curTime += cur.deltaTime;
          const [note, velocity] = Array.isArray(cur.data) ? cur.data : [0, 0];
          if (cur.type === 9 && velocity !== 0) {
            acc.noteMap[note] = acc.curTime;
            if (note > midiInfo.max) midiInfo.max = note;
            if (note < midiInfo.min) midiInfo.min = note;
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
        { noteMap: {}, curTime: 0, parsed: [] } as MidiData
      )
      .parsed.map((e) => {
        e.start /= 440.3;
        e.end /= 440.3;
        return e;
      });

    midiInfo.max += 1; // we need [min, max] so max should add 1 else we will get [min, max)
    midiInfo.avg = 150 / (midiInfo.max - midiInfo.min);

    return {
      midiData,
      midiInfo,
    };
  };

  private prepareCanvas = () => {
    const { container, width, height } = this.config;
    const canvas = document.createElement("canvas");
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
    midiInfo,
    midiData,
    width,
    height,
  }: {
    ctx: CanvasRenderingContext2D;
    audio: HTMLAudioElement;
    midiInfo: ReturnType<
      (typeof MidiCanvas)["prototype"]["prepareData"]
    >["midiInfo"];
    midiData: ReturnType<
      (typeof MidiCanvas)["prototype"]["prepareData"]
    >["midiData"];
    width: number;
    height: number;
  }) => {
    const { min, avg } = midiInfo;
    const baseHeight = height - avg;

    this.raf = requestAnimationFrame(() => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      Object.entries(this.config.barStyle || {}).forEach(([key, value]) => {
        // @ts-ignore
        ctx[key] = value;
      });

      ctx.shadowBlur;

      const { currentTime } = audio;
      const inside = midiData.filter(
        (e) => e.end >= currentTime - 4000 && e.start <= currentTime + 4000
      );
      const highLight = inside.filter(
        (e) => e.start <= currentTime && e.end >= currentTime
      );

      inside.forEach((e) => {
        const x = (e.start - currentTime) * 50 + width / 2;
        const y = baseHeight - (e.note - min) * avg;
        const w = (e.end - e.start) * 50;
        ctx.fillRect(x, y, w, avg);
      });

      Object.entries(this.config.activeStyle || {}).forEach(([key, value]) => {
        // @ts-ignore
        ctx[key] = value;
      });

      highLight.forEach((e) => {
        const x = (e.start - currentTime) * 50 + width / 2;
        const y = baseHeight - (e.note - min) * avg;
        const w = (e.end - e.start) * 50;
        ctx.fillRect(x, y, w, avg);
      });

      this.drawFrame({ ctx, audio, midiInfo, midiData, width, height });
    });
  };

  private prepare = () => {
    if (this.ready) {
      return this.audio;
    }
    const { audio } = this.prepareAudio();
    const { midiInfo, midiData } = this.prepareData();
    const { ctx, rect } = this.prepareCanvas();

    audio.addEventListener("timeupdate", () => {
      if (audio.paused) {
        this.drawFrame({
          ctx,
          audio,
          midiInfo,
          midiData,
          width: rect.width,
          height: rect.height,
        });
      }
    });
    audio.addEventListener("play", () => {
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(() => {
        this.drawFrame({
          ctx,
          audio,
          midiInfo,
          midiData,
          width: rect.width,
          height: rect.height,
        });
      });
    });
    audio.addEventListener("pause", () => {
      cancelAnimationFrame(this.raf);
    });

    this.ready = true;

    return audio;
  };
}
