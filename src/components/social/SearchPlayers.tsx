import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { useUnifiedFriends } from '../../hooks/useUnifiedFriends';
import { PlayerCard } from './PlayerCard';
import { SkeletonList } from './Skeleton';

export function SearchPlayers() {
  const { searchUsers, sendFriendRequest } = useUnifiedFriends();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const data = await searchUsers(query.trim());
    setResults(data);
    setIsSearching(false);
  }, [query, searchUsers]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Toca para escribir"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchIcon}>🔎</Text>
        </TouchableOpacity>
      </View>

      {results.length === 0 && !isSearching ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Busca por ID o nombre de usuario</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <PlayerCard
              username={item.username || item.display_name}
              subtitle={`ID: ${item.id}`}
              avatarUrl={item.avatar_url || undefined}
              actions={[{ label: 'Enviar solicitud', variant: 'primary', onPress: () => sendFriendRequest(String(item.id)) }]}
            />
          )}
        />
      )}
      {isSearching && (
        <View style={{ marginTop: dimensions.spacing.md }}>
          <SkeletonList />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.md,
    backgroundColor: colors.secondary,
    paddingLeft: dimensions.spacing.md,
    marginBottom: dimensions.spacing.md,
  },
  input: {
    flex: 1,
    height: 44,
    color: colors.text,
    fontSize: typography.fontSize.md,
  },
  searchButton: {
    paddingHorizontal: dimensions.spacing.md,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderTopRightRadius: dimensions.borderRadius.md,
    borderBottomRightRadius: dimensions.borderRadius.md,
  },
  searchIcon: {
    fontSize: typography.fontSize.md,
    color: colors.primaryButtonText,
    fontWeight: typography.fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});


