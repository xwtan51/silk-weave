import type { ReactNode } from 'react';

export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
      {/* Phone chassis */}
      <div className="w-full max-w-[390px] h-[844px] max-h-screen bg-paper rounded-[48px] border-[6px] border-[#2C2C2C] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-[#2C2C2C] rounded-b-2xl z-10" />
        {children}
      </div>
    </div>
  );
}
