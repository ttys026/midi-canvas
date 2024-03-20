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
      midi: "data:audio/midi;base64,TVRoZAAAAAYAAQACANxNVHJrAAAAEwD/UQMHoR8A/1gEBAIYCAD/LwBNVHJrAAAB6wDBAYZWkTdkgQyRNwAAkTpkgSiROgAAkTxkgTCRPAAAkThkaZE4ACyROGSBH5E4AACROmSBBJE6AACRPGSCEJE8AFiRN2SBFpE3AACROGSBHpE4AACROmSBH5E6AACRN2RykTcAPpE3ZIEEkTcAAJE4ZIEekTgAAJE6ZIFckToAgRaROGSBFZE4AACROmR8kToAGpE8ZIFKkTwAAJE6ZFiROgAkkThkgR6ROAAAkTpkgQSROgAAkTxkg1uRPACIZ5E4ZIEwkTgAAJE6ZHuROgAakTxkgSeRPAAAkThkgR+ROAARkThkgRaROAAAkTpkgRaROgAAkTxkgSeRPACBMJE3ZGmRNwA1kThkgQSROAAAkTpkgTmROgAAkTdkgiuRNwAAkThkgRaROAAAkTpkgTmROgCBJ5E4ZIEekTgAAJE6ZGqROgAjkTxkgSeRPAAAkThkc5E4ADSROGSBKJE4AACROmRYkToANJE8ZIIjkTwAgVORPGSBHpE8ABKRPGR7kTwAEpE8ZIEEkTwAEZE8ZIIjkTwAAJE4ZIFtkTgAAJE1ZIMEkTUAgUGRPGSBDZE8ABKRPGSBMJE8AACROmSBFZE6AACROGSBFpE4AACRP2SBMJE/AIEEkTxkh1GRPAAAkTpkiCCROgAA/y8A",
      audio: "",
      container: document.body,
      width: 200,
      height: 100,
    });
    expect(canvas.audio).toBeDefined();
    expect(canvas.audio.paused).toBeTruthy();
  });
});
