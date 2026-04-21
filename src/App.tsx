import {
  Navigate,
  Route,
  HashRouter as Router,
  Routes,
} from "react-router-dom";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import Voting from "./pages/Voting";
import Results from "./pages/Results";
import HallOfFame from "./pages/HallOfFame";
import Vault from "./pages/Vault";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/signin" element={<SignIn />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/voting" element={<Voting />} />
          <Route path="/results" element={<Results />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/halloffame" element={<HallOfFame />} />
        </Route>

        {/* Redirect logic */}
        <Route path="/" element={<Navigate replace to="/home" />} />
      </Routes>
    </Router>
  );
};
