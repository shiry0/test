// Curated Mars Trek WMTS mosaics. Bounds and zoom limits follow the NASA service.
// A regional mosaic covers the selected site, not the entire named landform.
export const MARS_IMAGERY = {
  jezero: {
    wide: { key: 'ctx-jezero-wide', id: 'Jezero_CTX_BlockAdj_dd', bounds: [75.1537692, 15.9058484, 78.8717121, 19.4453003], maxLevel: 13, detail: 'CTX · Jezero region' },
    ctx: { key: 'ctx', id: 'JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0', bounds: [77.1604655, 18.2110274, 77.6991776, 18.7211945], maxLevel: 13, detail: 'CTX · 6 m/px' },
    hirise: { key: 'hirise', id: 'JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd', bounds: [77.2229331, 18.3067994, 77.583964, 18.669315], maxLevel: 17, detail: 'HiRISE · 25 cm/px' },
  },
  olympus: {
    ctx: { key: 'ctx-olympus', id: 'olympus_mons.eq', bounds: [-136, 12, -124, 24], maxLevel: 13, detail: 'CTX · Olympus Mons mosaic' },
  },
  valles: {
    ctx: { key: 'ctx-valles', id: 'Coprates_EMelas_Chasm_CTX_BlockAdj_dd', bounds: [-71.7280511, -13.3920212, -64.8714999, -10.0078622], maxLevel: 12, detail: 'CTX · Coprates / Melas' },
  },
  gale: {
    ctx: { key: 'ctx-gale', id: 'Gale_CTX_BlockAdj_dd', bounds: [135.1842593, -6.5732988, 139.2413012, -2.8077809], maxLevel: 12, detail: 'CTX · Gale Crater mosaic' },
    hirise: { key: 'hirise-gale', id: 'curiosity_hirise_mosaic', bounds: [137.1224669, -4.9254743, 137.7298129, -4.2489588], maxLevel: 16, detail: 'HiRISE · Curiosity site' },
  },
  elysium: {
    ctx: { key: 'ctx-elysium', id: 'InSightCTXMosaic_112917', bounds: [133.935732, 3.728413, 137.2761299, 5.0696168], maxLevel: 13, detail: 'CTX · InSight site mosaic' },
    hirise: { key: 'hirise-elysium', id: 'ESP_058005_1845_RED_spline_rect', bounds: [135.5687727, 4.3304903, 135.6963018, 4.6680121], maxLevel: 17, detail: 'HiRISE · InSight landing site' },
  },
  hellas: {
    ctx: { key: 'ctx-hellas', id: 'Hellas_Hellas2_CTX_BlockAdj_dd', bounds: [99.6625132, -41.8075384, 106.2773911, -37.3150663], maxLevel: 12, detail: 'CTX · Hellas eastern rim' },
  },
  cerberus: {
    ctx: { key: 'ctx-cerberus', id: 'Cerberus_CTX_BlockAdj_dd', bounds: [160.1914394, 8.2036983, 163.8111954, 11.7431501], maxLevel: 12, detail: 'CTX · Cerberus Fossae' },
  },
}

export const MARS_TILE_LAYERS = Object.fromEntries(
  Object.values(MARS_IMAGERY).flatMap(region => Object.values(region).map(layer => [layer.key, layer]))
)
