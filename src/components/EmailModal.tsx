import { useState, useEffect } from "react";
import { Mail, X, Send, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  defaultEmail?: string;
  studentName?: string;
  onSend: (email: string) => Promise<void>;
}

type SendState = "idle" | "sending" | "success" | "error";

const EmailModal = ({ open, onClose, defaultEmail = "", studentName, onSend }: EmailModalProps) => {
  const [email, setEmail] = useState(defaultEmail);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setEmail(defaultEmail);
      setSendState("idle");
      setErrorMsg("");
    }
  }, [open, defaultEmail]);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSend = async () => {
    if (!isValidEmail) return;
    setSendState("sending");
    setErrorMsg("");
    try {
      await onSend(email.trim());
      setSendState("success");
    } catch (e: any) {
      setSendState("error");
      setErrorMsg(e?.message || "Failed to send. Check backend configuration.");
    }
  };

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-slideUp"
        style={{ background: "white" }}
      >
        {/* Header gradient bar */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 h-1.5" />

        {/* Content */}
        <div className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X className="h-4 w-4" />
          </button>

          {sendState === "success" ? (
            // ── Success State ──
            <div className="py-6 text-center space-y-4">
              <div className="inline-flex h-16 w-16 rounded-full bg-green-100 items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Email Sent!</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Academic result has been sent to
                </p>
                <p className="text-sm font-semibold text-indigo-600 mt-0.5">{email}</p>
              </div>
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                📬 If using Mailtrap sandbox, check your{" "}
                <a
                  href="https://mailtrap.io/inboxes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 underline"
                >
                  Mailtrap Inbox
                </a>{" "}
                for the captured email.
              </p>
              <Button
                onClick={onClose}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90"
              >
                Done
              </Button>
            </div>
          ) : (
            // ── Send Form ──
            <div className="space-y-5">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Email Result Sheet</h2>
                  <p className="text-xs text-gray-500">
                    Send academic result directly to student{studentName ? ` — ${studentName}` : ""}
                  </p>
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="modal-email" className="text-sm font-semibold text-gray-700">
                  Recipient Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                  className={cn(
                    "text-sm rounded-xl border-2 focus:border-indigo-400 transition-colors",
                    !isValidEmail && email.length > 0 && "border-red-400 focus:border-red-400"
                  )}
                  disabled={sendState === "sending"}
                  autoFocus
                />
                {!isValidEmail && email.length > 3 && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Please enter a valid email address
                  </p>
                )}
              </div>

              {/* What will be sent info box */}
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">What will be sent</p>
                <div className="text-xs text-indigo-600 space-y-1">
                  <p>📧 Rich HTML email with full marks breakdown</p>
                  <p>📎 PDF result sheet as attachment</p>
                  <p>📊 Subject-wise performance summary</p>
                </div>
              </div>

              {/* Error state */}
              {sendState === "error" && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700">Send Failed</p>
                    <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
                    <p className="text-xs text-red-500 mt-1">
                      💡 Make sure backend is running and <code className="bg-red-100 px-1 rounded">MAILTRAP_INBOX_ID</code> is set in <code className="bg-red-100 px-1 rounded">backend/.env</code>
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-xl border-2"
                  disabled={sendState === "sending"}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!isValidEmail || sendState === "sending"}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90 gap-2 disabled:opacity-50"
                >
                  {sendState === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
