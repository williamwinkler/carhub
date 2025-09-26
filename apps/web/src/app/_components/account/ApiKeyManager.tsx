"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaCopy,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaKey,
} from "react-icons/fa";
import { trpc } from "../../_trpc/client";

export default function ApiKeyManager() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: apiKeyStatus } = trpc.users.hasApiKey.useQuery();
  const utils = trpc.useContext();

  const generateApiKeyMutation = trpc.users.generateApiKey.useMutation({
    onSuccess: (data) => {
      utils.users.hasApiKey.invalidate();
      setNewApiKey(data.apiKey);
      setShowConfirmModal(false);
      setShowApiKey(true);
      toast.success("API key generated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate API key");
    },
  });

  const handleGenerateApiKey = async () => {
    await generateApiKeyMutation.mutateAsync();
  };

  const handleCopyApiKey = async () => {
    if (newApiKey) {
      await navigator.clipboard.writeText(newApiKey);
      toast.success("API key copied to clipboard!");
    }
  };

  const closeApiKeyModal = () => {
    setNewApiKey(null);
    setShowApiKey(false);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaKey className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-semibold text-slate-200">
          API Key Management
        </h2>
      </div>

      <div className="space-y-4">
        <p className="text-slate-400">
          API keys allow you to access the CarHub API programmatically. Keep
          your API key secure and never share it publicly.
        </p>

        {/* API Key Status */}
        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${apiKeyStatus?.hasApiKey ? "bg-green-400" : "bg-gray-400"}`}
            />
            <div>
              <p className="text-slate-300 font-medium">
                {apiKeyStatus?.hasApiKey ? "API Key Active" : "No API Key"}
              </p>
              <p className="text-sm text-slate-500">
                {apiKeyStatus?.hasApiKey
                  ? "You have an active API key for accessing the CarHub API"
                  : "Generate an API key to access the CarHub API programmatically"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={generateApiKeyMutation.isPending}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200"
          >
            {generateApiKeyMutation.isPending
              ? "Generating..."
              : apiKeyStatus?.hasApiKey
                ? "Generate New Key"
                : "Generate API Key"}
          </button>
        </div>

        {/* API Documentation Link */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-blue-400 mt-0.5">ℹ️</div>
            <div>
              <p className="text-blue-300 font-medium mb-1">
                API Documentation
              </p>
              <p className="text-blue-200 text-sm mb-2">
                Learn how to use your API key with our REST API endpoints.
              </p>
              <a
                href="http://localhost:3001/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium underline underline-offset-4"
              >
                View API Documentation →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationTriangle className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl font-semibold text-slate-200">
                {apiKeyStatus?.hasApiKey
                  ? "Generate New API Key"
                  : "Generate API Key"}
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              {apiKeyStatus?.hasApiKey && (
                <p className="text-amber-300 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  ⚠️ This will overwrite your existing API key. Any applications
                  using the old key will stop working.
                </p>
              )}
              <p className="text-slate-400">
                {apiKeyStatus?.hasApiKey
                  ? "Are you sure you want to generate a new API key? This action cannot be undone."
                  : "This will generate a new API key for accessing the CarHub API."}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-slate-600/50 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateApiKey}
                disabled={generateApiKeyMutation.isPending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all duration-200"
              >
                {generateApiKeyMutation.isPending
                  ? "Generating..."
                  : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Display Modal */}
      {newApiKey && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg mx-4">
            <div className="flex items-center gap-3 mb-4">
              <FaKey className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-semibold text-slate-200">
                API Key Generated
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-green-300 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                ✅ Your new API key has been generated successfully!
              </p>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Your API Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg font-mono text-sm">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={newApiKey}
                      readOnly
                      className="w-full bg-transparent text-slate-200 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
                    title={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  <button
                    onClick={handleCopyApiKey}
                    className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              <p className="text-amber-300 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                ⚠️ Make sure to copy and store this API key securely. You
                won&apos;t be able to see it again.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyApiKey}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FaCopy className="w-4 h-4" />
                Copy API Key
              </button>
              <button
                onClick={closeApiKeyModal}
                className="px-4 py-2 bg-slate-600/50 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-all duration-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
