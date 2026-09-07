'use client';

import React from 'react';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareLinkBoxProps {
  shareUrl: string;
  copied: boolean;
  onCopyLink: () => void;
}

export default function ShareLinkBox({ shareUrl, copied, onCopyLink }: ShareLinkBoxProps) {
  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-emerald-600" />
        <h3 className="font-bold text-slate-900 text-sm">Share Your Results</h3>
      </div>
      <p className="text-xs text-slate-500">
        Anyone with this link can view the read-only dashboard without needing to sign in:
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={shareUrl}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono select-all focus:outline-none"
        />
        <button
          onClick={onCopyLink}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c1815] hover:bg-[#18362e] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
