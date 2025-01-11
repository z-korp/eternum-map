export const colors = [
  { border: '#FF4444', background: '#FFE4E1' }, // Red tones
  { border: '#44FF44', background: '#DFFFDF' }, // Green tones
  { border: '#4444FF', background: '#E1E1FF' }, // Blue tones
  { border: '#FFD700', background: '#FFF8DC' }, // Gold tones
  { border: '#9400D3', background: '#E6E6FA' }, // Violet tones
  { border: '#00CED1', background: '#DFF9FA' }, // Turquoise tones
  { border: '#FF69B4', background: '#FFDDE6' }, // Pink tones
  { border: '#8B4513', background: '#F5DEB3' }, // Brown tones
  { border: '#FF8C00', background: '#FFE5B4' }, // Orange tones
  { border: '#20B2AA', background: '#B2DFDF' }, // Light teal
  { border: '#8A2BE2', background: '#D9B3F7' }, // Purple tones
  { border: '#7FFF00', background: '#E0FFD1' }, // Lime tones
  { border: '#DC143C', background: '#FFD6DC' }, // Crimson tones
  { border: '#1E90FF', background: '#D7EBFF' }, // Dodger blue
  { border: '#228B22', background: '#D4EAD4' }, // Forest green
  { border: '#B22222', background: '#FFD6D6' }, // Firebrick
  { border: '#DAA520', background: '#FFF6D2' }, // Goldenrod
  { border: '#2E8B57', background: '#C9E6DC' }, // Sea green
  { border: '#FF4500', background: '#FFD6BF' }, // Orange red
  { border: '#6A5ACD', background: '#D8D7F4' }, // Slate blue
  { border: '#4682B4', background: '#C8E1F3' }, // Steel blue
  { border: '#FF6347', background: '#FFD9D3' }, // Tomato
  { border: '#32CD32', background: '#D0F7D0' }, // Lime green
  { border: '#8B0000', background: '#F4CCCC' }, // Dark red
  { border: '#FFB6C1', background: '#FFF2F4' }, // Light pink
  { border: '#4682B4', background: '#CDEFF5' }, // Teal tones
  { border: '#7B68EE', background: '#E6E4F9' }, // Medium slate blue
  { border: '#708090', background: '#E4E4E5' }, // Slate gray
];

export const getPlayerColors = (playerId: number) => {
  // Calculate index using modulo
  const index = playerId % colors.length; // Wraps around if playerId > 28
  return colors[index];
};
