const airportList = [
    // Rockford
    { name: "IRFD", airport: "Greater Rockford Airport", airspace: "Class C", px: 6844.02, py: 9947, size: 32, type: "aprt.serv.twr" },
    { name: "IMLR", airport: "Mellor Airport", airspace: "Class D", px: 4510.23, py: 9082.34, size: 32, type: "aprt.serv.twr" },
    { name: "ITRC", airport: "Training Centre", airspace: "Class G", px: 7040.13, py: 11408.45, size: 32, type: "aprt" },
    { name: "IGAR", airport: "Air Base Garry", airspace: "Class D Military", px: 5001.56, py: 10434.38, size: 32, type: "aprt.mltry.twr" },
    { name: "IBLT", airport: "Boltic Airfield", airspace: "Class D", px: 5698.83, py: 9500.39, size: 32, type: "aprt.priv.twr" },
    { name: "OWO", airport: "Rockford Seabase", airspace: "Class G", px: 6375, py: 8871.88, size: 32, type: "aprt.seabase" },
    { name: "RFDCG", airport: "Rockford Coast Guard", airspace: "Class G Restricted", px: 5574.54, py: 10166.87, size: 32, type: "aprt.seabase" },
    { name: "RFDRB", airport: "Rockford Roadbase", airspace: "Class G", px: 6103.77, py: 9981.25, size: 32, type: "aprt.priv" },

    // Grindavik
    { name: "IGRV", airport: "Grindavik Airport", airspace: "Class D", px: 876.56, py: 6415.23, size: 32, type: "aprt.serv.twr" },
    { name: "TVO", airport: "Grindavik Seabase", airspace: "Class G", px: 1031.93, py: 6777.18, size: 32, type: "aprt.seabase" },
    { name: "GRVCG", airport: "Grindavik Coast Guard", airspace: "Class G Restricted", px: 1009.63, py: 6267.56, size: 32, type: "aprt.seabase" },

    // Sauthemptona
    { name: "ISAU", airport: "Sauthemptona Airport", airspace: "Class D", px: 622.66, py: 10986.33, size: 32, type: "aprt.serv.twr" },
    { name: "OILRIG", airport: "North Sea Oil Rig", airspace: "Class G Restricted", px: 1370.56, py: 9110.64, size: 32, type: "aprt.seabase" },

    // Cyprus
    { name: "IHEN", airport: "Henstridge Airfield", airspace: "Class G", px: 9957.5, py: 13120.7, size: 32, type: "aprt.priv" },
    { name: "IIAB", airport: "Island International Air Base", airspace: "Class D Military", px: 10857.81, py: 12953.13, size: 32, type: "aprt.mltry.twr" },
    { name: "ILAR", airport: "Larnaca International Airport", airspace: "Class C", px: 10651.9, py: 11682.73, size: 32, type: "aprt.serv.twr" },
    { name: "IPAP", airport: "Paphos International Airport", airspace: "Class C", px: 12044.53, py: 12087.11, size: 32, type: "aprt.serv.twr" },
    { name: "IBAR", airport: "Barra Airport", airspace: "Class D", px: 11507.42, py: 12550.39, size: 32, type: "aprt.serv.twr" },

    // Skopelos
    { name: "ISKP", airport: "Skopelos Airport", airspace: "Class D", px: 11196.59, py: 8865.9, size: 32, type: "aprt.serv.twr" },

    // Izolirani
    { name: "IZOL", airport: "Izolirani International Airport", airspace: "Class C", px: 14189.06, py: 7529.69, size: 32, type: "aprt.serv.twr" },
    { name: "ISCM", airport: "RAF Scampton", airspace: "Class D Military", px: 12846.88, py: 6234.38, size: 32, type: "aprt.mltry.twr" },
    { name: "IZOCG", airport: "Izolirani Coast Guard", airspace: "Class G Restricted", px: 13182.29, py: 7488.36, size: 32, type: "aprt.seabase" },
    { name: "IJAF", airport: "Al Najaf Airfield", airspace: "Class D", px: 14351.56, py: 6953.13, size: 32, type: "aprt.priv.twr" },
    { name: "IZORB", airport: "Izolirani Roadbase", airspace: "Class G", px: 13669.53, py: 6791.02, size: 32, type: "aprt.priv" },

    // Saint Barts
    { name: "IBTH", airport: "Saint Barthelemy Airport", airspace: "Class D", px: 8238.9, py: 6231.38, size: 32, type: "aprt.serv.twr" },

    // Perth
    { name: "IPPH", airport: "Perth International Airport", airspace: "Class C", px: 9914.96, py: 3802.91, size: 32, type: "aprt.serv.twr" },
    { name: "ILKL", airport: "Lukla Airport", airspace: "Class D", px: 10748.02, py: 4428.26, size: 32, type: "aprt.serv.twr" },
    { name: "SHV", airport: "Perth Seabase", airspace: "Class G", px: 10942.48, py: 3763.13, size: 32, type: "aprt.seabase" },
    { name: "PERCG", airport: "Perth Coast Guard", airspace: "Class G Restricted", px: 10449.78, py: 4719.87, size: 32, type: "aprt.seabase" },

    // Orenji
    { name: "ITKO", airport: "Tokyo International Airport", airspace: "Class C", px: 6266.73, py: 2127.95, size: 32, type: "aprt.serv.twr" },
    { name: "ORNCG", airport: "Tokyo Coast Guard", airspace: "Class G Restricted", px: 5705.74, py: 1533.54, size: 32, type: "aprt.seabase" },
    { name: "ORNRB", airport: "Tokyo Roadbase", airspace: "Class G", px: 5907.66, py: 967.85, size: 32, type: "aprt.priv" },
    { name: "IDCS", airport: "Saba Airport", airspace: "Class G", px: 6651.22, py: 190.03, size: 32, type: "aprt.priv" },
    { name: "IBRD", airport: "Bird Island Airfield", airspace: "Class G", px: 7145.6, py: 1015.5, size: 32, type: "aprt.twr" }
]

const aircraftNames = {
    "A10 Warthog": "A10",
    "An 225": "A225",
    "Airbus A320": "A320",
    "A330 MRTT": "A332",
    "Airbus A330": "A333",
    "Airbus A340": "A343",
    "Airbus A350": "A359",
    "Airbus A380": "A388",
    "Airbus Beluga": "A3ST",
    "An22": "AN22",
    "ATR72": "AT76",
    "ATR72F": "AT76",
    "B1 Lancer": "B1",
    "B2 Spirit Bomber": "B2",
    "B29 SuperFortress": "B29",
    "Bell 412": "B412",
    "Bell 412 Rescue": "B412",
    "707AF1": "B703",
    "Boeing 707": "B703",
    "KC-707": "B703",
    "Boeing 727": "B722",
    "Boeing 727 Cargo": "B722",
    "C40": "B737",
    "Boeing 737": "B738",
    "Boeing 737 Cargo": "B738",
    "747AF1": "B742",
    "Boeing 747": "B744",
    "Boeing 747 Cargo": "B744",
    "Boeing 757": "B752",
    "Boeing 757 Cargo": "B752",
    "C-32": "B752",
    "KC767": "B762",
    "Boeing 767": "B763",
    "Boeing 767 Cargo": "B763",
    "Boeing 777 Cargo": "B77L",
    "Boeing 777": "B77W",
    "Boeing 787": "B789",
    "Balloon": "BALL",
    "Airbus A220": "BCS1",
    "KingAir 260": "BE20",
    "DreamLifter": "BLCF",
    "C130 Hercules": "C130",
    "EC-18B": "C135",
    "C17": "C17",
    "Cessna 172": "C172",
    "Cessna 172 Amphibian": "C172",
    "Cessna 172 Student": "C172",
    "Cessna 182": "C182",
    "Cessna 182 Amphibian": "C182",
    "Cessna Caravan": "C208",
    "Cessna Caravan Amphibian": "C208",
    "Cessna Caravan Cargo": "C208",
    "KC130J": "C30J",
    "Cessna 402": "C402",
    "Concorde": "CONC",
    "Diamond DA50": "DA50",
    "F4U Corsair": "CORS",
    "Bombardier CRJ700": "CRJ7",
    "Bombardier Q400": "DH8D",
    "DHC-6 Twin Otter": "DHC6",
    "DHC-6 Twin Otter Amphibian": "DHC6",
    "Fokker Dr1": "DR1",
    "E190": "E190",
    "Extra 300s": "E300",
    "E-3 Sentry": "E3TF",
    "H135": "EC35",
    "Eurofighter Typhoon": "EUFI",
    "F14": "F14",
    "F15": "F15",
    "F16": "F16",
    "F/A-18 Super Hornet": "F18S",
    "F22": "F22",
    "F35": "F35",
    "F4 Phantom": "F4",
    "Chinook": "H47",
    "UH-60": "H60",
    "UH-60 Coast Guard": "H60",
    "Harrier": "HAR",
    "Hawk T1": "HAWK",
    "Hurricane": "HURI",
    "Piper Cub": "J3",
    "Piper Cub Amphibian": "J3",
    "KC-1": "L101",
    "Lockheed Tristar": "L101",
    "Bombardier Learjet 45": "LJ45",
    "English Electric Lightning": "LTNG",
    "Douglas MD11": "MD11",
    "Douglas MD11 Cargo": "MD11",
    "Douglas MD90": "MD90",
    "Mig-15": "MG15",
    "Piper PA28181": "P28A",
    "P38 Lightning": "P38",
    "P51 Mustang": "P51",
    "P8": "P8",
    "Paratrike": "PARA",
    "Sikorsky S92": "S92",
    "Sikorsky S92 Coast Guard": "S92",
    "Gripen": "SB39",
    "Cirrus Vision": "SF50",
    "Blimp": "SHIP",
    "CaravanBlimp": "SHIP",
    "Sled": "SLEI",
    "SR71 BlackBird": "SR71",
    "SU27": "SU27",
    "SU57": "SU57",
    "Derek Plane": "ULAC",
    "Avro Vulcan": "VULC",
    "Wright Brothers Plane": "WF",
    "A6M Zero": "A6M",
}

const aircraftCodes = {
    "A10": "A10 Warthog",
    "A225": "An 225",
    "A320": "Airbus A320",
    "A332": "A330 MRTT",
    "A333": "Airbus A330",
    "A343": "Airbus A340",
    "A359": "Airbus A350",
    "A388": "Airbus A380",
    "A3ST": "Airbus Beluga",
    "AN22": "An22",
    "AT76": "ATR72F",
    "B1": "B1 Lancer",
    "B2": "B2 Spirit Bomber",
    "B29": "B29 SuperFortress",
    "B412": "Bell 412 Rescue",
    "B703": "KC-707",
    "B722": "Boeing 727 Cargo",
    "B737": "C40",
    "B738": "Boeing 737 Cargo",
    "B742": "747AF1",
    "B744": "Boeing 747 Cargo",
    "B752": "C-32",
    "B762": "KC767",
    "B763": "Boeing 767 Cargo",
    "B77L": "Boeing 777 Cargo",
    "B77W": "Boeing 777",
    "B789": "Boeing 787",
    "BALL": "Balloon",
    "BCS1": "Airbus A220",
    "BE20": "KingAir 260",
    "BLCF": "DreamLifter",
    "C130": "C130 Hercules",
    "C135": "EC-18B",
    "C17": "C17",
    "C172": "Cessna 172 Student",
    "C182": "Cessna 182 Amphibian",
    "C208": "Cessna Caravan Cargo",
    "C30J": "KC130J",
    "C402": "Cessna 402",
    "CONC": "Concorde",
    "DA50": "Diamond DA50",
    "CORS": "F4U Corsair",
    "CRJ7": "Bombardier CRJ700",
    "DH8D": "Bombardier Q400",
    "DHC6": "DHC-6 Twin Otter Amphibian",
    "DR1": "Fokker Dr1",
    "E190": "E190",
    "E300": "Extra 300s",
    "E3TF": "E-3 Sentry",
    "EC35": "H135",
    "EUFI": "Eurofighter Typhoon",
    "F14": "F14",
    "F15": "F15",
    "F16": "F16",
    "F18S": "F/A-18 Super Hornet",
    "F22": "F22",
    "F35": "F35",
    "F4": "F4 Phantom",
    "H47": "Chinook",
    "H60": "UH-60 Coast Guard",
    "HAR": "Harrier",
    "HAWK": "Hawk T1",
    "HURI": "Hurricane",
    "J3": "Piper Cub Amphibian",
    "L101": "Lockheed Tristar",
    "LJ45": "Bombardier Learjet 45",
    "LTNG": "English Electric Lightning",
    "MD11": "Douglas MD11 Cargo",
    "MD90": "Douglas MD90",
    "MG15": "Mig-15",
    "P28A": "Piper PA28181",
    "P38": "P38 Lightning",
    "P51": "P51 Mustang",
    "P8": "P8",
    "PARA": "Paratrike",
    "S92": "Sikorsky S92 Coast Guard",
    "SB39": "Gripen",
    "SF50": "Cirrus Vision",
    "SHIP": "CaravanBlimp",
    "SLEI": "Sled",
    "SR71": "SR71 BlackBird",
    "SU27": "SU27",
    "SU57": "SU57",
    "ULAC": "Derek Plane",
    "VULC": "Avro Vulcan",
    "WF": "Wright Brothers Plane",
    "A6M": "A6M Zero"
};

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
    'Yeti Airlines': { icao: 'NYT', radio: 'Yeti Airlines', ingame: 'Beti' },
    'Wizz Air': { icao: 'WZZ', radio: 'Wizz Air', ingame: 'BizzAir' },
    'Swiss': { icao: 'SWR', radio: 'Swiss', ingame: 'Bliss' },
    'British Airways': { icao: 'BAW', radio: 'Speedbird', ingame: 'Speedbird' },
    'Ryanair': { icao: 'RYR', radio: 'Ryanair', ingame: 'Byanair' },
    'Cathay Pacific': { icao: 'CPA', radio: 'Cathay', ingame: 'Cafey' },
    'Cebu Pacific': { icao: 'CEB', radio: 'Cebu Air', ingame: 'Cebu' },
    'Pan Am': { icao: 'PAA', radio: 'Clipper', ingame: 'Clipper' },
    'Condor': { icao: 'CFG', radio: 'Condor', ingame: 'Doncor' },
    'Emirates': { icao: 'UAE', radio: 'Emirates', ingame: 'Emarates' },
    'Flybe': { icao: 'BEE', radio: 'Jersey', ingame: 'Flybee' },
    'EasyJet': { icao: 'EZY', radio: 'Easy', ingame: 'Hardjet' },
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

// module.exports moved to bottom to ensure Tiles/Fixes are available

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

const Fixes = [
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
    { name: "PEMDA", px: -138.56, py: 3160.92, size: 32, type: "waypoint" },
    { name: "ATCAG", px: 233.99, py: 3203.53, size: 32, type: "waypoint" },
    { name: "HEMOS", px: 654.23, py: 3363.8, size: 32, type: "waypoint" },
    { name: "BOLRO", px: 977.54, py: 3495.63, size: 32, type: "waypoint" },
    { name: "LIZAD", px: 1238.58, py: 3939.4, size: 32, type: "waypoint" },
    { name: "BAKUR", px: 1365.91, py: 4281.29, size: 32, type: "waypoint" },
    { name: "XAMAB", px: 2725.21, py: 4339.17, size: 32, type: "waypoint" },
    { name: "LEGOS", px: 4733.34, py: 3580.41, size: 32, type: "waypoint" },
    { name: "DOPLI", px: 4382.55, py: 3398, size: 32, type: "waypoint" },
    { name: "GURLU", px: 3037.85, py: 4061.58, size: 32, type: "waypoint" },
    { name: "EVRIN", px: 3315.56, py: 3918.92, size: 32, type: "waypoint" },
    { name: "BANBA", px: 3302.7, py: 3726.57, size: 32, type: "waypoint" },
    { name: "CYRUS", px: 3498.29, py: 3594.2, size: 32, type: "waypoint" },
    { name: "BAMOS", px: 3736.41, py: 3521.44, size: 32, type: "waypoint" },
    { name: "SIGFO", px: 3876.97, py: 3487.54, size: 32, type: "waypoint" },
    { name: "KAVEL", px: 4031.59, py: 3443.72, size: 32, type: "waypoint" },
    { name: "SIZZL", px: 3231.22, py: 3380.05, size: 32, type: "waypoint" },
    { name: "KALIN", px: 3173.35, py: 3166.73, size: 32, type: "waypoint" },
    { name: "MIKOS", px: 3416.43, py: 2892.23, size: 32, type: "waypoint" },
    { name: "MENOA", px: 3599.99, py: 2816.16, size: 32, type: "waypoint" },
    { name: "APRIL", px: 3864.57, py: 2721.9, size: 32, type: "waypoint" },
    { name: "TIDAR", px: 4221.76, py: 2682.21, size: 32, type: "waypoint" },
    { name: "KIGOB", px: 4269.71, py: 3214.69, size: 32, type: "waypoint" },
    { name: "TIDAR", px: 4221.76, py: 2682.21, size: 32, type: "waypoint" },
    { name: "HEMAN", px: 4259.79, py: 2979.87, size: 32, type: "waypoint" },
    { name: "OPADO", px: 3703.34, py: 2628.47, size: 32, type: "waypoint" },
    { name: "BENJA", px: 3700.86, py: 2371.33, size: 32, type: "waypoint" },
    { name: "TIKNE", px: 3717.22, py: 2027.57, size: 32, type: "waypoint" },
    { name: "APATE", px: 4224.11, py: 1975.54, size: 32, type: "waypoint" },
    { name: "GAIAS", px: 4615.24, py: 1703.68, size: 32, type: "waypoint" },
    { name: "AKUNO", px: 3431.32, py: 2038.95, size: 32, type: "waypoint" },
    { name: "RUNDA", px: 3398.24, py: 1935.59, size: 32, type: "waypoint" },
    { name: "SIGNA", px: 3283.99, py: 1648.13, size: 32, type: "waypoint" },
    { name: "GARDE", px: 3071.76, py: 844.24, size: 32, type: "waypoint" },
    { name: "OLEPI", px: 3065.92, py: 1148.26, size: 32, type: "waypoint" },
    { name: "OLESA", px: 2621.87, py: 1538.22, size: 32, type: "waypoint" },
    { name: "BORDO", px: 2282.19, py: 1537.34, size: 32, type: "waypoint" },
    { name: "INABI", px: 1500.8, py: 1314.54, size: 32, type: "waypoint" },
    { name: "ELMAS", px: 1544.65, py: 1484.43, size: 32, type: "waypoint" },
    { name: "EMBED", px: 1553.19, py: 1927.94, size: 32, type: "waypoint" },
    { name: "AVBIT", px: 1418.83, py: 2234.08, size: 32, type: "waypoint" },
    { name: "MOTOX", px: 978.96, py: 3189.06, size: 32, type: "waypoint" },
    { name: "GODOS", px: 978.13, py: 2759.93, size: 32, type: "waypoint" },
    { name: "SLANY", px: 1048.41, py: 2601.18, size: 32, type: "waypoint" },
    { name: "BEREP", px: 1594.11, py: 2374.64, size: 32, type: "waypoint" },
    { name: "DESUL", px: 2088.55, py: 2518.5, size: 32, type: "waypoint" },
    { name: "IBALO", px: 2086.9, py: 2525.12, size: 32, type: "waypoint" },
    { name: "LUGIS", px: 2379.6, py: 2604.49, size: 32, type: "waypoint" },
    { name: "GODOS", px: 2586.3, py: 2664.02, size: 32, type: "waypoint" },
    { name: "WESEL", px: 2826.21, py: 2732.66, size: 32, type: "waypoint" },
    { name: "GAPLI", px: 2995.76, py: 2836.73, size: 32, type: "waypoint" },

    //---------------------------------------AIRPORT------------------------------------------//
    //-------------EZY ENROUTE------------//

    //all airports are vor/dme
    // Rockford
    /*
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
     */
    //---------------------------------------MINOR/APPROACH FIXES------------------------------------------//
    //{ name: "", px: , py: , size: 16, type: "waypoint" },

    //---------------------------------------VORTAC/OTHER FIX------------------------------------------//
    //all have shortened name of 3 letters normally + need to make sure they cna't be "fixes" too
    { name: "BAR", short: "", px: 603.95, py: 4038.48, size: 32, type: "vortac" }, //Barnie
    { name: "HUT", px: 4223.41, py: 4528.51, size: 32, type: "vortac" }, //hunter
    { name: "GOL", px: 77.18, py: 2305.87, size: 16, type: "vortac" }, //GOLDEN
    { name: "KRO", px: -81.03, py: 3733.93, size: 16, type: "vortac" }, //KROTEN
    { name: "HAW", px: 524.21, py: 2115.01, size: 16, type: "vortac" }, //hawkin
    { name: "BLA", px: 2200.63, py: 3225.53, size: 16, type: "vordme" }, //BLADES
    { name: "CAN", px: 3165.08, py: 4512.8, size: 16, type: "vortac" }, //CANDLE
    { name: "DIR", px: 3299.78, py: 4774.27, size: 16, type: "vortac" }, //DIRECTOR
    { name: "KIN", px: 4220.1, py: 3897.64, size: 16, type: "vortac" }, //KINDLE
    { name: "DET", px: 5127.13, py: 3375.09, size: 16, type: "vortac" }, //detox
    { name: "CLR", px: 3726.49, py: 3224.61, size: 16, type: "vortac" }, //CLEARANCE
    { name: "DEL", px: 4140.73, py: 3035.27, size: 16, type: "vortac" }, //DELIVERY
    { name: "DIZ", px: 5224.69, py: 2678.08, size: 16, type: "vortac" }, //DIZZIER
    { name: "TRE", px: 4514.87, py: 2469.72, size: 16, type: "vortac" }, //TRESIN
    { name: "ORG", px: 3643.55, py: 1626.5, size: 16, type: "vortac" }, //ORANGE
    { name: "BTM", px: 3938.22, py: 1384.46, size: 16, type: "vortac" }, //BRAINSTORM
    { name: "COC", px: 3463.15, py: 984.33, size: 16, type: "vortac" }, //CROIS NOOB
    { name: "ROM", px: 3105.67, py: 1863.29, size: 16, type: "vortac" }, //ROMENS
    { name: "VOX", px: 3230.79, py: 2200.63, size: 16, type: "vortac" }, //VONARX
    { name: "RES", px: 2619.24, py: 2218.17, size: 16, type: "vortac" }, //RESURGE
    { name: "HOT", px: 12846.88, py: 6234.38, size: 16, type: "tacan" }, //at iscm
    { name: "IGAR", px: 5001.56, py: 10434.38, size: 16, type: "tacan" }
];

const SIDS_STARS = [

    // --- LAZER Departures ---
    {
        name: "LAZER1R",
        type: "SID",
        airport: "IRFD",
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
        waypoints: [
            { name: "LAZER", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 0 },
            { name: "TRN", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 }
        ]
    },
    {
        name: "REAPR1G",
        type: "STAR",
        airport: "IRFD",
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
        waypoints: [
            { name: "SETHR", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 0 },
            { name: "KUNAV", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
            { name: "BLADE", altitude: { max: 4000 }, speed: { max: 250 }, heading: 0 },
            { name: "FLUDO", altitude: { exact: 4000 }, speed: { max: 250 }, heading: 0 }
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

/* ========== TEST DATA (PTFS COORDINATES) - COMMENTED OUT ==========
CONVERSION FORMULA (from index.js):
const ptfsBounds = { top_left: { x: -49222.1, y: -45890.8 }, bottom_right: { x: 47132.9, y: 46139.2 } };
const imageWidth = 28906, imageHeight = 23060;
const ptfsCenter = { x: -1044.6, y: 124.2 };
const ptfsWidth = 96355, ptfsHeight = 92030;
const scale = Math.min(imageWidth / ptfsWidth, imageHeight / ptfsHeight) ≈ 0.2506;
const offsetY = 8;

To convert PTFS (x, y) to pixel (px, py):
    adjustedY = y - offsetY;
    dx = x - ptfsCenter.x;
    dy = adjustedY - ptfsCenter.y;
    px = (imageWidth / 2) + dx * scale;
    py = (imageHeight / 2) - dy * scale;

const TEST_Fixes = [
    // Waypoints (using raw PTFS x, y coords - need conversion to px, py)
    { name: "SHELL", x: -8831, y: -13465, size: 16, type: "waypoint" },
    { name: "NIKON", x: -4080, y: -14120, size: 16, type: "waypoint" },
    { name: "CHILY", x: 1105, y: -13550, size: 16, type: "waypoint" },
    { name: "SHIBA", x: -6160, y: -12582, size: 16, type: "waypoint" },
    { name: "LETSE", x: -1636, y: -11728, size: 16, type: "waypoint" },
    { name: "HONDA", x: 2057, y: -11740, size: 16, type: "waypoint" },
    { name: "ASTRO", x: -5257, y: -10239, size: 16, type: "waypoint" },
    { name: "GULEG", x: -7411, y: -8614, size: 16, type: "waypoint" },
    { name: "PIPER", x: -4548, y: -8371, size: 16, type: "waypoint" },
    { name: "ONDER", x: -1999, y: -7691, size: 16, type: "waypoint" },
    { name: "KNIFE", x: 354, y: -8266, size: 16, type: "waypoint" },
    { name: "TUDEP", x: -5461, y: -6087, size: 16, type: "waypoint" },
    { name: "ALLRY", x: 2003, y: -6068, size: 16, type: "waypoint" },
    { name: "CRAZY", x: 6071, y: -11731, size: 16, type: "waypoint" },
    { name: "WOTAN", x: 11278, y: -11117, size: 16, type: "waypoint" },
    { name: "WAGON", x: 14463, y: -10041, size: 16, type: "waypoint" },
    { name: "WELLS", x: 8174, y: -8761, size: 16, type: "waypoint" },
    { name: "SQUID", x: 12005, y: -8705, size: 16, type: "waypoint" },
    { name: "ZESTA", x: 15345, y: -7799, size: 16, type: "waypoint" },
    { name: "TINDR", x: 3397, y: -7470, size: 16, type: "waypoint" },
    { name: "NOONU", x: 9645, y: -6362, size: 16, type: "waypoint" },
    { name: "KELLA", x: 11308, y: -6268, size: 16, type: "waypoint" },
    { name: "STRAX", x: 3969, y: -5783, size: 16, type: "waypoint" },
    { name: "TALIS", x: 8508, y: -3896, size: 16, type: "waypoint" },
    { name: "SISTA", x: 10661, y: -4234, size: 16, type: "waypoint" },
    { name: "UDMUG", x: 16759, y: -4687, size: 16, type: "waypoint" },
    { name: "ROSMO", x: 13171, y: -3197, size: 16, type: "waypoint" },
    { name: "LLIME", x: 17791, y: -2783, size: 16, type: "waypoint" },
    { name: "CAMEL", x: 7009, y: -2107, size: 16, type: "waypoint" },
    { name: "DUNKS", x: 9371, y: -1987, size: 16, type: "waypoint" },
    { name: "MORRD", x: 16766, y: -660, size: 16, type: "waypoint" },
    { name: "CYRIL", x: 8796, y: 146, size: 16, type: "waypoint" },
    { name: "DOGGO", x: 11914, y: 2418, size: 16, type: "waypoint" },
    { name: "ABSRS", x: 18280, y: 2230, size: 16, type: "waypoint" },
    { name: "BILLO", x: 15608, y: 3719, size: 16, type: "waypoint" },
    { name: "JUSTY", x: 12706, y: 5345, size: 16, type: "waypoint" },
    { name: "CHAIN", x: 18280, y: 6323, size: 16, type: "waypoint" },
    { name: "RENTS", x: 8403, y: 7394, size: 16, type: "waypoint" },
    { name: "GRASS", x: 5861, y: 8557, size: 16, type: "waypoint" },
    { name: "JACKI", x: 11226, y: 9834, size: 16, type: "waypoint" },
    { name: "DEBUG", x: 15578, y: 9835, size: 16, type: "waypoint" },
    { name: "BOBUX", x: 13141, y: 11794, size: 16, type: "waypoint" },
    { name: "NUBER", x: 18249, y: 12294, size: 16, type: "waypoint" },
    { name: "AQWRT", x: 4942, y: 12107, size: 16, type: "waypoint" },
    { name: "FORIA", x: 2003, y: 14055, size: 16, type: "waypoint" },
    { name: "MUONE", x: 12727, y: 14065, size: 16, type: "waypoint" },
    { name: "JAZZR", x: 15546, y: 14080, size: 16, type: "waypoint" },
    { name: "FORCE", x: 6820, y: 16297, size: 16, type: "waypoint" },
    { name: "MASEV", x: 9745, y: 16297, size: 16, type: "waypoint" },
    { name: "ALTRS", x: 11977, y: 16297, size: 16, type: "waypoint" },
    { name: "CAWZE", x: 6223, y: 2539, size: 16, type: "waypoint" },
    { name: "ANYMS", x: 4721, y: 6111, size: 16, type: "waypoint" },
    { name: "GERLD", x: -5513, y: -5129, size: 16, type: "waypoint" },
    { name: "RENDR", x: -4152, y: -4793, size: 16, type: "waypoint" },
    { name: "JOOPY", x: -979, y: -5138, size: 16, type: "waypoint" },
    { name: "PROBE", x: -2801, y: -3499, size: 16, type: "waypoint" },
    { name: "DINER", x: 1025, y: -3315, size: 16, type: "waypoint" },
    { name: "WELSH", x: -4166, y: -1503, size: 16, type: "waypoint" },
    { name: "INDEX", x: -2343, y: -233, size: 16, type: "waypoint" },
    { name: "GAVIN", x: 1796, y: 463, size: 16, type: "waypoint" },
    { name: "SILVA", x: 5501, y: 525, size: 16, type: "waypoint" },
    { name: "OCEEN", x: 3556, y: 1752, size: 16, type: "waypoint" },
    { name: "ENDER", x: -6997, y: 228, size: 16, type: "waypoint" },
    { name: "SUNST", x: -8746, y: 1694, size: 16, type: "waypoint" },
    { name: "KENED", x: -4165, y: 1223, size: 16, type: "waypoint" },
    { name: "SETHR", x: 779, y: 2551, size: 16, type: "waypoint" },
    { name: "BUCFA", x: -6824, y: 2906, size: 16, type: "waypoint" },
    { name: "KUNAV", x: -4149, y: 3163, size: 16, type: "waypoint" },
    { name: "SAWPE", x: -9509, y: 3601, size: 16, type: "waypoint" },
    { name: "ICTAM", x: -4771, y: 4152, size: 16, type: "waypoint" },
    { name: "HAWFA", x: -2960, y: 3832, size: 16, type: "waypoint" },
    { name: "QUEEN", x: -1099, y: 5202, size: 16, type: "waypoint" },
    { name: "BEANS", x: -9339, y: 6330, size: 16, type: "waypoint" },
    { name: "LOGAN", x: -7021, y: 6851, size: 16, type: "waypoint" },
    { name: "LAVNO", x: 396, y: 5878, size: 16, type: "waypoint" },
    { name: "ATPEV", x: 1422, y: 5463, size: 16, type: "waypoint" },
    { name: "JAMSI", x: 2563, y: 7477, size: 16, type: "waypoint" },
    { name: "MOGTA", x: -4085, y: 7787, size: 16, type: "waypoint" },
    { name: "EXMOR", x: -6616, y: 8917, size: 16, type: "waypoint" },
    { name: "PEPUL", x: -3163, y: 9612, size: 16, type: "waypoint" },
    { name: "GODLU", x: 767, y: 9133, size: 16, type: "waypoint" },
    { name: "LAZER", x: 2328, y: 9776, size: 16, type: "waypoint" },
    { name: "EMJAY", x: -5262, y: 12030, size: 16, type: "waypoint" },
    { name: "ODOKU", x: -1601, y: 12026, size: 16, type: "waypoint" },
    { name: "TRELN", x: -3746, y: 15204, size: 16, type: "waypoint" },
    { name: "REAPR", x: -804, y: 14678, size: 16, type: "waypoint" },
    { name: "HACKE", x: -18226, y: 6782, size: 16, type: "waypoint" },
    { name: "GEORG", x: -15448, y: 7626, size: 16, type: "waypoint" },
    { name: "SEEKS", x: -12534, y: 8607, size: 16, type: "waypoint" },
    { name: "HECKS", x: -18917, y: 10092, size: 16, type: "waypoint" },
    { name: "PACKT", x: -16560, y: 10740, size: 16, type: "waypoint" },
    { name: "ALDER", x: -9663, y: 11149, size: 16, type: "waypoint" },
    { name: "STACK", x: -13439, y: 11921, size: 16, type: "waypoint" },
    { name: "WASTE", x: -16755, y: 13537, size: 16, type: "waypoint" },
    { name: "HOGGS", x: -10125, y: 13246, size: 16, type: "waypoint" },
    { name: "BULLY", x: -11343, y: -9951, size: 16, type: "waypoint" },
    { name: "FROOT", x: -13443, y: -7445, size: 16, type: "waypoint" },
    { name: "EURAD", x: -9233, y: -6725, size: 16, type: "waypoint" },
    { name: "BOBOS", x: -15602, y: -5374, size: 16, type: "waypoint" },
    { name: "BLANK", x: -8364, y: -4774, size: 16, type: "waypoint" },
    { name: "THENR", x: -13484, y: -4257, size: 16, type: "waypoint" },
    { name: "ACRES", x: -17124, y: -3589, size: 16, type: "waypoint" },
    { name: "YOUTH", x: -11050, y: -2953, size: 16, type: "waypoint" },
    { name: "UWAIS", x: -18809, y: -1925, size: 16, type: "waypoint" },
    { name: "EZYDB", x: -8243, y: -1477, size: 16, type: "waypoint" },
    { name: "FRANK", x: -18618, y: 640, size: 16, type: "waypoint" },
    { name: "CELAR", x: -12680, y: 1690, size: 16, type: "waypoint" },
    { name: "THACC", x: -18651, y: 3458, size: 16, type: "waypoint" },
    { name: "SHREK", x: -15674, y: 3749, size: 16, type: "waypoint" },
    { name: "SPACE", x: -12548, y: 4357, size: 16, type: "waypoint" },

    // VORDMEs
    { name: "HME", x: -2858, y: -10677, size: 32, type: "vordme" },
    { name: "PER", x: 5262, y: -6944, size: 32, type: "vordme" },
    { name: "NJF", x: 15131, y: 61, size: 32, type: "vordme" },
    { name: "IZO", x: 14784, y: 1344, size: 32, type: "vordme" },
    { name: "LCK", x: 6904, y: 10591, size: 32, type: "vordme" },
    { name: "PFO", x: 9998, y: 11471, size: 32, type: "vordme" },
    { name: "RFD", x: -1576, y: 6739, size: 32, type: "vordme" },
    { name: "TRN", x: -1141, y: 9981, size: 32, type: "vordme" },
    { name: "SAU", x: -15642, y: 9049, size: 32, type: "vordme" },
    { name: "GVK", x: -14850, y: -1132, size: 32, type: "vordme" },
    { name: "MLR", x: -6762, y: 4880, size: 32, type: "vordme" },
    { name: "BLA", x: -2928, y: 4985, size: 32, type: "vordme" },

    // VORTACs
    { name: "COC", x: 5016, y: -9129, size: 32, type: "vortac" },
    { name: "BTM", x: 7996, y: -6638, size: 32, type: "vortac" },
    { name: "ORG", x: 6165, y: -5093, size: 32, type: "vortac" },
    { name: "HOT", x: 11783, y: -1544, size: 32, type: "vortac" },
    { name: "TRE", x: 11635, y: 230, size: 32, type: "vortac" },
    { name: "DIZ", x: 16114, y: 1520, size: 32, type: "vortac" },
    { name: "DET", x: 15509, y: 5929, size: 32, type: "vortac" },
    { name: "KIN", x: 9783, y: 9212, size: 32, type: "vortac" },
    { name: "CAN", x: 3122, y: 13072, size: 32, type: "vortac" },
    { name: "DIR", x: 3999, y: 14733, size: 32, type: "vortac" },
    { name: "HUT", x: 9837, y: 13179, size: 32, type: "vortac" },
    { name: "DEL", x: 9276, y: 3783, size: 32, type: "vortac" },
    { name: "CLR", x: 6682, y: 4981, size: 32, type: "vortac" },
    { name: "ROM", x: 2761, y: -3602, size: 32, type: "vortac" },
    { name: "RES", x: -288, y: -1362, size: 32, type: "vortac" },
    { name: "VOX", x: 3602, y: -1482, size: 32, type: "vortac" },
    { name: "GRY", x: -5678, y: 7742, size: 32, type: "vortac" },
    { name: "KRT", x: -17324, y: 8193, size: 32, type: "vortac" },
    { name: "BAR", x: -12987, y: 10091, size: 32, type: "vortac" },
    { name: "HAW", x: -13515, y: -2025, size: 32, type: "vortac" },
    { name: "GOL", x: -16315, y: -798, size: 32, type: "vortac" },
];

const TEST_Airports = [
    { name: "IDCS", x: -1618, y: -14964, size: 32, type: "airport" },
    { name: "ITKO", x: -2456, y: -10651, size: 32, type: "airport" },
    { name: "IPPH", x: 6035, y: -6803, size: 32, type: "airport" },
    { name: "ILKL", x: 7541, y: -5504, size: 32, type: "airport" },
    { name: "IGRV", x: -14386, y: -919, size: 32, type: "airport" },
    { name: "IBTH", x: 1926, y: -1503, size: 32, type: "airport" },
    { name: "ISCM", x: 12037, y: -1667, size: 32, type: "airport" },
    { name: "IJAF", x: 15394, y: 74, size: 32, type: "airport" },
    { name: "IZOL", x: 14924, y: 1140, size: 32, type: "airport" },
    { name: "ISAU", x: -15352, y: 9167, size: 32, type: "airport" },
    { name: "IMLR", x: -6455, y: 4922, size: 32, type: "airport" },
    { name: "IGAR", x: -5424, y: 7885, size: 32, type: "airport" },
    { name: "IRFD", x: -975, y: 6694, size: 32, type: "airport" },
    { name: "IBLT", x: -3742, y: 5822, size: 32, type: "airport" },
    { name: "ILAR", x: 7110, y: 10802, size: 32, type: "airport" },
    { name: "IPAP", x: 10577, y: 11424, size: 32, type: "airport" },
    { name: "IIAB", x: 7740, y: 13450, size: 32, type: "airport" },
    { name: "ITRC", x: -665, y: 10019, size: 32, type: "airport" },
];

*/
// Expose to browser window if available (browser context)
if (typeof window !== 'undefined') {
    window.airportList = airportList;
    window.aircraftNames = aircraftNames;
    window.aircraftCodes = aircraftCodes;
    window.AIRLINE_MAP = AIRLINE_MAP;
    window.Tiles = Tiles;
    window.Fixes = Fixes;
}

// Also export for Node.js if module.exports exists
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        airportList,
        aircraftNames,
        aircraftCodes,
        AIRLINE_MAP,
        Tiles,
        Fixes
    };
}