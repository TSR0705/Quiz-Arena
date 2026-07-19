import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { styles } from "../styles";
import { 
  User, 
  Mail, 
  Eye, 
  Save, 
  Key, 
  Trophy, 
  ShieldAlert 
} from "lucide-react";

const ProfilePage = () => {
  const { currentUser, fetchUser } = useAuth();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    leaderboardOptIn: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [securityMessage, setSecurityMessage] = useState("");
  const [requestingReset, setRequestingReset] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setForm({
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
        leaderboardOptIn: currentUser.leaderboardOptIn !== false
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      let data = {};
      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          data = { error: { message: text || "Failed to update profile." } };
        }
      } catch (e) {
        data = { error: { message: "Failed to parse response." } };
      }

      if (res.ok) {
        setMessage({ type: "success", text: "Profile details updated successfully!" });
        // Sync global auth state
        await fetchUser();
      } else {
        setMessage({ type: "error", text: data.error?.message || "Failed to update profile details." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "A network error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Password reset request
  const handlePasswordReset = async () => {
    setRequestingReset(true);
    setSecurityMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email })
      });
      
      let data = {};
      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          data = { error: { message: text || "Failed to request password reset." } };
        }
      } catch (e) {
        data = { error: { message: "Failed to parse response." } };
      }

      if (res.ok) {
        setSecurityMessage("A password reset link has been dispatched to your email address.");
      } else {
        setSecurityMessage(data.error?.message || "Failed to request password reset.");
      }
    } catch (err) {
      console.error(err);
      setSecurityMessage("Failed to request reset due to network issues.");
    } finally {
      setRequestingReset(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Summary Card */}
        <div className="flex flex-col gap-6">
          <div className={`${styles.card} flex flex-col items-center text-center`}>
            <img
              src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.displayName || 'user'}`}
              alt="avatar"
              className="w-24 h-24 rounded-full border-4 border-[#915EFF] mb-4 bg-[#1a1a2e]"
            />
            <h2 className={styles.h2}>{currentUser.displayName}</h2>
            <p className={styles.subtext}>{currentUser.email}</p>

            <div className="w-full grid grid-cols-2 gap-4 mt-6 border-t border-[#2a2a40] pt-6">
              <div className="bg-[#202038]/50 p-3.5 rounded-xl border border-[#2a2a40]">
                <p className="text-xs text-gray-400">Streak Peak</p>
                <p className="text-lg font-black text-orange-400">🔥 {currentUser.longestStreak || 0} days</p>
              </div>
              <div className="bg-[#202038]/50 p-3.5 rounded-xl border border-[#2a2a40]">
                <p className="text-xs text-gray-400">Current Streak</p>
                <p className="text-lg font-black text-orange-400">⚡ {currentUser.currentStreak || 0} days</p>
              </div>
              <div className="bg-[#202038]/50 p-3.5 rounded-xl border border-[#2a2a40]">
                <p className="text-xs text-gray-400">Total XP</p>
                <p className="text-lg font-black text-yellow-400">✨ {currentUser.totalXp || 0}</p>
              </div>
              <div className="bg-[#202038]/50 p-3.5 rounded-xl border border-[#2a2a40]">
                <p className="text-xs text-gray-400">Current Level</p>
                <p className="text-lg font-black text-purple-400">🏆 {currentUser.currentLevel || 1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Update Profile Form & Security */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Form */}
          <div className={styles.card}>
            <h3 className={`${styles.h3} mb-6 border-b border-[#2a2a40] pb-3 flex items-center gap-2`}>
              <User className="w-5 h-5 text-[#915EFF]" />
              <span>Profile Settings</span>
            </h3>

            {message.text && (
              <div className={`p-4 rounded-xl border mb-6 text-sm flex items-center gap-2 ${
                message.type === "success" 
                  ? "bg-green-500/10 border-green-500/20 text-green-400" 
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400">Display Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="displayName"
                    value={form.displayName}
                    onChange={handleChange}
                    className={`${styles.input} pl-10`}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`${styles.input} pl-10`}
                    required
                  />
                </div>
              </div>

              {/* Leaderboard Opt-In checkbox */}
              <div className="flex items-start gap-3 bg-[#202038]/30 p-4 rounded-xl border border-[#2a2a40]">
                <input
                  type="checkbox"
                  name="leaderboardOptIn"
                  id="leaderboardOptIn"
                  checked={form.leaderboardOptIn}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-800 text-[#915EFF] focus:ring-[#915EFF]"
                />
                <label htmlFor="leaderboardOptIn" className="text-xs cursor-pointer select-none">
                  <div className="font-bold text-white flex items-center gap-1.5 mb-1 text-sm">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span>Opt-In to Global Leaderboards</span>
                  </div>
                  <p className="text-gray-400 leading-normal">
                    When enabled, your highest quiz attempts will be ranked globally. Disable this to keep your scores private.
                  </p>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`${styles.btnPrimary} w-full flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-4.5 h-4.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security / Password Reset */}
          <div className={`${styles.card} border-yellow-500/10`}>
            <h3 className={`${styles.h3} mb-4 border-b border-[#2a2a40] pb-3 flex items-center gap-2`}>
              <Key className="w-5 h-5 text-yellow-500" />
              <span>Account Security</span>
            </h3>
            <p className="text-xs text-gray-400 leading-normal mb-4">
              To update your account password, click the button below to generate a password reset challenge sent to your verified inbox.
            </p>

            <button
              onClick={handlePasswordReset}
              disabled={requestingReset}
              className={`${styles.btnSecondary} text-xs py-2 w-full flex items-center justify-center gap-2`}
            >
              {requestingReset ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Request Reset Link</span>
                </>
              )}
            </button>

            {securityMessage && (
              <p className="text-xs text-yellow-500 mt-3 font-semibold">
                {securityMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
