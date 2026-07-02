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
            <Link href="/planner" className="hover:text-gray-300 transition-colors">Career Planner</Link>
            <Link href="/learning" className="hover:text-gray-300 transition-colors">Learning Path</Link>
            <Link href="/goals" className="hover:text-gray-300 transition-colors">Career Goals</Link>
            <Link href="/achievements" className="hover:text-gray-300 transition-colors">Achievements</Link>
            <Link href="/certifications" className="hover:text-gray-300 transition-colors">Certifications</Link>
            <Link href="/companies" className="hover:text-gray-300 transition-colors">Target Companies</Link>
            <Link href="/references" className="hover:text-gray-300 transition-colors">References</Link>
            <Link href="/question-bank" className="hover:text-gray-300 transition-colors">Question Bank</Link>
            <Link href="/portfolio" className="hover:text-gray-300 transition-colors">Portfolio Projects</Link>
            <Link href="/applications" className="hover:text-gray-300 transition-colors">Applications</Link>
            <Link href="/dashboard" className="hover:text-gray-300 transition-colors">Dashboard</Link>
            <Link href="/review" className="hover:text-gray-300 transition-colors">Weekly Review</Link>
            <Link href="/networking" className="hover:text-gray-300 transition-colors">Networking</Link>
            <Link href="/mentorship" className="hover:text-gray-300 transition-colors">Mentorship</Link>
            <a href="#top" className="hover:text-gray-300 transition-colors">Back to top</a>
          </div>

          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} CareerPilot AI
          </p>
        </div>
      </div>
    </footer>
  );
}
