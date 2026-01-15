import type {
  Meeting,
  Participant,
  Transcript,
  TopicNode,
  TopicEdge,
  InsightEvent,
  AnalysisSummary,
} from '../types/database';

const SPEAKER_NAMES = [
  'Sarah Chen', 'Michael Rodriguez', 'Emily Thompson', 'David Kim', 'Jessica Martinez',
  'James Wilson', 'Lisa Anderson', 'Robert Lee', 'Amanda Brown', 'Christopher Taylor',
  'Rachel Green', 'Daniel White', 'Sophia Johnson', 'Matthew Davis', 'Olivia Garcia',
  'Andrew Miller', 'Victoria Jones', 'Ryan Moore', 'Lauren Martinez', 'Brandon Clark',
  'Natalie Lewis', 'Kevin Walker', 'Michelle Hall', 'Steven Allen', 'Jennifer Young',
  'Joshua King', 'Ashley Wright', 'Tyler Scott', 'Megan Adams', 'Jordan Baker',
];

const MEETING_TOPICS = [
  'Digital Transformation Strategy',
  'Cloud Migration Planning',
  'Customer Experience Workshop',
  'Q1 Strategic Planning',
  'Product Roadmap Review',
  'Agile Transformation Discussion',
  'Data Platform Architecture',
  'API Strategy Session',
  'Security Framework Planning',
  'Organizational Change Management',
  'Innovation Lab Kickoff',
  'Cost Optimization Review',
  'Market Research Findings',
  'Technical Debt Assessment',
  'Employee Engagement Initiative',
  'Partner Integration Planning',
  'Mobile Strategy Discussion',
  'Analytics Dashboard Review',
  'Process Automation Workshop',
  'Customer Feedback Analysis',
];

const TRANSCRIPT_TEMPLATES = {
  Strategy: [
    "I think we need to prioritize the digital transformation initiatives for Q2, especially around customer-facing applications.",
    "Our strategy should focus on three pillars: technology modernization, process optimization, and talent development.",
    "The competitive landscape is shifting rapidly. We need to be more agile in our decision-making.",
    "Let's align on the strategic objectives before diving into tactical implementations.",
    "I'm seeing strong alignment between what Finance is proposing and our overall business strategy.",
  ],
  Operations: [
    "The current process has too many manual steps. We need to automate at least 60% of this workflow.",
    "We're experiencing bottlenecks in the approval chain. Can we streamline this?",
    "Our operational metrics show a 15% improvement since implementing the new system.",
    "I'm concerned about the scalability of this approach as we grow.",
    "We need better visibility into our operations pipeline. The current reporting is insufficient.",
  ],
  Technology: [
    "We should move to a microservices architecture to improve scalability and maintainability.",
    "The cloud migration will reduce our infrastructure costs by approximately 30% annually.",
    "I recommend we use containerization for better deployment consistency across environments.",
    "Our technical debt is accumulating. We need to allocate time for refactoring.",
    "The API gateway will handle authentication, rate limiting, and routing for all services.",
  ],
  People: [
    "Change management is critical here. We need to bring the team along on this journey.",
    "I'm hearing concerns from the team about the learning curve for this new platform.",
    "We should invest in training programs to upskill our workforce for these new technologies.",
    "The team is showing some resistance to change. We need better communication.",
    "Employee morale is high right now, which is a good foundation for this transformation.",
  ],
  Finance: [
    "The ROI projection shows breakeven in 18 months, which aligns with our investment criteria.",
    "We need to be mindful of budget constraints. Can we phase this implementation?",
    "The cost-benefit analysis clearly favors the cloud-native approach.",
    "I'm concerned about the upfront capital expenditure. Can we explore OpEx alternatives?",
    "Let's ensure we have proper financial tracking for this initiative.",
  ],
};

const TOPIC_LABELS = {
  Strategy: ['Digital Transformation', 'Market Positioning', 'Competitive Analysis', 'Business Model', 'Strategic Partnerships'],
  Operations: ['Process Automation', 'Workflow Optimization', 'Supply Chain', 'Quality Assurance', 'Operational Excellence'],
  Technology: ['Cloud Migration', 'Microservices', 'API Architecture', 'Data Platform', 'DevOps', 'Security Framework'],
  People: ['Change Management', 'Training & Development', 'Team Culture', 'Leadership', 'Employee Engagement'],
  Finance: ['Budget Planning', 'ROI Analysis', 'Cost Optimization', 'Financial Planning', 'Investment Strategy'],
};

const INSIGHT_TEMPLATES = {
  alignment: [
    { title: 'Strategic Alignment on Cloud Migration', description: 'Technology and Finance teams are aligned on cloud infrastructure approach and budget allocation.' },
    { title: 'Cross-Team Consensus on Customer Focus', description: 'All breakout rooms emphasizing customer experience as top priority for Q2.' },
    { title: 'Unified Approach to Agile Transformation', description: 'Operations and Technology teams converging on similar agile methodologies and practices.' },
    { title: 'Budget Agreement Across Departments', description: 'Finance and Strategy teams reached consensus on investment prioritization.' },
    { title: 'Shared Vision for Digital Platform', description: 'Product and Engineering teams aligned on technical architecture and roadmap.' },
  ],
  misalignment: [
    { title: 'Timeline Concerns in Operations', description: 'Operations team expressing concerns about aggressive timeline that Strategy team has not addressed.' },
    { title: 'Budget Tension Between Teams', description: 'Finance proposing budget cuts while Technology team is requesting additional resources.' },
    { title: 'Different Approaches to Implementation', description: 'Main room discussing phased rollout while breakout room 3 is planning big-bang deployment.' },
    { title: 'Conflicting Priorities Detected', description: 'Room 2 prioritizing cost reduction while Room 4 is emphasizing feature expansion.' },
    { title: 'Technical Approach Disagreement', description: 'Architecture team in Room 1 suggesting microservices while Room 5 favoring monolithic approach.' },
  ],
  gap: [
    { title: 'Customer Impact Not Discussed', description: 'No mention of customer impact analysis in any breakout rooms despite being stated objective.' },
    { title: 'Security Considerations Missing', description: 'Security and compliance topics absent from technology discussions in active rooms.' },
    { title: 'Change Management Not Addressed', description: 'Organizational change impacts not being discussed while planning major transformation.' },
    { title: 'Risk Assessment Needed', description: 'Teams discussing implementation details but missing comprehensive risk analysis.' },
    { title: 'Success Metrics Undefined', description: 'No clear KPIs or success criteria defined across any discussion rooms.' },
  ],
  highlight: [
    { title: 'Innovative Solution Proposed', description: 'Room 3 discussing creative approach to API integration that could reduce complexity by 40%.' },
    { title: 'Strong Team Engagement', description: 'High participation and collaborative problem-solving observed across all active rooms.' },
    { title: 'Data-Driven Decision Making', description: 'Teams consistently referencing analytics and metrics to support their recommendations.' },
    { title: 'Quick Problem Resolution', description: 'Technical blockers identified and resolved efficiently through cross-team collaboration.' },
  ],
};

class DemoDataGenerator {
  private meetingIdCounter = 1;
  private participantIdCounter = 1;
  private transcriptIdCounter = 1;
  private topicNodeIdCounter = 1;
  private topicEdgeIdCounter = 1;
  private insightIdCounter = 1;
  private summaryIdCounter = 1;

  private usedNames = new Set<string>();
  private topicNodes: TopicNode[] = [];

  generateMeetings(activeCount: number = 2, historicalCount: number = 18): Meeting[] {
    const meetings: Meeting[] = [];
    const now = new Date();

    // Generate active meetings
    for (let i = 0; i < activeCount; i++) {
      const roomType = i === 0 ? 'main' : 'breakout';
      const roomNumber = i === 0 ? 0 : i;
      const startedAt = new Date(now.getTime() - Math.random() * 3600000).toISOString();

      meetings.push({
        id: `demo-meeting-${this.meetingIdCounter++}`,
        meeting_uuid: `demo-uuid-${Math.random().toString(36).substr(2, 9)}`,
        rtms_stream_id: `rtms-${Math.random().toString(36).substr(2, 9)}`,
        server_urls: 'wss://demo.rtms.zoom.us',
        host_id: `host-${i}`,
        host_name: this.getRandomName(),
        topic: MEETING_TOPICS[i % MEETING_TOPICS.length],
        status: 'active',
        room_type: roomType,
        room_number: roomNumber,
        parent_meeting_id: roomType === 'breakout' ? 'demo-meeting-1' : null,
        started_at: startedAt,
        ended_at: null,
        created_at: startedAt,
        updated_at: startedAt,
      });
    }

    // Generate historical meetings
    for (let i = 0; i < historicalCount; i++) {
      const daysAgo = Math.floor(Math.random() * 14) + 1;
      const startedAt = new Date(now.getTime() - daysAgo * 86400000 - Math.random() * 36000000);
      const duration = (30 + Math.random() * 90) * 60000; // 30-120 minutes
      const endedAt = new Date(startedAt.getTime() + duration);

      meetings.push({
        id: `demo-meeting-${this.meetingIdCounter++}`,
        meeting_uuid: `demo-uuid-${Math.random().toString(36).substr(2, 9)}`,
        rtms_stream_id: `rtms-${Math.random().toString(36).substr(2, 9)}`,
        server_urls: 'wss://demo.rtms.zoom.us',
        host_id: `host-${i}`,
        host_name: this.getRandomName(),
        topic: MEETING_TOPICS[(i + 2) % MEETING_TOPICS.length],
        status: 'ended',
        room_type: 'main',
        room_number: 0,
        parent_meeting_id: null,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        created_at: startedAt.toISOString(),
        updated_at: endedAt.toISOString(),
      });
    }

    return meetings.sort((a, b) =>
      new Date(b.started_at || b.created_at).getTime() - new Date(a.started_at || a.created_at).getTime()
    );
  }

  generateParticipants(meetingId: string, count: number = 12): Participant[] {
    const participants: Participant[] = [];
    const now = new Date();
    const meetingStart = new Date(now.getTime() - Math.random() * 1800000);

    for (let i = 0; i < count; i++) {
      const joinedAt = new Date(meetingStart.getTime() + Math.random() * 600000);
      const isActive = Math.random() > 0.2; // 80% active

      participants.push({
        id: `demo-participant-${this.participantIdCounter++}`,
        meeting_id: meetingId,
        participant_id: `participant-${Math.random().toString(36).substr(2, 9)}`,
        user_name: this.getRandomName(),
        email: null,
        role: i === 0 ? 'host' : Math.random() > 0.9 ? 'co-host' : 'participant',
        joined_at: joinedAt.toISOString(),
        left_at: isActive ? null : new Date(joinedAt.getTime() + Math.random() * 1800000).toISOString(),
        is_active: isActive,
        created_at: joinedAt.toISOString(),
      });
    }

    return participants;
  }

  generateTranscripts(meetingId: string, count: number = 50): Transcript[] {
    const transcripts: Transcript[] = [];
    const now = new Date();
    const categories = Object.keys(TRANSCRIPT_TEMPLATES);

    for (let i = 0; i < count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const templates = TRANSCRIPT_TEMPLATES[category as keyof typeof TRANSCRIPT_TEMPLATES];
      const content = templates[Math.floor(Math.random() * templates.length)];
      const createdAt = new Date(now.getTime() - (count - i) * 12000); // Spread over last 10 minutes

      transcripts.push({
        id: `demo-transcript-${this.transcriptIdCounter++}`,
        meeting_id: meetingId,
        participant_id: `participant-${Math.floor(Math.random() * 12)}`,
        speaker_name: this.getRandomName(),
        content,
        timestamp_ms: Math.floor(Math.random() * 3600000),
        sequence: i,
        is_final: true,
        created_at: createdAt.toISOString(),
      });
    }

    return transcripts.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  generateTopicNodes(count: number = 28): TopicNode[] {
    const nodes: TopicNode[] = [];
    const now = new Date();
    const categories = Object.keys(TOPIC_LABELS);

    categories.forEach(category => {
      const labels = TOPIC_LABELS[category as keyof typeof TOPIC_LABELS];
      labels.forEach(label => {
        const mentionCount = Math.floor(Math.random() * 15) + 3;
        const roomMentions: Record<string, number> = {};

        // Distribute mentions across rooms
        const numRooms = Math.floor(Math.random() * 4) + 1;
        for (let i = 0; i < numRooms; i++) {
          const room = Math.floor(Math.random() * 9);
          roomMentions[room] = Math.floor(Math.random() * 5) + 1;
        }

        const firstSeen = new Date(now.getTime() - Math.random() * 3600000);
        const lastSeen = new Date(now.getTime() - Math.random() * 600000);

        nodes.push({
          id: `demo-topic-${this.topicNodeIdCounter++}`,
          label,
          description: `Discussion topic related to ${category.toLowerCase()}`,
          category,
          mention_count: mentionCount,
          room_mentions: roomMentions,
          importance_score: Math.random() * 0.7 + 0.3,
          first_seen: firstSeen.toISOString(),
          last_seen: lastSeen.toISOString(),
          created_at: firstSeen.toISOString(),
        });
      });
    });

    this.topicNodes = nodes;
    return nodes;
  }

  generateTopicEdges(nodes: TopicNode[]): TopicEdge[] {
    const edges: TopicEdge[] = [];
    const relationshipTypes: Array<'related_to' | 'depends_on' | 'conflicts_with' | 'supports'> =
      ['related_to', 'depends_on', 'conflicts_with', 'supports'];
    const weights = [0.6, 0.2, 0.05, 0.15]; // Probabilities for each type

    // Create edges between nodes
    for (let i = 0; i < nodes.length; i++) {
      const connectionsCount = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < connectionsCount; j++) {
        let targetIdx = Math.floor(Math.random() * nodes.length);
        if (targetIdx === i) continue;

        // Prefer connections within same category
        if (Math.random() > 0.6) {
          const sameCategoryNodes = nodes
            .map((n, idx) => ({ node: n, idx }))
            .filter(({ node }) => node.category === nodes[i].category && node.id !== nodes[i].id);
          if (sameCategoryNodes.length > 0) {
            targetIdx = sameCategoryNodes[Math.floor(Math.random() * sameCategoryNodes.length)].idx;
          }
        }

        const rand = Math.random();
        let relationshipType: typeof relationshipTypes[number] = 'related_to';
        let cumulative = 0;
        for (let k = 0; k < weights.length; k++) {
          cumulative += weights[k];
          if (rand < cumulative) {
            relationshipType = relationshipTypes[k];
            break;
          }
        }

        edges.push({
          id: `demo-edge-${this.topicEdgeIdCounter++}`,
          source_node_id: nodes[i].id,
          target_node_id: nodes[targetIdx].id,
          relationship_type: relationshipType,
          weight: Math.random() * 0.6 + 0.4,
          room_context: {},
          created_at: new Date().toISOString(),
        });
      }
    }

    return edges;
  }

  generateInsightEvents(count: number = 30): InsightEvent[] {
    const insights: InsightEvent[] = [];
    const types: Array<'alignment' | 'misalignment' | 'gap' | 'highlight'> =
      ['alignment', 'misalignment', 'gap', 'highlight'];
    const severities: Array<'info' | 'warning' | 'alert'> = ['info', 'warning', 'alert'];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const templates = INSIGHT_TEMPLATES[type];
      const template = templates[Math.floor(Math.random() * templates.length)];

      let severity: typeof severities[number] = 'info';
      if (type === 'misalignment') severity = Math.random() > 0.5 ? 'warning' : 'alert';
      else if (type === 'gap') severity = 'warning';

      const involvedRooms: number[] = [];
      const roomCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < roomCount; j++) {
        const room = Math.floor(Math.random() * 9);
        if (!involvedRooms.includes(room)) involvedRooms.push(room);
      }

      const createdAt = new Date(now.getTime() - (count - i) * 20000); // Spread over time

      insights.push({
        id: `demo-insight-${this.insightIdCounter++}`,
        insight_type: type,
        severity,
        title: template.title,
        description: template.description,
        involved_rooms: involvedRooms,
        related_topics: this.getRandomTopicLabels(2, 4),
        metadata: {},
        created_at: createdAt.toISOString(),
      });
    }

    return insights.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  generateAnalysisSummaries(): AnalysisSummary[] {
    const summaries: AnalysisSummary[] = [];
    const now = new Date();

    for (let room = 0; room <= 8; room++) {
      const keyTopics = this.getRandomTopicLabels(3, 5);
      const keySpeakers = Array.from({ length: 3 }, () => this.getRandomName());

      summaries.push({
        id: `demo-summary-${this.summaryIdCounter++}`,
        meeting_id: 'demo-meeting-1',
        room_number: room,
        summary_type: 'room',
        content: `Room ${room === 0 ? 'Main' : room} is discussing ${keyTopics.join(', ').toLowerCase()} with focus on implementation strategies.`,
        sentiment_score: Math.random() * 0.5 + 0.3,
        key_topics: keyTopics,
        key_speakers: keySpeakers,
        action_items: [],
        last_transcript_id: null,
        created_at: now.toISOString(),
      });
    }

    return summaries;
  }

  private getRandomName(): string {
    let name: string;
    let attempts = 0;
    do {
      name = SPEAKER_NAMES[Math.floor(Math.random() * SPEAKER_NAMES.length)];
      attempts++;
    } while (this.usedNames.has(name) && attempts < 50);

    this.usedNames.add(name);
    return name;
  }

  private getRandomTopicLabels(min: number, max: number): string[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const allTopics = Object.values(TOPIC_LABELS).flat();
    const selected: string[] = [];

    while (selected.length < count && selected.length < allTopics.length) {
      const topic = allTopics[Math.floor(Math.random() * allTopics.length)];
      if (!selected.includes(topic)) {
        selected.push(topic);
      }
    }

    return selected;
  }

  reset() {
    this.usedNames.clear();
    this.topicNodes = [];
  }
}

export const demoGenerator = new DemoDataGenerator();
