export const confirmationMessages = [
  "You're checked in. Keep building!",
  "Attendance marked successfully. Now get back to building.",
  "You're officially checked in for this session.",
  "You're in. Time to build something great.",
  "Awesome! Your attendance is recorded.",
  "Got it! Ready to hack?",
];

export const getRandomNexoraNote = (prevIndex?: number): { note: string, index: number } => {
  let randomIndex = Math.floor(Math.random() * confirmationMessages.length);
  // Avoid repeating the same message if possible
  if (prevIndex !== undefined && prevIndex === randomIndex && confirmationMessages.length > 1) {
    randomIndex = (randomIndex + 1) % confirmationMessages.length;
  }
  return {
    note: confirmationMessages[randomIndex],
    index: randomIndex
  };
};

export const getRandomConfirmationMessage = () => {
  return getRandomNexoraNote().note;
};
