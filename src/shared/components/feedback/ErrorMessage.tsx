import { AlertCircle } from "lucide-react";

export default function ErrorMessage({message}: {message: string}) {
    return (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{message}</span>
            </div>
          </div>
    );
}
