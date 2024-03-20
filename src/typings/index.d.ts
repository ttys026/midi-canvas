declare module "midi-parser-js";

interface MidiParseResult {
  formatType: number;
  tracks: number;
  track: { event: MidiEvent[] }[];
  timeDivision: number;
}

interface MidiEvent {
  deltaTime: number;
  type: number;
  channel: number;
  data: [number, number];
}

interface MidiData {
  noteMap: { [key in number]: number };
  curTime: number;
  parsed: ParseData[];
}
