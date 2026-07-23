export const plantTrackerDetail = {
	displayTitle: "Smart Plant Monitor — IoT Device from Scratch",
	stack:
		"ESP32 · C++ · Arduino · DHT22 · TSL2591 · Capacitive Soil Sensor · TC4056 · Python/FastAPI · WiFi/HTTP",
	skills:
		"Embedded firmware · Hardware design · Soldering · 3D printing · REST API integration",
	status: "Hardware complete, firmware working, case design in progress",
	overview: [
		"A fully autonomous IoT plant monitoring device built from individual electronic components. The device measures soil moisture, air temperature, air humidity, and ambient light, and sends readings over WiFi to a centralized API every hour. The project covers the full stack — from component selection and schematic design, to soldering, firmware, data pipeline, and 3D-printed enclosure.",
		"The goal was not to buy a ready-made sensor kit, but to understand every layer of the system from the ground up: why each component was chosen, how they communicate, how the device stays alive on battery, and how the data flows to a dashboard.",
	],
	motivation: [
		"Most commercial plant monitors are either too expensive for scaling across multiple plants, or too closed to integrate into a custom dashboard. I wanted something I could replicate for under €25 per unit, fully understand, and connect to my own backend.",
		"The secondary motivation was to combine skills I had been building separately — embedded programming, soldering, 3D printing — into one cohesive project with a real, useful output.",
	],
	architectureImage: "/schematic.png",
	architectureCaption: "System architecture — power chain, sensors, and WiFi data flow",
	componentDecisions: [
		{
			title: "Microcontroller: ESP32 vs Arduino",
			paragraphs: [
				"The initial instinct was to use an Arduino Nano — familiar territory from previous projects. The key realization was that an Arduino has no WiFi natively: adding an ESP8266 WiFi module would mean managing AT commands over UART, adding complexity and failure points for no benefit.",
				"The ESP32 is a better fit for three reasons:",
			],
			list: [
				"WiFi is built in. No external module, no AT command layer, WiFi just works as a standard library.",
				"Deep sleep at ~10µA. The device only needs to be awake for a few seconds every hour to read sensors and transmit. The rest of the time it can sleep at near-zero consumption. On a 3000mAh cell this translates to weeks of autonomy rather than hours.",
				"12-bit ADC with 18 channels. The capacitive soil sensor outputs an analog voltage. The ESP32's ADC gives 4096 steps of resolution versus 1024 on the Arduino Uno, which means finer moisture detection — though in practice the sensor's own variability is the limiting factor.",
			],
			closing:
				"The trade-off: the ESP32 runs at 3.3V logic, not 5V. Every sensor needed to be verified as 3.3V compatible. All three chosen sensors (DHT22, TSL2591, capacitive soil) support 3.3V, so this was not a blocker, but it is something to check for any future sensor additions.",
		},
		{
			title: "Soil Sensor: Capacitive vs Resistive",
			paragraphs: [
				"Two types of soil moisture sensors exist in the hobbyist market:",
				"Resistive sensors work by measuring electrical conductivity between two metal probes. They are cheap (~€0.50) but corrode within weeks in moist soil, giving increasingly inaccurate readings until they fail entirely.",
				"Capacitive sensors measure the dielectric constant of the soil around a PCB trace without passing current through the soil. No corrosion, stable long-term readings, and more accurate at mid-range moisture levels.",
				"The capacitive v1.2 was chosen. The additional cost (€1.20 vs €0.50) is trivial for the durability improvement.",
			],
			closing:
				"Calibration trade-off: capacitive sensors require calibration per-unit. The raw ADC output varies between sensors and between ESP32 boards due to ADC non-linearity. The calibration procedure (measuring raw values in air and in water, then mapping to 0–100%) takes five minutes but must be done for every new sensor. In a commercial product you would factory-calibrate or use a lookup table; in this project it is a manual step.",
			note: "My calibrated values: AIR_VALUE = 2030, WATER_VALUE = 620. These will differ on your hardware.",
		},
		{
			title: "Light Sensor: TSL2591 vs LDR",
			paragraphs: [
				"A simple Light Dependent Resistor (LDR) costs ~€0.10 and gives a rough analog voltage proportional to light. It was the obvious first choice.",
				"The TSL2591 was chosen instead for three reasons. First, it outputs calibrated lux values rather than arbitrary ADC counts, making readings comparable across devices and meaningful in plant-care terms (most houseplants have specific lux requirements). Second, it has two photodiodes — one for full spectrum and one for infrared — allowing the chip to compute visible light independently from IR, which better reflects what plants actually use. Third, it communicates over I²C, freeing up the ADC channels for other uses.",
			],
			closing:
				"The trade-off is cost (~€5 vs ~€0.10) and the need to manage I²C address conflicts if adding multiple identical sensors to one bus (the TSL2591's I²C address is fixed at 0x29).",
		},
		{
			title: "Power: TC4056 + 18650",
			paragraphs: [
				"Why not just use USB power permanently?",
				"Permanent USB power would mean running a cable to each plant. For a single plant near a power socket this is fine, but the stated goal was a fully autonomous device that can sit anywhere without cable management.",
				"The chosen circuit:",
			],
			powerChain: "USB-C (5V) → TC4056 charger → 18650 cell → [boost converter] → ESP32",
			subsections: [
				{
					title: "The boost converter problem — an important lesson",
					paragraphs: [
						"The TC4056 outputs raw battery voltage: 3.7V nominal, up to 4.2V when fully charged. The ESP32 expansion shield requires 5V via its USB input or 6.5V–16V via its DC barrel jack. The battery voltage falls in neither range.",
						"The solution is a MT3608 boost converter (~€1) that steps up the battery's 3.7–4.2V to a stable 5V. This component was not in the original BOM and was discovered only when trying to connect the TC4056 to the shield — a good example of why building the circuit physically reveals gaps that a paper schematic can miss.",
					],
					lesson:
						"When designing a battery-powered system, trace the full voltage chain from cell to load before ordering components. Each step in the chain (charger → cell → converter → regulator → MCU) has input and output voltage requirements that must be matched.",
				},
			],
			batteryEstimate: [
				"ESP32 active (WiFi + sensor reads): ~200mA for ~3 seconds",
				"ESP32 deep sleep: ~0.01mA",
				"Readings every 60 minutes: 24 wake cycles/day",
				"Daily consumption: (24 × 200mA × 3s / 3600) + (24h × 0.01mA) ≈ 4mAh/day",
				"Autonomy on 3000mAh cell: ~750 days theoretical",
			],
			closing:
				"In practice, WiFi connection time varies (sometimes 5–10 seconds), and the boost converter has its own efficiency loss (~85%). Realistic autonomy is closer to 3–6 months between charges — still very acceptable.",
		},
	],
	firmware: {
		intro:
			"The firmware is written in C++ for the Arduino framework. Key decisions:",
		decisions: [
			"Single-file structure for prototype phase. As the project scales to multiple sensors and deep sleep, the firmware will be refactored into separate modules (wifi.h, sensors.h, sleep.h).",
			"Averaging for soil readings. The ESP32's ADC is known for noise and non-linearity, particularly at the extremes of its range. Taking 10 readings and averaging them removes most of the noise:",
		],
		code: `int raw = 0;
for (int i = 0; i < 10; i++) {
  raw += analogRead(SOIL_PIN);
  delay(10);
}
raw /= 10;`,
		afterCode: [
			"HTTP POST to custom API. Each reading is serialized as JSON and sent to a FastAPI endpoint with an API key header for authentication. The device ID is hardcoded per device (\"plant_1\", \"plant_2\"...) which is simple but would not scale to tens of devices — a production approach would use a provisioning flow or MAC address as device ID.",
		],
		gap: "Current gap — deep sleep not yet implemented. The loop currently delays 3600 seconds between readings. This keeps the WiFi stack active and the ESP32 fully powered the entire time, burning ~80mA continuously. Deep sleep is the next firmware milestone: wake on RTC timer, read sensors, transmit, sleep.",
	},
	hardwareAssembly: {
		photos: [
			{ src: "/humidity/1.jpg", alt: "Smart Plant Monitor hardware assembly step 1" },
			{ src: "/humidity/2.jpg", alt: "Smart Plant Monitor hardware assembly step 2" },
			{ src: "/humidity/3.jpg", alt: "Smart Plant Monitor hardware assembly step 3" },
			{ src: "/humidity/4.jpg", alt: "Smart Plant Monitor hardware assembly step 4" },
			{ src: "/humidity/5.jpg", alt: "Smart Plant Monitor hardware assembly step 5" },
			{ src: "/humidity/6.jpg", alt: "Smart Plant Monitor hardware assembly step 6" },
			{ src: "/humidity/7.jpg", alt: "Smart Plant Monitor hardware assembly step 7" },
			{ src: "/humidity/8.jpg", alt: "Smart Plant Monitor hardware assembly step 8" },
			{ src: "/humidity/9.jpg", alt: "Smart Plant Monitor hardware assembly step 9" },
		],
		solderingLessons: {
			title: "Lessons from soldering",
			intro:
				"This was my first project involving soldering small SMD-adjacent pads (the TC4056 power pads) rather than through-hole components. Several practical lessons:",
			list: [
				"Cold joints look different from good ones. A good solder joint is shiny, smooth, and forms a small volcano shape around the wire. Cold joints look dull and blobby — they make electrical contact intermittently at best. Several joints needed to be redone.",
				"Color-code everything. I initially soldered two red wires for OUT+ and OUT−. With no visual distinction, it is impossible to know which is positive without a multimeter. Black for ground, red for positive, always, even on the bench.",
				"Label your connectors before you need to debug. The ESP32 expansion shield has multiple ground and VCC pins serving different purposes — one group outputs 3.3V to sensors, another is a power input, one is tied to USB. Without reading the expansion board's datasheet, these look identical.",
			],
		},
		expansionShield: {
			title: "The expansion shield confusion",
			intro:
				"A significant debugging session was spent trying to connect the TC4056 output to the right pins on the ESP32 expansion shield. The shield has:",
			list: [
				"A GVS (Ground/Voltage/Signal) connector that looks like a power input but outputs 3.3V to sensors",
				"A 5V/3.3V distribution block that also outputs",
				"A VIN pin on the main header that accepts power input",
				"A DC barrel jack that accepts 6.5V+",
			],
			closing:
				"The correct input (VIN on the main ESP32 header) is accessible but requires bypassing the shield's own power routing, or using the boost converter to hit 5V for the shield's USB input.",
			lesson:
				"Expansion shields and breakout boards add convenience but also abstraction. When something does not work, reading the shield's own documentation separately from the ESP32 datasheet is essential — they are two different circuits stacked together.",
		},
	},
	doDifferently: [
		"Start without the expansion shield. The shield was bought for convenience (labeled sensor connectors, power distribution) but introduced confusion about voltage levels and pin routing. For a single-device prototype, wiring directly to the ESP32 header with female dupont cables is simpler and more educational.",
		"Design the BOM around the power chain first. Component selection started with sensors (interesting) rather than the power system (critical). The missing boost converter was only discovered during assembly. Power architecture should be the first thing locked down.",
		"Use a breadboard phase before soldering. All connections were made with dupont cables directly onto headers, which is fine, but testing the complete circuit on a breadboard before any soldering would have caught the VIN routing issue earlier.",
		"Version the firmware from day one. The current firmware is a single file. Adding Git from the first commit, even for a solo project, would make it easier to track what changed when something stopped working.",
	],
	workedWell: [
		"The sensor selection. All three sensors worked first try with their respective Adafruit libraries. The TSL2591 was detected immediately on I²C, the DHT22 read correctly once the + and out wires were corrected (an early wiring mistake), and the soil sensor calibrated cleanly.",
		"Iterating physically. Reading about G/V/S connectors is fine; being confused by one in your hand and working through the confusion is a much stronger learning. Every mistake made while building this device — the cold solder joints, the wrong power pin, the reversed DHT22 wires — is now part of long-term memory in a way that reading a tutorial would not produce.",
		"The data pipeline. Getting sensor data from a physical device in a pot to a database endpoint via WiFi, authenticated with an API key, on a first attempt — that is a satisfying end-to-end result.",
	],
	nextSteps: [
		"Complete the power circuit — add MT3608 boost converter, connect TC4056 → boost → ESP32, validate battery operation",
		"Implement deep sleep — switch from delay() to ESP32 deep sleep with RTC wakeup, validate current consumption",
		"Design and print the enclosure — two-part case: main body clipping to pot rim housing ESP32 + battery, soil probe stake with sensor at tip",
		"Build the dashboard — Grafana connected to InfluxDB, or a lightweight React frontend",
		"Add Telegram notifications — alert when soil moisture drops below threshold per plant",
		"Scale to multiple plants — replicate the hardware, give each device a unique plant ID, aggregate in a single dashboard",
	],
	skillsDemonstrated: [
		"Embedded C++ — sensor libraries, I²C, ADC, WiFi, HTTP client, JSON serialization",
		"Electronics fundamentals — voltage levels, pull-up resistors, ADC calibration, Li-Ion charging circuits, power chain design",
		"Hardware debugging — cold joint identification, pin-level continuity tracing, datasheet reading",
		"Soldering — through-hole and small pad soldering, wire preparation, connector crimping",
		"System design — sensor selection trade-offs, battery life estimation, protocol choice (MQTT vs HTTP)",
		"3D printing (in progress) — enclosure design for electronics, moisture-resistant materials (PETG)",
		"API design — device authentication, JSON payload schema, time-series data modeling",
	],
};
