"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, X, MessageSquare, Copy, Check } from "lucide-react";

interface AddTraineeFormProps {
  onAdd: (email: string, password: string, name: string) => Promise<void>;
  onCancel: () => void;
  adding: boolean;
  error: string | null;
}

export function AddTraineeForm({ onAdd, onCancel, adding, error }: AddTraineeFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      return;
    }
    await onAdd(email, password, name);
    // Clear form on success
    if (!error) {
      setName("");
      setEmail("");
      setPassword("");
    }
  };

  const handleWhatsAppShare = (email: string, password: string) => {
    const message = `שלום! נוצר עבורך חשבון ב-Universal FitLog.\n\nפרטי התחברות:\nאימייל: ${email}\nסיסמה: ${password}\n\nמומלץ לשנות את הסיסמה בכניסה הראשונה.\n\nכניסה: ${window.location.origin}/auth/login`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyCredentials = (email: string, password: string) => {
    const text = `אימייל: ${email}\nסיסמה: ${password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
      <CardHeader className="p-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white text-xl sm:text-2xl font-bold">הוסף מתאמן חדש</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl flex-shrink-0"
            disabled={adding}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold">
            {error}
          </div>
        )}
        
        <div>
          <label className="text-sm font-bold mb-2 block text-gray-900 dark:text-white">
            שם המתאמן
          </label>
          <Input
            type="text"
            placeholder="הזן שם"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl h-12 font-medium focus:border-blue-600 dark:focus:border-blue-500 transition-all"
            disabled={adding}
          />
        </div>
        
        <div>
          <label className="text-sm font-bold mb-2 block text-gray-900 dark:text-white">
            אימייל (שם משתמש)
          </label>
          <Input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl h-12 font-medium focus:border-blue-600 dark:focus:border-blue-500 transition-all"
            disabled={adding}
          />
        </div>
        
        <div>
          <label className="text-sm font-bold mb-2 block text-gray-900 dark:text-white">
            סיסמה ראשונית
          </label>
          <Input
            type="password"
            placeholder="לפחות 6 תווים"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl h-12 font-medium focus:border-blue-600 dark:focus:border-blue-500 transition-all"
            disabled={adding}
          />
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 font-medium bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg">
            ⚠️ זוהי סיסמה ראשונית. מומלץ שהמתאמן ישנה אותה בכניסה הראשונה.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!name || !email || !password || adding}
            className="flex-1 h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg sm:rounded-xl shadow-sm transition-all active:scale-95 text-sm sm:text-base"
          >
            {adding ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 ml-2 animate-spin" />
                מוסיף...
              </>
            ) : (
              "הוסף מתאמן"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-11 sm:h-12 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-lg sm:rounded-xl transition-all active:scale-95 text-sm sm:text-base"
            disabled={adding}
          >
            ביטול
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Component to display credentials after successful creation
interface CredentialsDisplayProps {
  email: string;
  password: string;
  onClose: () => void;
}

export function CredentialsDisplay({ email, password, onClose }: CredentialsDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleWhatsAppShare = () => {
    const message = `שלום! נוצר עבורך חשבון ב-Universal FitLog.\n\nפרטי התחברות:\nאימייל: ${email}\nסיסמה: ${password}\n\nמומלץ לשנות את הסיסמה בכניסה הראשונה.\n\nכניסה: ${window.location.origin}/auth/login`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyCredentials = () => {
    const text = `אימייל: ${email}\nסיסמה: ${password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
      <CardHeader className="p-5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-gray-900 dark:text-white text-lg sm:text-2xl font-bold">פרטי התחברות למתאמן החדש</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-slate-800">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mb-2 font-bold uppercase">אימייל:</p>
          <p className="text-gray-900 dark:text-white font-mono text-base sm:text-xl font-black mb-4 break-all">{email}</p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mb-2 font-bold uppercase">סיסמה:</p>
          <p className="text-gray-900 dark:text-white font-mono text-base sm:text-xl font-black break-all">{password}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleWhatsAppShare}
            className="flex-1 h-11 sm:h-12 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-bold rounded-lg sm:rounded-xl shadow-sm transition-all active:scale-95 text-sm sm:text-base"
          >
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
            שלח בוואטסאפ
          </Button>
          <Button
            onClick={handleCopyCredentials}
            variant="outline"
            className="flex-1 h-11 sm:h-12 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-lg sm:rounded-xl transition-all active:scale-95 text-sm sm:text-base"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                הועתק!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                העתק
              </>
            )}
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-slate-400 text-center font-medium bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
          ⚠️ שמור את הפרטים במקום בטוח. המתאמן יוכל לשנות את הסיסמה בכניסה הראשונה.
        </p>
      </CardContent>
    </Card>
  );
}

