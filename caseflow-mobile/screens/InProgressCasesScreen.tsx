
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CaseStatus, Case } from '../types';
import { useCases } from '../context/CaseContext';
import CaseListScreen from './CaseListScreen';

type SortMode = 'order' | 'priority';

const InProgressCasesScreen: React.FC = () => {
  const [sortMode, setSortMode] = useState<SortMode>('order');
  const { getCasesWithPriorities } = useCases();

  // Create sort function based on current mode
  const sortFunction = useMemo(() => {
    if (sortMode === 'priority') {
      return (a: Case, b: Case) => {
        const casesWithPriorities = getCasesWithPriorities();
        const caseA = casesWithPriorities.find(c => c.id === a.id);
        const caseB = casesWithPriorities.find(c => c.id === b.id);

        const priorityA = caseA?.priority;
        const priorityB = caseB?.priority;

        // Cases with priority come first, sorted by priority number (ascending)
        // Cases without priority come last, sorted by order
        if (priorityA && priorityB) {
          return priorityA - priorityB;
        } else if (priorityA && !priorityB) {
          return -1; // A has priority, B doesn't - A comes first
        } else if (!priorityA && priorityB) {
          return 1; // B has priority, A doesn't - B comes first
        } else {
          // Neither has priority, sort by order
          return (a.order || 0) - (b.order || 0);
        }
      };
    } else {
      // Default order sorting
      return (a: Case, b: Case) => (a.order || 0) - (b.order || 0);
    }
  }, [sortMode, getCasesWithPriorities]);

  return (
    <CaseListScreen
      title="In Progress Cases"
      filter={(c) => c.status === CaseStatus.InProgress && !c.isSaved}
      sort={sortFunction}
      isReorderable={sortMode === 'order'}
      emptyMessage="No cases are currently in progress."
      tabKey="in-progress"
      searchPlaceholder="Search in progress cases..."
      customHeaderActions={
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: '#9ca3af', marginRight: 8 }}>Sort by:</Text>
          <TouchableOpacity
            onPress={() => setSortMode('order')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: sortMode === 'order' ? '#2563eb' : '#374151',
              marginRight: 8
            }}
          >
            <Text style={{
              fontSize: 14,
              color: sortMode === 'order' ? '#ffffff' : '#d1d5db'
            }}>
              Order
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortMode('priority')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: sortMode === 'priority' ? '#2563eb' : '#374151'
            }}
          >
            <Text style={{
              fontSize: 14,
              color: sortMode === 'priority' ? '#ffffff' : '#d1d5db'
            }}>
              Priority
            </Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
};

export default InProgressCasesScreen;