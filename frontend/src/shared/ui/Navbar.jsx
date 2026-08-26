import { NavLink } from "react-router-dom";
import { navRoutes } from "../../routes";
import "./Navbar.css";

function Navbar() {
	return (
		<nav className="navbar">
			<NavLink to="/" className="navbar-brand" end>
				Paul Frappier
			</NavLink>
			<ul className="navbar-links">
				{navRoutes.map(({ path, label }) => (
					<li key={path}>
						<NavLink
							to={path}
							end={path === "/"}
							className={({ isActive }) =>
								isActive ? "nav-link active" : "nav-link"
							}
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
