import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { styles } from "../styles";
import { 
  Award, 
  Search, 
  CheckCircle, 
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CertificatesPage = () => {
  const [certs, setCerts] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Fetch dashboard to get badges
    fetch("/api/dashboard")
      .then((res) => {
        if (res.ok) return res.json();
        return { badges: [] };
      })
      .then((data) => {
        setBadges(data.badges || []);
      })
      .catch((err) => console.error("Error loading badges:", err));

    // 2. Fetch user certificates
    fetch("/api/certificates")
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        setCerts(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading certificates:", err);
        setLoading(false);
      });
  }, []);

  const handleVerify = (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;

    setVerifying(true);
    setVerifyResult(null);

    fetch(`/api/certificates/verify/${encodeURIComponent(verifyCode.trim())}`)
      .then(async (res) => {
        const data = await res.json();
        setVerifyResult({
          success: res.ok && data.valid,
          message: res.ok && data.valid ? "Certificate is authentic!" : (data.error?.message || "Invalid certificate code."),
          cert: data.certificate || null
        });
        setVerifying(false);
      })
      .catch((err) => {
        console.error(err);
        setVerifyResult({
          success: false,
          message: "A network error occurred while verifying.",
          cert: null
        });
        setVerifying(false);
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#915EFF] mx-auto mb-4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Achievements & Badges section */}
      <div className={styles.card}>
        <h3 className={`${styles.h3} text-yellow-500 flex items-center gap-2 mb-6 border-b border-[#2a2a40] pb-3`}>
          <span>🏆 Unlocked Achievements</span>
        </h3>
        {badges.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">
            No achievements unlocked yet. Finish assessments with perfect scores to earn badges!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {badges.map((badge) => (
              <div 
                key={badge.code} 
                className="bg-[#202038]/30 p-4 rounded-xl border border-yellow-500/10 hover:border-yellow-500/35 hover:shadow-md hover:shadow-yellow-500/5 transition duration-200 flex flex-col items-center text-center"
              >
                <div className="text-4xl mb-2">{badge.icon || "🏆"}</div>
                <h4 className="font-bold text-yellow-400 text-sm">{badge.name}</h4>
                <p className="text-xs text-gray-400 mt-1 leading-normal">{badge.description}</p>
                <span className="text-[10px] text-gray-500 mt-3 font-mono">
                  Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Split: Certificates list vs. Verification Checker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Certificates */}
        <div className={`${styles.card} lg:col-span-2 space-y-4`}>
          <div className="border-b border-[#2a2a40] pb-3 mb-4">
            <h3 className={styles.h3}>Your Generated Certificates</h3>
          </div>

          {certs.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p>No certificates earned yet. Achieve 100% on a 5+ question assessment to qualify!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {certs.map((cert) => (
                <div 
                  key={cert.certificateId} 
                  className="bg-[#202038]/30 p-5 rounded-xl border border-[#2a2a40] hover:border-[#915EFF]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition duration-200"
                >
                  <div>
                    <h4 className="font-bold text-white text-md">{cert.topicName}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{cert.categoryName} • Perfect Score</p>
                    <p className="text-[10px] text-gray-500 mt-2 font-mono break-all">
                      Code: {cert.verificationCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
                    <button
                      onClick={() => navigate(`/verify-certificate?code=${cert.verificationCode}`)}
                      className={`${styles.btnSecondary} flex items-center gap-1.5 text-xs py-2`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/verify-certificate?code=${cert.verificationCode}`);
                        alert("Verification link copied to clipboard!");
                      }}
                      className={`${styles.btnPrimary} text-xs py-2`}
                    >
                      Share Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Check Card */}
        <div className={styles.card}>
          <h3 className="text-base font-semibold text-white border-b border-[#2a2a40] pb-3 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-[#915EFF]" />
            <span>Verify Certificates</span>
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Test the authenticity of any QuizArena certificate by entering its verification code below.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              placeholder="Enter verification code..."
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className={styles.input}
              required
            />
            <button
              type="submit"
              disabled={verifying}
              className={`${styles.btnPrimary} w-full text-xs py-2.5 flex items-center justify-center gap-2`}
            >
              {verifying ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Verify Authenticity</span>
                </>
              )}
            </button>
          </form>

          {/* Verification Results Panel */}
          {verifyResult && (
            <div className={`mt-6 p-4 rounded-xl border ${
              verifyResult.success 
                ? "bg-green-500/10 border-green-500/20 text-green-400" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            } space-y-3`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                {verifyResult.success ? (
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                )}
                <span>{verifyResult.success ? "Verification Passed" : "Verification Failed"}</span>
              </div>
              <p className="text-xs text-gray-300 leading-normal">
                {verifyResult.message}
              </p>

              {verifyResult.success && verifyResult.cert && (
                <div className="pt-2.5 border-t border-[#2a2a40] space-y-1.5 text-[10px] text-gray-400">
                  <p>Recipient: <strong className="text-white">{verifyResult.cert.issuedTo}</strong></p>
                  <p>Topic: <strong className="text-white">{verifyResult.cert.topicName}</strong></p>
                  <p>Score: <strong className="text-white">{verifyResult.cert.score}/{verifyResult.cert.maxScore} (100%)</strong></p>
                  <p>Date: <strong className="text-white">{new Date(verifyResult.cert.completedAt).toLocaleDateString()}</strong></p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificatesPage;
