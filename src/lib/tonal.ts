const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const noteToMidi = (note: string): number => {
  const match = note.match(/([A-G])(#|b)?/);
  if (!match) throw new Error(`Invalid note format: ${note}`);

  let noteName = match[1];
  const accidental = match[2];

  if (accidental === 'b') {
    const noteIndex = noteOrder.indexOf(noteName);
    noteName = noteOrder[(noteIndex + 11) % 12];
  }
  if (accidental === '#') {
    noteName = noteName + '#';
  }

  return noteOrder.indexOf(noteName);
};

export const getPitchShiftInSemitones = (fromKey: string, toKey: string): number => {
  if (fromKey === toKey) return 0;

  const fromNote = fromKey.replace('m', '').replace('maj', '');
  const toNote = toKey.replace('m', '').replace('maj', '');

  const fromMidi = noteToMidi(fromNote);
  const toMidi = noteToMidi(toNote);

  let diff = toMidi - fromMidi;

  // Find the shortest path (up or down)
  if (Math.abs(diff) > 6) {
    if (diff > 0) {
      diff = diff - 12;
    } else {
      diff = diff + 12;
    }
  }

  return diff;
};