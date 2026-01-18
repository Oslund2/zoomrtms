import { useState, useEffect } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateMeetingName } from '../lib/namingUtils';

export default function NamingWarningBanner() {
  const [nonCompliantCount, setNonCompliantCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = localStorage.getItem('naming-warning-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (dismissedTime > oneDayAgo) {
        setIsDismissed(true);
        return;
      }
    }

    checkNonCompliantMeetings();
  }, []);

  const checkNonCompliantMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      let count = 0;
      if (data) {
        for (const meeting of data) {
          const validation = validateMeetingName(
            meeting.topic || '',
            meeting.room_type as 'main' | 'breakout',
            meeting.room_number || undefined
          );

          if (!validation.isValid) {
            count++;
          }
        }
      }

      setNonCompliantCount(count);
    } catch (error) {
      console.error('Error checking meetings:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('naming-warning-dismissed', Date.now().toString());
  };

  const handleGoToNaming = () => {
    navigate('/settings?tab=naming');
  };

  if (!isVisible || isDismissed || nonCompliantCount === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-amber-900">
              {nonCompliantCount} Meeting{nonCompliantCount !== 1 ? 's' : ''} Need{nonCompliantCount === 1 ? 's' : ''} Attention
            </h3>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0"
              title="Dismiss for 24 hours"
            >
              <X className="w-4 h-4 text-amber-600" />
            </button>
          </div>
          <p className="text-sm text-amber-800 mb-3">
            Some active meetings don't follow Zoom's naming conventions and may not be detected correctly by RTMS.
            This could cause issues with room routing and data collection.
          </p>
          <button
            onClick={handleGoToNaming}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Fix Naming Issues
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
