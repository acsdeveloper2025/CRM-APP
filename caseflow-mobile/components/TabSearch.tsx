import React, { useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { SearchIcon, XIcon } from './Icons';

interface TabSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
}

const TabSearch: React.FC<TabSearchProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = "Search cases...",
  resultCount,
  totalCount
}) => {
  const searchInputRef = useRef<TextInput>(null);

  const handleClear = useCallback(() => {
    onSearchChange('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [onSearchChange]);

  const renderSearchInput = () => (
    <View style={{
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(31, 41, 55, 0.5)',
      borderWidth: 1,
      borderColor: '#4B5563',
      borderRadius: 8,
      paddingLeft: 40,
      paddingRight: searchQuery ? 40 : 16,
      paddingVertical: 12
    }}>
      <View style={{
        position: 'absolute',
        left: 12,
        zIndex: 1
      }}>
        <SearchIcon
          color="#9CA3AF"
          width={20}
          height={20}
        />
      </View>
      <TextInput
        key="search-input"
        ref={searchInputRef}
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={{
          flex: 1,
          color: '#ffffff',
          fontSize: 16,
          paddingVertical: 0,
          minHeight: 20
        }}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        blurOnSubmit={false}
        selectTextOnFocus={false}
        clearButtonMode="never"
      />
      {searchQuery ? (
        <TouchableOpacity
          onPress={handleClear}
          style={{
            position: 'absolute',
            right: 12,
            padding: 4,
            zIndex: 1
          }}
        >
          <XIcon color="#9CA3AF" width={16} height={16} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderSearchResults = () => {
    if (!searchQuery) {
      return null;
    }

    return (
      <View style={{
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <View>
          {resultCount !== undefined && totalCount !== undefined ? (
            <View>
              {resultCount === 0 ? (
                <Text style={{ color: '#ef4444', fontSize: 14 }}>
                  No results found
                </Text>
              ) : (
                <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                  {`Showing ${resultCount} of ${totalCount} cases`}
                </Text>
              )}
            </View>
          ) : null}
        </View>
        <Text style={{ color: '#6B7280', fontSize: 12 }}>
          {`Search active: "${searchQuery}"`}
        </Text>
      </View>
    );
  };

  const renderSearchTips = () => {
    if (!searchQuery || !resultCount || resultCount !== 0) {
      return null;
    }

    return (
      <View style={{
        marginTop: 12,
        padding: 12,
        backgroundColor: 'rgba(31, 41, 55, 0.3)',
        borderWidth: 1,
        borderColor: '#4B5563',
        borderRadius: 8
      }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '500',
          color: '#D1D5DB',
          marginBottom: 8
        }}>
          Search Tips:
        </Text>
        <View>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
            • Try searching by case ID (e.g., "CASE-001")
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
            • Search by customer name (e.g., "Priya Sharma")
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
            • Search by address or location (e.g., "Mumbai", "Marine Drive")
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
            • Search by bank name (e.g., "HDFC", "ICICI")
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
            • Search by verification type (e.g., "Residence", "Office")
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
            • Search is case-insensitive
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
      <View style={{ position: 'relative' }}>
        {renderSearchInput()}
        {renderSearchResults()}
      </View>
      {renderSearchTips()}
    </View>
  );
};

export default React.memo(TabSearch);