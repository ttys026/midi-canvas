import MidiCanvas from "../src";

describe("MidiCanvas", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should work", () => {
    const canvas = new MidiCanvas({
      midi: "data:audio/midi;base64,TVRoZAAAAAYAAQACANxNVHJrAAAAEwD/UQMHoR8A/1gEBAIYCAD/LwBNVHJrAAABYwDBAQCRP2SBU5E/AACRNmRYkTYAEpE/ZFiRPwAAkT1kcpE9AACRO2SCK5E7AACRQGSBXJFAABKRQGSBQpFAABGRQGR7kUAAgXeRP2SBQZE/AACRNmRqkTYAEpE/ZGCRPwAAkT1kc5E9AACRO2RpkTsAAJE6ZFCROgAakTtkT5E7AACRPWSBMJE9ADWRPWRykT0AEpE9ZD6RPQARkT1kgRaRPQCBDZE/ZCORPwAAkT1kI5E9AACRP2SBXJE/AACRNmRqkTYAAJE/ZGCRPwAAkT1kUJE9AACRO2RykTsAAJE6ZGGROgAAkTtkaZE7AACRRGSBOZFEABKRRGSBQZFEABKRRGSBBJFEADWRQmRpkUIAAJFAZGGRQAAAkT9kgUuRPwAAkT1kYJE9AACRO2SBBJE7AACROGSBVJE4AACROmSBHpE6AACRO2SBU5E7ABKRO2SBOZE7ABGRO2SBMJE7AAD/LwA=",
      audio: "",
      container: document.body,
      width: 200,
      height: 100,
    });
    expect(canvas.audio).toBeDefined();
    expect(canvas.audio.paused).toBeTruthy();
  });
});
