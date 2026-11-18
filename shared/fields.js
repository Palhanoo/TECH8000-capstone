// Every field a reading can carry. This one list drives the reading detail view,
// the CSV export, the field coverage chart and the data dictionary.
export const FIELD_GROUPS = ["Context", "Location", "Network", "Signal (4G LTE)", "Signal (5G NR)", "Performance", "Device", "Record"];

export const FIELDS = [
  // Context
  { key: "takenAt", group: "Context", label: "Timestamp", unit: "ISO 8601, UTC", desc: "When the reading was taken.", source: "System.currentTimeMillis()", privacy: "public" },
  { key: "tz", group: "Context", label: "Timezone", unit: "IANA name", desc: "Device timezone, so readings can be compared by local time of day.", source: "TimeZone.getDefault()", privacy: "public" },
  { key: "country", group: "Context", label: "Country", desc: "Country of the serving network.", source: "Derived from MCC", privacy: "public" },
  { key: "city", group: "Context", label: "City / area", desc: "Nearest known area.", source: "Reverse geocode (server)", privacy: "public" },
  { key: "campus", group: "Context", label: "Monash campus", desc: "Set when the reading falls inside a Monash campus.", source: "Campus geofence (server)", privacy: "public" },
  { key: "spot", group: "Context", label: "Spot", desc: "Place name typed by the student, e.g. a building or station.", source: "User input", privacy: "public" },
  { key: "environment", group: "Context", label: "Indoor / outdoor", desc: "Tagged by the student. Walls and floors weaken signal, so this matters for analysis.", source: "User input", privacy: "public" },
  { key: "floor", group: "Context", label: "Floor", unit: "level", desc: "Floor level when indoors. 0 is ground, negative is below ground.", source: "User input", privacy: "public" },

  // Location
  { key: "lat", group: "Location", label: "Latitude", unit: "degrees", desc: "Rounded to 2 decimals (about 1 km) when coarse location is on.", source: "Location.getLatitude()", privacy: "sensitive" },
  { key: "lon", group: "Location", label: "Longitude", unit: "degrees", desc: "Rounded to 2 decimals (about 1 km) when coarse location is on.", source: "Location.getLongitude()", privacy: "sensitive" },
  { key: "accuracy", group: "Location", label: "Horizontal accuracy", unit: "m", desc: "GPS confidence radius. Large values mean the position is unreliable.", source: "Location.getAccuracy()", privacy: "public" },
  { key: "altitude", group: "Location", label: "Altitude", unit: "m", desc: "Height above the WGS84 ellipsoid.", source: "Location.getAltitude()", privacy: "public" },
  { key: "speed", group: "Location", label: "Speed", unit: "m/s", desc: "Movement speed. Separates standing readings from walking or travelling.", source: "Location.getSpeed()", privacy: "public" },
  { key: "heading", group: "Location", label: "Heading", unit: "degrees", desc: "Direction of travel, 0 is north.", source: "Location.getBearing()", privacy: "public" },
  { key: "coarse", group: "Location", label: "Coarse location", unit: "true / false", desc: "Whether the coordinates were rounded for privacy.", source: "User setting", privacy: "public" },

  // Network
  { key: "mcc", group: "Network", label: "MCC", desc: "Mobile Country Code of the serving network.", source: "CellIdentity.getMccString()", privacy: "public" },
  { key: "mnc", group: "Network", label: "MNC", desc: "Mobile Network Code. MCC + MNC identifies the carrier exactly.", source: "CellIdentity.getMncString()", privacy: "public" },
  { key: "carrier", group: "Network", label: "Carrier", desc: "Carrier name looked up from MCC + MNC.", source: "Lookup table (server)", privacy: "public" },
  { key: "tech", group: "Network", label: "Technology", desc: "LTE, NR-NSA (5G anchored on 4G), NR-SA (standalone 5G) or 3G.", source: "CellInfo type + TelephonyDisplayInfo", privacy: "public" },
  { key: "band", group: "Network", label: "Band", desc: "Frequency band, e.g. B3 (1800 MHz) or n78 (3500 MHz).", source: "CellIdentityLte.getBands() / CellIdentityNr.getBands()", privacy: "public" },
  { key: "channel", group: "Network", label: "Channel (EARFCN / NR-ARFCN)", desc: "Exact carrier frequency number.", source: "CellIdentityLte.getEarfcn() / CellIdentityNr.getNrarfcn()", privacy: "public" },
  { key: "pci", group: "Network", label: "PCI", desc: "Physical Cell ID. Distinguishes nearby cells; reused across a city.", source: "CellIdentityLte.getPci()", privacy: "public" },
  { key: "cellId", group: "Network", label: "Cell ID (ECI / NCI)", desc: "Globally unique cell identifier. Combined with time it can locate a person, so it is withheld from public exports.", source: "CellIdentityLte.getCi() / CellIdentityNr.getNci()", privacy: "restricted" },
  { key: "tac", group: "Network", label: "TAC", desc: "Tracking Area Code, a group of cells.", source: "CellIdentityLte.getTac()", privacy: "restricted" },
  { key: "roaming", group: "Network", label: "Roaming", unit: "true / false", desc: "Whether the phone is roaming on a foreign network.", source: "ServiceState.getRoaming()", privacy: "public" },
  { key: "neighbours", group: "Network", label: "Neighbour cells", unit: "pci:dBm | ...", desc: "Other cells the phone can hear, with their signal strength.", source: "TelephonyManager.getAllCellInfo()", privacy: "public" },

  // LTE
  { key: "rsrp", group: "Signal (4G LTE)", label: "RSRP", unit: "dBm", range: [-140, -44], desc: "Reference Signal Received Power. The main 4G signal strength measure. Above -80 is good, below -100 is poor.", source: "CellSignalStrengthLte.getRsrp()", privacy: "public" },
  { key: "rsrq", group: "Signal (4G LTE)", label: "RSRQ", unit: "dB", range: [-20, -3], desc: "Reference Signal Received Quality. Drops when the cell is busy or there is interference.", source: "CellSignalStrengthLte.getRsrq()", privacy: "public" },
  { key: "rssi", group: "Signal (4G LTE)", label: "RSSI", unit: "dBm", range: [-113, -51], desc: "Total received power including noise. Also the headline measure on 3G.", source: "CellSignalStrengthLte.getRssi()", privacy: "public" },
  { key: "sinr", group: "Signal (4G LTE)", label: "SINR", unit: "dB", range: [-20, 30], desc: "Signal to interference plus noise. Drives how fast data can go.", source: "CellSignalStrengthLte.getRssnr()", privacy: "public" },
  { key: "cqi", group: "Signal (4G LTE)", label: "CQI", unit: "0-15", range: [0, 15], desc: "Channel Quality Indicator the phone reports to the tower.", source: "CellSignalStrengthLte.getCqi()", privacy: "public" },
  { key: "ta", group: "Signal (4G LTE)", label: "Timing advance", unit: "steps (about 78 m each)", range: [0, 1282], desc: "Rough distance to the tower.", source: "CellSignalStrengthLte.getTimingAdvance()", privacy: "public" },

  // NR
  { key: "ssRsrp", group: "Signal (5G NR)", label: "SS-RSRP", unit: "dBm", range: [-140, -44], desc: "5G equivalent of RSRP, measured on the synchronisation signal.", source: "CellSignalStrengthNr.getSsRsrp()", privacy: "public" },
  { key: "ssRsrq", group: "Signal (5G NR)", label: "SS-RSRQ", unit: "dB", range: [-43, 20], desc: "5G signal quality.", source: "CellSignalStrengthNr.getSsRsrq()", privacy: "public" },
  { key: "ssSinr", group: "Signal (5G NR)", label: "SS-SINR", unit: "dB", range: [-23, 40], desc: "5G signal to interference plus noise.", source: "CellSignalStrengthNr.getSsSinr()", privacy: "public" },

  // Performance
  { key: "down", group: "Performance", label: "Download", unit: "Mbps", desc: "Measured by an optional 10 second test. Uses about 15 MB of data.", source: "Active test (GDDS test server)", privacy: "public" },
  { key: "up", group: "Performance", label: "Upload", unit: "Mbps", desc: "Measured by the same optional test.", source: "Active test (GDDS test server)", privacy: "public" },
  { key: "latency", group: "Performance", label: "Latency", unit: "ms", desc: "Median round trip time over 20 pings.", source: "Active test (GDDS test server)", privacy: "public" },
  { key: "jitter", group: "Performance", label: "Jitter", unit: "ms", desc: "Variation in round trip time.", source: "Active test (GDDS test server)", privacy: "public" },
  { key: "loss", group: "Performance", label: "Packet loss", unit: "%", desc: "Share of pings that never came back.", source: "Active test (GDDS test server)", privacy: "public" },

  // Device
  { key: "model", group: "Device", label: "Phone model", desc: "Different modems report different fields and read slightly differently.", source: "Build.MODEL", privacy: "public" },
  { key: "os", group: "Device", label: "OS version", desc: "Some radio fields need newer Android versions.", source: "Build.VERSION.RELEASE", privacy: "public" },
  { key: "appVersion", group: "Device", label: "App version", desc: "Lets analysts exclude readings from a buggy release.", source: "BuildConfig.VERSION_NAME", privacy: "public" },

  // Record
  { key: "readingId", group: "Record", label: "Reading ID", desc: "Unique ID for this reading.", source: "Server", privacy: "public" },
  { key: "sessionId", group: "Record", label: "Walk session", desc: "Shared by every reading taken in one walk.", source: "App", privacy: "public" },
  { key: "contributor", group: "Record", label: "Contributor", desc: "Pseudonymous ID. Never the student's name or email.", source: "Server", privacy: "public" },
  { key: "source", group: "Record", label: "Capture method", desc: "App: read automatically by the Android app (simulated in this prototype). Manual: typed in from the phone's Field Test Mode.", source: "App", privacy: "public" },
  { key: "consentVersion", group: "Record", label: "Consent version", desc: "Which version of the consent terms the student agreed to.", source: "Server", privacy: "public" },
];

export const FIELD_BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f]));

// Why a value is missing. Telling these apart is part of cleaning the data.
export const MISSING = {
  unsupported: "Not reported by this phone",
  not_applicable: "Not applicable",
  not_entered: "Not entered by the student",
  not_run: "Speed test not run",
  withheld: "Withheld for privacy",
};
