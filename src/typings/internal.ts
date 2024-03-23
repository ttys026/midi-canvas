export interface MidiParseResult {
  formatType: number;
  tracks: number;
  track: { event: MidiEvent[] }[];
  timeDivision: number;
}

export interface MidiEvent {
  deltaTime: number;
  type: number;
  channel: number;
  data: [number, number];
}

export interface ParseData {
  note: number;
  start: number;
  end: number;
}

export interface MidiData {
  noteMap: { [key in number]: number };
  curTime: number;
  parsed: ParseData[];
}
