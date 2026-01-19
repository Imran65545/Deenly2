import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center">
                <Loader2 size={48} className="text-emerald-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
