export const MODES = Object.freeze(['solo', 'family', 'classroom']);

export const SLIDE_KINDS = Object.freeze(['intro', 'question', 'clues', 'pause', 'final']);

export function isMode(value) {
  return MODES.includes(value);
}

export function isQuestionSlide(slide) {
  return slide?.kind === 'question' || slide?.kind === 'clues';
}
