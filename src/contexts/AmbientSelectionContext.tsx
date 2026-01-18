import { createContext, useContext, useState, ReactNode } from 'react';
import type { Transcript } from '../types/database';

interface SelectedTopic {
  id: string;
  label: string;
  category: string | null;
  roomMentions: Record<string, number>;
}

interface AmbientSelectionState {
  selectedTopic: SelectedTopic | null;
  selectedRoom: number | null;
  selectedCategory: string | null;
  selectedTranscript: Transcript | null;
}

interface AmbientSelectionContextType extends AmbientSelectionState {
  setSelectedTopic: (topic: SelectedTopic | null) => void;
  setSelectedRoom: (room: number | null) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedTranscript: (transcript: Transcript | null) => void;
  clearAllFilters: () => void;
}

const AmbientSelectionContext = createContext<AmbientSelectionContextType | undefined>(undefined);

export function AmbientSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedTopic, setSelectedTopic] = useState<SelectedTopic | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);

  const clearAllFilters = () => {
    setSelectedTopic(null);
    setSelectedRoom(null);
    setSelectedCategory(null);
    setSelectedTranscript(null);
  };

  return (
    <AmbientSelectionContext.Provider
      value={{
        selectedTopic,
        selectedRoom,
        selectedCategory,
        selectedTranscript,
        setSelectedTopic,
        setSelectedRoom,
        setSelectedCategory,
        setSelectedTranscript,
        clearAllFilters,
      }}
    >
      {children}
    </AmbientSelectionContext.Provider>
  );
}

export function useAmbientSelection() {
  const context = useContext(AmbientSelectionContext);
  if (!context) {
    throw new Error('useAmbientSelection must be used within AmbientSelectionProvider');
  }
  return context;
}
