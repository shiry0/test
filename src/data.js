export const worlds = {
  earth: {
    name: 'Earth', number: '03', subtitle: 'One planet. Endless possibility.',
    description: 'Trace the curve of a coastline. Follow a mountain range. Rediscover the extraordinary world we call home.',
    texture: '/textures/earth.jpg', color: '#97c7e7', atmosphere: '#5599ee',
    diameter: '12,742', gravity: '9.81', day: '23.9', dayUnit: 'hours', distance: '149.6M',
    tag: 'OUR HOME WORLD', type: 'Terrestrial planet', temperature: '15°C',
    feature: 'The Himalayas', featureText: 'Where Earth reaches for the sky.',
    note: 'Liquid oceans cover about 71% of Earth’s surface. Its atmosphere and magnetic field help protect a remarkable diversity of life.',
  },
  moon: {
    name: 'Moon', number: '01', subtitle: 'A familiar face. An alien world.',
    description: 'Travel across ancient impact craters and quiet seas of basalt. Our nearest neighbor holds a history written in stone.',
    texture: '/textures/moon.jpg', color: '#d8d5ce', atmosphere: null,
    diameter: '3,474', gravity: '1.62', day: '27.3', dayUnit: 'Earth days', distance: '384,400',
    tag: 'OUR NEAREST NEIGHBOR', type: 'Natural satellite', temperature: '−23°C',
    feature: 'Sea of Tranquility', featureText: 'One small step, a whole new perspective.',
    note: 'The Moon is tidally locked to Earth: the same hemisphere always faces us. The lunar maria are broad plains of ancient volcanic basalt.',
  },
  mars: {
    name: 'Mars', number: '04', subtitle: 'The next horizon is red.',
    description: 'Discover a world of rust-colored deserts, towering volcanoes, and ancient riverbeds. Imagine what comes next.',
    texture: '/textures/mars.jpg', color: '#eda179', atmosphere: '#c5734d',
    diameter: '6,779', gravity: '3.71', day: '24.6', dayUnit: 'hours', distance: '227.9M',
    tag: 'THE RED PLANET', type: 'Terrestrial planet', temperature: '−65°C',
    feature: 'Olympus Mons', featureText: 'A volcano on an entirely different scale.',
    note: 'Mars has a thin atmosphere, largely carbon dioxide. Its surface preserves evidence of ancient rivers, deltas, and lakes.',
  },
}

export const destinations = {
  himalayas: { name: 'The Himalayas', region: 'NEPAL · EARTH', center: [86.925, 27.988], zoom: 11.6, bearing: -24, pitch: 72, label: '27.9881° N / 86.9250° E', description: 'Fly over the highest mountain range on Earth. Drag to explore, or hold the right mouse button to tilt the terrain.' },
  alps: { name: 'The Alps', region: 'SWITZERLAND · EARTH', center: [7.6586, 45.9763], zoom: 12.3, bearing: 35, pitch: 70, label: '45.9763° N / 7.6586° E', description: 'Explore the ridgelines around the Matterhorn, where steep rock faces rise above deep glacial valleys.' },
  canyon: { name: 'Grand Canyon', region: 'ARIZONA · EARTH', center: [-112.112, 36.096], zoom: 12.2, bearing: 20, pitch: 68, label: '36.0960° N / 112.1120° W', description: 'Follow the Colorado River through layered rock and a landscape shaped over millions of years.' },
}
