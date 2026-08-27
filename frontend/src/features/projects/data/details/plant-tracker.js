export const plantTrackerDetail = {
	displayTitle: "Smart Plant Monitor",
	stack:
		"ESP32 · C++ · Arduino · Electronics · Python · WiFi/HTTP",
	skills:
		"Embedded firmware · Hardware design · Soldering · 3D printing · REST API integration",
	status: "Hardware complete, firmware working, case design in progress",
	overview: [
		"This project started when my grilfriend brought home many new plants. As it was hard to know when to water them, I decided to build a smart monitoring solution. ",
		"To build such a device, I used electronic components and assembled them together. ",
		"The device measures soil moisture, air temperature, air humidity, and light.",
		"It then sends the recorded data over WiFi to an API that I created on my Xp-tracker website (which is another project) to display the data on a dashboard updated every hour. ",
		"This is a very exciting project as it is quite complete. From component selection and schematic design, to soldering, software, data pipeline, and 3D-printed enclosure.",
		"These types of objects already exist. But the goal was not to buy an already made sensor, but to understand every layer of the systemand be able to call it my own work. ",
		"I had to make decisions about each component, how they communicate, how the device stays alive on battery, and how the data goes to my dashboard.",
	],
	motivation: [
		"Most commercial plant monitors can get expensive when trying to scale across multiple plants, ",
		"or too closed to integrate into a custom dashboard. I wanted something I could replicate for ~20€ or less per unit, ",
		"fully understand, and connect to my own backend.",
		"The other motivation was to combine skills I had been building separately: ",
		"microcontroller programming, electrical engineering, soldering, and 3D printing into one project with a real, useful output.",
	],
	architectureImage: "/schematic.png",
	architectureCaption: "System architecture power chain, sensors, and WiFi data flow",
	componentDecisions: [
		{
			title: "Microcontroller: ESP32 vs Arduino",
			paragraphs: [
				"My initial instinct was to use an Arduino Nano ",
				"as I am familiar with the hardware from previous projects. The key realization was that an Arduino has no WiFi natively. ",
				"I looked at an alternative by adding an ESP8266 WiFi module. But it would have meant managing AT commands over UART. Which I am not familiar with at all. ",
				"This would have added unnecessary and quite honestly hard complexity and possible failures for no benefit.",
				"Thus, the ESP32 was a better fit for couple reasons:",
			],
			list: [
				"WiFi is built in.",
				"Deep sleep at ~10µA. The device only needs to be awake for a few seconds every hour to read sensors and transmit. The rest of the time it can sleep at near-zero consumption. On a 3000mAh cell this translates to weeks of autonomy rather than hours. ",
				"The ESP32's ADC gives 4096 steps of resolution versus 1024 on the Arduino Uno, which means better moisture detection. Although to be honest the project was not meant to be industry grade so this might have been an unnecessary constraint. ",
			],
		},
		{
			title: "Soil Sensor: Capacitive vs Resistive",
			paragraphs: [
				"When looking for soil sensors, I came accross two types: ",
				"Resistive sensors which work by measuring electrical conductivity between two metal rodes. ",
				"They are cheap (~€0.50) but usually get corroded within weeks in moist soil. ",
				"This meant that they would be giving increasingly inaccurate readings until they fail.",
				"Capacitive sensors measure the dielectric constant of the soil around a PCB trace without passing current through the soil. ", ///Add some explaning of the words here
				"This means less/no corrosion, more stable long-term readings, and they also seem to be more accurate at mid-range levels.",
				"The capacitive v1.2 was chosen. I considered the additional cost (€1.20 vs €0.50) to be trivial given the durability improvement.",
			],
			closing:[
				"Calibration trade-off: capacitive sensors require calibration per-unit. ",
				"The raw ADC output varies between sensors and between ESP32 boards due to ADC non-linearity. ",
				"The calibration procedure (measuring raw values in air and in water, then mapping to 0–100%) takes five minutes but must be done for every new sensor. ",
				"In a commercial product you would factory-calibrate or use a lookup table; in this project it is a manual step.",
			],
			note: "My calibrated values: AIR_VALUE = 2030, WATER_VALUE = 620. ",
		},
		{
			title: "Light Sensor: TSL2591 vs LDR",
			paragraphs: [
				"A simple Light Dependent Resistor (LDR) costs ~€0.10 and gives a rough analog voltage proportional to light. It was the obvious first choice.",
				"I chose the TSL2591 instead for three reasons. ",
				"First, it outputs calibrated lux values rather than arbitrary ADC counts, making readings comparable across devices and meaningful in plant-care terms ",
				"(most houseplants have specific lux requirements). Second, it has two photodiodes ", //Big word here again 
				"one for full spectrum and one for infrared allowing the chip to compute visible light independently from IR, which better reflects what plants actually use. ",
				"Third, it communicates over I²C, freeing up the ADC channels for other uses.",
			],
			closing: //Price seems a little off 
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
					title: "The boost converter problem, an important lesson",
					paragraphs: [
						"The TC4056 outputs raw battery voltage: 3.7V nominal, up to 4.2V when fully charged. The ESP32 expansion shield requires 5V via its USB input or 6.5V–16V via its DC barrel jack. ",
						"The battery voltage falls in neither range.",
						"The solution is a MT3608 boost converter (~€1) that steps up the battery's 3.7–4.2V to a stable 5V. ",
						"This component was not in the original BOM and was discovered only when trying to connect the TC4056 to the shield. ",
						"a good example of why building the circuit physically reveals gaps that a paper schematic can miss.",
					],
					lesson:[
						"When designing a battery-powered system, trace the full voltage chain from cell to load before ordering components. ",
						"Each step in the chain (charger → cell → converter → regulator → MCU) has input and output voltage requirements that must be matched.",
					]
				},
			],
			batteryEstimate: [
				"ESP32 active (WiFi + sensor reads): ~200mA for ~3 seconds",
				"ESP32 deep sleep: ~0.01mA",
				"Readings every 60 minutes: 24 wake cycles/day",
				"Daily consumption: (24 × 200mA × 3s / 3600) + (24h × 0.01mA) ≈ 4mAh/day",
				"Autonomy on 3000mAh cell: ~750 days theoretical",
			],
			closing:[
				"In practice, WiFi connection time varies (sometimes 5–10 seconds), and the boost converter has its own efficiency loss (~85%). ",
				"Realistic autonomy is closer to 3–6 months between charges which i deemed as still very acceptable.",
			]
		},
	],
	firmware: {
		intro:
			"The firmware is written in C++:",
		decisions: [
			"Averaging for soil readings. The ESP32's ADC is known for noise and non-linearity. Taking 10 readings and averaging them removes most of the noise:",
			"HTTP POST to custom API. Each reading is sent as a JSON and to a FastAPI endpoint with an API key header for authentication. The device ID is hardcoded in every device (\"plant_1\", \"plant_2\"...)."
		],
		gap: "Current gap, deep sleep not yet implemented. The loop currently delays 3600 seconds between readings. This keeps the WiFi active and the ESP32 fully powered the entire time. Deep sleep is the next software goal."
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
				"This was my first full project involving soldering, which lead to several practical lessons:",
			list: [
				"Maybe the most important that I have been pushing for way too long. The need to by soldering helping hands. This project showed just how much easier it would have made every steps.", 
				"My joints definitely do not look great but they were functional and I beleive this to be a good first step.",
				"Label your connectors before you need to debug. The ESP32 expansion shield has multiple ground and VCC pins serving different purposes one group outputs 3.3V to sensors, another is a power input, one is tied to USB. Without reading the expansion board's datasheet, these look identical.",
			],
		},
	},
	doDifferently: [
		"Start without the expansion shield. The shield was bought for convenience (labeled sensor connectors, power distribution) but it ended up introducing more confusion about voltage and pin routing. For a small prototype, wiring directly to the ESP32 with female dupont cables would have been simpler.",
		"Use a breadboard phase before soldering.",
	],
	workedWell: [
		"The sensor selection. All three sensors worked first try with their respective Adafruit libraries.",
		"The data pipeline. Getting sensor data from a physical device in a pot to a database endpoint via WiFi worked first try and THAT is a satisfying result.",
	],
	nextSteps: [
		"Implement deep sleep. Switch from delay() to ESP32 deep sleep with RTC wakeup.",
		"Design and print the enclosure. Two parts case: main body that could clip to the pot rim with inside the ESP32 + battery, and a soil probe with sensor at the tip",
		"Scale to multiple plants. I have 2 devices for now but will try to get more. Give each device a unique plant ID, aggregate in a single dashboard",
	],
};
