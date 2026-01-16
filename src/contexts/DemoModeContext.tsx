import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { demoGenerator } from '../lib/demoData';
import type {
  Meeting,
  Participant,
  Transcript,
  TopicNode,
  TopicEdge,
  InsightEvent,
  AnalysisSummary,
} from '../types/database';

interface DemoData {
  meetings: Meeting[];
  participants: Map<string, Participant[]>;
  transcripts: Transcript[];
  topicNodes: TopicNode[];
  topicEdges: TopicEdge[];
  insights: InsightEvent[];
  summaries: AnalysisSummary[];
}

interface DemoModeContextType {
  isDemoMode: boolean;
  isPaused: boolean;
  demoData: DemoData;
  toggleDemoMode: () => void;
  togglePause: () => void;
  resetDemoData: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

const DEMO_MODE_KEY = 'ambient-demo-mode';
const DEMO_PAUSED_KEY = 'ambient-demo-paused';

function generateInitialData(): DemoData {
  const meetings = demoGenerator.generateMeetings(9, 18);
  const participants = new Map<string, Participant[]>();

  // Generate participants for active meetings
  meetings.filter(m => m.status === 'active').forEach(meeting => {
    participants.set(meeting.id, demoGenerator.generateParticipants(meeting.id, 12));
  });

  // Generate participants for recent historical meetings (last 5)
  meetings
    .filter(m => m.status === 'ended')
    .slice(0, 5)
    .forEach(meeting => {
      participants.set(meeting.id, demoGenerator.generateParticipants(meeting.id, 10));
    });

  const transcripts = meetings.filter(m => m.status === 'active').length > 0
    ? demoGenerator.generateTranscripts(meetings[0].id, 50)
    : [];

  const topicNodes = demoGenerator.generateTopicNodes(28);
  const topicEdges = demoGenerator.generateTopicEdges(topicNodes);
  const insights = demoGenerator.generateInsightEvents(30);
  const summaries = demoGenerator.generateAnalysisSummaries();

  return {
    meetings,
    participants,
    transcripts,
    topicNodes,
    topicEdges,
    insights,
    summaries,
  };
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true') {
      localStorage.setItem(DEMO_MODE_KEY, 'true');
      return true;
    }
    // Check localStorage
    return localStorage.getItem(DEMO_MODE_KEY) === 'true';
  });

  const [isPaused, setIsPaused] = useState(() => {
    return localStorage.getItem(DEMO_PAUSED_KEY) === 'true';
  });

  const [demoData, setDemoData] = useState<DemoData>(generateInitialData);
  const [updateCounter, setUpdateCounter] = useState(0);

  // Persist demo mode state
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(DEMO_MODE_KEY, 'true');
    } else {
      localStorage.removeItem(DEMO_MODE_KEY);
    }
  }, [isDemoMode]);

  // Persist paused state
  useEffect(() => {
    if (isPaused) {
      localStorage.setItem(DEMO_PAUSED_KEY, 'true');
    } else {
      localStorage.removeItem(DEMO_PAUSED_KEY);
    }
  }, [isPaused]);

  // Auto-update demo data every 10 seconds
  useEffect(() => {
    if (!isDemoMode || isPaused) return;

    const interval = setInterval(() => {
      setUpdateCounter(prev => prev + 1);
      updateDemoData();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [isDemoMode, isPaused]);

  const updateDemoData = () => {
    setDemoData(prevData => {
      const activeMeetings = prevData.meetings.filter(m => m.status === 'active');
      const activeMeetingId = activeMeetings[0]?.id || 'demo-meeting-1';

      const newTranscriptCount = Math.floor(Math.random() * 3) + 2;
      const newTranscripts = demoGenerator.generateLiveTranscripts(activeMeetingId, newTranscriptCount);
      const allTranscripts = [...newTranscripts, ...prevData.transcripts].slice(0, 100);

      const newNodeCount = Math.floor(Math.random() * 2) + 1;
      const newNodes = demoGenerator.generateTopicNodes(newNodeCount);
      const allNodes = [...prevData.topicNodes, ...newNodes].slice(-35);

      const newEdges = demoGenerator.generateTopicEdges(allNodes);
      const allEdges = [...prevData.topicEdges, ...newEdges].slice(-50);

      const newInsightCount = Math.floor(Math.random() * 2) + 2;
      const newInsights = demoGenerator.generateInsightEvents(newInsightCount);
      const allInsights = [...newInsights, ...prevData.insights].slice(0, 40);

      const updatedSummaries = prevData.summaries.map(summary => ({
        ...summary,
        sentiment_score: Math.max(0.2, Math.min(0.9, summary.sentiment_score + (Math.random() - 0.5) * 0.1)),
        created_at: new Date().toISOString(),
      }));

      return {
        ...prevData,
        transcripts: allTranscripts,
        topicNodes: allNodes,
        topicEdges: allEdges,
        insights: allInsights,
        summaries: updatedSummaries,
      };
    });
  };

  const toggleDemoMode = () => {
    setIsDemoMode(prev => {
      const newMode = !prev;
      if (newMode) {
        // Reset and generate fresh data when enabling
        demoGenerator.reset();
        setDemoData(generateInitialData());
      }
      return newMode;
    });
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const resetDemoData = () => {
    demoGenerator.reset();
    setDemoData(generateInitialData());
    setUpdateCounter(0);
  };

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        isPaused,
        demoData,
        toggleDemoMode,
        togglePause,
        resetDemoData,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
