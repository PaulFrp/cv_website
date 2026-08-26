import { NavLink } from "react-router-dom";

const navItems = [
	{ to: "/", label: "Home" },
	{ to: "/projects", label: "Projects" },
	{ to: "/museum", label: "Museum" },
	{ to: "/cv", label: "CV" },
];

function Navbar() {
	return (
		<nav className="navbar">
			<NavLink to="/" className="navbar-brand" end>
				Paul Frappier
			</NavLink>
			<ul className="navbar-links">
				{navItems.map(({ to, label }) => (
					<li key={to}>
						<NavLink
							to={to}
							className={({ isActive }) =>
								isActive ? "nav-link active" : "nav-link"
							}
							end={to === "/"}
						>
							{label}
						</NavLink>
					</li>
				))}
			</ul>
		</nav>
	);
}

export default Navbar;
