// Collection localities from the NASA PDS Mars 2020 Initial Reports, Volume 1.
// Coordinates locate the reported sampling area, not a survey of an individual
// visible stone in this game's illustrative terrain. Paired tubes share a site.
export const SAMPLE_REPORT_URL = 'https://pds-geosciences.wustl.edu/missions/mars2020/Mars%202020%20Initial%20Reports%20Volume%201%20Release%202.2.pdf'
export const SAMPLE_CATALOG_URL = 'https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/'

export const PERSEVERANCE_SAMPLE_SITES = [
  {
    id: 'sample-rochette', name: 'Rochette', latitude: 18.43074132, longitude: 77.44436502,
    samples: ['Montdenier', 'Montagnac'],
    fact: 'Perseverance cored this fine-grained mafic rock at Artuby Ridge. The initial reports describe likely igneous material and minerals that indicate later alteration by water.',
  },
  {
    id: 'sample-brac', name: 'Brac', latitude: 18.43397, longitude: 77.44301,
    samples: ['Salette', 'Coulettes'],
    fact: 'Salette and Coulettes were collected from the Brac rock area on the Jezero crater floor. The reports describe olivine and pyroxene alongside signs of alteration.',
  },
  {
    id: 'sample-issole', name: 'Issole', latitude: 18.43264, longitude: 77.44133,
    samples: ['Robine', 'Malay'],
    fact: 'Robine and Malay were cored at the Issole rock site. They record another part of the crater-floor geology examined by Perseverance.',
  },
  {
    id: 'sample-sid', name: 'Sid', latitude: 18.44386406, longitude: 77.45242176,
    samples: ['Hahonih', 'Atsah'],
    fact: 'Perseverance collected Hahonih and Atsah in the Sid area, east of its landing site. The initial report describes Hahonih as likely basaltic andesite.',
  },
]
