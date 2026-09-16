import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, ExternalLink, RefreshCw, X, Database, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface FirebaseRulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseRulesGuideModal: React.FC<FirebaseRulesGuideModalProps> = ({ isOpen, onClose }) => {
  const { refreshFromFirebase, syncAllToFirebase, isFirebaseSyncing } = useApp();
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const rulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rulesCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestResult('กำลังทดสอบการเชื่อมต่อ...');
    try {
      await refreshFromFirebase();
      await syncAllToFirebase();
      setTestResult('✅ เชื่อมต่อสำเร็จและซิงค์ข้อมูลเรียบร้อยแล้ว! ทุกอุปกรณ์ (iOS, PC, Android) เชื่อมต่อกันสดแล้ว');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setTestResult('❌ ยังติดสิทธิ์ (permission-denied): กรุณาตรวจสอบว่ากดปุ่ม "Publish" ใน Firebase Console แล้วหรือยัง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">วิธีเปิดสิทธิ์ Firebase Rules</h3>
              <p className="text-xs text-amber-100 mt-0.5">เพื่อให้ PC, iOS (iPad/iPhone) และ Android ซิงค์ข้อมูลตรงกันแบบ Realtime</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
            <Database className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">สาเหตุที่ข้อมูลบน iPad และ PC ยังไม่ตรงกัน:</span>
              <p className="mt-0.5 text-amber-800">
                เนื่องจากโปรเจกต์ <strong>promote-cnsp</strong> บน Firebase Console ยังติดสิทธิ์ <code>permission-denied</code> ทำให้ฐานข้อมูลยังไม่ยอมรับการเขียนและอ่านจากภายนอก
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
              <span>ขั้นตอนที่ 1: เปิดหน้า Rules ใน Firebase Console</span>
            </h4>
            <a
              href="https://console.firebase.google.com/project/promote-cnsp/firestore/rules"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <span>เปิดหน้า Firestore Rules ของ promote-cnsp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
                <span>ขั้นตอนที่ 2: วางกฎด้านล่างนี้แทนที่กฎเดิม</span>
              </h4>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-amber-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed select-all">
              {rulesCode}
            </pre>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
              <span>ขั้นตอนที่ 3: กดปุ่ม "Publish" (เผยแพร่)</span>
            </h4>
            <p className="text-xs text-slate-500 pl-6.5">
              ที่มุมขวาบนของหน้าเว็บ Firebase Console ให้กดปุ่มสีฟ้า <strong>"Publish"</strong> เพื่อบันทึกกฎ
            </p>
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              testResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {testResult}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/80 text-xs font-bold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
          <button
            onClick={handleTestConnection}
            disabled={isFirebaseSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isFirebaseSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>ฉันกด Publish แล้ว - ทดสอบซิงค์สด</span>
          </button>
        </div>
      </div>
    </div>
  );
};
