export const NEXORA_NOTES = [
  "Keep building. Every great product starts with a small idea.",
  "One more session, one more thing learned.",
  "Great developers stay curious. Keep asking why.",
  "Build it. Break it. Learn from it. Build it better.",
  "Your next line of code could solve a real problem.",
  "Small improvements compound into great engineering.",
  "Stay curious. The industry keeps changing.",
  "Good code solves problems. Great engineers understand them first.",
  "Every bug is another opportunity to understand the system.",
  "Keep shipping. Experience is built one project at a time.",
  "The best way to learn development is to build.",
  "Your ideas deserve a chance to become something real.",
  "Learn the fundamentals. Then build something meaningful with them.",
  "Technology changes fast. Curiosity keeps you moving.",
  "A difficult problem today can become your strongest skill tomorrow.",
  "Keep experimenting. That's how better solutions emerge.",
  "Don't just write code. Build things people can use.",
  "Every project teaches you something the tutorial couldn't.",
  "Stay consistent. Strong engineering is built over time.",
  "Keep creating. The industry needs people who solve problems.",
];

export function getRandomNexoraNote(previousIndex: number = -1): { note: string; index: number } {
  let nextIndex = Math.floor(Math.random() * NEXORA_NOTES.length);
  // Prevent immediate repetition
  if (nextIndex === previousIndex && NEXORA_NOTES.length > 1) {
    nextIndex = (nextIndex + 1) % NEXORA_NOTES.length;
  }
  return { note: NEXORA_NOTES[nextIndex], index: nextIndex };
}
