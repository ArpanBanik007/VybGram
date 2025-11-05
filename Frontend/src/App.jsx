import { Routes, Route } from "react-router-dom";
import SignUp from "./Pages/SignupPage";
import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage";
import Videopage from "./Pages/Videopage";
import OwnProfilepage from "./Pages/OwnProfilepage";
import SavePage from "./Pages/SavePage";
import HistoryPage from "./Pages/HistoryPage";
import SettingPage from "./Pages/SettingPage";
import ProfileSettting from "./settings/ProfileSettting";
import SecuritySetting from "./settings/SecuritySetting";
import UserProfileTotalPage from "./Pages/UserProfileTotalPage";

function App() {
  return (
    <Routes>
      {/* login and signup */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignUp />} />

      {/* other pages */}
      <Route path="/home" element={<HomePage />} />
      <Route path="/videos" element={<Videopage />} />
      <Route path="/profile" element={<OwnProfilepage />} />
      <Route path="/saved" element={<SavePage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/settings" element={<SettingPage />} />
      <Route path="/settings/profile" element={<ProfileSettting />} />
      <Route path="/settings/security" element={<SecuritySetting />} />
      <Route path="/profile/user" element={<UserProfileTotalPage />} />
    </Routes>
  );
}

export default App;
