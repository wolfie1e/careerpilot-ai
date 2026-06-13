import Link from "next/link";
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">CareerPilot AI</span>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <Link href="/#features" className="hover:text-gray-300 transition-colors">Features</Link>
            <Link href="/#how-it-works" className="hover:text-gray-300 transition-colors">How It Works</Link>
            <Link href="/#pricing" className="hover:text-gray-300 transition-colors">Pricing</Link>
            <Link href="/#faq" className="hover:text-gray-300 transition-colors">FAQ</Link>
            <Link href="/login" className="hover:text-gray-300 transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-gray-300 transition-colors">Get Started</Link>
          </div>

          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} CareerPilot AI
          </p>
        </div>
      </div>
    </footer>
  );
}
