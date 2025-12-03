import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";      // ⬅️ new landing page
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing */}
        <Route path="/" element={<Landing />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main app */}
        <Route path="/dashboard" element={<Index />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
