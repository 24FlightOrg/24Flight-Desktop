/*
 Websocket / ATIS / Units reference (developer notes)

 Event types sent/received via the 24Data websocket:
    - "ACFT_DATA": AircraftData from the ATC 24 main server.
    - "EVENT_ACFT_DATA": AircraftData from the ATC 24 event server.
    - "FLIGHT_PLAN": Stream of submitted FlightPlan objects for ATC 24 main server.
    - "EVENT_FLIGHT_PLAN": Stream of submitted FlightPlan objects for the ATC 24 event server.
    - "CONTROLLERS": Position[] claimed by controllers in #online-atc.
    - "ATIS": ATIS object for an airport when it's been updated.

 ATIS payload notes (common fields the frontend expects):
    - `airport` (ICAO string), `letter` (designator), `content` (string),
        `lines` (array of strings), `editor` (username), and optional fields
        like `chart`, `chart_link`, `chart_url`, `link`, or `charts`.
    - The frontend `beautifyAtis()` looks for several of these keys and will
        render a "View Chart" link when `chart`, `chart_link`, `chart_url`,
        `chartlink`, `link` or `charts[0]` is present.

 Example ATIS object:
    {
        "airport": "ISAU",
        "letter": "T",
        "content": "ISAU ATIS INFO T TIME 1922Z\n...",
        "lines": ["ISAU ATIS INFO T TIME 1922Z", "DEP RWY 26 ARR RWY 26", "..."],
        "editor": "PTC_Helper"
    }

 Aircraft / game units reference:
    - In-game approximate: 1 knot = 0.5442765 studs/sec (note: not exact)
    - Alternate conversion used in parts of the codebase: 1 knot = 0.918650795 studs/sec
        (1 stud = 0.56 metres — use with caution; values in the repo contain approximations)
    - Conversion used to convert game knots to real knots: real_knots = game_knots * 0.592172785
    - Approximate: 3307.14286 studs = 1 Nautical Mile

 Additional notes:
    - `ACFT_DATA` messages from 24Data contain fields like `heading`, `altitude`,
        `playerName`, `position:{x,y}`, `speed`, `groundSpeed`, and `isOnGround`.
    - The server code occasionally applies a linear slow-down to aircraft
        dependent on altitude above 2,000 ft to increase cruise time; this
        affects reported `groundSpeed` but not the `speed` field uniformly.

 These comments are for developer convenience and should help when mapping
 websocket payloads to UI behaviors (e.g. showing chart links from ATIS).
*/

const airportList = [
  // Rockford
  {
    name: "IRFD",
    airport: "Greater Rockford Intl",
    island: "Greater Rockford",
    airspace: "Greater Rockford",
    px: 6844.02, py: 9947, size: 32, type: "aprt.serv.twr",
    runways: [
      {
        name: "25L/07R",
        aliases: ["25L", "07R"],
        // length: 2500,
        heading: "25_",
        elevation: 0,
        endpoints: [{ x: 1792.86, y: 2651.78 }, { x: 1868.15, y: 2619.48 }],
        ils: {
          sides: {
            "25L": {
              loc: {
                freq: 110.30,
                // areaDistance: how far back the LOC intercept area extends (set per runway)
                areaDistance: 3000,
                // coords: list of map points (x/y) to navigate to before the final lineup
                coords: [ { x: 1600, y: 2680 }, { x: 1700, y: 2660 } ]
              },
              gs: {
                // angle: 3.0, // glideslope angle kept as comment; use waypoints below instead
                decisionHeight: 200,
                selectable: true,
                // waypoints: array of points with altitude to define the glideslope path
                waypoints: [ { x: 1700, y: 2660, alt: 1200 }, { x: 1800, y: 2650, alt: 600 } ]
              }
            },
            "07R": {
              loc: {
                freq: 110.30,
                areaDistance: 3000,
                coords: [ { x: 1900, y: 2600 }, { x: 1850, y: 2620 } ]
              },
              gs: {
                decisionHeight: 200,
                selectable: false,
                waypoints: [ { x: 1850, y: 2620, alt: 1200 }, { x: 1790, y: 2630, alt: 600 } ]
              }
            }
          }
        }
      },
      {
        name: "25C/07C",
        aliases: ["25C", "07C"],
        // length: 2400,
        heading: "25_",
        elevation: 0,
        endpoints: [{ x: null, y: null }, { x: null, y: null }],
        ils: {
          sides: {
            "25C": {
              loc: { freq: 110.35, areaDistance: 3000, coords: [] },
              gs: { decisionHeight: 200, selectable: true, waypoints: [] }
            },
            "07C": {
              loc: { freq: 110.35, areaDistance: 3000, coords: [] },
              gs: { decisionHeight: 200, selectable: false, waypoints: [] }
            }
          }
        }
      },
      {
        name: "25R/07L",
        aliases: ["25R", "07L"],
        // length: 2300,
        heading: "25_",
        elevation: 0,
        endpoints: [{ x: null, y: null }, { x: null, y: null }],
        ils: {
          sides: {
            "25R": { loc: { freq: 110.40, areaDistance: 3000, coords: [] }, gs: { decisionHeight: 200, selectable: true, waypoints: [] } },
            "07L": { loc: { freq: 110.40, areaDistance: 3000, coords: [] }, gs: { decisionHeight: 200, selectable: false, waypoints: [] } }
          }
        }
      }
    ],
    taxiways: [
      { name: "A", nodes: [{ x: 6844, y: 9947 }, { x: 6900, y: 9950 }] },
      { name: "B", nodes: [{ x: 6788, y: 9944 }, { x: 6844, y: 9947 }] }
    ]
  },
  {
    name: "IMLR", airport: "Mellor Airport", island: "Rockford", airspace: "Greater Rockford", px: 4510.23, py: 9082.34, size: 32, type: "aprt.serv.twr",
    runways: [
      {
        name: "18/36",
        aliases: ["18", "36"],
        length: 1800,
        width: 30,
        heading: 180,
        elevation: 420,
        endpoints: [
          { x: null, y: null },
          { x: null, y: null }
        ],
        ils: {
          sides: {
            "18": {
              glideslope: 3.0,
              decisionHeight: 250,
              selectable: true,
              locFreq: 109.80,
              ilsCoord: { x: null, y: null }
            },
            "36": {
              glideslope: 3.0,
              decisionHeight: 250,
              selectable: false,
              locFreq: 109.80,
              ilsCoord: { x: null, y: null }
            }
          }
        }
      }
    ],
    taxiways: [
      { name: "A", nodes: [{ x: 4510, y: 9082 }, { x: 4510, y: 9182 }] }
    ]
  },
  {
    name: "ITRC", airport: "Training Centre", island: "Rockford", px: 7040.13, py: 11408.45, size: 32, type: "aprt",
    runways: [
      {
        name: "09/27",
        aliases: ["09", "27"],
        length: 1200,
        width: 25,
        heading: 90,
        elevation: 710,
        endpoints: [{ x: null, y: null }, { x: null, y: null }],
        ils: {
          sides: {
            "09": { glideslope: 3.0, decisionHeight: 250, selectable: false, locFreq: 111.10, ilsCoord: { x: null, y: null } },
            "27": { glideslope: 3.0, decisionHeight: 250, selectable: false, locFreq: 111.10, ilsCoord: { x: null, y: null } }
          }
        }
      }
    ],
    taxiways: []
  },
  {
    name: "IGAR", airport: "Air Base Garry", island: "Rockford", px: 5001.56, py: 10434.38, size: 32, type: "aprt.mltry.twr",
    runways: [
      {
        name: "09/27",
        aliases: ["09", "27"],
        length: 3200,
        width: 45,
        heading: 90,
        elevation: 680,
        endpoints: [{ x: null, y: null }, { x: null, y: null }],
        ils: {
          sides: {
            "09": { glideslope: 3.0, decisionHeight: 200, selectable: true, locFreq: 112.50, ilsCoord: { x: null, y: null } },
            "27": { glideslope: 3.0, decisionHeight: 200, selectable: false, locFreq: 112.50, ilsCoord: { x: null, y: null } }
          }
        }
      }
    ],
    taxiways: []
  },
  {
    name: "IBLT", airport: "Boltic Airfield", island: "Rockford", px: 5698.83, py: 9500.39, size: 32, type: "aprt.priv.twr",
    runways: [
      {
        name: "06/24",
        aliases: ["06", "24"],
        length: 900,
        width: 20,
        heading: 60,
        elevation: 450,
        endpoints: [{ x: null, y: null }, { x: null, y: null }],
        ils: { sides: {} }
      }
    ],
    taxiways: []
  },
  {
    name: "OWO", airport: "Waterloo", island: "greater rockford", px: 6375, py: 8871.88, size: 32, type: "aprt.seabase",
    runways: [],
    taxiways: []
  },
  {
    name: "RFDCG", airport: "Rockford Coast Guard", island: "greater rockford", px: 5574.54, py: 10166.87, size: 32, type: "aprt.seabase",
    runways: [],
    taxiways: []
  },
  {
    name: "RFDRB", airport: "Rockford Roadbase", island: "greater rockford", px: 6103.77, py: 9981.25, size: 32, type: "aprt.priv",
    runways: [],
    taxiways: []
  },

  // Grindavik
  { name: "IGRV", airport: "Grindavik Airport", island: "Grindavik", px: 876.56, py: 6415.23, size: 32, type: "aprt.serv.twr" },
  { name: "TVO", airport: "Grindavik Seabase", island: "Grindavik", px: 1031.93, py: 6777.18, size: 32, type: "aprt.seabase" },
  { name: "GRVCG", airport: "Grindavik Coast Guard", island: "Grindavik", px: 1009.63, py: 6267.56, size: 32, type: "aprt.seabase" },

  // Sauthemptona
  { name: "ISAU", airport: "Sauthemptona Airport", island: "Sauthemptona", px: 622.66, py: 10986.33, size: 32, type: "aprt.serv.twr" },
  { name: "OILRIG", airport: "North Sea Oil Rig", island: "Sauthemptona", px: 1370.56, py: 9110.64, size: 32, type: "aprt.seabase" },

  // Cyprus
  { name: "IHEN", airport: "Henstridge Airfield", island: "Cyprus", px: 9957.5, py: 13120.7, size: 32, type: "aprt.priv" },
  { name: "IIAB", airport: "Island International Air Base", island: "Cyprus", px: 10857.81, py: 12953.13, size: 32, type: "aprt.mltry.twr" },
  { name: "ILAR", airport: "Larnaca International Airport", island: "Cyprus", px: 10651.9, py: 11682.73, size: 32, type: "aprt.serv.twr" },
  { name: "IPAP", airport: "Paphos International Airport", island: "Cyprus", px: 12044.53, py: 12087.11, size: 32, type: "aprt.serv.twr" },
  { name: "IBAR", airport: "Barra Airport", island: "Cyprus", px: 11507.42, py: 12550.39, size: 32, type: "aprt.serv.twr" },

  // Skopelos
  { name: "ISKP", airport: "Skopelos Airport", island: "Skopelos", px: 11196.59, py: 8865.9, size: 32, type: "aprt.serv.twr" },

  // Izolirani
  { name: "IZOL", airport: "Izolirani International Airport", island: "Izolirani", px: 14189.06, py: 7529.69, size: 32, type: "aprt.serv.twr" },
  { name: "ISCM", airport: "RAF Scampton", island: "Izolirani", px: 12846.88, py: 6234.38, size: 32, type: "aprt.mltry.twr" },
  { name: "IZOCG", airport: "Izolirani Coast Guard", island: "Izolirani", px: 13182.29, py: 7488.36, size: 32, type: "aprt.seabase" },
  { name: "IJAF", airport: "Al Najaf Airfield", island: "Izolirani", px: 14351.56, py: 6953.13, size: 32, type: "aprt.priv.twr" },
  { name: "IZORB", airport: "Izolirani Roadbase", island: "Izolirani", px: 13669.53, py: 6791.02, size: 32, type: "aprt.priv" },

  // Saint Barts
  { name: "IBTH", airport: "Saint Barthelemy Airport", island: "Saint Barts", px: 8238.9, py: 6231.38, size: 32, type: "aprt.serv.twr" },

  // Perth
  { name: "IPPH", airport: "Perth International Airport", island: "Perth", px: 9914.96, py: 3802.91, size: 32, type: "aprt.serv.twr" },
  { name: "ILKL", airport: "Lukla Airport", island: "Perth", px: 10748.02, py: 4428.26, size: 32, type: "aprt.serv.twr" },
  { name: "SHV", airport: "Perth Seabase", island: "Perth", px: 10942.48, py: 3763.13, size: 32, type: "aprt.seabase" },
  { name: "PERCG", airport: "Perth Coast Guard", island: "Perth", px: 10449.78, py: 4719.87, size: 32, type: "aprt.seabase" },

  // Orenji
  { name: "ITKO", airport: "Tokyo International Airport", island: "Orenji", px: 6266.73, py: 2127.95, size: 32, type: "aprt.serv.twr" },
  { name: "ORNCG", airport: "Tokyo Coast Guard", island: "Orenji", px: 5705.74, py: 1533.54, size: 32, type: "aprt.seabase" },
  { name: "ORNRB", airport: "Tokyo Roadbase", island: "Orenji", px: 5907.66, py: 967.85, size: 32, type: "aprt.priv" },
  { name: "IDCS", airport: "Saba Airport", island: "Orenji", px: 6651.22, py: 190.03, size: 32, type: "aprt.priv" },
  { name: "IBRD", airport: "Bird Island Airfield", island: "Orenji", px: 7145.6, py: 1015.5, size: 32, type: "aprt.twr" }
]

//EACH IS NOT MATHEMATICALL ACCURATE, ONLY USED BY INKSCAPE! + NOT ALL MAY BE ACCURATE - NEED TO CHECK IF THE SLOPES ACTUALLY LIKE MATH RIGHT FOR COORDS
const SECTOR_DEFS = [
  {
    id: "Rockford", //IRCC
    centerline: [
      { px: 3875.07, py: 14342.69 }, //inf
      { px: 3875.07, py: 11538.69 },
      { px: 2773.59, py: 10409.15 },
      { px: 2773.59, py: 7543.93 },
      { px: 3938.98, py: 6541 },
      { px: 8409.64, py: 7839.02 },
      { px: 9015.79, py: 9000.79 },
      { px: 9280.26, py: 9961.56 },
      { px: 9467.95, py: 11081.08 },
      { px: 7740.79, py: 11983.03 },
      { px: 7740.79, py: 14342.69 }, //inf
    ],
    width: 400,
    color: "#000000" // black
  },
  {
    id: "SAUTHEMPTONA", //ISCC
    centerline: [
      { px: 3875.07, py: 14342.69 }, //inf
      { px: 3875.07, py: 11538.69 },
      { px: 2773.59, py: 10409.15 },
      { px: 2773.59, py: 9882.96 },
      { px: 735.87, py: 9071.9 },
      { px: -1260.51, py: 8863.33 }, //inf
    ],
    width: 400,
    color: "#000000" // black
  },
  {
    id: "GRINDAVIK", //IGCC
    centerline: [
      { px: 3124.38, py: -107.58 }, //inf
      { px: 4607.06, py: 4953.17 },
      { px: 3938.98, py: 6541 },
      { px: 2773.59, py: 7543.93 },
      { px: 2773.59, py: 9882.96 },
      { px: 735.87, py: 9071.9 },
      { px: -1260.51, py: 8863.33 }, //inf
    ],
    width: 400,
    color: "#000000" // black
  },
  {
    id: "SAINT BARTHELEMY", //ISCC
    centerline: [
      { px: 3938.98, py: 6541 },
      { px: 8409.64, py: 7839.02 },
      { px: 9015.79, py: 9000.79 },
      { px: 9280.26, py: 9961.56 },
      { px: 9340.4, py: 10343.66 },
      { px: 12336.16, py: 9494.75 },
      { px: 12143.22, py: 9307.66 },
      { px: 12097.62, py: 8374.56 },
      { px: 12393.46, py: 8026.1 },
      { px: 12443.74, py: 7634.39 },
      { px: 11405.39, py: 7542.01 },
      { px: 10394.82, py: 7907.73 },
      { px: 10672.63, py: 6836.17 },
      { px: 9849.05, py: 6115.46 },
      { px: 9398.87, py: 4688.91 },
      { px: 8706.64, py: 4354.49 },
      { px: 4856.12, py: 4354.49 },
    ],
    width: 400,
    color: "#000000" // black
  },
  {
    id: "ORENJI", //IOCC
    centerline: [
      { px: 3124.38, py: -107.58 }, //inf
      { px: 4607.06, py: 4953.17 },
      { px: 4856.12, py: 4354.49 },
      { px: 8706.64, py: 4354.49 },
      { px: 8706.64, py: -107.58 }, //inf
    ],
    width: 400,
    color: "#000000" // black
  },
  {
    id: "PERTH", //IPCC
    centerline: [
      { px: 8706.64, py: -107.58 }, //inf
      { px: 8706.64, py: 4354.49 },
      { px: 9398.87, py: 4688.91 },
      { px: 9849.05, py: 6115.46 },
      { px: 10674.28, py: 5683.58 },
      { px: 11843.41, py: 5683.58 },
      { px: 13103.49, py: 4799.71 },
      { px: 14314.79, py: 4225.07 },
      { px: 16229.71, py: 4274.67 }, //inf
    ],
    width: 400,
    color: "#000000" // black
  },
  {
    id: "CYPRUS", // ICCC
    centerline: [
      { px: 16242.11, py: 10743.74 }, //inf
      { px: 12938.35, py: 10045.49 },
      { px: 12336.16, py: 9494.75 },
      { px: 9340.4, py: 10343.66 },
      { px: 9467.95, py: 11081.08 },
      { px: 7740.79, py: 11983.03 },
      { px: 7740.79, py: 14342.69 }, //inf
    ],
    width: 400,
    color: "#000000" // black
  },
  {
    id: "IZOLIRANI", //IZCC
    centerline: [
      { px: 16242.11, py: 10743.74 }, //inf
      { px: 12938.35, py: 10045.49 },
      { px: 12143.22, py: 9307.66 },
      { px: 12097.62, py: 8374.56 },
      { px: 12393.46, py: 8026.1 },
      { px: 12443.74, py: 7634.39 },
      { px: 11405.39, py: 7542.01 },
      { px: 10394.82, py: 7907.73 },
      { px: 10672.63, py: 6836.17 },
      { px: 9849.05, py: 6115.46 },
      { px: 10674.28, py: 5683.58 },
      { px: 11843.41, py: 5683.58 },
      { px: 13103.49, py: 4799.71 },
      { px: 14314.79, py: 4225.07 },
      { px: 16229.71, py: 4274.67 }, //inf
    ],
    width: 400,
    color: "#000000" // black
  }
];

window.SECTOR_DEFS = SECTOR_DEFS;

const AIRLINE_MAP = {
  'Aer Lingus': { icao: 'EIN', radio: 'Shamrock', ingame: 'Shamrock' },
  'Aeroflot': { icao: 'AFL', radio: 'Aeroflot', ingame: 'AEROFLOT' },
  'Air Canada': { icao: 'ACA', radio: 'Air Canada', ingame: 'Air Canadian' },
  'Air Baltic': { icao: 'BTI', radio: 'Air Baltic', ingame: 'AirBalistic' },
  'Air New Zealand': { icao: 'ANZ', radio: 'New Zealand', ingame: 'OldZealand' },
  'American Airlines': { icao: 'AAL', radio: 'American', ingame: 'Americano' },
  'Antonov Airlines': { icao: 'ADB', radio: 'Antonov Bureau', ingame: 'Antonov Bureau' },
  'Azul': { icao: 'AZU', radio: 'Azul', ingame: 'Azol' },
  'Delta': { icao: 'DAL', radio: 'Delta', ingame: 'Belta' },
  'Air France': { icao: 'AFR', radio: 'Air France', ingame: 'Bepsi' },
  'Yeti Airlines': { icao: 'NYT', radio: 'Yeti Airlines', ingame: 'BetiAirlines' },
  'Wizz Air': { icao: 'WZZ', radio: 'Wizz Air', ingame: 'BizzAir' },
  'Swiss': { icao: 'SWR', radio: 'Swiss', ingame: 'Bliss' },
  'British Airways': { icao: 'BAW', radio: 'Speedbird', ingame: 'Speedbird' },
  'Ryanair': { icao: 'RYR', radio: 'Ryanair', ingame: 'Byanair' },
  'Cathay Pacific': { icao: 'CPA', radio: 'Cathay', ingame: 'Cafey' },
  'Cebu Pacific': { icao: 'CEB', radio: 'Cebu Air', ingame: 'CEDU AIR' },
  'Pan Am': { icao: 'PAA', radio: 'Clipper', ingame: 'Clipper' },
  'Condor': { icao: 'CFG', radio: 'Condor', ingame: 'Doncor' },
  'Emirates': { icao: 'UAE', radio: 'Emirates', ingame: 'Emarates' },
  'Flybe': { icao: 'BEE', radio: 'Jersey', ingame: 'Flybee' },
  'EasyJet': { icao: 'EZY', radio: 'Easy', ingame: 'Hard' },
  'Iberia': { icao: 'IBE', radio: 'Iberia', ingame: 'Ideria' },
  'JetBlue': { icao: 'JBU', radio: 'Jet Blue', ingame: 'JetBloo' },
  'Jet2': { icao: 'EXS', radio: 'Channex', ingame: 'Channex' },
  'KLM': { icao: 'KLM', radio: 'KLM', ingame: 'KLN' },
  'Korean Air': { icao: 'KAL', radio: 'Korean Air', ingame: 'KoreenAir' },
  'Korean Air Cargo': { icao: 'KAL', radio: 'Korean Air', ingame: 'KoreenAir' },
  'LOT Polish Airlines': { icao: 'LOT', radio: 'LOT', ingame: 'PolKot' },
  'Lufthansa': { icao: 'DLH', radio: 'Lufthansa', ingame: 'Lifthansa' },
  'TUI': { icao: 'TOM', radio: 'Tomjet', ingame: 'Lui' },
  'Southwest': { icao: 'SWA', radio: 'Southwest', ingame: 'Northeast' },
  'Qantas': { icao: 'QFA', radio: 'Qantas', ingame: 'Oantas' },
  'Qatar': { icao: 'QTR', radio: 'Qatari', ingame: 'Oatar' },
  'United Airlines': { icao: 'UAL', radio: 'United', ingame: 'Reunited' },
  'Scandinavian Airlines': { icao: 'SAS', radio: 'Scandinavian', ingame: 'Scandialien' },
  'Singapore Airlines': { icao: 'SIA', radio: 'Singapore', ingame: 'Singadoor' },
  'Spirit': { icao: 'NKS', radio: 'Spirit Wings', ingame: 'Sprit Wings' },
  'UPS': { icao: 'UPS', radio: 'UPS', ingame: 'Sus' },
  'FedEx': { icao: 'FDX', radio: 'FedEx', ingame: 'Tedex' },
  'Thai Airways': { icao: 'THA', radio: 'Thai', ingame: 'Thay' },
  'Turkish Airlines': { icao: 'THY', radio: 'Turkish', ingame: 'Turkey' },
  'DHL': { icao: 'DHK', radio: 'DHL', ingame: 'Worldstar' },
};


// Expose AIRLINE_MAP globally for index.js and other scripts
window.AIRLINE_MAP = AIRLINE_MAP;

const Tiles = [
  { url: '/unified/images/map/tiles/tile_0_0.png', px: 0, py: 0 },
  { url: '/unified/images/map/tiles/tile_0_1.png', px: 1806, py: 0 },
  { url: '/unified/images/map/tiles/tile_0_2.png', px: 3612, py: 0 },
  { url: '/unified/images/map/tiles/tile_0_3.png', px: 5418, py: 0 },
  { url: '/unified/images/map/tiles/tile_0_4.png', px: 7224, py: 0 },
  { url: '/unified/images/map/tiles/tile_0_5.png', px: 9030, py: 0 },
  { url: '/unified/images/map/tiles/tile_0_6.png', px: 10836, py: 0 },
  { url: '/unified/images/map/tiles/tile_0_7.png', px: 12642, py: 0 },
  { url: '/unified/images/map/tiles/tile_1_0.png', px: 0, py: 1971 },
  { url: '/unified/images/map/tiles/tile_1_1.png', px: 1806, py: 1971 },
  { url: '/unified/images/map/tiles/tile_1_2.png', px: 3612, py: 1971 },
  { url: '/unified/images/map/tiles/tile_1_3.png', px: 5418, py: 1971 },
  { url: '/unified/images/map/tiles/tile_1_4.png', px: 7224, py: 1971 },
  { url: '/unified/images/map/tiles/tile_1_5.png', px: 9030, py: 1971 },
  { url: '/unified/images/map/tiles/tile_1_6.png', px: 10836, py: 1971 },
  { url: '/unified/images/map/tiles/tile_1_7.png', px: 12642, py: 1971 },
  { url: '/unified/images/map/tiles/tile_2_0.png', px: 0, py: 3942 },
  { url: '/unified/images/map/tiles/tile_2_1.png', px: 1806, py: 3942 },
  { url: '/unified/images/map/tiles/tile_2_2.png', px: 3612, py: 3942 },
  { url: '/unified/images/map/tiles/tile_2_3.png', px: 5418, py: 3942 },
  { url: '/unified/images/map/tiles/tile_2_4.png', px: 7224, py: 3942 },
  { url: '/unified/images/map/tiles/tile_2_5.png', px: 9030, py: 3942 },
  { url: '/unified/images/map/tiles/tile_2_6.png', px: 10836, py: 3942 },
  { url: '/unified/images/map/tiles/tile_2_7.png', px: 12642, py: 3942 },
  { url: '/unified/images/map/tiles/tile_3_0.png', px: 0, py: 5913 },
  { url: '/unified/images/map/tiles/tile_3_1.png', px: 1806, py: 5913 },
  { url: '/unified/images/map/tiles/tile_3_2.png', px: 3612, py: 5913 },
  { url: '/unified/images/map/tiles/tile_3_3.png', px: 5418, py: 5913 },
  { url: '/unified/images/map/tiles/tile_3_4.png', px: 7224, py: 5913 },
  { url: '/unified/images/map/tiles/tile_3_5.png', px: 9030, py: 5913 },
  { url: '/unified/images/map/tiles/tile_3_6.png', px: 10836, py: 5913 },
  { url: '/unified/images/map/tiles/tile_3_7.png', px: 12642, py: 5913 },
  { url: '/unified/images/map/tiles/tile_4_0.png', px: 0, py: 7884 },
  { url: '/unified/images/map/tiles/tile_4_1.png', px: 1806, py: 7884 },
  { url: '/unified/images/map/tiles/tile_4_2.png', px: 3612, py: 7884 },
  { url: '/unified/images/map/tiles/tile_4_3.png', px: 5418, py: 7884 },
  { url: '/unified/images/map/tiles/tile_4_4.png', px: 7224, py: 7884 },
  { url: '/unified/images/map/tiles/tile_4_5.png', px: 9030, py: 7884 },
  { url: '/unified/images/map/tiles/tile_4_6.png', px: 10836, py: 7884 },
  { url: '/unified/images/map/tiles/tile_4_7.png', px: 12642, py: 7884 },
  { url: '/unified/images/map/tiles/tile_5_0.png', px: 0, py: 9855 },
  { url: '/unified/images/map/tiles/tile_5_1.png', px: 1806, py: 9855 },
  { url: '/unified/images/map/tiles/tile_5_2.png', px: 3612, py: 9855 },
  { url: '/unified/images/map/tiles/tile_5_3.png', px: 5418, py: 9855 },
  { url: '/unified/images/map/tiles/tile_5_4.png', px: 7224, py: 9855 },
  { url: '/unified/images/map/tiles/tile_5_5.png', px: 9030, py: 9855 },
  { url: '/unified/images/map/tiles/tile_5_6.png', px: 10836, py: 9855 },
  { url: '/unified/images/map/tiles/tile_5_7.png', px: 12642, py: 9855 },
  { url: '/unified/images/map/tiles/tile_6_0.png', px: 0, py: 11826 },
  { url: '/unified/images/map/tiles/tile_6_1.png', px: 1806, py: 11826 },
  { url: '/unified/images/map/tiles/tile_6_2.png', px: 3612, py: 11826 },
  { url: '/unified/images/map/tiles/tile_6_3.png', px: 5418, py: 11826 },
  { url: '/unified/images/map/tiles/tile_6_4.png', px: 7224, py: 11826 },
  { url: '/unified/images/map/tiles/tile_6_5.png', px: 9030, py: 11826 },
  { url: '/unified/images/map/tiles/tile_6_6.png', px: 10836, py: 11826 },
  { url: '/unified/images/map/tiles/tile_6_7.png', px: 12642, py: 11826 },
];

// Ensure every airport entry carries an explicit airspace field (default to island)
try {
  if (Array.isArray(airportList)) {
    airportList.forEach(ap => { if (ap && ap.airspace === undefined) ap.airspace = ap.island; });
  }
} catch (e) { }

const Fixes = [
  //need to use other waypoints as reference and have paths be accurate w distance + degree
  //---------------------------------------INITIALIZATION------------------------------------------//
  // Waypoints relative to the top left of the map image

  // Top left corner
  // { name: "TOPLEFT", px: -14453*2, py: -13800*2, size: 32, type: "waypoint" }, // top left

  // Center of map
  // { name: "CENTER", px: imageWidth / 2, py: imageHeight / 2, size: 32, type: "waypoint" }, // center

  // Bottom right corner
  // { name: "BOTTOMRIGHT", px: imageWidth, py: imageHeight, size: 32, type: "waypoint" }, // bottom right

  //---------------------------------------MAJOR FIX------------------------------------------//
  //-------------EZY ENROUTE------------//
  // Grindavik

  { name: "BULLY", px: 2456.09, py: 2417.97, size: 32, type: "waypoint" }, //bully
  { name: "FROOT", px: 1503.71, py: 3544.37, size: 32, type: "waypoint" }, //fruit
  { name: "EURAD", px: 3402.95, py: 3875.30, size: 32, type: "waypoint" }, //Yurad
  { name: "BOBOS", px: 543.59, py: 4476.87, size: 32, type: "waypoint" }, //bowbows?
  { name: "THENR", px: 1496.88, py: 4987.5, size: 32, type: "waypoint" }, //thenner
  { name: "BLANK", px: 3790.63, py: 4756.25, size: 32, type: "waypoint" }, //blank
  { name: "ACRES", px: -146.88, py: 5275, size: 32, type: "waypoint" }, //acres
  { name: "YOUTH", px: 2587.5, py: 5571.88, size: 32, type: "waypoint" }, //youth
  { name: "UWAIS", px: -893.75, py: 6028.13, size: 32, type: "waypoint" }, //Eww Wais
  { name: "FRANK", px: -815.63, py: 7182.81, size: 32, type: "waypoint" }, //Frank
  { name: "CELAR", px: 1856.16, py: 7658.85, size: 32, type: "waypoint" }, //Sellar
  { name: "EZYDB", px: 3848.21, py: 6238.01, size: 32, type: "waypoint" }, //EasyDub
  { name: "THACC", px: -826.43, py: 8455.45, size: 32, type: "waypoint" }, //Thack
  { name: "SHREK", px: 513.28, py: 8585.94, size: 32, type: "waypoint" }, //Shrek
  { name: "SPACE", px: 1915.82, py: 8843.25, size: 32, type: "waypoint" }, //Space

  // Sauthemptona
  { name: "HACKE", px: -322.19, py: 9934.38, size: 32, type: "waypoint" }, //Hackee
  { name: "HECKS", px: -950.78, py: 11425.78, size: 32, type: "waypoint" }, //Hecks
  { name: "GEORG", px: 610.94, py: 10313.28, size: 32, type: "waypoint" }, //George
  { name: "SEEKS", px: 1923.44, py: 10763.28, size: 32, type: "waypoint" }, //Seeks
  { name: "PACKT", px: 117.19, py: 11721.88, size: 32, type: "waypoint" }, //Packet
  { name: "ALDER", px: 3212.92, py: 11899.28, size: 32, type: "waypoint" }, //Alder
  { name: "STACK", px: 1506.25, py: 12237.5, size: 32, type: "waypoint" }, //Stack
  { name: "WASTE", px: 23.44, py: 12975, size: 32, type: "waypoint" }, //Waste
  { name: "HOGGS", px: 3000.78, py: 12844.48, size: 32, type: "waypoint" }, //Hoggs
  { name: "ROBUX", px: 2358.86, py: 14075.84, size: 32, type: "waypoint" }, //Robux

  // Rockford
  { name: "ENDER", px: 4415, py: 7000.36, size: 32, type: "waypoint" }, //Ender
  { name: "SUNST", px: 3621.71, py: 7665.48, size: 32, type: "waypoint" }, //Sunset
  { name: "BUCFA", px: 4481.29, py: 8200.23, size: 32, type: "waypoint" }, //Buckfuh
  { name: "KENED", px: 5683.37, py: 7442.3, size: 32, type: "waypoint" }, //Keneddy? kened?
  { name: "SETHR", px: 7901.92, py: 8038.92, size: 32, type: "waypoint" }, //Sether
  { name: "KUNAV", px: 5685.58, py: 8315.13, size: 32, type: "waypoint" }, //Kunnov
  { name: "HAWFA", px: 6220.33, py: 8606.82, size: 32, type: "waypoint" }, //Haw Fuh
  { name: "SAWPE", px: 3277.34, py: 8505.47, size: 32, type: "waypoint" }, //Saw pee
  { name: "BEANS", px: 3355.44, py: 9736.53, size: 32, type: "waypoint" }, //Beans
  { name: "LOGAN", px: 4395.31, py: 9970.31, size: 32, type: "waypoint" }, //Logan
  { name: "EXMOR", px: 4577.41, py: 10896.63, size: 32, type: "waypoint" }, //exhmore
  { name: "QUEEN", px: 7062.23, py: 9241, size: 32, type: "waypoint" }, //queen
  { name: "MOGTA", px: 5718.73, py: 10398.89, size: 32, type: "waypoint" }, //moghtha
  { name: "LAVNO", px: 7721.88, py: 9537.1, size: 32, type: "waypoint" }, //lavno
  { name: "ICTAM", px: 5409.37, py: 8757.08, size: 32, type: "waypoint" }, //ichtham
  { name: "ATPEV", px: 8186.97, py: 9353.7, size: 32, type: "waypoint" }, //ath pev
  { name: "JAMSI", px: 8702.94, py: 10251.94, size: 32, type: "waypoint" }, //jam see
  { name: "GODLU", px: 7897.5, py: 10994.41, size: 32, type: "waypoint" }, //god loo
  { name: "LAZER", px: 8599.08, py: 11282.77, size: 32, type: "waypoint" }, //laser
  { name: "PEPUL", px: 6128.63, py: 11217.59, size: 32, type: "waypoint" }, //people
  { name: "EMJAY", px: 5184.38, py: 12296.88, size: 32, type: "waypoint" }, //MJ
  { name: "ODOKU", px: 6843.75, py: 12306.25, size: 32, type: "waypoint" }, //Odo ku
  { name: "REAPR", px: 7192.6, py: 13494.69, size: 32, type: "waypoint" }, //Reaper
  { name: "TRELN", px: 5875.62, py: 13722.29, size: 32, type: "waypoint" },
  { name: "DEATH", px: 4556.42, py: 14033.86, size: 32, type: "waypoint" },

  // Larnaca
  { name: "RENTS", px: 11320.34, py: 10213.27, size: 32, type: "waypoint" }, //Rents
  { name: "GRASS", px: 10182.34, py: 10739.18, size: 32, type: "waypoint" }, //Grass
  { name: "AQWRT", px: 9766.91, py: 12330.17, size: 32, type: "waypoint" }, //Aquirt
  { name: "FORIA", px: 8449.93, py: 13218.48, size: 32, type: "waypoint" }, //Forya
  { name: "FORCE", px: 10469.6, py: 14239.36, size: 32, type: "waypoint" }, //Force
  { name: "MASEV", px: 11592.13, py: 14279.14, size: 32, type: "waypoint" }, //Masiv
  { name: "ALTRS", px: 12811.89, py: 14252.62, size: 32, type: "waypoint" }, //Alters
  { name: "MUONE", px: 13267.09, py: 13214.06, size: 32, type: "waypoint" }, //Mew Own
  { name: "JAZZR", px: 14539.88, py: 13227.32, size: 32, type: "waypoint" }, //Jazzer
  { name: "NUBER", px: 15755.22, py: 12414.14, size: 32, type: "waypoint" }, //New ber
  { name: "BOBUX", px: 13457.13, py: 12188.75, size: 32, type: "waypoint" }, //Bobux
  { name: "DEBUG", px: 14557.56, py: 11318.13, size: 32, type: "waypoint" }, //Debug
  { name: "JACKI", px: 12599.76, py: 11304.87, size: 32, type: "waypoint" }, //Jacky

  // Skopelos
  { name: "CAWZE", px: 10343.65, py: 8030.08, size: 32, type: "waypoint" }, //Cawz ey
  { name: "ANYMS", px: 9669.69, py: 9324.53, size: 32, type: "waypoint" }, //Ay nims

  // Izolirani
  { name: "CAMEL", px: 10703.83, py: 5979.47, size: 32, type: "waypoint" }, //Camel
  { name: "CYRIL", px: 11512.58, py: 6995.94, size: 32, type: "waypoint" }, //S eye ril, sir il
  { name: "DUNKS", px: 11768.91, py: 6028.09, size: 32, type: "waypoint" }, //Dunks
  { name: "DOGGO", px: 12909.12, py: 8012.4, size: 32, type: "waypoint" }, //Dog Oh
  { name: "JUSTY", px: 13262.67, py: 9333.81, size: 32, type: "waypoint" }, //Justy
  { name: "CHAIN", px: 15732.06, py: 9766.91, size: 32, type: "waypoint" }, //Chain
  { name: "BILLO", px: 14557.56, py: 8586.93, size: 32, type: "waypoint" }, //Bill oh
  { name: "ABSRS", px: 15768.48, py: 7919.6, size: 32, type: "waypoint" }, //Abserse
  { name: "MORRD", px: 15087.89, py: 6624.71, size: 32, type: "waypoint" }, //Mord
  { name: "LLIME", px: 15538.67, py: 5670.11, size: 32, type: "waypoint" }, //Lime
  { name: "UDMUG", px: 15083.47, py: 4808.33, size: 32, type: "waypoint" }, //Uhd mug
  { name: "ROSMO", px: 13474.8, py: 5484.5, size: 32, type: "waypoint" }, //Ros moh

  // Saint Barts
  { name: "PROBE", px: 6306.51, py: 5351.91, size: 32, type: "waypoint" }, //Probe
  { name: "DINER", px: 8012.4, py: 5427.04, size: 32, type: "waypoint" }, //Diner
  { name: "INDEX", px: 6505.38, py: 6819.16, size: 32, type: "waypoint" }, //Index
  { name: "GAVIN", px: 8361.54, py: 7141.78, size: 32, type: "waypoint" }, //Gavin
  { name: "SILVA", px: 10018.82, py: 7159.46, size: 32, type: "waypoint" }, //Silva
  { name: "OCEEN", px: 9143.77, py: 7716.3, size: 32, type: "waypoint" }, //Oceen?
  { name: "GERLD", px: 5077.91, py: 4605.03, size: 32, type: "waypoint" }, //Gerald
  { name: "RENDR", px: 5687.79, py: 4772.97, size: 32, type: "waypoint" }, //Render
  { name: "WELSH", px: 5687.79, py: 6249.06, size: 32, type: "waypoint" }, //Whelsh
  { name: "JOOPY", px: 7115.26, py: 4631.55, size: 32, type: "waypoint" }, //Jhoophy

  // Perth
  { name: "CRAZY", px: 10279.56, py: 1327.34, size: 32, type: "waypoint" }, //crazy
  { name: "WOTAN", px: 12625, py: 1929.69, size: 32, type: "waypoint" }, //woah ton
  { name: "WAGON", px: 14049.33, py: 2417.42, size: 32, type: "waypoint" }, //wagon
  { name: "WELLS", px: 11223.11, py: 2978.69, size: 32, type: "waypoint" }, //wells
  { name: "SQUID", px: 12951.1, py: 3011.83, size: 32, type: "waypoint" }, //squid
  { name: "KELLA", px: 12639.06, py: 4100, size: 32, type: "waypoint" }, //kell uh
  { name: "ZESTA", px: 14448.44, py: 3410.94, size: 32, type: "waypoint" }, //zest uh
  { name: "NOONU", px: 11890.63, py: 4068.75, size: 32, type: "waypoint" }, //Newnew
  { name: "SISTA", px: 12350, py: 5018.75, size: 32, type: "waypoint" }, //Sistuh
  { name: "TALIS", px: 11375, py: 5168.75, size: 32, type: "waypoint" }, //Talis
  { name: "STRAX", px: 9336.57, py: 4321.32, size: 32, type: "waypoint" }, //Strax
  { name: "TINDR", px: 9083.59, py: 3561.72, size: 32, type: "waypoint" }, //Tinder

  // Tokyo
  { name: "SHELL", px: 3588.57, py: 866.21, size: 32, type: "waypoint" }, //Shell
  { name: "NIKON", px: 5716.52, py: 583.36, size: 32, type: "waypoint" }, //neekon
  { name: "CHILY", px: 8046.88, py: 828.13, size: 32, type: "waypoint" }, //chilly
  { name: "SHIBA", px: 4781.81, py: 1261.74, size: 32, type: "waypoint" }, //shee buh
  { name: "LETSE", px: 6815.63, py: 1653.13, size: 32, type: "waypoint" }, //lets see
  { name: "HONDA", px: 8478.13, py: 1653.13, size: 32, type: "waypoint" }, //Honda
  { name: "ASTRO", px: 5192.92, py: 2293.68, size: 32, type: "waypoint" }, //Astro
  { name: "GULEG", px: 4215.12, py: 3056.13, size: 32, type: "waypoint" }, //goo leg
  { name: "PIPER", px: 5508.8, py: 3155.46, size: 32, type: "waypoint" }, //Piper
  { name: "TUDEP", px: 5095.59, py: 4182.98, size: 32, type: "waypoint" }, //too dep
  { name: "ALLRY", px: 8449.93, py: 4191.82, size: 32, type: "waypoint" }, //all rey
  { name: "ONDER", px: 6653.43, py: 3462.61, size: 32, type: "waypoint" }, //Onder
  { name: "KNIFE", px: 7711.88, py: 3204.08, size: 32, type: "waypoint" }, //Knife

  //-------------ADVANCED ENROUTE------------//
  /*{ name: "PEMDA", px: -392.7, py: 8967.47, size: 32, type: "waypoint" },
  { name: "ATCAG", px: 670.12, py: 9085.28, size: 32, type: "waypoint" },
  { name: "HEMOS", px: 1867.22, py: 9552.72, size: 32, type: "waypoint" },
  { name: "BOLRO", px: 2775.01, py: 9915.87, size: 32, type: "waypoint" },
  { name: "LIZAD", px: 3512.76, py: 11174.19, size: 32, type: "waypoint" },
  { name: "BAKUR", px: 3875.05, py: 12139.47, size: 32, type: "waypoint" },
  { name: "XAMAB", px: 774.59, py: 12327.21, size: 32, type: "waypoint" },
  { name: "LEGOS", px: 13437.64, py: 10150.73, size: 32, type: "waypoint" },
  { name: "DOPLI", px: 12432.11, py: 9590.73, size: 32, type: "waypoint" },
  { name: "GURLU", px: 8630.63, py: 11524.66, size: 32, type: "waypoint" },
  { name: "EVRIN", px: 9417.58, py: 11112.48, size: 32, type: "waypoint" },
  { name: "BANBA", px: 9375.48, py: 10569.34, size: 32, type: "waypoint" },
  { name: "CYRUS", px: 9941.42, py: 10208.03, size: 32, type: "waypoint" },
  { name: "BAMOS", px: 10602.08, py: 9983.52, size: 32, type: "waypoint" },
  { name: "SIGFO", px: 11014.85, py: 9888.81, size: 32, type: "waypoint" },
  { name: "KAVEL", px: 11445.15, py: 9784.74, size: 32, type: "waypoint" },
  { name: "SIZZL", px: , py: , size: 32, type: "waypoint" },
  { name: "KALIN", px: 9008.24, py: 8980.12, size: 32, type: "waypoint" },
  { name: "MIKOS", px: , py: , size: 32, type: "waypoint" },
  { name: "MENOA", px: , py: , size: 32, type: "waypoint" },
  { name: "APRIL", px: , py: , size: 32, type: "waypoint" },
  { name: "TIDAR", px: , py: , size: 32, type: "waypoint" },
  { name: "KIGOB", px: , py: , size: 32, type: "waypoint" },
  { name: "TIDAR", px: , py: , size: 32, type: "waypoint" },
  { name: "HEMAN", px: , py: , size: 32, type: "waypoint" },
  { name: "OPADO", px: , py: , size: 32, type: "waypoint" },
  { name: "BENJA", px: , py: , size: 32, type: "waypoint" },
  { name: "TIKNE", px: , py: , size: 32, type: "waypoint" },
  { name: "APATE", px: , py: , size: 32, type: "waypoint" },
  { name: "GAIAS", px: , py: , size: 32, type: "waypoint" },
  { name: "AKUNO", px: , py: , size: 32, type: "waypoint" },
  { name: "RUNDA", px: , py: , size: 32, type: "waypoint" },
  { name: "SIGNA", px: , py: , size: 32, type: "waypoint" },
  { name: "GARDE", px: , py: , size: 32, type: "waypoint" },
  { name: "OLEPI", px: , py: , size: 32, type: "waypoint" },
  { name: "OLESA", px: , py: , size: 32, type: "waypoint" },
  { name: "BORDO", px: , py: , size: 32, type: "waypoint" },
  { name: "INABI", px: , py: , size: 32, type: "waypoint" },
  { name: "ELMAS", px: , py: , size: 32, type: "waypoint" },
  { name: "EMBED", px: , py: , size: 32, type: "waypoint" },
  { name: "AVBIT", px: , py: , size: 32, type: "waypoint" },
  { name: "MOTOX", px: , py: , size: 32, type: "waypoint" },
  { name: "GODOS", px: , py: , size: 32, type: "waypoint" },
  { name: "SLANY", px: , py: , size: 32, type: "waypoint" },
  { name: "BEREP", px: , py: , size: 32, type: "waypoint" },
  { name: "DESUL", px: , py: , size: 32, type: "waypoint" },
  { name: "IBALO", px: , py: , size: 32, type: "waypoint" },
  { name: "LUGIS", px: , py: , size: 32, type: "waypoint" },
  { name: "GODOS", px: , py: , size: 32, type: "waypoint" },
  { name: "WESEL", px: , py: , size: 32, type: "waypoint" },
  { name: "GAPLI", px: , py: , size: 32, type: "waypoint" },
   */
  //---------------------------------------AIRPORT------------------------------------------//
  //-------------EZY ENROUTE------------//

  //all airports are vor/dme
  // Rockford
  { name: "IRFD", px: 6844.02, py: 9947, size: 32, type: "aprt.serv.twr" }, //done
  { name: "IMLR", px: 4510.23, py: 9082.34, size: 32, type: "aprt.serv.twr" }, //done
  { name: "ITRC", px: 7040.13, py: 11408.45, size: 32, type: "aprt" }, //done
  { name: "IGAR", px: 5001.56, py: 10434.38, size: 32, type: "aprt.mltry.twr" }, //tacan btw called + shortened as IGAR
  { name: "IBLT", px: 5698.83, py: 9500.39, size: 32, type: "aprt.priv.twr" }, //done
  { name: "OWO", px: 6375, py: 8871.88, size: 32, type: "aprt.seabase" }, //done seabase
  { name: "RFDCG", px: 5574.54, py: 10166.87, size: 32, type: "aprt.seabase" }, //done seabase
  { name: "RFDRB", px: 6103.77, py: 9981.25, size: 32, type: "aprt.priv" }, //done seabase

  //Grindavik
  { name: "IGRV", px: 876.56, py: 6415.23, size: 32, type: "aprt.serv.twr" }, //done
  { name: "TVO", px: 1031.93, py: 6777.18, size: 32, type: "aprt.seabase" }, //done seabase
  { name: "GRVCG", px: 1009.63, py: 6267.56, size: 32, type: "aprt.seabase" }, //done seabase

  //Sauthemptona
  { name: "ISAU", px: 622.66, py: 10986.33, size: 32, type: "aprt.serv.twr" }, //done
  { name: "OILRIG", px: 1370.56, py: 9110.64, size: 32, type: "aprt.seabase" }, //done

  //Larnaca
  { name: "IHEN", px: 9957.5, py: 13120.7, size: 32, type: "aprt.priv" }, //done private? airport?
  { name: "IIAB", px: 10857.81, py: 12953.13, size: 32, type: "aprt.mltry.twr" }, //done military w/ tower
  { name: "ILAR", px: 10651.9, py: 11682.73, size: 32, type: "aprt.serv.twr" }, //done
  { name: "IPAP", px: 12044.53, py: 12087.11, size: 32, type: "aprt.serv.twr" }, //done
  { name: "IBAR", px: 11507.42, py: 12550.39, size: 32, type: "aprt.serv.twr" }, //private w/ tower +services?

  //Skopelos
  { name: "ISKP", px: 11196.59, py: 8865.9, size: 32, type: "aprt.serv.twr" }, //airport? private?

  //Izolirani
  { name: "IZOL", px: 14189.06, py: 7529.69, size: 32, type: "aprt.serv.twr" }, //done
  { name: "ISCM", px: 12846.88, py: 6234.38, size: 32, type: "aprt.mltry.twr" }, //done military w/ a tower, is HOTDOG TACAN short HOT
  { name: "IZOCG", px: 13182.29, py: 7488.36, size: 32, type: "aprt.seabase" }, //done seabase
  { name: "IJAF", px: 14351.56, py: 6953.13, size: 32, type: "aprt.priv.twr" }, //done private? airport? tower?
  { name: "IZORB", px: 13669.53, py: 6791.02, size: 32, type: "aprt.priv" }, //done seabase

  //Saint Barts
  { name: "IBTH", px: 8238.9, py: 6231.38, size: 32, type: "aprt.serv.twr" }, //done

  //Perth
  { name: "IPPH", px: 9914.96, py: 3802.91, size: 32, type: "aprt.serv.twr" }, //done
  { name: "ILKL", px: 10748.02, py: 4428.26, size: 32, type: "aprt.serv.twr" }, //done private?
  { name: "SHV", px: 10942.48, py: 3763.13, size: 32, type: "aprt.seabase" }, //done seabase
  { name: "PERCG", px: 10449.78, py: 4719.87, size: 32, type: "aprt.seabase" }, //done seabase

  //Tokyo
  { name: "ITKO", px: 6266.73, py: 2127.95, size: 32, type: "aprt.serv.twr" }, //done
  { name: "ORNCG", px: 5705.74, py: 1533.54, size: 32, type: "aprt.seabase" }, //done seabase
  { name: "ORNRB", px: 5907.66, py: 967.85, size: 32, type: "aprt.priv" }, //done
  { name: "IDCS", px: 6651.22, py: 190.03, size: 32, type: "aprt.priv" }, //done private? airport?
  { name: "IBRD", px: 7145.6, py: 1015.5, size: 32, type: "aprt.twr" }, //done 

  //---------------------------------------MINOR/APPROACH FIXES------------------------------------------//
  //{ name: "", px: , py: , size: 16, type: "waypoint" },

  //---------------------------------------VORTAC/OTHER FIX------------------------------------------//
  //all have shortened name of 3 letters normally + need to make sure they cna't be "fixes" too
  //they're all waypoints as well...
  /*
  { name: "BAR", px: , py: , size: 32, type: "vortac" }, //Barnie
  { name: "HUT", px: , py: , size: 32, type: "vortac" }, //hunter
  { name: "GOL", px: , py: , size: 16, type: "vortac" }, //GOLDEN
  { name: "KRO", px: , py: , size: 16, type: "vortac" }, //KROTEN
  { name: "HAW", px: , py: , size: 16, type: "vortac" }, //hawkin
  { name: "BLA", px: , py: , size: 16, type: "vordme" }, //BLADES
  { name: "CAN", px: , py: , size: 16, type: "vortac" }, //CANDLE
  { name: "DIR", px: , py: , size: 16, type: "vortac" }, //DIRECTOR
  { name: "KIN", px: , py: , size: 16, type: "vortac" }, //KINDLE
  { name: "DET", px: , py: , size: 16, type: "vortac" }, //detox
  { name: "CLR", px: , py: , size: 16, type: "vortac" }, //CLEARANCE
  { name: "DEL", px: , py: , size: 16, type: "vortac" }, //DELIVERY
  { name: "DIZ", px: , py: , size: 16, type: "vortac" }, //DIZZIER
  { name: "TRE", px: , py: , size: 16, type: "vortac" }, //TRESIN
  { name: "ORG", px: , py: , size: 16, type: "vortac" }, //ORANGE
  { name: "BTM", px: , py: , size: 16, type: "vortac" }, //BRAINSTORM
  { name: "COC", px: , py: , size: 16, type: "vortac" }, //CROIS NOOB
  { name: "ROM", px: , py: , size: 16, type: "vortac" }, //ROMENS
  { name: "VOX", px: , py: , size: 16, type: "vortac" }, //VONARX
  { name: "RES", px: , py: , size: 16, type: "vortac" }, //RESURGE
  { name: "HOT", px: , py: , size: 16, type: "tacan" }, //at iscm
  { name: "IGAR", px: , py: , size: 16, type: "tacan" }
  // New waypoint placeholders (from SIDS/STARS) - fill coords later
  // { name: "BLADE", px: , py: , size: 32, type: "waypoint" }, // waypoint
  // { name: "FLUDO", px: , py: , size: 32, type: "waypoint" }, // waypoint
  // IBAR (Barra) waypoints
  { name: "BARRA", px: 11800, py: 12800, size: 32, type: "waypoint" }, // Near IBAR airport
  { name: "COAST", px: 12100, py: 13100, size: 32, type: "waypoint" }, // Coastal waypoint
  { name: "OCEAN", px: 12400, py: 13400, size: 32, type: "waypoint" }, // Ocean waypoint
  { name: "ISLAND", px: 12700, py: 13700, size: 32, type: "waypoint" }, // Island waypoint
  // ISKP (Skopelos) waypoints
  { name: "CLOUD", px: 11400, py: 9100, size: 32, type: "waypoint" }, // Near ISKP airport
  { name: "SUN", px: 11700, py: 9400, size: 32, type: "waypoint" }, // Sun waypoint
  { name: "MOON", px: 12000, py: 9700, size: 32, type: "waypoint" }, // Moon waypoint
  { name: "SKY", px: 11100, py: 8600, size: 32, type: "waypoint" }, // Sky waypoint
  */
];

const SIDS_STARS = [

  // --- LAZER Departures ---
  {
    name: "LAZER1R",
    type: "SID",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "RWY07R/07C", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 },
      { name: "ATPEV", altitude: { max: 5000 }, speed: { max: 250 }, heading: 170 },
      { name: "LAZER", altitude: { min: 4000, max: 6000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "LAZER1Y",
    type: "SID",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "RWY07R/07C", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 },
      { name: "ATPEV", altitude: { max: 5000 }, speed: { max: 250 }, heading: 170 },
      { name: "LAZER", altitude: { min: 4000, max: 6000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "LAZER1S",
    type: "SID",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "RWY25R/25C", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 },
      { name: "MOGTA", altitude: { exact: 1000 }, speed: { max: 250 }, heading: 150 },
      { name: "PEPUL", altitude: { max: 5000 }, speed: { max: 250 }, heading: 110 },
      { name: "TRN", altitude: { max: 5000 }, speed: { max: 250 }, heading: 95 },
      { name: "LAZER", altitude: { min: 4000, max: 6000 }, speed: { max: 250 }, heading: 0 }
    ]
  },

  // --- SETHR Departure ---
  {
    name: "SETHR1R",
    type: "SID",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "RWY07R/07C", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 },
      { name: "ATPEV", altitude: { max: 5000 }, speed: { max: 250 }, heading: 344 },
      { name: "SETHR", altitude: { min: 4000, max: 6000 }, speed: { max: 250 }, heading: 0 }
    ]
  },

  // --- HAWFA Departure ---
  {
    name: "HAWFA1S",
    type: "SID",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "RWY25R/25C", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 },
      { name: "MOGTA", altitude: { max: 5000 }, speed: { max: 250 }, heading: 15 },
      { name: "BLA", altitude: { min: 3500 }, speed: { max: 250 }, heading: 357 },
      { name: "HAWFA", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 0 }
    ]
  },

  // --- BEANS Departures ---
  {
    name: "BEANS1R",
    type: "SID",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "RWY07R/07C", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 },
      { name: "ATPEV", altitude: { max: 5000 }, speed: { max: 250 }, heading: 290 },
      { name: "HAWFA", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 250 },
      { name: "MLR", altitude: { min: 4000 }, speed: { max: 250 }, heading: 235 },
      { name: "BEANS", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "BEANS1Y",
    type: "SID",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "RWY25R/25C", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 },
      { name: "MOGTA", altitude: { max: 5000 }, speed: { max: 250 }, heading: 17 },
      { name: "HAWFA", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 250 },
      { name: "MLR", altitude: { min: 4000 }, speed: { max: 250 }, heading: 235 },
      { name: "BEANS", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "BEANS1S",
    type: "SID",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "RWY07R/07C", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 },
      { name: "ATPEV", altitude: { max: 5000 }, speed: { max: 250 }, heading: 332 },
      { name: "SETHR", altitude: { max: 5000 }, speed: { max: 250 }, heading: 267 },
      { name: "BUCFA", altitude: { max: 5000 }, speed: { max: 250 }, heading: 328 },
      { name: "SUNST", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },

  // --- SUNST Departures ---
  {
    name: "SUNST1R",
    type: "SID",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "RWY07R/07C", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 },
      { name: "ATPEV", altitude: { max: 5000 }, speed: { max: 250 }, heading: 290 },
      { name: "HAWFA", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 250 },
      { name: "MLR", altitude: { min: 4000 }, speed: { max: 250 }, heading: 235 },
      { name: "BEANS", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "SUNST1Y",
    type: "SID",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "RWY07R/07C", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 },
      { name: "ATPEV", altitude: { max: 5000 }, speed: { max: 250 }, heading: 332 },
      { name: "SETHR", altitude: { max: 5000 }, speed: { max: 250 }, heading: 267 },
      { name: "BUCFA", altitude: { max: 5000 }, speed: { max: 250 }, heading: 328 },
      { name: "SUNST", altitude: { max: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },

  // --- STARs ---
  {
    name: "BEANS1G",
    type: "STAR",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "BEANS", altitude: { exact: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "LOGAN", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "MOGTA", altitude: { max: 3000 }, speed: { max: 250 }, heading: 0 },
      { name: "PEPUL", altitude: { exact: 3000 }, speed: { max: 250 }, heading: 0 },
      { name: "TRN", altitude: { max: 3000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "LAZER1G",
    type: "STAR",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "LAZER", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "TRN", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "REAPR1G",
    type: "STAR",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "REAPR", altitude: { min: 1000, max: 5000 }, speed: { max: 250 }, heading: 0 },
      { name: "ODOKU", altitude: { exact: 3000 }, speed: { max: 250 }, heading: 0 },
      { name: "TRN", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "ENDER1J",
    type: "STAR",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "ENDER", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "KUNAV", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "BLADE", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "FLUDO", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "SETHR1J",
    type: "STAR",
    airport: "IRFD",
    chartpack: "RFD Chart Pack (by p1anes)",
    waypoints: [
      { name: "SETHR", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "KUNAV", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "BLADE", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "FLUDO", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 0 }
    ]
  }
  ,

  // === IGRV (Grindavik) Procedures ===
  {
    name: "THENR1",
    type: "SID",
    airport: "IGRV",
    chartpack: "IGRV CHARTS - nova_av [AeroNav]",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "THENR", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "CELAR", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "YOUTH", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "CELAR1",
    type: "SID",
    airport: "IGRV",
    chartpack: "IGRV CHARTS - nova_av [AeroNav]",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "CELAR", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "WEESH", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "DUNES", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "YOUTH1",
    type: "SID",
    airport: "IGRV",
    chartpack: "IGRV CHARTS - nova_av [AeroNav]",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "YOUTH", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "DUNES", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "SPECK", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "WEESH1",
    type: "STAR",
    airport: "IGRV",
    chartpack: "IGRV CHARTS - nova_av [AeroNav]",
    waypoints: [
      { name: "WEESH", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "YOUTH", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "CELAR", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "THENR", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "DUNES1",
    type: "STAR",
    airport: "IGRV",
    chartpack: "IGRV CHARTS - nova_av [AeroNav]",
    waypoints: [
      { name: "DUNES", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "WEESH", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "YOUTH", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "THENR", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
  ,

  // === IGRV (Grindavik) Procedures ===
  {
    name: "THENR1",
    type: "SID",
    airport: "IGRV",
    chartpack: "IGRV CHARTS - nova_av [AeroNav]",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "THENR", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "CELAR", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "YOUTH", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "CELAR1",
    type: "SID",
    airport: "IGRV",
    chartpack: "IGRV CHARTS - nova_av [AeroNav]",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "CELAR", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "WEESH", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "DUNES", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "YOUTH1",
    type: "SID",
    airport: "IGRV",
    chartpack: "IGRV CHARTS - nova_av [AeroNav]",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "YOUTH", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "DUNES", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "SPECK", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "WEESH1",
    type: "STAR",
    airport: "IGRV",
    chartpack: "IGRV CHARTS - nova_av [AeroNav]",
    waypoints: [
      { name: "WEESH", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "YOUTH", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "CELAR", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "THENR", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "DUNES1",
    type: "STAR",
    airport: "IGRV",
    chartpack: "IGRV CHARTS - nova_av [AeroNav]",
    waypoints: [
      { name: "DUNES", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "WEESH", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "YOUTH", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "THENR", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
  ,

  // === ISAU (Sauthemptona) Procedures ===
  {
    name: "GEORG1",
    type: "SID",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "GEORG", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "PACKT", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "SEEKS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "PACKT1",
    type: "SID",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "PACKT", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "SEEKS", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "GOTAN", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "SEEKS1",
    type: "SID",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "SEEKS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "GOTAN", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "BADUM", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "GOTAN1",
    type: "STAR",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "GOTAN", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "SEEKS", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "PACKT", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "GEORG", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "BADUM1",
    type: "STAR",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "BADUM", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "GOTAN", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "SEEKS", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "GEORG", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
  ,

  // === ILAR (Larnaca) Procedures ===
  {
    name: "GRASS1",
    type: "SID",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "GRASS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "AQWRT", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "AQWRT1",
    type: "SID",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "AQWRT", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "CAWZE", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "RENTS1",
    type: "SID",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "RENTS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "CAWZE", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "ANYMS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "CAWZE1",
    type: "STAR",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "CAWZE", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "AQWRT", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "GRASS", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "ANYMS1",
    type: "STAR",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "ANYMS", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "CAWZE", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "GRASS", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
  ,

  // === IPAP (Paphos) Procedures ===
  {
    name: "RENTS1A",
    type: "SID",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 },
      { name: "RENTS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "FORIA", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "RENTS1B",
    type: "SID",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 },
      { name: "RENTS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "ALTRS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "RENTS1C",
    type: "SID",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 },
      { name: "RENTS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "MUONE", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "FORIA1A",
    type: "STAR",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "FORIA", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 }
    ]
  },
  {
    name: "ALTRS1A",
    type: "STAR",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "ALTRS", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 }
    ]
  }
  ,

  // === IBAR (Barra) Procedures ===
  {
    name: "BARRA1",
    type: "SID",
    airport: "IBAR",
    chartpack: "Barra Charts [IBAR] - userwastaken [ryseaviation], din0_nuggies21",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "BARRA", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "COAST", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "OCEAN", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "COAST1",
    type: "SID",
    airport: "IBAR",
    chartpack: "Barra Charts [IBAR] - userwastaken [ryseaviation], din0_nuggies21",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "COAST", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "OCEAN", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "ISLAND", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "OCEAN1",
    type: "STAR",
    airport: "IBAR",
    chartpack: "Barra Charts [IBAR] - userwastaken [ryseaviation], din0_nuggies21",
    waypoints: [
      { name: "OCEAN", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "COAST", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "BARRA", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "ISLAND1",
    type: "STAR",
    airport: "IBAR",
    chartpack: "Barra Charts [IBAR] - userwastaken [ryseaviation], din0_nuggies21",
    waypoints: [
      { name: "ISLAND", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "OCEAN", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "COAST", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "BARRA", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
  ,

  // === ISKP (Skopelos) Procedures ===
  {
    name: "SKY1",
    type: "SID",
    airport: "ISKP",
    chartpack: "ISKP Charts - Skopelos Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "SKY", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "CLOUD", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "SUN", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "CLOUD1",
    type: "SID",
    airport: "ISKP",
    chartpack: "ISKP Charts - Skopelos Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "CLOUD", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "SUN", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "MOON", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "SUN1",
    type: "STAR",
    airport: "ISKP",
    chartpack: "ISKP Charts - Skopelos Aviation",
    waypoints: [
      { name: "SUN", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "CLOUD", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "SKY", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "MOON1",
    type: "STAR",
    airport: "ISKP",
    chartpack: "ISKP Charts - Skopelos Aviation",
    waypoints: [
      { name: "MOON", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "SUN", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "CLOUD", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "SKY", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
  ,

  // === ILAR (Larnaca) Procedures ===
  {
    name: "GRASS1",
    type: "SID",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "GRASS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "AQWRT", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "AQWRT1",
    type: "SID",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "AQWRT", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "CAWZE", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "RENTS1",
    type: "SID",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "RENTS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "CAWZE", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "ANYMS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "CAWZE1",
    type: "STAR",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "CAWZE", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "AQWRT", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "GRASS", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "ANYMS1",
    type: "STAR",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "ANYMS", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "CAWZE", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "GRASS", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
  ,

  // === IPAP (Paphos) Procedures ===
  {
    name: "RENTS1A",
    type: "SID",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 },
      { name: "RENTS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "FORIA", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "RENTS1B",
    type: "SID",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 },
      { name: "RENTS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "ALTRS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "RENTS1C",
    type: "SID",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 },
      { name: "RENTS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "MUONE", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "FORIA1A",
    type: "STAR",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "FORIA", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 }
    ]
  },
  {
    name: "ALTRS1A",
    type: "STAR",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "ALTRS", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 }
    ]
  }
  ,

  // === IBAR (Barra) Procedures ===
  {
    name: "BARRA1",
    type: "SID",
    airport: "IBAR",
    chartpack: "Barra Charts [IBAR] - userwastaken [ryseaviation], din0_nuggies21",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "BARRA", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "COAST", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "OCEAN", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "COAST1",
    type: "SID",
    airport: "IBAR",
    chartpack: "Barra Charts [IBAR] - userwastaken [ryseaviation], din0_nuggies21",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "COAST", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "OCEAN", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "ISLAND", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "OCEAN1",
    type: "STAR",
    airport: "IBAR",
    chartpack: "Barra Charts [IBAR] - userwastaken [ryseaviation], din0_nuggies21",
    waypoints: [
      { name: "OCEAN", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "COAST", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "BARRA", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "ISLAND1",
    type: "STAR",
    airport: "IBAR",
    chartpack: "Barra Charts [IBAR] - userwastaken [ryseaviation], din0_nuggies21",
    waypoints: [
      { name: "ISLAND", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "OCEAN", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "COAST", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "BARRA", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
  ,

  // === ISKP (Skopelos) Procedures ===
  {
    name: "SKY1",
    type: "SID",
    airport: "ISKP",
    chartpack: "ISKP Charts - Skopelos Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "SKY", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "CLOUD", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "SUN", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "CLOUD1",
    type: "SID",
    airport: "ISKP",
    chartpack: "ISKP Charts - Skopelos Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "CLOUD", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "SUN", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "MOON", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "SUN1",
    type: "STAR",
    airport: "ISKP",
    chartpack: "ISKP Charts - Skopelos Aviation",
    waypoints: [
      { name: "SUN", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "CLOUD", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "SKY", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "MOON1",
    type: "STAR",
    airport: "ISKP",
    chartpack: "ISKP Charts - Skopelos Aviation",
    waypoints: [
      { name: "MOON", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "SUN", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "CLOUD", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "SKY", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
  ,

  // === ISAU (Sauthemptona) Procedures ===
  {
    name: "GEORG1",
    type: "SID",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "GEORG", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "PACKT", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "SEEKS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "PACKT1",
    type: "SID",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "PACKT", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "SEEKS", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "GOTAN", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "SEEKS1",
    type: "SID",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "SEEKS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "GOTAN", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "BADUM", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "GOTAN1",
    type: "STAR",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "GOTAN", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "SEEKS", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "PACKT", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "GEORG", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "BADUM1",
    type: "STAR",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "BADUM", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "GOTAN", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "SEEKS", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "GEORG", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
,

  // === IBAR (Barra) Procedures ===
  {
    name: "BARRA1",
    type: "SID",
    airport: "IBAR",
    chartpack: "Barra Charts [IBAR] - userwastaken [ryseaviation], din0_nuggies21",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "BARRA", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "COAST", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "OCEAN", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "COAST1",
    type: "SID",
    airport: "IBAR",
    chartpack: "Barra Charts [IBAR] - userwastaken [ryseaviation], din0_nuggies21",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "COAST", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "OCEAN", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "ISLAND", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "OCEAN1",
    type: "STAR",
    airport: "IBAR",
    chartpack: "Barra Charts [IBAR] - userwastaken [ryseaviation], din0_nuggies21",
    waypoints: [
      { name: "OCEAN", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "COAST", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "BARRA", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "ISLAND1",
    type: "STAR",
    airport: "IBAR",
    chartpack: "Barra Charts [IBAR] - userwastaken [ryseaviation], din0_nuggies21",
    waypoints: [
      { name: "ISLAND", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "OCEAN", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "COAST", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "BARRA", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
,

  // === ILAR (Larnaca) Procedures ===
  {
    name: "GRASS1",
    type: "SID",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "GRASS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "AQWRT", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "AQWRT1",
    type: "SID",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "AQWRT", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "CAWZE", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "RENTS1",
    type: "SID",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "RENTS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "CAWZE", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "ANYMS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "CAWZE1",
    type: "STAR",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "CAWZE", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "AQWRT", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "GRASS", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "ANYMS1",
    type: "STAR",
    airport: "ILAR",
    chartpack: "ILAR Chart (Aloha516)",
    waypoints: [
      { name: "ANYMS", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "CAWZE", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "GRASS", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
,

  // === IPAP (Paphos) Procedures ===
  {
    name: "RENTS1A",
    type: "SID",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 },
      { name: "RENTS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "FORIA", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "RENTS1B",
    type: "SID",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 },
      { name: "RENTS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "ALTRS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "RENTS1C",
    type: "SID",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 },
      { name: "RENTS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "MUONE", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "FORIA1A",
    type: "STAR",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "FORIA", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 }
    ]
  },
  {
    name: "ALTRS1A",
    type: "STAR",
    airport: "IPAP",
    chartpack: "IPAP Charts - Paphos Aviation",
    waypoints: [
      { name: "ALTRS", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "MASEV", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "RENTS", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY17", altitude: {}, speed: {}, heading: 170 },
      { name: "RWY35", altitude: {}, speed: {}, heading: 350 }
    ]
  }
,

  // === ISAU (Sauthemptona) Procedures ===
  {
    name: "GEORG1",
    type: "SID",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "GEORG", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "PACKT", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "SEEKS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "PACKT1",
    type: "SID",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "PACKT", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "SEEKS", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "GOTAN", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "SEEKS1",
    type: "SID",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "SEEKS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "GOTAN", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "BADUM", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "GOTAN1",
    type: "STAR",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "GOTAN", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "SEEKS", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "PACKT", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "GEORG", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "BADUM1",
    type: "STAR",
    airport: "ISAU",
    chartpack: "ISAU Charts - PlutonFordo",
    waypoints: [
      { name: "BADUM", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "GOTAN", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "SEEKS", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "GEORG", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
,

  // === ISKP (Skopelos) Procedures ===
  {
    name: "SKY1",
    type: "SID",
    airport: "ISKP",
    chartpack: "ISKP Charts - Skopelos Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "SKY", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "CLOUD", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "SUN", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "CLOUD1",
    type: "SID",
    airport: "ISKP",
    chartpack: "ISKP Charts - Skopelos Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "CLOUD", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "SUN", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "MOON", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "SUN1",
    type: "STAR",
    airport: "ISKP",
    chartpack: "ISKP Charts - Skopelos Aviation",
    waypoints: [
      { name: "SUN", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "CLOUD", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "SKY", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "MOON1",
    type: "STAR",
    airport: "ISKP",
    chartpack: "ISKP Charts - Skopelos Aviation",
    waypoints: [
      { name: "MOON", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "SUN", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "CLOUD", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "SKY", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
,

  // === IZOL (Izolirani) Procedures ===
  {
    name: "CAMEL1",
    type: "SID",
    airport: "IZOL",
    chartpack: "IZOL Charts - Izolirani Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "CAMEL", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "CYRIL", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "DUNKS", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "CYRIL1",
    type: "SID",
    airport: "IZOL",
    chartpack: "IZOL Charts - Izolirani Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "CYRIL", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "DUNKS", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "DOGGO", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "DUNKS1",
    type: "SID",
    airport: "IZOL",
    chartpack: "IZOL Charts - Izolirani Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "DUNKS", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "DOGGO", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "JUSTY", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "DOGGO1",
    type: "STAR",
    airport: "IZOL",
    chartpack: "IZOL Charts - Izolirani Aviation",
    waypoints: [
      { name: "DOGGO", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "JUSTY", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "CHAIN", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "BILLO", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  },
  {
    name: "JUSTY1",
    type: "STAR",
    airport: "IZOL",
    chartpack: "IZOL Charts - Izolirani Aviation",
    waypoints: [
      { name: "JUSTY", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "CHAIN", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "BILLO", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "ABSRS", altitude: { max: 4000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
,

  // === IPPH (Perth) Procedures ===
  {
    name: "SHV1",
    type: "SID",
    airport: "IPPH",
    chartpack: "IPPH Charts - Perth Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "SHV", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "PERCG", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "ILKL", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "PERCG1",
    type: "SID",
    airport: "IPPH",
    chartpack: "IPPH Charts - Perth Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "PERCG", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "ILKL", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "SHV", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "ILKL1",
    type: "STAR",
    airport: "IPPH",
    chartpack: "IPPH Charts - Perth Aviation",
    waypoints: [
      { name: "ILKL", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "SHV", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "PERCG", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
,

  // === ITKO (Tokyo) Procedures ===
  {
    name: "LETSE1",
    type: "SID",
    airport: "ITKO",
    chartpack: "ITKO Charts - Tokyo Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "LETSE", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "ONDER", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "KNIFE", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "ONDER1",
    type: "SID",
    airport: "ITKO",
    chartpack: "ITKO Charts - Tokyo Aviation",
    waypoints: [
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 },
      { name: "ONDER", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
      { name: "KNIFE", altitude: { max: 6000 }, speed: { max: 250 }, heading: 0 },
      { name: "LETSE", altitude: { min: 5000 }, speed: { max: 250 }, heading: 0 }
    ]
  },
  {
    name: "KNIFE2",
    type: "STAR",
    airport: "ITKO",
    chartpack: "ITKO Charts - Tokyo Aviation",
    waypoints: [
      { name: "KNIFE", altitude: { max: 15000 }, speed: { max: 250 }, heading: 0 },
      { name: "ONDER", altitude: { max: 10000 }, speed: { max: 250 }, heading: 0 },
      { name: "LETSE", altitude: { max: 6000 }, speed: { max: 220 }, heading: 0 },
      { name: "RWY09", altitude: {}, speed: {}, heading: 90 },
      { name: "RWY27", altitude: {}, speed: {}, heading: 270 }
    ]
  }
];

const charts = [{
    id: 1,
    name: "Airport Info",
    airport: "IRFD",
    author: "Aeronav",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-02.png"
},
{
    id: 2,
    name: "SID STAR Suggestions",
    airport: "IRFD",
    author: "Aeronav",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-04.png"
},
{
    id: 3,
    name: "VFR Sectional Chart",
    airport: "IRFD",
    author: "Aeronav",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-05.png"
},
{
    id: 4,
    name: "Takeoff Minimums",
    airport: "IRFD",
    author: "Aeronav",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-07.png"
},
{
    id: 5,
    name: "NADP 25L/C/R",
    airport: "IRFD",
    author: "Aeronav",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-08.png"
},
{
    id: 6,
    name: "Taxi Chart",
    airport: "IRFD",
    author: "Aeronav",
    category: "GND",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-09.png"
},
{
    id: 7,
    name: "B744/A380 Taxi Routes",
    airport: "IRFD",
    author: "Aeronav",
    category: "GND",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-10.png"
},
{
    id: 8,
    name: "AN225 Taxi Routes",
    airport: "IRFD",
    author: "Aeronav",
    category: "GND",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-11.png"
},
{
    id: 9,
    name: "SID NADP",
    airport: "IRFD",
    author: "Aeronav",
    category: "SID",
    runways: ["25L", "25C", "25R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-12.png"
},
{
    id: 10,
    name: "DARRK 3 RNAV",
    airport: "IRFD",
    author: "Aeronav",
    category: "SID",
    runways: ["25L", "25C", "25R", "07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-13.png"
},
{
    id: 11,
    name: "KENED 2 RNAV",
    airport: "IRFD",
    author: "Aeronav",
    category: "SID",
    runways: ["25L", "25C", "25R", "07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-14.png"
},
{
    id: 12,
    name: "LOGAN 4 RNAV",
    airport: "IRFD",
    author: "Aeronav",
    category: "SID",
    runways: ["25L", "25C", "25R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-15.png"
},
{
    id: 13,
    name: "OSHNN 1 RNAV",
    airport: "IRFD",
    author: "Aeronav",
    category: "SID",
    runways: ["25L", "25C", "25R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-16.png"
},
{
    id: 14,
    name: "ROCKFORD 6",
    airport: "IRFD",
    author: "Aeronav",
    category: "SID",
    runways: ["25L", "25C", "25R", "07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-17.png"
},
{
    id: 15,
    name: "TRAINING 1 RNAV",
    airport: "IRFD",
    author: "Aeronav",
    category: "SID",
    runways: ["25L", "25C", "25R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-18.png"
},
{
    id: 16,
    name: "WNDDY 3 RNAV",
    airport: "IRFD",
    author: "Aeronav",
    category: "SID",
    runways: ["07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-19.png"
},
{
    id: 17,
    name: "BEANS 1 RNAV",
    airport: "IRFD",
    author: "Aeronav",
    category: "SID",
    runways: ["25L", "25C", "25R", "07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-20.png"
},
{
    id: 18,
    name: "GORDO 1",
    airport: "IRFD",
    author: "Aeronav",
    category: "STAR",
    runways: ["25L", "25C", "25R", "07L", "07C", "7R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-21.png"
},
{
    id: 19,
    name: "JAMSI 1 RNAV",
    airport: "IRFD",
    author: "Aeronav",
    category: "STAR",
    runways: ["25L", "25C", "25R", "07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-22.png"
},
{
    id: 20,
    name: "KUNAV 2 RNAV",
    airport: "IRFD",
    author: "Aeronav",
    category: "STAR",
    runways: ["25L", "25C", "25R", "7L", "7C", "7R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-23.png"
},
{
    id: 21,
    name: "MATRIX 1",
    airport: "IRFD",
    author: "Aeronav",
    category: "STAR",
    runways: ["25L", "25C", "25R", "7L", "7C", "7R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-24.png"
},
{
    id: 22,
    name: "MELLOR 1",
    airport: "IRFD",
    author: "Aeronav",
    category: "STAR",
    runways: ["25L", "25C", "25R", "7L", "7C", "7R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-25.png"
},
{
    id: 23,
    name: "POPPY 3 RNAV",
    airport: "IRFD",
    author: "Aeronav",
    category: "STAR",
    runways: ["25L", "25C", "25R", "7L", "7C", "7R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-26.png"
},
{
    id: 24,
    name: "SUNST 3 RNAV",
    airport: "IRFD",
    author: "Aeronav",
    category: "STAR",
    runways: ["25L", "25C", "25R", "7L", "7C", "7R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-27.png"
},
{
    id: 25,
    name: "WILEK 1",
    airport: "IRFD",
    author: "Aeronav",
    category: "STAR",
    runways: ["25L", "25C", "25R", "7L", "7C", "7R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-28.png"
},
{
    id: 26,
    name: "ILS or LOC",
    airport: "IRFD",
    author: "Aeronav",
    category: "APP",
    runways: ["25L"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-29.png"
},
{
    id: 27,
    name: "ILS or LOC",
    airport: "IRFD",
    author: "Aeronav",
    category: "APP",
    runways: ["25C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-30.png"
},
{
    id: 28,
    name: "ILS PRM",
    airport: "IRFD",
    author: "Aeronav",
    category: "APP",
    runways: ["25C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-31.png"
},
{
    id: 29,
    name: "ILS or LOC",
    airport: "IRFD",
    author: "Aeronav",
    category: "APP",
    runways: ["25R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-32.png"
},
{
    id: 30,
    name: "ILS PRM TEXT",
    airport: "IRFD",
    author: "Aeronav",
    category: "APP",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-33.png"
},
{
    id: 31,
    name: "RNAV (RNP)",
    airport: "IRFD",
    author: "Aeronav",
    category: "APP",
    runways: ["07L"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-34.png"
},
{
    id: 32,
    name: "RNAV (RNP)",
    airport: "IRFD",
    author: "Aeronav",
    category: "APP",
    runways: ["07C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-35.png"
},
{
    id: 33,
    name: "RNAV (RNP)",
    airport: "IRFD",
    author: "Aeronav",
    category: "APP",
    runways: ["07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-36.png"
},
{
    id: 34,
    name: "VOR or GPS",
    airport: "IRFD",
    author: "Aeronav",
    category: "APP",
    runways: ["07L", "07C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-37.png"
},
{
    id: 35,
    name: "RIVER PASS VISUAL",
    airport: "IRFD",
    author: "Aeronav",
    category: "APP",
    runways: ["07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-38.png"
},
{
    id: 36,
    name: "DYNAMIX VALLEY VISUAL",
    airport: "IRFD",
    author: "Aeronav",
    category: "APP",
    runways: ["07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-39.png"
},
{
    id: 37,
    name: "SHORELINE VISUAL",
    airport: "IRFD",
    author: "Aeronav",
    category: "APP",
    runways: ["07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Aeronav/IRFD_RFD Charts - Aeronav (nova_av, sweet_kid, midwestavgeek, poppyys_journal, sxelent)-40.png"
},
{
    id: 38,
    name: "Ground Chart",
    airport: "IRFD",
    author: "Official",
    category: "GND",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/Official/IRFD Ground Chart.png"
},
{
    id: 39,
    name: "Info 1",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-01.png"
},
{
    id: 40,
    name: "Info 2",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-02.png"
},
{
    id: 41,
    name: "Info 3",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-03.png"
},
{
    id: 42,
    name: "Info 4",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-04.png"
},
{
    id: 43,
    name: "Info 5",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-05.png"
},
{
    id: 44,
    name: "Info 6",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-06.png"
},
{
    id: 45,
    name: "Info 7",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-07.png"
},
{
    id: 46,
    name: "Info 8",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-08.png"
},
{
    id: 47,
    name: "Aerodrome Chart",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "GND",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-10.png"
},
{
    id: 48,
    name: "Aerodrome Parking",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "GND",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-11.png"
},
{
    id: 49,
    name: "LAZER 1R",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["07R", "07C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-12.png"
},
{
    id: 50,
    name: "LAZER 1Y",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["07R", "07C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-12.png"
},
{
    id: 50,
    name: "LAZER 1S",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["25R", "25C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-12.png"
},
{
    id: 51,
    name: "LAZER 1Z",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["25R", "25C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-12.png"
},
{
    id: 52,
    name: "SETHR 1R",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["07R", "07C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-12.png"
},
{
    id: 53,
    name: "SETHR 1Y",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["07R", "07C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-12.png"
},
{
    id: 54,
    name: "HAWFA 1S",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["25R", "25C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-12.png"
},
{
    id: 55,
    name: "HAWFA 1Z",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["25R", "25C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-12.png"
},
{
    id: 56,
    name: "BEANS 1R",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["07R", "07C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-13.png"
},
{
    id: 57,
    name: "BEANS 1Y",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["07R", "07C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-13.png"
},
{
    id: 58,
    name: "BEANS 1S",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["25R", "25C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-13.png"
},
{
    id: 59,
    name: "BEANS 1Z",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["25R", "25C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-13.png"
},
{
    id: 60,
    name: "SUNST 1R",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["07R", "07C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-13.png"
},
{
    id: 61,
    name: "SUNST 1Y",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "SID",
    runways: ["07R", "07C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-13.png"
},
{
    id: 62,
    name: "BEANS 1G RNAV1",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "STAR",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-14.png"
},
{
    id: 63,
    name: "LAZER 1G RNAV1",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "STAR",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-15.png"
},
{
    id: 64,
    name: "REAPR 1G RNAV1",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "STAR",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-15.png"
},
{
    id: 65,
    name: "ENDER 1J RNAV1",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "STAR",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-16.png"
},
{
    id: 66,
    name: "SETHR 1J RNAV1",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "STAR",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-16.png"
},
{
    id: 67,
    name: "ILS/DME",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "APP",
    runways: ["07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-17.png"
},
{
    id: 68,
    name: "ILS/DME",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "APP",
    runways: ["07C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-18.png"
},
{
    id: 69,
    name: "ILS/DME",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "APP",
    runways: ["25L"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-19.png"
},
{
    id: 70,
    name: "ILS/DME",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "APP",
    runways: ["25C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-20.png"
},
{
    id: 71,
    name: "ILS/DME",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "APP",
    runways: ["25R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-22.png"
},
{
    id: 72,
    name: "RATS",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-24.png"
},
{
    id: 73,
    name: "RATS SAG",
    airport: "IRFD",
    author: "EzyDubbs AIP",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/EzyDubbs IRFD AIP/IRFD AIP - EzyDubbs, hayd3n_21, AeroSD, somerandomperson9408, SunsetAviator and Laffey-25.png"
},
{
    id: 74,
    name: "Radar MIN ALTS",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-02.png"
},
{
    id: 75,
    name: "Ground Chart",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "GND",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-03.png"
},
{
    id: 76,
    name: "ILS/LOC",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "APP",
    runways: ["25R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-04.png"
},
{
    id: 77,
    name: "ILS/LOC",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "APP",
    runways: ["25C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-05.png"
},
{
    id: 78,
    name: "ILS/LOC",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "APP",
    runways: ["25L"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-06.png"
},
{
    id: 79,
    name: "ILS/LOC",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "APP",
    runways: ["07L"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-07.png"
},
{
    id: 80,
    name: "ILS/LOC",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "APP",
    runways: ["07C"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-08.png"
},
{
    id: 81,
    name: "ILS/LOC",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "APP",
    runways: ["07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-09.png"
},
{
    id: 82,
    name: "ANYMS 1A RNAV RNP",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "SID",
    runways: ["07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-10.png"
},
{
    id: 83,
    name: "LAZER 1A RNAV RNP",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "SID",
    runways: ["07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-10.png"
},
{
    id: 84,
    name: "KENED 1A RNAV RNP",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "SID",
    runways: ["07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-11.png"
},
{
    id: 85,
    name: "BEANS 1A RNAV RNP",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "SID",
    runways: ["07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-12.png"
},
{
    id: 86,
    name: "LAZER 2A RNAV RNP",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "SID",
    runways: ["25L", "25C", "25R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-13.png"
},
{
    id: 87,
    name: "ANYMS 2A RNAV RNP",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "SID",
    runways: ["25L", "25C", "25R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-14.png"
},
{
    id: 88,
    name: "KENED 2A RNAV RNP",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "SID",
    runways: ["25L", "25C", "25R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-15.png"
},
{
    id: 89,
    name: "BEANS 2A RNAV RNP",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "SID",
    runways: ["25L", "25C", "25R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-15.png"
},
{
    id: 90,
    name: "INDEX 4A RNAV",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "STAR",
    runways: ["07L", "07C", "07R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-16.png"
},
{
    id: 91,
    name: "CLEARANCE1 RNAV",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "STAR",
    runways: ["25L", "25C", "25R"],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-17.png"
},
{
    id: 92,
    name: "CTRL ZONE/CTRL AREA",
    airport: "IRFD",
    author: "RFD Charts (p1anes)",
    category: "GEN",
    runways: [],
    file: "/unified/images/charts/Rockford/IRFD/Chart pack/RFD Chart Pack (by p1anes)/RFD Chart Pack (by p1anes)-18.png"
},
];

const guides = [
    {
        id: 1,
        name: "How to read Charts",
        category: "Tutorial",
        author: "24Flight Team",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
        id: 2,
        name: "VATSIM Communication Guide",
        category: "Communication",
        author: "24Flight Team",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
];

const checklists = [
    {
        id: 1,
        name: "Cessna 172",
        file: "/unified/docs/checklists/C172.pdf",
        image: "/unified/images/checklists/C172_preview.png"
    },
    {
        id: 2,
        name: "Boeing 737",
        file: "/unified/docs/checklists/B737.pdf",
        image: "/unified/images/checklists/B737_preview.png"
    },
    {
        id: 3,
        name: "Airbus A320",
        file: "/unified/docs/checklists/A320.pdf",
        image: "/unified/images/checklists/A320_preview.png"
    }
];

charts.forEach(c => {
  if (!c) return;
  if (typeof c.px === 'undefined') c.px = 0;
  if (typeof c.py === 'undefined') c.py = 0;
  if (typeof c.width === 'undefined') c.width = 48;
  if (typeof c.height === 'undefined') c.height = 48;
});

/*
 * Parse FLPN (Flight Plan) route string
 * Format: DEPARTURE_ICAO SID.Transition WAYPOINTS STAR.Transition ARRIVAL_ICAO
 * @param {string} flpnString - The FLPN route string to parse
 * @returns {Array} Array of waypoint objects with name, type, and coordinates
 */

// Consolidated aircraft definitions (family-level entries) with short codes (no variants)
const aircraftDefinitions = {
  "Airbus A220": { short: "A220", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Airbus A320": { short: "A320", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Airbus A330": { short: "A330", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Airbus A330F": { short: "A330", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Airbus A340": { short: "A340", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Airbus A350": { short: "A350", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Airbus Beluga": { short: "A3ST", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Antonov An-22": { short: "AN22", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Antonov An-225": { short: "AN225", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "ATR-72": { short: "ATR72", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "ATR-72 (Cargo)": { short: "ATR72", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 727": { short: "B727", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 727 (Cargo)": { short: "B727", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 737": { short: "B737", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 737 (Cargo)": { short: "B737", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 747": { short: "B747", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 747 (Cargo)": { short: "B747", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 757": { short: "B757", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 757 (Cargo)": { short: "B757", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 767": { short: "B767", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 767 (Cargo)": { short: "B767", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 777": { short: "B777", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 777 (Cargo)": { short: "B777", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing 787": { short: "B787", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Boeing Dreamlifter": { short: "DLF", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Bombardier CRJ700": { short: "CRJ700", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Bombardier Q400": { short: "Q400", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Cessna Caravan (Cargo)": { short: "C208", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Concorde": { short: "CONC", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "DC-10": { short: "DC10", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "DC-10F": { short: "DC10", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Embraer E190": { short: "E190", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "Lockheed Tristar": { short: "L101", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "McDonnell Douglas MD-11": { short: "MD11", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "McDonnell Douglas MD-11 (Cargo)": { short: "MD11", category: "Cargo", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "McDonnell Douglas MD-90": { short: "MD90", category: "Airliner", group: "Airliner & Cargo", notes: "Permitted wherever spawnable" },
  "A330 MRTT": { short: "A330", category: "Tanker", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "A6M Zero": { short: "A6M", category: "Old Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "Avro Vulcan": { short: "VULC", category: "Old Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "B29": { short: "B29", category: "Old Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "Boeing 707 (AF1)": { short: "B707", category: "Airliner", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "Boeing 737 (AF1)": { short: "B737", category: "Airliner", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "Boeing 747 (AF1)": { short: "B747", category: "Airliner", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "Boeing C-17 Globemaster III": { short: "C17", category: "Modern Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "Boeing P-8 Poseidon": { short: "P8", category: "Modern Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "C-130 Hercules": { short: "C130", category: "Old Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "E-3 Sentry": { short: "E3TF", category: "Modern Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "EC-18B": { short: "C135", category: "Modern Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "F4U Corsair": { short: "CORS", category: "Old Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "Fokker Dr1": { short: "DR1", category: "Old Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "Hawker Hurricane": { short: "HURI", category: "Old Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "KC-1": { short: "L101", category: "Tanker", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "KC-130": { short: "C30J", category: "Tanker", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "KC-707": { short: "B703", category: "Tanker", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "KC-767": { short: "B762", category: "Tanker", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "P-51 Mustang": { short: "P51", category: "Old Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  "P38 Lightning": { short: "P38", category: "Old Military", group: "De-Restricted Military", notes: "Permitted wherever spawnable" },
  // Helicopters / light
  "Airbus H135": { short: "H135", category: "Helicopter", group: "Light & Amphibous & Helicopter", notes: "Permitted wherever spawnable" },
  "Bell 412": { short: "B412", category: "Helicopter", group: "Light & Amphibous & Helicopter", notes: "Permitted wherever spawnable" },
  "Blimp": { short: "SHIP", category: "Random", group: "Light & Amphibous & Helicopter", notes: "Permitted wherever spawnable" },
  "Bombardier Learjet": { short: "LJ45", category: "Light", group: "Light & Amphibous & Helicopter", notes: "Permitted wherever spawnable" },
  "Cessna 172": { short: "C172", category: "Light", group: "Light & Amphibous & Helicopter", notes: "Permitted wherever spawnable" },
  "Cessna 172 (Amphibious)": { short: "C172", category: "Amphibious", group: "Light & Amphibous & Helicopter", notes: "Permitted wherever spawnable" },
  "Cessna 182": { short: "C182", category: "Light", group: "Light & Amphibous & Helicopter", notes: "Permitted wherever spawnable" },
  "Cessna 182 (Amphibious)": { short: "C182", category: "Amphibious", group: "Light & Amphibous & Helicopter", notes: "Permitted wherever spawnable" },
  "Cessna 402": { short: "C402", category: "Light", group: "Light & Amphibous & Helicopter", notes: "Permitted wherever spawnable" },
  "Cessna Caravan": { short: "C208", category: "Light", group: "Light & Amphibous & Helicopter", notes: "Permitted wherever spawnable" },
  "DHC-6 Twin Otter": { short: "DHC6", category: "Light", group: "Light & Amphibous & Helicopter", notes: "Permitted wherever spawnable" },
  "Extra 300s": { short: "E300", category: "Light", group: "Light & Amphibous & Helicopter", notes: "Permitted wherever spawnable" },
  // Misc/Not permitted
  "Caproni Stipa": { short: "STIPA", category: "Random", group: "N/A", notes: "Not permitted on ATC24" },
  "Derek's Creation": { short: "ULAC", category: "Random", group: "N/A", notes: "Not permitted on ATC24" },
  "Hot Air Balloon": { short: "BALL", category: "Random", group: "N/A", notes: "Not permitted on ATC24" },
  "Military UFO": { short: "UFO", category: "Random", group: "N/A", notes: "Not permitted on ATC24" }
};

// Derive compact maps for compatibility: fullName -> short, and short -> fullName
const aircraftNames = {};
const aircraftCodes = {};
Object.entries(aircraftDefinitions).forEach(([fullName, def]) => {
  const short = def && def.short ? def.short : (fullName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 5));
  aircraftNames[fullName] = short;
  // Avoid overwriting if short already exists; keep first mapping
  if (!aircraftCodes[short]) aircraftCodes[short] = fullName;
});

// Ground vehicle area permissions (inside window check block)
if (typeof window !== 'undefined') {
  // Expose to browser window if available (browser context)
  window.airportList = airportList;
  window.aircraftNames = aircraftNames;
  window.aircraftCodes = aircraftCodes;
  window.AIRLINE_MAP = AIRLINE_MAP;
  window.Tiles = Tiles;
  window.Fixes = Fixes;
  window.SIDS_STARS = SIDS_STARS;

  const vehicleAreas = [
    { name: "737 Stair Truck", category: "Ground Crew Vehicle", class: "Category 1", notes: "Only permitted on GC service roads and aircraft stands" },
    { name: "Baggage Truck", category: "Ground Crew Vehicle", class: "Category 1", notes: "Only permitted on GC service roads and aircraft stands" },
    { name: "Catering Truck", category: "Ground Crew Vehicle", class: "Category 1", notes: "Only permitted on GC service roads and aircraft stands" },
    { name: "Pickup (Airfield Operations)", category: "Ground Crew Vehicle", class: "Category 1", notes: "Only permitted on GC service roads and aircraft stands" },
    { name: "Pickup (White)", category: "Ground Crew Vehicle", class: "Category 1", notes: "Only permitted on GC service roads and aircraft stands" },
    { name: "Small Baggage Truck", category: "Ground Crew Vehicle", class: "Category 1", notes: "Only permitted on GC service roads and aircraft stands" },
    { name: "Stair Truck", category: "Ground Crew Vehicle", class: "Category 1", notes: "Only permitted on GC service roads and aircraft stands" },
    { name: "Terminal Bus", category: "Ground Crew Vehicle", class: "Category 1", notes: "Only permitted on GC service roads and aircraft stands" },
    { name: "Fire Engine", category: "Ground Crew Vehicle", class: "Category 2", notes: "Only permitted on GC service roads and aircraft stands - permitted on taxiways and runways during emergencies" },
    { name: "Fuel Truck (Green)", category: "Ground Crew Vehicle", class: "Category 2", notes: "Only permitted on GC service roads and aircraft stands - permitted on taxiways and runways during emergencies" },
    { name: "Fuel Truck (Orange)", category: "Ground Crew Vehicle", class: "Category 2", notes: "Only permitted on GC service roads and aircraft stands - permitted on taxiways and runways during emergencies" },
    { name: "Fuel Truck (White)", category: "Ground Crew Vehicle", class: "Category 2", notes: "Only permitted on GC service roads and aircraft stands - permitted on taxiways and runways during emergencies" },
    { name: "Fuel Truck Small (Green)", category: "Ground Crew Vehicle", class: "Category 2", notes: "Only permitted on GC service roads and aircraft stands - permitted on taxiways and runways during emergencies" },
    { name: "Large Fire Engine", category: "Ground Crew Vehicle", class: "Category 2", notes: "Only permitted on GC service roads and aircraft stands - permitted on taxiways and runways during emergencies" },
    { name: "Long Bar Pushback Tug", category: "Ground Crew Vehicle", class: "Category 2", notes: "Only permitted on GC service roads and aircraft stands - permitted on taxiways and runways during emergencies" },
    { name: "Pickup (Police)", category: "Ground Crew Vehicle", class: "Category 2", notes: "Only permitted on GC service roads and aircraft stands - permitted on taxiways and runways during emergencies" },
    { name: "Pushback Tug", category: "Ground Crew Vehicle", class: "Category 2", notes: "Only permitted on GC service roads and aircraft stands - permitted on taxiways and runways during emergencies" },
    { name: "Pushback Tug Small", category: "Ground Crew Vehicle", class: "Category 2", notes: "Only permitted on GC service roads and aircraft stands - permitted on taxiways and runways during emergencies" },
    { name: "Pickup (Follow Me)", category: "Ground Crew Vehicle", class: "Category 3", notes: "Permitted on GC service roads, aircraft stands, and taxiways" },
    { name: "RHIB Rescue Boat", category: "Coast Guard Vehicle", class: "N/A", notes: "Not Permitted on ATC 24" }
  ];

  // Expose new data structures to the window for frontend use
  window.aircraftDefinitions = aircraftDefinitions;
  window.vehicleAreas = vehicleAreas;
  // Build useful chart indexes for quick lookups and grouping
  const chartsByAirport = {};
  const chartsByCategory = {};
  const chartNameMap = {};
  charts.forEach(c => {
    if (!c || !c.airport) return;
    chartsByAirport[c.airport] = chartsByAirport[c.airport] || [];
    chartsByAirport[c.airport].push(c);
    chartsByCategory[c.category] = chartsByCategory[c.category] || [];
    chartsByCategory[c.category].push(c);
    if (c.name) chartNameMap[c.name.toLowerCase()] = c;
    if (c.file) chartNameMap[c.file.toLowerCase()] = c;
  });
  window.charts = charts;
  window.chartsByAirport = chartsByAirport;
  window.chartsByCategory = chartsByCategory;
  window.chartNameMap = chartNameMap;

  // Helper to find a chart for a given procedure name and airport
  window.findChartForProcedure = function (airport, procedureName) {
    if (!procedureName) return null;
    const needle = procedureName.toLowerCase();
    const list = chartsByAirport[airport] || charts;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (!c) continue;
      if ((c.name && c.name.toLowerCase().includes(needle)) || (c.file && c.file.toLowerCase().includes(needle))) return c;
    }
    return null;
  };

  window.guides = guides;
  window.checklists = checklists;

  console.log("Data exposed");
}
console.log("Data JS Loaded");