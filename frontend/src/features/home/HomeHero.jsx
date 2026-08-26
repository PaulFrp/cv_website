import { Link } from "react-router-dom";
import HeroVideo from "./HeroVideo";

const CALLS_TO_ACTION = [
	{ to: "/museum", label: "Enter the museum", primary: true },
	{ to: "/projects", label: "Projects" },
	{ to: "/cv", label: "CV" },
];

function HomeHero() {
	return (
		<div className="home-hero">
			<div className="home-hero-copy">
				<p className="home-brand">Paul Frappier</p>
				<p className="home-lede">
					Data scientist and builder at CentraleSupélec — analytics, generative
					AI, full-stack apps, and tinkering with printers and ESP32 boards.
				</p>
				<div className="home-ctas">
					{CALLS_TO_ACTION.map(({ to, label, primary }) => (
						<Link
							key={to}
							to={to}
							className={`home-cta${primary ? " home-cta--primary" : ""}`}
						>
							{label}
						</Link>
					))}
				</div>
			</div>

			<HeroVideo />
		</div>
	);
}

export default HomeHero;
