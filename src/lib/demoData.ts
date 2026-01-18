import type {
  Meeting,
  Participant,
  Transcript,
  TopicNode,
  TopicEdge,
  InsightEvent,
  AnalysisSummary,
} from '../types/database';

const NEWSROOM_ROLES = [
  { name: 'Sarah Chen', role: 'Managing Editor' },
  { name: 'Michael Rodriguez', role: 'Investigative Reporter' },
  { name: 'Emily Thompson', role: 'City Editor' },
  { name: 'David Kim', role: 'National Editor' },
  { name: 'Jessica Martinez', role: 'Political Correspondent' },
  { name: 'James Wilson', role: 'CFO' },
  { name: 'Lisa Anderson', role: 'Digital Editor' },
  { name: 'Robert Lee', role: 'General Assignment Reporter' },
  { name: 'Amanda Brown', role: 'Communications Director' },
  { name: 'Christopher Taylor', role: 'Revenue Director' },
  { name: 'Rachel Green', role: 'Marketing Manager' },
  { name: 'Daniel White', role: 'Legal Counsel' },
  { name: 'Sophia Johnson', role: 'HR Director' },
  { name: 'Matthew Davis', role: 'Editor-in-Chief' },
  { name: 'Olivia Garcia', role: 'Publisher' },
  { name: 'Andrew Miller', role: 'Operations Manager' },
  { name: 'Victoria Jones', role: 'Investigative Lead' },
  { name: 'Ryan Moore', role: 'Staff Reporter' },
  { name: 'Lauren Martinez', role: 'Photo Editor' },
  { name: 'Brandon Clark', role: 'Data Journalist' },
  { name: 'Natalie Lewis', role: 'Copy Chief' },
  { name: 'Kevin Walker', role: 'Audience Development Manager' },
  { name: 'Michelle Hall', role: 'Social Media Editor' },
  { name: 'Steven Allen', role: 'Video Producer' },
  { name: 'Jennifer Young', role: 'Business Reporter' },
  { name: 'Joshua King', role: 'Sports Editor' },
  { name: 'Ashley Wright', role: 'Features Editor' },
  { name: 'Tyler Scott', role: 'Assistant Editor' },
  { name: 'Megan Adams', role: 'Breaking News Reporter' },
  { name: 'Jordan Baker', role: 'Managing Director' },
];

export const DEPARTMENT_CONFIG = [
  { id: 0, name: 'All Participants', type: 'main' as const },
  { id: 1, name: 'Local News', type: 'breakout' as const },
  { id: 2, name: 'National News', type: 'breakout' as const },
  { id: 3, name: 'Finance', type: 'breakout' as const },
  { id: 4, name: 'Communications', type: 'breakout' as const },
  { id: 5, name: 'Marketing', type: 'breakout' as const },
  { id: 6, name: 'Legal', type: 'breakout' as const },
  { id: 7, name: 'HR', type: 'breakout' as const },
  { id: 8, name: 'Revenue', type: 'breakout' as const },
];

export function getDepartmentName(roomNumber: number): string {
  const dept = DEPARTMENT_CONFIG.find(d => d.id === roomNumber);
  return dept?.name || `Room ${roomNumber}`;
}

const MEETING_TOPICS = [
  'Breaking News Coverage Coordination',
  'Election Coverage Strategy',
  'Investigative Series Planning',
  'Q1 Editorial Strategy',
  'Digital Audience Growth Initiative',
  'Newsroom Workflow Modernization',
  'Multimedia Storytelling Workshop',
  'Revenue Diversification Discussion',
  'Source Protection Protocols',
  'Cross-Department Alignment Meeting',
  'Community Engagement Initiative',
  'Budget Review & Planning',
  'Subscriber Retention Analysis',
  'Content Distribution Strategy',
  'Staff Development Program',
  'Partnership Opportunities Review',
  'Mobile-First Publishing Discussion',
  'Analytics & Metrics Review',
  'Editorial Standards Workshop',
  'Crisis Communication Planning',
];

const TRANSCRIPT_TEMPLATES = {
  MainRoom: [
    "We need to coordinate coverage across local and national desks for this developing story.",
    "The editorial strategy should prioritize investigative depth while maintaining our breaking news capabilities.",
    "Let's ensure all departments are aligned on our digital-first publishing approach for this series.",
    "I'm seeing good momentum from the breakout discussions. We need to synthesize these insights.",
    "Our newsroom transformation requires buy-in from every department. How are teams responding?",
    "The revenue implications of this decision need to be balanced with our editorial mission.",
    "We should reconvene after breakouts to finalize the cross-department action plan.",
  ],
  LocalNews: [
    "I've been cultivating sources in the municipal government for months on this development story.",
    "Our community beat coverage needs more resources. We're missing important neighborhood stories.",
    "The city council meeting tonight could break news on the housing development controversy.",
    "We need to coordinate with the photographer for the community profile piece running Sunday.",
    "Local business owners are concerned about the zoning changes. This could be a major story.",
    "I think we should do a deeper dive into the school board's budget decisions.",
    "The police scanner indicates a developing situation downtown. Should we deploy someone?",
  ],
  NationalNews: [
    "The Washington bureau is tracking three potential policy announcements this week.",
    "We need to localize this national trend story for our readership. What's the regional angle?",
    "Our political correspondent has an exclusive interview with the senator scheduled for tomorrow.",
    "The wire services are reporting conflicting information. We should verify before publishing.",
    "This federal policy change will have significant local impact. We should coordinate with Local News.",
    "I'm tracking investigative leads on the congressional committee's recent hearings.",
    "Our national desk needs to be ready to pivot quickly if this story breaks overnight.",
  ],
  Finance: [
    "Q2 revenue projections are down 8% from our target. We need to adjust operating expenses.",
    "The subscription growth is strong, but we're seeing churn in our mid-tier package.",
    "Advertising revenue continues to decline. We need diversified revenue streams urgently.",
    "Can we phase this technology investment over two fiscal quarters to manage cash flow?",
    "The cost per subscriber acquisition has increased 15%. Marketing needs to optimize campaigns.",
    "I'm concerned about the payroll implications if we expand investigative staff right now.",
    "Let's review the budget allocation for each department before the board meeting.",
  ],
  Communications: [
    "We need a prepared statement ready in case the investigative story generates backlash.",
    "Our brand messaging should emphasize journalistic integrity and community accountability.",
    "The social media response to yesterday's editorial was overwhelmingly positive.",
    "I'm drafting talking points for the publisher's interview with the media trade publication.",
    "We should proactively reach out to stakeholders before the investigative series publishes.",
    "The crisis communication protocol needs to be updated based on lessons from last month.",
    "Our external messaging must align with the newsroom's editorial independence principles.",
  ],
  Marketing: [
    "Our subscriber growth rate increased 22% after implementing the new digital campaign.",
    "The social media engagement metrics show readers want more behind-the-scenes content.",
    "We should A/B test different newsletter formats to improve open rates.",
    "The audience analytics indicate strong interest in local investigative journalism.",
    "I propose we create a subscriber referral program to leverage our loyal reader base.",
    "Our content promotion strategy needs to highlight exclusive investigative work more prominently.",
    "The demographic data shows we're reaching younger audiences through mobile platforms.",
  ],
  Legal: [
    "We need to review this investigative piece for potential defamation concerns before publication.",
    "The source protection protocols must be followed rigorously on this sensitive story.",
    "I recommend we consult with outside counsel on the FOIA request implications.",
    "The reporter's documentation of sources meets our legal standards for this story.",
    "We should add an additional fact-checking layer given the public figures involved.",
    "The retraction and correction policy needs to be applied consistently across all platforms.",
    "I'm reviewing the confidentiality agreements for the anonymous sources cited in this series.",
  ],
  HR: [
    "We have three open positions in the newsroom. The hiring timeline needs to accelerate.",
    "Staff feedback indicates burnout concerns. We should discuss workload distribution.",
    "The training program for multimedia storytelling has been well-received by reporters.",
    "We need to address the salary compression issue before we lose experienced journalists.",
    "The diversity and inclusion initiatives are showing positive results in our recruitment.",
    "I'm concerned about retention given the competitive hiring environment in journalism.",
    "The performance review process should better recognize investigative work that takes months to develop.",
  ],
  Revenue: [
    "The advertising sales team landed a significant sponsor for our investigative series.",
    "We should explore branded content opportunities that don't compromise editorial integrity.",
    "Subscription bundling with local partners could expand our revenue base.",
    "The programmatic advertising rates are down. We need direct sales relationships.",
    "I'm seeing interest from foundations for grant funding of our public service journalism.",
    "The membership model is working well for other newsrooms. Should we consider it?",
    "Event sponsorships could provide a steady supplementary revenue stream.",
  ],
};

const TOPIC_LABELS = {
  News: ['Breaking News Protocol', 'Story Selection', 'Source Development', 'Fact-Checking Standards', 'Editorial Independence', 'Investigative Methods'],
  Finance: ['Budget Management', 'Revenue Forecasting', 'Cost Optimization', 'Investment Strategy', 'Financial Planning', 'Expense Allocation'],
  HR: ['Talent Acquisition', 'Employee Development', 'Performance Management', 'Compensation Strategy', 'Workplace Culture', 'Retention Programs'],
  Communications: ['Brand Messaging', 'Crisis Management', 'Stakeholder Relations', 'Media Strategy', 'Internal Communications', 'Public Relations'],
  AI: ['Machine Learning Models', 'Natural Language Processing', 'Predictive Analytics', 'Automation Strategy', 'AI Ethics', 'Data Pipeline'],
  Marketing: ['Digital Campaigns', 'Audience Segmentation', 'Content Strategy', 'Social Media Engagement', 'SEO Strategy', 'Brand Development'],
  Operations: ['Process Optimization', 'Workflow Automation', 'System Integration', 'Quality Assurance', 'Operational Efficiency', 'Infrastructure'],
  Technology: ['Platform Architecture', 'Cloud Infrastructure', 'Security Protocols', 'API Development', 'DevOps Practices', 'Technical Debt'],
};

const INSIGHT_TEMPLATES = {
  alignment: [
    { title: 'Editorial-Revenue Alignment on Investigative Series', description: 'Local News and National News teams aligned on investigative approach while Revenue secured sponsor funding.' },
    { title: 'Cross-Department Consensus on Digital Strategy', description: 'Marketing, Communications, and both news desks emphasizing mobile-first publishing for Q2.' },
    { title: 'Unified Newsroom Workflow Approach', description: 'Local News and National News converging on similar story development and fact-checking protocols.' },
    { title: 'Budget Agreement Across Departments', description: 'Finance and HR reached consensus on staffing investment priorities.' },
    { title: 'Shared Vision for Subscriber Growth', description: 'Marketing and Revenue teams aligned on membership model strategy and implementation timeline.' },
  ],
  misalignment: [
    { title: 'Timeline Concerns in National News', description: 'National News expressing concerns about aggressive publication timeline that Communications has not addressed.' },
    { title: 'Budget Tension Between Departments', description: 'Finance proposing staff reductions while HR discussing expansion of training programs.' },
    { title: 'Different Approaches to Story Development', description: 'All Participants discussing phased investigative approach while Local News planning immediate publication.' },
    { title: 'Conflicting Priorities Detected', description: 'Finance prioritizing cost reduction while National News emphasizing resource expansion for political coverage.' },
    { title: 'Content Strategy Disagreement', description: 'Marketing suggesting clickable headlines while Local News maintaining editorial integrity standards.' },
  ],
  gap: [
    { title: 'Legal Review Not Discussed', description: 'No mention of legal review process in investigative series planning across All Participants room.' },
    { title: 'Source Protection Missing from Discussion', description: 'Source protection and confidentiality protocols absent from National News investigative planning.' },
    { title: 'Community Impact Not Addressed', description: 'Local News discussing breaking news coverage without considering community impact assessment.' },
    { title: 'Crisis Communication Plan Needed', description: 'Teams planning controversial publication but Communications hasn\'t outlined response strategy.' },
    { title: 'Success Metrics Undefined', description: 'No clear audience engagement KPIs or editorial impact criteria defined across any newsroom discussion.' },
  ],
  highlight: [
    { title: 'Innovative Storytelling Approach Proposed', description: 'Local News discussing multimedia narrative technique that could increase engagement by 40%.' },
    { title: 'Strong Cross-Department Collaboration', description: 'High participation and effective coordination observed between Local News, National News, and Marketing.' },
    { title: 'Data-Driven Editorial Decisions', description: 'Teams consistently referencing audience analytics and engagement metrics to inform story selection.' },
    { title: 'Quick Source Verification Success', description: 'National News identified and verified critical sources efficiently through investigative collaboration.' },
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
  private personIdCounter = 1;

  private personIdMap = new Map<string, number>();
  private topicNodes: TopicNode[] = [];

  generateMeetings(activeCount: number = 9, historicalCount: number = 18): Meeting[] {
    const meetings: Meeting[] = [];
    const now = new Date();
    const mainMeetingStartTime = new Date(now.getTime() - Math.random() * 1800000);

    // Generate active meetings - always create all 9 rooms (main + 8 breakouts)
    for (let i = 0; i < 9; i++) {
      const dept = DEPARTMENT_CONFIG[i];
      const startedAt = new Date(mainMeetingStartTime.getTime() + (i * 1000)).toISOString();

      // Select appropriate topic based on department
      let topic = MEETING_TOPICS[0];
      if (i === 0) topic = 'Cross-Department Alignment Meeting';
      else if (i === 1 || i === 2) topic = 'Election Coverage Strategy';
      else if (i === 3) topic = 'Budget Review & Planning';
      else if (i === 4) topic = 'Crisis Communication Planning';
      else if (i === 5) topic = 'Digital Audience Growth Initiative';
      else if (i === 6) topic = 'Source Protection Protocols';
      else if (i === 7) topic = 'Staff Development Program';
      else if (i === 8) topic = 'Revenue Diversification Discussion';

      // Select appropriate host based on department
      let hostName = this.getRandomName();
      if (i === 0) hostName = 'Matthew Davis'; // Editor-in-Chief hosts main room
      else if (i === 1) hostName = 'Emily Thompson'; // City Editor
      else if (i === 2) hostName = 'David Kim'; // National Editor
      else if (i === 3) hostName = 'James Wilson'; // CFO
      else if (i === 4) hostName = 'Amanda Brown'; // Communications Director
      else if (i === 5) hostName = 'Rachel Green'; // Marketing Manager
      else if (i === 6) hostName = 'Daniel White'; // Legal Counsel
      else if (i === 7) hostName = 'Sophia Johnson'; // HR Director
      else if (i === 8) hostName = 'Christopher Taylor'; // Revenue Director

      meetings.push({
        id: `demo-meeting-${this.meetingIdCounter++}`,
        meeting_uuid: `demo-uuid-${Math.random().toString(36).substr(2, 9)}`,
        rtms_stream_id: `rtms-${Math.random().toString(36).substr(2, 9)}`,
        server_urls: 'wss://demo.rtms.zoom.us',
        host_id: `host-${i}`,
        host_name: hostName,
        topic: `${dept.name} - ${topic}`,
        status: 'active',
        room_type: dept.type,
        room_number: dept.id,
        parent_meeting_id: dept.type === 'breakout' ? 'demo-meeting-1' : null,
        started_at: startedAt,
        ended_at: null,
        created_at: startedAt,
        updated_at: startedAt,
      });
    }

    // Generate historical meetings with various department combinations
    for (let i = 0; i < historicalCount; i++) {
      const daysAgo = Math.floor(Math.random() * 14) + 1;
      const startedAt = new Date(now.getTime() - daysAgo * 86400000 - Math.random() * 36000000);
      const duration = (30 + Math.random() * 90) * 60000; // 30-120 minutes
      const endedAt = new Date(startedAt.getTime() + duration);

      // Randomly select department for historical meetings
      const deptIndex = Math.floor(Math.random() * 9);
      const dept = DEPARTMENT_CONFIG[deptIndex];
      const historicalTopic = MEETING_TOPICS[(i + 2) % MEETING_TOPICS.length];

      meetings.push({
        id: `demo-meeting-${this.meetingIdCounter++}`,
        meeting_uuid: `demo-uuid-${Math.random().toString(36).substr(2, 9)}`,
        rtms_stream_id: `rtms-${Math.random().toString(36).substr(2, 9)}`,
        server_urls: 'wss://demo.rtms.zoom.us',
        host_id: `host-hist-${i}`,
        host_name: this.getRandomName(),
        topic: `${dept.name} - ${historicalTopic}`,
        status: 'ended',
        room_type: dept.type,
        room_number: dept.id,
        parent_meeting_id: dept.type === 'breakout' ? 'demo-meeting-1' : null,
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

    // Determine which template category to use based on meeting ID
    const meetingIndex = parseInt(meetingId.split('-')[2]) - 1;
    let categoryKey: keyof typeof TRANSCRIPT_TEMPLATES = 'MainRoom';

    if (meetingIndex === 0) categoryKey = 'MainRoom';
    else if (meetingIndex === 1) categoryKey = 'LocalNews';
    else if (meetingIndex === 2) categoryKey = 'NationalNews';
    else if (meetingIndex === 3) categoryKey = 'Finance';
    else if (meetingIndex === 4) categoryKey = 'Communications';
    else if (meetingIndex === 5) categoryKey = 'Marketing';
    else if (meetingIndex === 6) categoryKey = 'Legal';
    else if (meetingIndex === 7) categoryKey = 'HR';
    else if (meetingIndex === 8) categoryKey = 'Revenue';

    const templates = TRANSCRIPT_TEMPLATES[categoryKey];

    for (let i = 0; i < count; i++) {
      const content = templates[Math.floor(Math.random() * templates.length)];
      const createdAt = new Date(now.getTime() - (count - i) * 12000);

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

  generateLiveTranscripts(meetingId: string, count: number = 3): Transcript[] {
    const transcripts: Transcript[] = [];
    const now = new Date();

    // Determine which template category to use based on meeting ID
    const meetingIndex = parseInt(meetingId.split('-')[2]) - 1;
    let categoryKey: keyof typeof TRANSCRIPT_TEMPLATES = 'MainRoom';

    if (meetingIndex === 0) categoryKey = 'MainRoom';
    else if (meetingIndex === 1) categoryKey = 'LocalNews';
    else if (meetingIndex === 2) categoryKey = 'NationalNews';
    else if (meetingIndex === 3) categoryKey = 'Finance';
    else if (meetingIndex === 4) categoryKey = 'Communications';
    else if (meetingIndex === 5) categoryKey = 'Marketing';
    else if (meetingIndex === 6) categoryKey = 'Legal';
    else if (meetingIndex === 7) categoryKey = 'HR';
    else if (meetingIndex === 8) categoryKey = 'Revenue';

    const templates = TRANSCRIPT_TEMPLATES[categoryKey];

    for (let i = 0; i < count; i++) {
      const content = templates[Math.floor(Math.random() * templates.length)];
      const createdAt = new Date(now.getTime() - i * 2000);

      transcripts.push({
        id: `demo-transcript-${this.transcriptIdCounter++}`,
        meeting_id: meetingId,
        participant_id: `participant-${Math.floor(Math.random() * 12)}`,
        speaker_name: this.getRandomName(),
        content,
        timestamp_ms: now.getTime() - i * 2000,
        sequence: this.transcriptIdCounter,
        is_final: true,
        created_at: createdAt.toISOString(),
      });
    }

    return transcripts;
  }

  generateTopicNodes(count: number = 48): TopicNode[] {
    const nodes: TopicNode[] = [];
    const now = new Date();
    const categories = Object.keys(TOPIC_LABELS);

    const hotTopics = ['Machine Learning Models', 'Budget Management', 'Crisis Management', 'Breaking News Protocol'];
    const mediumTopics = ['Talent Acquisition', 'Content Strategy', 'Process Optimization', 'Cloud Infrastructure', 'Revenue Forecasting', 'Brand Messaging'];

    categories.forEach(category => {
      const labels = TOPIC_LABELS[category as keyof typeof TOPIC_LABELS];
      labels.forEach(label => {
        let mentionCount: number;
        let numRooms: number;
        let importanceScore: number;

        if (hotTopics.includes(label)) {
          mentionCount = Math.floor(Math.random() * 20) + 35;
          numRooms = Math.floor(Math.random() * 3) + 6;
          importanceScore = Math.random() * 0.15 + 0.85;
        } else if (mediumTopics.includes(label)) {
          mentionCount = Math.floor(Math.random() * 12) + 18;
          numRooms = Math.floor(Math.random() * 3) + 3;
          importanceScore = Math.random() * 0.2 + 0.6;
        } else {
          mentionCount = Math.floor(Math.random() * 10) + 3;
          numRooms = Math.floor(Math.random() * 2) + 1;
          importanceScore = Math.random() * 0.4 + 0.2;
        }

        const roomMentions: Record<string, number> = {};
        const usedRooms = new Set<number>();

        for (let i = 0; i < numRooms; i++) {
          let room: number;
          do {
            room = Math.floor(Math.random() * 9);
          } while (usedRooms.has(room));
          usedRooms.add(room);

          const roomShare = hotTopics.includes(label)
            ? Math.floor(Math.random() * 8) + 4
            : mediumTopics.includes(label)
            ? Math.floor(Math.random() * 6) + 2
            : Math.floor(Math.random() * 4) + 1;
          roomMentions[room] = roomShare;
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
          importance_score: importanceScore,
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
      const dept = DEPARTMENT_CONFIG[room];
      const keyTopics = this.getRandomTopicLabels(3, 5);
      const keySpeakers = Array.from({ length: 3 }, () => this.getRandomName());

      let focusArea = 'implementation strategies';
      if (room === 1 || room === 2) focusArea = 'editorial approach and source verification';
      else if (room === 3) focusArea = 'budget allocation and financial planning';
      else if (room === 4) focusArea = 'messaging strategy and stakeholder communication';
      else if (room === 5) focusArea = 'audience growth and engagement tactics';
      else if (room === 6) focusArea = 'legal compliance and risk mitigation';
      else if (room === 7) focusArea = 'staff development and organizational culture';
      else if (room === 8) focusArea = 'revenue opportunities and monetization strategies';

      summaries.push({
        id: `demo-summary-${this.summaryIdCounter++}`,
        meeting_id: 'demo-meeting-1',
        room_number: room,
        summary_type: 'room',
        content: `${dept.name} is discussing ${keyTopics.join(', ').toLowerCase()} with focus on ${focusArea}.`,
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
    const person = NEWSROOM_ROLES[Math.floor(Math.random() * NEWSROOM_ROLES.length)];
    return person.name;
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
    this.personIdMap.clear();
    this.personIdCounter = 1;
    this.topicNodes = [];
  }
}

export const demoGenerator = new DemoDataGenerator();
