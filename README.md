# Midi Canvas

### install

```bash
npm i --save midi-canvas
```

### usage

```javascript
midi.current = new MidiCanvas({
  midis: [{ src: "base64" }],
  audio: "url",
  width: "100%",
  height: 150,
  container: document.body,
});

midi.current.audio.ontimeupdate = () => {
  const time = midi.current?.audio?.currentTime || 0;
  setProgress(time);
};
midi.current.audio.onplay = () => setPlaying(true);
midi.current.audio.onpause = () => setPlaying(false);

midi.current.audio.play();
```
