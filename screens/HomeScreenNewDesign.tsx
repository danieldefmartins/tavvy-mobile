// ============================================
// NEW HOME SCREEN DESIGN - renderStandardMode replacement
// ============================================
// This file contains the new design for the Home screen standard mode
// Copy this into HomeScreen.tsx to replace the existing renderStandardMode

// Add these new styles to the StyleSheet.create at the bottom:
const newStyles = {
  // ===== GREETING SECTION =====
  greetingSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 2,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTaglineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  // ===== SEARCH CARD =====
  searchCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  searchInputNew: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  searchInputText: {
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickActionSurprise: {
    borderWidth: 1,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // ===== MOOD CARDS =====
  moodSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  moodSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 120,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  moodCardSmall: {
    width: '48%',
  },
  moodCardLarge: {
    width: '100%',
    minHeight: 130,
  },
  moodCardFood: {
    // Gradient applied via LinearGradient
  },
  moodCardDrinks: {
    // Gradient applied via LinearGradient
  },
  moodCardExplore: {
    // Gradient applied via LinearGradient
  },
  moodPopular: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  moodPopularText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  moodEmoji: {
    fontSize: 36,
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.9,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  moodSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  // ===== LIVE NOW SECTION =====
  liveSection: {
    marginBottom: 20,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  liveSeeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667EEA',
  },

  // ===== NEARBY SECTION =====
  nearbySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  nearbyList: {
    gap: 12,
  },
  nearbyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  nearbyRank: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyRankText: {
    fontSize: 12,
    fontWeight: '700',
  },
  nearbyImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  nearbyCategory: {
    fontSize: 12,
  },
  nearbySignal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  nearbySignalIcon: {
    fontSize: 12,
  },
  nearbySignalText: {
    fontSize: 11,
    fontWeight: '600',
  },
};

// ===== NEW renderStandardMode FUNCTION =====
// Replace the existing renderStandardMode with this:

/*
const renderStandardMode = () => {
  // Get user's first name for greeting
  const firstName = profile?.display_name?.split(' ')[0] || 'there';
  
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? '#0F0F0F' : '#FAFAFA' }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===== GREETING SECTION ===== */}
        <View style={newStyles.greetingSection}>
          <View style={newStyles.greetingRow}>
            <View>
              <Text style={[newStyles.greetingText, { color: isDark ? '#888' : '#6B7280' }]}>
                {greeting}
              </Text>
              <Text style={[newStyles.userName, { color: isDark ? '#fff' : '#111827' }]}>
                {firstName} 👋
              </Text>
              <View style={[newStyles.brandTagline, { flexDirection: 'row', alignItems: 'center' }]}>
                <View style={[newStyles.brandTaglineDot, { backgroundColor: '#667EEA' }]} />
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#667EEA' }}>
                  Real-time signals. Not star ratings.
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[newStyles.avatar, { backgroundColor: isDark ? '#FF6B6B' : '#667EEA' }]}
              onPress={() => navigation.navigate('Apps', { screen: 'ProfileMain' })}
            >
              <Text style={newStyles.avatarText}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== SEARCH CARD ===== */}
        <View style={[
          newStyles.searchCard, 
          { 
            backgroundColor: isDark ? '#1E1E1E' : '#fff',
            borderWidth: isDark ? 1 : 0,
            borderColor: 'rgba(255,255,255,0.06)',
            shadowColor: isDark ? 'transparent' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0 : 0.06,
            shadowRadius: 12,
            elevation: isDark ? 0 : 4,
          }
        ]}>
          <TouchableOpacity 
            style={[
              newStyles.searchInputNew, 
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }
            ]}
            onPress={() => {
              setIsSearchFocused(true);
              searchInputRef.current?.focus();
            }}
          >
            <Ionicons name="search" size={20} color="#667EEA" />
            <Text style={[newStyles.searchInputText, { color: isDark ? '#888' : '#9CA3AF' }]}>
              What are you in the mood for?
            </Text>
          </TouchableOpacity>
          
          <View style={newStyles.quickActionsRow}>
            <TouchableOpacity 
              style={[
                newStyles.quickAction, 
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
                }
              ]}
              onPress={switchToMapMode}
            >
              <Text style={newStyles.quickActionIcon}>📍</Text>
              <Text style={[newStyles.quickActionText, { color: isDark ? '#888' : '#6B7280' }]}>Near Me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                newStyles.quickAction, 
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
                }
              ]}
              onPress={switchToMapMode}
            >
              <Text style={newStyles.quickActionIcon}>🗺️</Text>
              <Text style={[newStyles.quickActionText, { color: isDark ? '#888' : '#6B7280' }]}>Map</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                newStyles.quickAction, 
                newStyles.quickActionSurprise,
                { 
                  backgroundColor: isDark 
                    ? 'rgba(102, 126, 234, 0.2)' 
                    : 'rgba(102, 126, 234, 0.1)',
                  borderColor: 'rgba(102, 126, 234, 0.3)',
                }
              ]}
              onPress={() => {
                // Surprise me - navigate to a random trending place
                if (trendingItems.length > 0) {
                  const randomItem = trendingItems[Math.floor(Math.random() * trendingItems.length)];
                  if (randomItem.type === 'place' || randomItem.place) {
                    navigation.navigate('PlaceDetails', { placeId: randomItem.id || randomItem.place?.id });
                  }
                }
              }}
            >
              <Text style={newStyles.quickActionIcon}>🎲</Text>
              <Text style={[newStyles.quickActionText, { color: '#667EEA' }]}>Surprise</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                newStyles.quickAction, 
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
                }
              ]}
              onPress={() => navigation.navigate('Apps', { screen: 'ProfileMain' })}
            >
              <Text style={newStyles.quickActionIcon}>⭐</Text>
              <Text style={[newStyles.quickActionText, { color: isDark ? '#888' : '#6B7280' }]}>Saved</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== MOOD CARDS ===== */}
        <View style={newStyles.moodSection}>
          <Text style={[newStyles.moodSectionLabel, { color: isDark ? '#555' : '#9CA3AF' }]}>
            What's your mood?
          </Text>
          <View style={newStyles.moodGrid}>
            {/* Hungry Card */}
            <TouchableOpacity 
              style={[newStyles.moodCard, newStyles.moodCardSmall]}
              onPress={() => {
                handleCategorySelect('Restaurants');
                switchToMapMode();
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[newStyles.moodPopular, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                <Text style={newStyles.moodPopularText}>🔥 Popular right now</Text>
              </View>
              <Text style={newStyles.moodEmoji}>🍕</Text>
              <Text style={newStyles.moodTitle}>Hungry</Text>
              <Text style={newStyles.moodSubtitle}>Restaurants & Food</Text>
            </TouchableOpacity>
            
            {/* Thirsty Card */}
            <TouchableOpacity 
              style={[newStyles.moodCard, newStyles.moodCardSmall]}
              onPress={() => {
                handleCategorySelect('Bars');
                switchToMapMode();
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[newStyles.moodPopular, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                <Text style={newStyles.moodPopularText}>📈 Trending near you</Text>
              </View>
              <Text style={newStyles.moodEmoji}>🍸</Text>
              <Text style={newStyles.moodTitle}>Thirsty</Text>
              <Text style={newStyles.moodSubtitle}>Bars & Cafes</Text>
            </TouchableOpacity>
            
            {/* Explore Card */}
            <TouchableOpacity 
              style={[newStyles.moodCard, newStyles.moodCardLarge]}
              onPress={() => navigation.navigate('Apps')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={isDark ? ['#0F2027', '#203A43', '#2C5364'] : ['#E0E7FF', '#C7D2FE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[newStyles.moodPopular, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(67, 56, 202, 0.15)' }]}>
                <Text style={[newStyles.moodPopularText, { color: isDark ? 'rgba(255,255,255,0.9)' : '#4338CA' }]}>
                  ✨ {exploreItems.length || 89} experiences nearby
                </Text>
              </View>
              <Text style={newStyles.moodEmoji}>🌟</Text>
              <Text style={[newStyles.moodTitle, { color: isDark ? '#fff' : '#4338CA' }]}>Explore Something New</Text>
              <Text style={[newStyles.moodSubtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : '#6366F1' }]}>
                Events, activities & hidden gems
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== LIVE NOW / HAPPENING NOW ===== */}
        <View style={newStyles.liveSection}>
          <View style={newStyles.liveHeader}>
            <View style={newStyles.liveTitleRow}>
              <View style={newStyles.liveDot} />
              <Text style={[newStyles.liveLabel, { color: isDark ? '#fff' : '#111827' }]}>Live Now</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Apps')}>
              <Text style={newStyles.liveSeeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {/* Use existing HappeningNow component */}
          <HappeningNow
            onPlacePress={(placeId) => navigation.navigate("PlaceDetails" as never, { placeId } as never)}
          />
        </View>

        {/* ===== STORIES ROW ===== */}
        <View style={{ marginBottom: 20 }}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#111', fontSize: 16, fontWeight: '700' }]}>
              Check how your favorite places look now
            </Text>
          </View>
          <StoriesRow
            currentUserId={user?.id}
            userLocation={userLocation}
            maxDistance={20}
          />
        </View>

        {/* ===== TOP PICKS NEARBY ===== */}
        <View style={newStyles.nearbySection}>
          <Text style={[newStyles.moodSectionLabel, { color: isDark ? '#555' : '#9CA3AF' }]}>
            Top Picks Nearby
          </Text>
          <View style={newStyles.nearbyList}>
            {isLoadingTrending ? (
              <ActivityIndicator size="small" color="#667EEA" />
            ) : trendingItems.slice(0, 3).map((item, index) => (
              <TouchableOpacity
                key={`nearby-${item.id}-${index}`}
                style={[
                  newStyles.nearbyItem,
                  { 
                    backgroundColor: isDark ? '#1A1A1A' : '#fff',
                    borderWidth: isDark ? 1 : 0,
                    borderColor: 'rgba(255,255,255,0.04)',
                    shadowColor: isDark ? 'transparent' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.06,
                    shadowRadius: 8,
                    elevation: isDark ? 0 : 2,
                  }
                ]}
                onPress={() => {
                  if (item.type === 'place' || item.place) {
                    navigation.navigate('PlaceDetails', { placeId: item.id || item.place?.id });
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[newStyles.nearbyRank, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                  <Text style={[newStyles.nearbyRankText, { color: isDark ? '#888' : '#6B7280' }]}>{index + 1}</Text>
                </View>
                <View style={[
                  newStyles.nearbyImage, 
                  { 
                    backgroundColor: index === 0 ? '#FF6B6B' : index === 1 ? '#667EEA' : '#10B981',
                  }
                ]}>
                  {item.image && (
                    <Image source={{ uri: item.image }} style={[newStyles.nearbyImage, { position: 'absolute' }]} />
                  )}
                </View>
                <View style={newStyles.nearbyInfo}>
                  <Text style={[newStyles.nearbyName, { color: isDark ? '#fff' : '#111827' }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[newStyles.nearbyCategory, { color: isDark ? '#666' : '#6B7280' }]}>
                    {item.category} • {item.subtitle || '0.4 mi'}
                  </Text>
                </View>
                <View style={[newStyles.nearbySignal, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={newStyles.nearbySignalIcon}>📶</Text>
                  <Text style={[newStyles.nearbySignalText, { color: '#10B981' }]}>Strong</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ===== EXPLORE TAVVY (Universes) ===== */}
        <View style={styles.exploreSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000' }]}>Explore Tavvy</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Apps')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.exploreSubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>
            Curated worlds of experiences
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 18 }}
            snapToInterval={width * 0.7 + 12}
            decelerationRate="fast"
          >
            {isLoadingExplore ? (
              <View style={{ width: width * 0.7, height: 180, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={ACCENT} />
              </View>
            ) : (
              exploreItems.map((item, index) => (
                <TouchableOpacity
                  key={`explore-universe-${item.id}-${index}`}
                  style={[styles.exploreCard, { backgroundColor: isDark ? theme.surface : '#111827' }]}
                  onPress={() => {
                    if (item.route) {
                      if (item.route === 'UniverseLanding' && item.data?.id) {
                        navigation.navigate('UniverseLanding', { universeId: item.data.id });
                      } else {
                        navigation.navigate(item.route as never);
                      }
                    }
                  }}
                  activeOpacity={0.9}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.exploreCardImage} />
                  ) : (
                    <View style={[styles.exploreCardImage, { backgroundColor: item.color, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name={item.icon} size={48} color="#fff" />
                    </View>
                  )}
                  {item.isPlaceholder && (
                    <View style={styles.placeholderBadge}>
                      <Text style={styles.placeholderBadgeText}>Coming Soon</Text>
                    </View>
                  )}
                  <View style={styles.exploreCardContent}>
                    <Text style={[styles.exploreCardTitle, { color: '#E5E7EB' }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.exploreCardMeta}>
                      <View style={[styles.exploreCardBadge, { backgroundColor: item.color }]}>
                        <Ionicons name={item.icon} size={12} color="#fff" />
                      </View>
                      <Text style={[styles.exploreCardSubtitle, { color: '#9CA3AF' }]} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};
*/
