export const nasDetail = {
	displayTitle: "TNAS Homelab — Self-hosted container stack",
	pitch: [
		"This project shows my first steps into the world of homelabbing. For this first project, I decided to set up a NAS. ",
		"The goal was to run different Docker compartiments for different uses like: media, downloads, reverse proxying, password management, and monitoring. ",
	],
	overview:[
		"My homelab is built around a NAS with 4 slots (only 2 are used with 4TB disks for now) as the central hardware.",
		"The motivation behinf this project was to self host containerized applications rather than relying on cloud services that have complete control over your data.",
		" It was also my first time deploying a full project orchestrated via docker.",
		" I used docker-compose files split like this: a full *arr stack (Radarr/Sonarr) paired with Jellyfin for media management and streaming, ",
		"qBittorrent for downloads routed through Gluetun (Mullvad VPN over WireGuard) to keep torrent traffic secured, Caddy as a reverse proxy for clean routing to services, ",
		"Vaultwarden (self-hosted Bitwarden) for password management, and Uptime Kuma for monitoring service health. ",
		"For remote access, I used Tailscale to reach Jellyfin and Vaultwarden securely from outside the home network ",
		"including getting Jellyfin working across various TV platforms without exposing ports directly to the internet.", 
		"I also explored Wake-on-LAN and monitor-off vs. sleep states to balance remote availability with power efficiency.",
	],
	techStack: [
		{ layer: "Hardware", technologies: "NAS Terramaster F4-424" },
		{ layer: "Disks", technologies: "2x Seagate IronWolf 4TB" }, 
		{
			layer: "Orchestration",
			technologies: "Docker, Docker Compose",
		},
		{
			layer: "Media",
			technologies: "Jellyfin, Radarr, Sonarr (*arr stack)",
		},
		{
			layer: "Downloads / VPN",
			technologies: "qBittorrent, Gluetun, Mullvad (WireGuard)",
		},
		{
			layer: "Networking",
			technologies: "Caddy (reverse proxy), Tailscale",
		},
		{
			layer: "Ops & security",
			technologies: "Vaultwarden, Uptime Kuma, Wake-on-LAN",
		},
	],
	challenges: [
		"I d like to mention that I have had surprisingly few challenges with this project. Starting a new project specifically in fields that you haven't touched before ususally leads to hours of head smashing but not this one. " , 
		{
			title: "Turning off your power when you go on holliday", 
			problem:"Involountarily shutting down your whole system without even realizing it.",
			solution: [
				"More of a joke problem but was still a lesson I learned the hard way and I believe this to be a good reminder.",
				"When leaving my apartment for more than 2 weeks for a holliday it made sense to turn off the water and the elecrticty as usual.", 
				"Once far away from the apartment and a couple of days later I realized that I had lost my tailscale coonection to the NAS.", 
				"I do have to say that it took me an embarassing amounf of time and efforts before realizing what had actually happened... the problem is always the human"
			],
		},
		{
			title: "Secure remote access without opening ports",
			problem:[
				"For obvious reasons, I needed access to Jellyfin and Vaultwarden not only at home but everywhere on my smartphone or laptop.",
				" But exposing my services directly on the public internet is both risky and defeating the purpose of self-hosting.",
			],
			solution: [
				"As I was already familiar with the technology, I deployed Tailscale as a private VPN into the homelab",
				"With tailscale set up I was able to route Jellyfin and Vaultwarden through it instead of port-forwarding",
				"This was also my first realisation of all the possible ways docker could be used. On the same machine ",
				"I was able to have a whole container under a VPN while some other containers were on the tailscale network. ",
				"I was scared of running into IP problems for conections but thanks to docker it was well handled",
				"Validated playback and client behavior across multiple TV / streaming devices",
			],
		},
		{
			title: "qBittorrent crash on boot (VPN race condition)",
			problem:[
				"Once (after a 2 weeks holliday) I had to reboot my NAS for some reason (:D). It would not start up so I investigated docker logs and found at that",
				" qBittorrent container tried starting but failed for no apparent reasons. More digging led me to find that the container was trying to start ",
				"before the Gluetun VPN container had a healthy WireGuard tunnel.",
				"For this reason the conatiner would come up  without a working VPN path and due to specific guardrails that I created it failed to boot,",
				" leaving the download stack broken until a manual restart.",
			],
			solution: [
				"To solve this issue, I first added a Docker healthcheck on the Gluetun container so Compose can detect when the VPN tunnel is actually up",
				"Then I set a depends_on with condition: service_healthy inside the qbitorrent compose so it only starts after Gluetun reports healthy",
				"And after verification and a new reboot, the behavior was confirmed and everything worked fine.",
			],
		},
	],
	codeHighlights: [
		{
			topic: "Compose health dependency",
			file: "docker-compose.yml — qBittorrent depends_on Gluetun",
			why: "service_healthy gate prevents the boot race that crashed qBittorrent",
		},
		{
			topic: "VPN-gated downloads",
			file: "Gluetun + qBittorrent network config",
			why: "All torrent traffic exits through Mullvad WireGuard only",
		},
		{
			topic: "Reverse proxy routing",
			file: "Caddyfile",
			why: "Clean hostnames for Jellyfin, Vaultwarden, and other services",
		},
		{
			topic: "Private remote access",
			file: "Tailscale",
			why: "Reach media and vault from outside without public port exposure",
		},
	],
	cvShort:
		"Built a self-hosted TNAS homelab with Docker Compose running Jellyfin, an *arr media stack, qBittorrent behind Gluetun (Mullvad WireGuard), Caddy, Vaultwarden, and Uptime Kuma. Fixed a boot race where qBittorrent started before the VPN was healthy using Compose depends_on: condition: service_healthy. Exposed Jellyfin and Vaultwarden remotely via Tailscale (no open ports) and tuned power/sleep behavior for remote availability.",
	cvMedium: [
		"Stack: Docker Compose on TNAS — Jellyfin, Radarr/Sonarr, qBittorrent + Gluetun, Caddy, Vaultwarden, Uptime Kuma",
		"Reliability: Resolved qBittorrent/Gluetun boot race with healthchecks and depends_on: condition: service_healthy",
		"Security: Routed torrent traffic exclusively through Mullvad WireGuard; no public port exposure for apps",
		"Remote access: Tailscale for Jellyfin and Vaultwarden, including TV client setups",
		"Ops: Explored Wake-on-LAN and sleep vs. idle states to balance uptime with power use",
	],
	techTags: [
		"Docker",
		"Docker Compose",
		"TNAS",
		"Jellyfin",
		"Radarr",
		"Sonarr",
		"qBittorrent",
		"Gluetun",
		"WireGuard",
		"Mullvad",
		"Caddy",
		"Vaultwarden",
		"Uptime Kuma",
		"Tailscale",
		"Homelab",
	],
	lessonsLearned:
		"Container orchestration is only as reliable as startup ordering and health signals. A Compose file that lists services is not enough — depends_on without a health condition still races on reboot. Pairing Gluetun healthchecks with service_healthy dependencies made the download stack survive cold boots. For remote access, Tailscale was a cleaner security model than port-forwarding: private reachability to Jellyfin and Vaultwarden without putting those services on the public internet.",
};
