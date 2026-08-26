import { Route, Routes } from "react-router-dom";
import { routes } from "./routes";
import Navbar from "./shared/ui/Navbar";
import "./shared/styles/layout.css";

function App() {
	return (
		<div className="app">
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
