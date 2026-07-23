export const nasDetail = {
	displayTitle: "TNAS Homelab — Self-hosted container stack",
	pitch:
		"A self-hosted homelab centered on a TNAS NAS, running a full Docker Compose stack for media, downloads, reverse proxying, password management, and monitoring — with secure remote access via Tailscale instead of exposing ports to the internet.",
	overview:
		"My homelab is built around a TNAS NAS as the central hardware, chosen to run a self-hosted, containerized stack rather than relying on cloud services. Docker sits at the core of the setup, orchestrating everything via Compose: a full *arr stack (Radarr/Sonarr) paired with Jellyfin for media management and streaming, qBittorrent for downloads routed through Gluetun (Mullvad VPN over WireGuard) to keep torrent traffic secured, Caddy as a reverse proxy for clean routing to services, Vaultwarden (self-hosted Bitwarden) for password management, and Uptime Kuma for monitoring service health. One key problem I solved was a race condition on boot — qBittorrent would crash because it started before the Gluetun VPN container was actually healthy. I fixed this with depends_on: condition: service_healthy in Compose so qBittorrent waits for the VPN tunnel to be confirmed up before starting. For remote access, I used Tailscale to reach Jellyfin and Vaultwarden securely from outside the home network — including getting Jellyfin working across various TV platforms — without exposing ports directly to the internet. I also explored Wake-on-LAN and monitor-off vs. sleep states to balance remote availability with power efficiency.",
	techStack: [
		{ layer: "Hardware", technologies: "TNAS NAS (homelab host)" },
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
		{
			title: "qBittorrent crash on boot (VPN race condition)",
			problem:
				"On NAS reboot, qBittorrent started before the Gluetun VPN container had a healthy WireGuard tunnel. The client then came up without a working VPN path and crashed or failed to bind correctly, leaving the download stack broken until a manual restart.",
			solution: [
				"Added a Docker healthcheck on the Gluetun container so Compose can detect when the VPN tunnel is actually up",
				"Set qBittorrent depends_on with condition: service_healthy so it only starts after Gluetun reports healthy",
				"Verified reboot behavior: media downloads stay routed through Mullvad without manual intervention",
			],
		},
		{
			title: "Secure remote access without opening ports",
			problem:
				"I needed access to Jellyfin and Vaultwarden away from home — including on various TV platforms — without exposing services directly on the public internet.",
			solution: [
				"Deployed Tailscale as a private mesh VPN into the homelab",
				"Routed Jellyfin and Vaultwarden over Tailscale instead of port-forwarding",
				"Validated playback and client behavior across multiple TV / streaming devices",
			],
		},
		{
			title: "Remote availability vs. power efficiency",
			problem:
				"Keeping the NAS always fully awake wastes power, but deep sleep breaks remote access when something needs to stream or unlock a vault from outside.",
			solution: [
				"Compared monitor-off / idle states vs. full sleep for how they affect Docker and network reachability",
				"Explored Wake-on-LAN as a way to bring the host online on demand",
				"Settled on a balance that keeps critical services reachable without leaving everything fully powered all day",
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
