import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Info, ExternalLink } from 'lucide-react';

interface NamingGuideProps {
  roomType: 'main' | 'breakout';
}

export default function NamingGuide({ roomType }: NamingGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-700">
            Naming Guide for {roomType === 'main' ? 'Main Room' : 'Breakout Rooms'}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {roomType === 'breakout' ? (
            <>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Required Format</h4>
                <p className="text-sm text-slate-600 mb-2">
                  Breakout room names MUST include "Breakout Room [1-8]" for Zoom to detect them correctly.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <code className="text-sm text-blue-900">
                    [Your Topic] - Breakout Room [1-8]
                  </code>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Correct Examples
                </h4>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>All Participants - Breakout Room 1</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Finance - Breakout Room 3</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Marketing - Breakout Room 5</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Incorrect Examples
                </h4>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>All Participants - Room 1 (missing "Breakout")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>Finance - Breakout Room 9 (invalid number)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>Marketing (missing room designation)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong>Important:</strong> Room numbers must be 1-8. Zoom uses this pattern to route RTMS data correctly.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Main Room Format</h4>
                <p className="text-sm text-slate-600 mb-2">
                  Main room names can be anything descriptive. Avoid including "Breakout Room" in the name.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Good Examples
                </h4>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>All-Hands Meeting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Q1 Strategy Session</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Engineering Team Sync</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> Use clear, descriptive names that help participants understand the meeting purpose.
                </p>
              </div>
            </>
          )}

          <div className="pt-2 border-t border-slate-200">
            <a
              href="https://developers.zoom.us/docs/rtms/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              Learn more about Zoom RTMS naming
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
