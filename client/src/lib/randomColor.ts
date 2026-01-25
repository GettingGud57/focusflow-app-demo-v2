const getRandomColor = () => {
  const hues = [
    '#d87878', // Light Red
    '#79a1cc', // Light Blue
    '#86d186', // Light Green
    '#e1bf81', // Light Orange
    '#9f86ba', // Light Purple
    '#95dbdb', // Light Cyan
    '#d697ac', // Lavender
    '#8c8a8a'  // Light Grey
  ];
  return hues[Math.floor(Math.random() * hues.length)];
};

export default getRandomColor;