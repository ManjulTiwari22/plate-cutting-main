import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PlateCuttingLayout from "./PlateCuttingLayout";
import Results from "./Results";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PlateCuttingLayout />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Router>
  );
}

export default App;
