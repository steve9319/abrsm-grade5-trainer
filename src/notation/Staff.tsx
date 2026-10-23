import { useEffect, useState } from 'react';
import {
  Accidental,
  Articulation,
  BarNote,
  Beam,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  Tuplet,
  Voice,
} from 'vexflow';
import { accidentalForLetter } from '../theory/key';
import { pitchName, vexAccidental, vexKey } from '../theory/pitch';
import type { NoteValue } from '../theory/rhythm';
import type { ArticulationName, NotationSpec, NotationSystem } from './types';

const DURATION: Record<NoteValue, string> = {
  breve: '1/2',
  semibreve: 'w',
  minim: 'h',
  crotchet: 'q',
  quaver: '8',
  semiquaver: '16',
  demisemiquaver: '32',
};

const ARTICULATION: Record<ArticulationName, string> = {
  staccato: 'a.',
  accent: 'a>',
  tenuto: 'a-',
  staccatissimo: 'av',
  marcato: 'a^',
  fermata: 'a@a',
};

function fallbackText(system: NotationSystem): string {
  const notes = system.events
    .map((event) => (event.kind === 'rest' ? 'rest' : (event.pitches ?? []).map((item) => pitchName(item, true)).join('+')))
    .join(' ');
  return `${system.clef} clef${system.timeSignature ? `, ${system.timeSignature}` : ''}: ${notes}`;
}

function drawSystem(element: HTMLDivElement, system: NotationSystem): void {
  element.innerHTML = '';
  const width =
    130 +
    (system.keySignature ? 90 : 0) +
    (system.timeSignature ? 40 : 0) +
    Math.max(system.events.length, 1) * 56;
  const height = 200;
  const renderer = new Renderer(element, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const context = renderer.getContext();
  context.setFont('Academico', 14);
  const stave = new Stave(8, 58, width - 16);
  stave.addClef(system.clef);
  if (system.keySignature) stave.addKeySignature(system.keySignature);
  if (system.timeSignature) stave.addTimeSignature(system.timeSignature);
  stave.setContext(context).draw();

  const notes: StaveNote[] = [];
  const tickables: (StaveNote | BarNote)[] = [];
  const tuplets: Tuplet[] = [];
  let tupletGroup: StaveNote[] = [];
  let tupletSpec: { notes: number; occupied: number; groupId: string } | null = null;

  const flushTuplet = () => {
    if (tupletGroup.length > 0 && tupletSpec) {
      tuplets.push(
        new Tuplet(tupletGroup, {
          numNotes: tupletSpec.notes,
          notesOccupied: tupletSpec.occupied,
          ratioed: false,
          bracketed: true,
        }),
      );
    }
    tupletGroup = [];
    tupletSpec = null;
  };

  for (const event of system.events) {
    const dots = event.dots ?? 0;
    const duration = `${DURATION[event.value]}${'d'.repeat(dots)}${event.kind === 'rest' ? 'r' : ''}`;
    const staveNote = new StaveNote({
      keys: event.kind === 'rest' ? ['b/4'] : (event.pitches ?? [pitchFallback()]).map((item) => vexKey(item)),
      duration,
      clef: system.clef,
      autoStem: true,
    });
    if (event.kind === 'note') {
      (event.pitches ?? []).forEach((item, index) => {
        const inSignature =
          system.signatureCount === undefined ? null : accidentalForLetter(item.letter, system.signatureCount);
        const printed = inSignature === null ? item.accidental : item.accidental === inSignature ? null : item.accidental;
        const glyph = printed === null ? null : printed === 0 ? 'n' : vexAccidental(printed);
        if (glyph) staveNote.addModifier(new Accidental(glyph), index);
      });
    }
    if (dots > 0) Dot.buildAndAttach([staveNote], { all: true });
    if (event.articulation) staveNote.addModifier(new Articulation(ARTICULATION[event.articulation]), 0);
    if (event.tuplet) {
      if (tupletSpec && tupletSpec.groupId !== event.tuplet.groupId) flushTuplet();
      tupletSpec = event.tuplet;
      tupletGroup.push(staveNote);
    } else {
      flushTuplet();
    }
    notes.push(staveNote);
    tickables.push(staveNote);
    if (event.barlineAfter) {
      flushTuplet();
      tickables.push(new BarNote());
    }
  }
  flushTuplet();

  if (tickables.length === 0) return;
  const voice = new Voice({ numBeats: 4, beatValue: 4 });
  voice.setMode(Voice.Mode.SOFT);
  voice.addTickables(tickables);
  const noteWidth = Math.max(40, width - stave.getNoteStartX() - 16);
  new Formatter().joinVoices([voice]).format([voice], noteWidth);
  voice.draw(context, stave);
  Beam.generateBeams(notes, { beamRests: false, maintainStemDirections: true }).forEach((beam) => {
    beam.setContext(context).draw();
  });
  tuplets.forEach((tuplet) => tuplet.setContext(context).draw());
}

function pitchFallback() {
  return { letter: 'B' as const, accidental: 0 as const, octave: 4 };
}

function SystemView({ system }: { system: NotationSystem }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!host) return;
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      try {
        drawSystem(host, system);
        setError(null);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Notation could not be drawn.');
      }
    };
    const fonts = document.fonts?.ready;
    if (fonts) void fonts.then(draw);
    else draw();
    return () => {
      cancelled = true;
    };
  }, [host, system]);

  return (
    <figure className="system">
      {system.label ? <figcaption>{system.label}</figcaption> : null}
      <div className="notation-scroll" ref={setHost} />
      {error ? <p className="notation-fallback">{fallbackText(system)}</p> : null}
    </figure>
  );
}

export function Notation({ spec }: { spec: NotationSpec }) {
  return (
    <div className="notation" aria-hidden="true">
      {spec.systems.map((system, index) => (
        <SystemView key={`${system.clef}-${system.timeSignature ?? ''}-${index}`} system={system} />
      ))}
    </div>
  );
}

export function notationDescription(spec: NotationSpec): string {
  return spec.systems.map(fallbackText).join('. ');
}
