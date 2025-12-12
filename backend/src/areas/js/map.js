// Map configuration
const imageWidth = 14453;
const imageHeight = 13800;

const imageBounds = [
  [0, 0],
  [imageHeight, imageWidth]
];

const mapMinZoom = 0;
const mapMaxZoom = 5;

const mapMaxResolution = 2.0;
const mapMinResolution = Math.pow(2, mapMaxZoom) * mapMaxResolution;

const mapExtent = [0, imageHeight, imageWidth, 0];
const tileExtent = [0, imageHeight, imageWidth, 0];

// Create custom CRS
const crs = L.CRS.Simple;

crs.transformation = new L.Transformation(1, -tileExtent[0], -1, tileExtent[3] + imageHeight);
crs.scale = function (zoom) {
  return Math.pow(2, zoom) / mapMinResolution;
};
crs.zoom = function (scale) {
  return Math.log(scale * mapMinResolution) / Math.LN2;
};

// Initialize map
const map = L.map('map', {
  crs: crs,
  minZoom: mapMinZoom,
  maxZoom: mapMaxZoom,
  zoomSnap: 0.25,
  attributionControl: false,
  zoomControl: true
});

// Add tile layer
const tileLayer = L.tileLayer('https://prod.24flight.org/ptfs/regular/{z}/{x}/{y}.png', {
  minZoom: mapMinZoom,
  maxZoom: mapMaxZoom,
  tileSize: L.point(256, 512),
  noWrap: true,
  tms: false,
  nativeZooms: [1, 2, 3, 4, 5]
}).addTo(map);

// Fit map bounds
map.fitBounds([
  crs.unproject(L.point(mapExtent[2], mapExtent[3])),
  crs.unproject(L.point(mapExtent[0], mapExtent[1]))
]);

// Handle window resize
window.addEventListener('resize', () => {
  map.invalidateSize(false);
});
