export function createAvatarData(seed: string) {
  const palette = [
    ['#155e75', '#67e8f9'],
    ['#9a3412', '#fdba74'],
    ['#14532d', '#86efac'],
    ['#312e81', '#a5b4fc'],
    ['#7c2d12', '#fca5a5'],
  ];

  const index = seed
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0) % palette.length;
  const [start, end] = palette[index];

  return `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
}
