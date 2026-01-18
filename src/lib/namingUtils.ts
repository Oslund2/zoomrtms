import type { NamingTemplate } from '../types/database';

export interface NamingValidationResult {
  isValid: boolean;
  detectedRoomType: 'main' | 'breakout' | 'unknown';
  detectedRoomNumber: number | null;
  issues: string[];
  suggestions: string[];
}

export type { NamingTemplate };

const BREAKOUT_ROOM_PATTERN = /Breakout\s+Room\s+(\d+)/i;
const VALID_ROOM_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

export function validateMeetingName(
  name: string,
  expectedRoomType?: 'main' | 'breakout',
  expectedRoomNumber?: number
): NamingValidationResult {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (!name || name.trim() === '') {
    issues.push('Meeting name cannot be empty');
    return {
      isValid: false,
      detectedRoomType: 'unknown',
      detectedRoomNumber: null,
      issues,
      suggestions: ['Enter a descriptive meeting name'],
    };
  }

  const match = name.match(BREAKOUT_ROOM_PATTERN);
  const detectedRoomNumber = match ? parseInt(match[1]) : null;
  const detectedRoomType: 'main' | 'breakout' | 'unknown' = detectedRoomNumber ? 'breakout' :
    (expectedRoomType === 'main' || !expectedRoomType) ? 'main' : 'unknown';

  if (expectedRoomType === 'breakout') {
    if (!detectedRoomNumber) {
      issues.push('Breakout room name must include "Breakout Room [1-8]"');
      suggestions.push(`Add " - Breakout Room ${expectedRoomNumber || 1}" to your meeting name`);
    } else if (!VALID_ROOM_NUMBERS.includes(detectedRoomNumber)) {
      issues.push(`Room number must be between 1 and 8 (found: ${detectedRoomNumber})`);
      suggestions.push(`Change to a valid room number (1-8)`);
    } else if (expectedRoomNumber && detectedRoomNumber !== expectedRoomNumber) {
      issues.push(`Name shows Room ${detectedRoomNumber} but Room ${expectedRoomNumber} is selected`);
      suggestions.push(`Update name to "Breakout Room ${expectedRoomNumber}"`);
    }
  }

  if (expectedRoomType === 'main' && detectedRoomNumber) {
    issues.push('Main room should not include "Breakout Room" in name');
    suggestions.push('Remove the breakout room reference from the name');
  }

  const isValid = issues.length === 0;

  return {
    isValid,
    detectedRoomType,
    detectedRoomNumber,
    issues,
    suggestions,
  };
}

export function generateMeetingName(
  baseName: string,
  roomType: 'main' | 'breakout',
  roomNumber?: number,
  template?: string
): string {
  if (roomType === 'main') {
    return baseName || 'Team Meeting';
  }

  const base = baseName || 'Team Discussion';
  const room = roomNumber || 1;

  if (template) {
    return template
      .replace('{ROOM_NUMBER}', room.toString())
      .replace('{BASE_NAME}', base)
      .replace('{DATE}', new Date().toLocaleDateString())
      .replace('{TIME}', new Date().toLocaleTimeString());
  }

  if (base.toLowerCase().includes('breakout room')) {
    return base.replace(/Breakout\s+Room\s+\d+/i, `Breakout Room ${room}`);
  }

  return `${base} - Breakout Room ${room}`;
}

export function applyTemplate(
  template: string,
  roomNumber: number,
  variables?: Record<string, string>
): string {
  let result = template.replace('{ROOM_NUMBER}', roomNumber.toString());

  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(`{${key}}`, value);
    });
  }

  result = result
    .replace('{DATE}', new Date().toLocaleDateString())
    .replace('{TIME}', new Date().toLocaleTimeString())
    .replace('{HOST_NAME}', variables?.HOST_NAME || 'Host');

  return result;
}

export function fixNonCompliantName(
  currentName: string,
  roomType: 'main' | 'breakout',
  roomNumber?: number
): string {
  if (roomType === 'main') {
    return currentName.replace(/\s*-?\s*Breakout\s+Room\s+\d+/gi, '').trim();
  }

  const match = currentName.match(BREAKOUT_ROOM_PATTERN);
  if (match) {
    const currentRoom = parseInt(match[1]);
    if (roomNumber && currentRoom !== roomNumber) {
      return currentName.replace(
        BREAKOUT_ROOM_PATTERN,
        `Breakout Room ${roomNumber}`
      );
    }
    return currentName;
  }

  return generateMeetingName(currentName, roomType, roomNumber);
}

export function extractBaseName(fullName: string): string {
  return fullName.replace(/\s*-?\s*Breakout\s+Room\s+\d+/gi, '').trim();
}

export function detectRoomInfo(name: string): {
  roomType: 'main' | 'breakout';
  roomNumber: number | null;
} {
  const match = name.match(BREAKOUT_ROOM_PATTERN);
  if (match) {
    const roomNumber = parseInt(match[1]);
    if (VALID_ROOM_NUMBERS.includes(roomNumber)) {
      return { roomType: 'breakout', roomNumber };
    }
  }
  return { roomType: 'main', roomNumber: null };
}

export function getQuickPresets(): Array<{ name: string; category: string }> {
  return [
    { name: 'Team Discussion', category: 'meeting' },
    { name: 'Working Session', category: 'workshop' },
    { name: 'Daily Standup', category: 'standup' },
    { name: 'Sprint Planning', category: 'planning' },
    { name: 'Department Meeting', category: 'meeting' },
    { name: 'Training Session', category: 'training' },
    { name: 'Client Meeting', category: 'client' },
    { name: 'Project Workshop', category: 'workshop' },
  ];
}
