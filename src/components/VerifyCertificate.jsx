import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";

const VerifyCertificate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");

  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) {
      setError("No certificate verification code was provided in the URL.");
      setLoading(false);
      return;
    }

    // Call public certificate verification API (FR-141)
    fetch(`/api/certificates/verify/${encodeURIComponent(code)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setCert(data.certificate);
        } else {
          setError(data.error?.message || "Certificate verification failed. Invalid code.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Network error occurred while verifying certificate.");
        setLoading(false);
      });
  }, [code]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary text-white p-4">
      <div className="bg-[#1a1a2e] p-8 rounded-2xl border border-gray-800 shadow-2xl max-w-lg w-full text-center relative">
        
        {loading ? (
          <div className="py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Verifying certificate authenticity...</p>
          </div>
        ) : error ? (
          <div className="py-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-500 mb-2">Invalid Certificate</h1>
            <p className="text-gray-300 text-sm mb-6">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold text-sm transition"
            >
              Go to Home Page
            </button>
          </div>
        ) : (
          <div className="py-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-400 mb-2">Authentic Certificate</h1>
            <p className="text-gray-400 text-xs mb-6">Verified Securely by QuizArena Engine</p>

            <div className="bg-tertiary p-6 rounded-xl border border-green-500/15 text-left space-y-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Recipient</p>
                <p className="text-lg font-bold text-white">{cert.displayName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Quiz Topic</p>
                <p className="text-md font-semibold text-white">{cert.topicName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Achieved Score</p>
                <p className="text-md font-semibold text-white">{cert.score}/{cert.maxScore} (100% Perfect Score)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Issue Date</p>
                  <p className="text-sm text-white">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                  <p className="text-sm text-green-400 font-bold">Active & Valid</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 break-all mb-6">
              Verification Code: <span className="font-mono">{code}</span>
            </p>

            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-purple-700 hover:bg-purple-900 rounded font-bold text-sm transition w-full"
            >
              Start Your Own Challenge
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyCertificate;
