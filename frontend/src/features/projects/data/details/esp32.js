export const esp32Detail = {
	displayTitle: "ESP32 automatic dashboard",
	pitch: [
		"An old Microsoft Surface turned into an autonomous dashboard for my habit and cooking website. An ESP32, an RTC module, and a servo motor press the power button on a schedule, logs in, and opens the site without me touching it.",
	],
	techStack: [
		{ layer: "Controller", technologies: "ESP32" },
		{ layer: "Timing", technologies: "RTC alarm module" },
		{ layer: "Actuator", technologies: "Servo motor (physical power-button press)" },
		{ layer: "Display / host", technologies: "Microsoft Surface (repurposed laptop)" },
		{ layer: "Host automation", technologies: "Windows Task Scheduler, Python startup script" },
		{ layer: "Target app", technologies: "XP tracker (habit & cooking dashboard)" },
	],
	overview: [
		"I already had a working website (see the XP tracker project) that I wanted to always have access to. ",
		"So when my old laptop died, I thought that I could turn it in a dashboard that would turn on and off by itself and reconnect to the site on each wake up.",
		"My first idea was to use the BIOS RTC alarm to wake the machine at a fixed time. Unfortunately, that option was not available on my laptop. So I came up with an electronic solution.",
		"An ESP32 with an RTC alarm module and a servo used as a “finger” that presses the Surface power button."
	],
	photos: [
		{ src: "/dashboard/front.jfif", alt: "ESP32 dashboard   front view of the Surface and press mechanism" },
		{ src: "/dashboard/top.jfif", alt: "ESP32 dashboard   top view of the servo and power-button setup" },
		{ src: "/dashboard/back.jfif", alt: "ESP32 dashboard   back view of the wiring and mounts" },
	],
	challenges: [
		{
			title: "Landing on the login screen after wake",
			problem: [
				"Once the computer turned on, Windows stopped on the login page. ",
				"That defeated the point of an unattended dashboard. I did not want to walk over and type a password every morning.",
			],
			solution: [
				"I set up an account that did not require any password that way the login screen was not a problem anymore. "
			],
		},
		{
			title: "Reopening the website after every shutdown",
			problem: [
				"When the computer shuts off, the website disappears.",
				"I first tried to launch a Python script automatically on boot but could not get a reliable way to do so from the tools I already knew.",
			],
			solution: [
				"I discovered the Windows Task Scheduler. It is a very powerful tool that solved all my issues.",
				"I was able to register the Python script to run at login so each wake the dashboard opens the website in the browser.",
			],
		},
		{
			title: "Servo alignment and a cardboard mount",
			problem: [
				"The servo does not have a lot of torque, so it has to be positioned precisely to press the power button cleanly.",
				"I did not have a 3D printer at the time, so the whole project is held together with cardboard and tape. It works just not very clean and quite fragile.",
			],
			solution: [
				"I had to iterate the placement carefully until presses were reliable enough for daily use.",
				"I also accepted cardboard as a mount, but I plan to print a proper case in the future.",
			],
		},
	],
	codeHighlights: [
		{
			topic: "Scheduled wake press",
			file: "ESP32 + RTC firmware",
			why: "RTC alarm fires the servo on a daily schedule without keeping the laptop awake overnight",
		},
		{
			topic: "Boot-time browser launch",
			file: "Windows Task Scheduler → Python script",
			why: "Opens the XP tracker page automatically after every cold start or wake",
		},
		{
			topic: "Unattended session",
			file: "Passwordless local Windows account",
			why: "Skips the login screen so the dashboard reaches the desktop alone",
		},
	],
	lessonsLearned: [
		"Although it is a small project, it was one of my first project that mixed hardware electronics with software to solve a problem.",
		"It is also to this day one of the most useful project. I still rely on it every day for sport and cooking."
	],
};
