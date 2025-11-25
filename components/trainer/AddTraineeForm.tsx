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
    <Card className="bg-card border-2 border-primary shadow-lg rounded-2xl sm:rounded-[2rem]">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-xl sm:text-2xl font-black">הוסף מתאמן חדש</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl flex-shrink-0"
            disabled={adding}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {error && (
          <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-2xl text-red-500 text-sm font-bold">
            {error}
          </div>
        )}
        
        <div>
          <label className="text-sm font-bold mb-2 block text-foreground">
            שם המתאמן
          </label>
          <Input
            type="text"
            placeholder="הזן שם"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-accent/30 border-2 border-border text-foreground rounded-xl h-12 font-medium focus:border-primary transition-all"
            disabled={adding}
          />
        </div>
        
        <div>
          <label className="text-sm font-bold mb-2 block text-foreground">
            אימייל (שם משתמש)
          </label>
          <Input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-accent/30 border-2 border-border text-foreground rounded-xl h-12 font-medium focus:border-primary transition-all"
            disabled={adding}
          />
        </div>
        
        <div>
          <label className="text-sm font-bold mb-2 block text-foreground">
            סיסמה ראשונית
          </label>
          <Input
            type="password"
            placeholder="לפחות 6 תווים"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-accent/30 border-2 border-border text-foreground rounded-xl h-12 font-medium focus:border-primary transition-all"
            disabled={adding}
          />
          <p className="text-xs text-muted-foreground mt-2 font-medium bg-accent/20 p-2 rounded-lg">
            ⚠️ זוהי סיסמה ראשונית. מומלץ שהמתאמן ישנה אותה בכניסה הראשונה.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!name || !email || !password || adding}
            className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-lg sm:rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm sm:text-base"
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
            className="flex-1 h-11 sm:h-12 border-2 border-border text-foreground hover:bg-accent font-black rounded-lg sm:rounded-xl transition-all active:scale-95 text-sm sm:text-base"
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
    <Card className="bg-card border-2 border-green-500 shadow-lg rounded-2xl sm:rounded-[2rem] mt-4">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-foreground text-lg sm:text-2xl font-black">פרטי התחברות למתאמן החדש</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="p-4 sm:p-6 bg-gradient-to-br from-accent/30 to-accent/20 rounded-xl sm:rounded-2xl border-2 border-border">
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-bold uppercase">אימייל:</p>
          <p className="text-foreground font-mono text-base sm:text-xl font-black mb-4 break-all">{email}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-bold uppercase">סיסמה:</p>
          <p className="text-foreground font-mono text-base sm:text-xl font-black break-all">{password}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleWhatsAppShare}
            className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-black rounded-lg sm:rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95 text-sm sm:text-base"
          >
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
            שלח בוואטסאפ
          </Button>
          <Button
            onClick={handleCopyCredentials}
            variant="outline"
            className="flex-1 h-11 sm:h-12 border-2 border-border text-foreground hover:bg-accent font-black rounded-lg sm:rounded-xl transition-all active:scale-95 text-sm sm:text-base"
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
        
        <p className="text-xs text-muted-foreground text-center font-medium bg-accent/20 p-3 rounded-xl">
          ⚠️ שמור את הפרטים במקום בטוח. המתאמן יוכל לשנות את הסיסמה בכניסה הראשונה.
        </p>
      </CardContent>
    </Card>
  );
}

