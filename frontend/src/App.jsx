import { Route, Routes } from "react-router-dom";
import { routes } from "./routes";
import Navbar from "./shared/ui/Navbar";
import ScrollToTop from "./shared/ui/ScrollToTop";
import "./shared/styles/layout.css";

function App() {
	return (
		<div className="app">
			<ScrollToTop />
			<Navbar />
			<main className="main-content">
				<Routes>
					{routes.map(({ path, element }) => (
						<Route key={path} path={path} element={element} />
					))}
				</Routes>
			</main>
		</div>
	);
}

export default App;
