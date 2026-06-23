import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import CV from "./pages/CV";
import "./App.css";

function App() {
	return (
		<div className="app">
			<Navbar />
			<main className="main-content">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/projects" element={<Projects />} />
					<Route path="/projects/:projectId" element={<ProjectDetail />} />
					<Route path="/cv" element={<CV />} />
				</Routes>
			</main>
		</div>
	);
}

export default App;
