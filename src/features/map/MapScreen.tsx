import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Platform,
  Animated,
  Easing,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Alert,
  Keyboard,
  PanResponder,
  TouchableWithoutFeedback,
} from 'react-native';
import MapView, { Marker, Region, MapPressEvent, LongPressEvent } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, MapConfig, DarkMapStyle } from '../../theme/colors';
import { CategoryId, MapPin } from '../../types/data';
import { CATEGORIES } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { triggerHaptic } from '../../services/haptics';

const DISTRICT_CENTERS: Record<string, { latitude: number; longitude: number }> = {
  'pendik': { latitude: 40.8750, longitude: 29.2330 },
  'kadıköy': { latitude: 40.9912, longitude: 29.0255 },
  'beşiktaş': { latitude: 41.0428, longitude: 29.0065 },
  'taksim': { latitude: 41.0360, longitude: 28.9840 },
  'beyoğlu': { latitude: 41.0335, longitude: 28.9765 },
  'üsküdar': { latitude: 41.0255, longitude: 29.0155 },
  'bostancı': { latitude: 40.9635, longitude: 29.0940 },
  'karaköy': { latitude: 41.0200, longitude: 28.9750 },
  'bakırköy': { latitude: 40.9800, longitude: 28.8700 },
  'bebek': { latitude: 41.0770, longitude: 29.0440 },
  'sarıyer': { latitude: 41.1680, longitude: 29.0550 },
  'moda': { latitude: 40.9840, longitude: 29.0270 },
  'caddebostan': { latitude: 40.9680, longitude: 29.0600 },
  'kartal': { latitude: 40.8900, longitude: 29.1850 },
  'maltepe': { latitude: 40.9250, longitude: 29.1300 },
  'ataşehir': { latitude: 40.9850, longitude: 29.1150 },
  'ümraniye': { latitude: 41.0250, longitude: 29.1100 },
  'tuzla': { latitude: 40.8150, longitude: 29.3000 },
  'şişli': { latitude: 41.0600, longitude: 28.9900 },
  'fatih': { latitude: 41.0180, longitude: 28.9500 },
  'levent': { latitude: 41.0800, longitude: 29.0150 },
  'maslak': { latitude: 41.1100, longitude: 29.0200 },
  'beykoz': { latitude: 41.1300, longitude: 29.1000 },
  'zeytinburnu': { latitude: 40.9900, longitude: 28.9000 },
  'avcılar': { latitude: 40.9800, longitude: 28.7200 },
  'beylikdüzü': { latitude: 41.0000, longitude: 28.6500 },
};

export const MapScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { pins, addPin, toggleLikePin, likedPinIds, isLoggedIn, showToast } = useApp();
  const mapRef = useRef<MapView>(null);
  const currentRegionRef = useRef<Region>(MapConfig.initialRegion);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);

  // Helper to determine district closest to given coordinates
  const getClosestDistrict = (lat: number, lng: number): string => {
    let closest = 'Kadıköy';
    let minDistance = Infinity;
    for (const [district, coords] of Object.entries(DISTRICT_CENTERS)) {
      const d = Math.hypot(coords.latitude - lat, coords.longitude - lng);
      if (d < minDistance) {
        minDistance = d;
        closest = district;
      }
    }
    return closest.charAt(0).toUpperCase() + closest.slice(1);
  };

  // Pin placement via exact tap/long-press
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedCoordinate, setPickedCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);

  // Add pin modal state
  const [isAddPinModalOpen, setIsAddPinModalOpen] = useState(false);
  const [newPinDesc, setNewPinDesc] = useState('');
  const [newPinCat, setNewPinCat] = useState<CategoryId>('cafe');

  // Popup animations
  const popupSlideAnim = useRef(new Animated.Value(400)).current;
  const likeBtnScaleAnim = useRef(new Animated.Value(1)).current;

  // Swipe-down to dismiss gesture for selected pin popup card
  const pinPopupPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          popupSlideAnim.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 65 || gesture.vy > 0.45) {
          handleClosePopup();
        } else {
          Animated.spring(popupSlideAnim, {
            toValue: 0,
            friction: 7,
            tension: 75,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Swipe-down to dismiss gesture for Add Pin modal sheet
  const addPinTranslateY = useRef(new Animated.Value(0)).current;
  const addPinPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          addPinTranslateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 70 || gesture.vy > 0.45) {
          Animated.timing(addPinTranslateY, {
            toValue: 600,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            handleCancelAddPin();
            addPinTranslateY.setValue(0);
          });
        } else {
          Animated.spring(addPinTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 75,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Helper to normalize Turkish characters for search
  const normalizeText = (str: string) => {
    return str
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .toLowerCase()
      .trim();
  };

  const flyToDistrict = (query: string) => {
    const qNorm = normalizeText(query);
    if (!qNorm) return;

    for (const [district, coords] of Object.entries(DISTRICT_CENTERS)) {
      const dNorm = normalizeText(district);
      if (qNorm === dNorm || (qNorm.length >= 3 && dNorm.includes(qNorm))) {
        mapRef.current?.animateToRegion(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.035,
            longitudeDelta: 0.035,
          },
          800
        );
        break;
      }
    }
  };

  // Search filter and auto flyTo
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    flyToDistrict(text);
  };

  // Filter pins based on selected category & search query
  const filteredPins = pins.filter((p) => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (searchQuery.trim().length > 0) {
      const q = normalizeText(searchQuery);
      const descNorm = normalizeText(p.description);
      const catNorm = normalizeText(p.category);
      const districtNorm = p.district ? normalizeText(p.district) : '';

      const descMatch = descNorm.includes(q);
      const catMatch = catNorm.includes(q);
      const districtMatch = districtNorm.includes(q) || (districtNorm && q.includes(districtNorm));
      return descMatch || catMatch || districtMatch;
    }
    return true;
  });

  const lastMarkerPressTimestamp = useRef<number>(0);

  const handleSelectPin = (pin: MapPin) => {
    triggerHaptic.selection();
    lastMarkerPressTimestamp.current = Date.now();
    Keyboard.dismiss();

    if (selectedPin && selectedPin.id === pin.id) {
      return;
    }

    setSelectedPin(pin);
    // Smoothly bounce or slide into place
    popupSlideAnim.setValue(180);
    Animated.spring(popupSlideAnim, {
      toValue: 0,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  };

  const handleClosePopup = () => {
    Animated.timing(popupSlideAnim, {
      toValue: 400,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSelectedPin(null);
    });
  };

  const requireAuth = (actionText: string): boolean => {
    if (!isLoggedIn) {
      Alert.alert(
        'Giriş Yapmalısın 🔒',
        `Bu özelliği kullanabilmek (${actionText}) için lütfen önce giriş yap.`
      );
      return false;
    }
    return true;
  };

  // User taps on the map
  const handleMapPress = (e: MapPressEvent) => {
    Keyboard.dismiss();
    // Guard against map container bubbling immediately after marker press
    if (Date.now() - lastMarkerPressTimestamp.current < 350) {
      return;
    }

    const coord = e.nativeEvent.coordinate;

    if (isPickingLocation) {
      if (!requireAuth('haritada pin eklemek')) return;
      setIsPickingLocation(false);
      setPickedCoordinate(coord);
      setIsAddPinModalOpen(true);
    } else if (selectedPin) {
      handleClosePopup();
    }
  };

  // User long-presses anywhere on map to drop pin instantly
  const handleMapLongPress = (e: LongPressEvent) => {
    if (!requireAuth('haritada pin eklemek')) return;
    const coord = e.nativeEvent.coordinate;
    setIsPickingLocation(false);
    setPickedCoordinate(coord);
    setIsAddPinModalOpen(true);
  };

  const handleToggleLike = (pinId: number) => {
    if (!requireAuth('pinleri beğenmek')) return;
    triggerHaptic.medium();
    const isLiked = likedPinIds[pinId];

    Animated.sequence([
      Animated.timing(likeBtnScaleAnim, {
        toValue: 0.88,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(likeBtnScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();

    toggleLikePin(pinId);
    if (selectedPin && selectedPin.id === pinId) {
      setSelectedPin((prev) =>
        prev
          ? { ...prev, upvotes: isLiked ? prev.upvotes - 1 : prev.upvotes + 1 }
          : null
      );
    }
  };

  const handleDropAtCurrentCenter = () => {
    if (!requireAuth('haritada pin eklemek')) return;
    triggerHaptic.light();
    setPickedCoordinate({
      latitude: currentRegionRef.current.latitude,
      longitude: currentRegionRef.current.longitude,
    });
    setIsPickingLocation(false);
    setIsAddPinModalOpen(true);
  };

  const handleCancelAddPin = () => {
    setIsAddPinModalOpen(false);
    setIsPickingLocation(false);
    setPickedCoordinate(null);
    setNewPinDesc('');
  };

  const handleOpenDirections = (pin: MapPin) => {
    triggerHaptic.light();
    Alert.alert(
      '🗺️ Yol Tarifi Al',
      'Hangi harita uygulamasıyla gitmek istersin?',
      [
        {
          text: 'Google Maps 🌐',
          onPress: () => {
            triggerHaptic.medium();
            const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`;
            Linking.openURL(googleUrl).catch(() => {
              Alert.alert('Hata', 'Google Maps açılamadı.');
            });
          },
        },
        {
          text: 'Apple Haritalar 🍏',
          onPress: () => {
            triggerHaptic.medium();
            const appleUrl = `maps:0,0?q=${pin.lat},${pin.lng}`;
            Linking.openURL(appleUrl).catch(() => {
              // Fallback to web google maps if not on iOS
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`);
            });
          },
        },
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCreatePin = () => {
    if (!newPinDesc.trim() || !pickedCoordinate) return;
    triggerHaptic.success();

    const district = getClosestDistrict(pickedCoordinate.latitude, pickedCoordinate.longitude);

    const created = addPin({
      lat: pickedCoordinate.latitude,
      lng: pickedCoordinate.longitude,
      category: newPinCat,
      description: newPinDesc.trim(),
      district,
    });

    // Reset filters so the new pin is guaranteed to be visible!
    setActiveCategory('all');
    setSearchQuery('');

    setIsAddPinModalOpen(false);
    setNewPinDesc('');
    setPickedCoordinate(null);
    setIsPickingLocation(false);

    // Zoom and center map to the newly dropped pin
    mapRef.current?.animateToRegion(
      {
        latitude: created.lat,
        longitude: created.lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      600
    );

    // Select the new pin
    handleSelectPin(created);

    showToast({
      type: 'info',
      title: 'Pin Haritaya Bırakıldı! 📍',
      message: `"${created.description}" pini ${district} konumuna başarıyla eklendi.`,
    });
  };

  const getCategoryDetails = (catId: CategoryId) => {
    return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[1];
  };

  return (
    <View style={styles.container}>
      {/* Native MapView */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={MapConfig.initialRegion}
        customMapStyle={DarkMapStyle}
        userInterfaceStyle="dark"
        showsUserLocation={true}
        showsCompass={false}
        onPress={handleMapPress}
        onLongPress={handleMapLongPress}
        onRegionChangeComplete={(region) => {
          currentRegionRef.current = region;
        }}
      >
        {filteredPins.map((pin) => {
          const cat = getCategoryDetails(pin.category);
          const isSelected = selectedPin?.id === pin.id;

          return (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.lat, longitude: pin.lng }}
              onPress={(e) => {
                if (e && e.stopPropagation) {
                  e.stopPropagation();
                }
                handleSelectPin(pin);
              }}
            >
              {/* Neon Glowing Marker */}
              <View
                style={[
                  styles.markerGlow,
                  {
                    borderColor: cat.color,
                    shadowColor: cat.color,
                    backgroundColor: Colors.bgCard,
                  },
                  isSelected && {
                    borderColor: '#ffffff',
                    shadowColor: '#ffffff',
                    transform: [{ scale: 1.25 }],
                  },
                ]}
              >
                <Text style={styles.markerIcon}>{cat.icon}</Text>
              </View>
            </Marker>
          );
        })}

        {/* Temporary Target Pin where user tapped */}
        {pickedCoordinate && (
          <Marker coordinate={pickedCoordinate}>
            <View style={styles.tempMarker}>
              <Text style={{ fontSize: 20 }}>📍</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Header & Search & Category Filter Bar */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>📍</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>NAPALIM</Text>
              <Text style={styles.brandSubtitle}>
                İstanbul • {filteredPins.length} mekan aktif
              </Text>
            </View>
          </View>
          <View style={styles.nativeBadge}>
            <Text style={styles.nativeBadgeText}>NATIVE</Text>
          </View>
        </View>

        {/* District & Place Search Bar */}
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search" size={16} color={Colors.textTertiary} style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Semt veya mekan ara... (Kadıköy, Pendik...)"
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchQuery('');
                Keyboard.dismiss();
              }}
              style={styles.searchClearBtn}
            >
              <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Horizontal Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={({ pressed }) => [
                  styles.filterChip,
                  isActive && {
                    backgroundColor: cat.color + '33',
                    borderColor: cat.color,
                  },
                  pressed && { transform: [{ scale: 0.94 }] },
                ]}
              >
                <Text style={styles.filterChipIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && { color: '#ffffff', fontWeight: '700' },
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Picking Location Guide Banner */}
      {isPickingLocation && (
        <View style={[styles.pickGuideBanner, { top: insets.top + 155 }]}>
          <Ionicons name="location" size={18} color={Colors.accentPink} />
          <Text style={styles.pickGuideText}>Dokun veya:</Text>
          <Pressable
            onPress={handleDropAtCurrentCenter}
            style={({ pressed }) => [
              styles.pickCenterBtn,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <Text style={styles.pickCenterBtnText}>Buraya Bırak 🎯</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setIsPickingLocation(false);
              setPickedCoordinate(null);
            }}
            style={styles.pickCancelBtn}
          >
            <Text style={styles.pickCancelText}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Floating "➕ Pin Ekle" Button */}
      {!selectedPin && (
        <Pressable
          onPress={() => {
            if (!requireAuth('haritada pin eklemek')) return;
            if (isPickingLocation) {
              setIsPickingLocation(false);
              setPickedCoordinate(null);
            } else {
              setIsPickingLocation(true);
            }
          }}
          style={({ pressed }) => [
            styles.floatingAddPinBtn,
            isPickingLocation && styles.floatingAddPinBtnActive,
            pressed && { transform: [{ scale: 0.92 }] },
          ]}
        >
          <Ionicons
            name={isPickingLocation ? 'close' : 'add'}
            size={20}
            color="#ffffff"
          />
          <Text style={styles.floatingAddPinText}>
            {isPickingLocation ? 'Vazgeç' : 'Pin Ekle'}
          </Text>
        </Pressable>
      )}

      {/* Selected Pin Bottom Sheet Card with Smooth Slide & Swipe-Down to Dismiss */}
      {selectedPin && (
        <Animated.View
          {...pinPopupPanResponder.panHandlers}
          style={[
            styles.popupCard,
            {
              paddingBottom: insets.bottom + 16,
              transform: [{ translateY: popupSlideAnim }],
            },
          ]}
        >
          <View style={styles.popupHandleZone}>
            <View style={styles.popupHandle} />
          </View>

          <View style={styles.popupHeader}>
            <View style={styles.popupTagRow}>
              <View
                style={[
                  styles.popupCategoryTag,
                  {
                    backgroundColor:
                      getCategoryDetails(selectedPin.category).color + '26',
                  },
                ]}
              >
                <Text style={styles.popupCategoryIcon}>
                  {getCategoryDetails(selectedPin.category).icon}
                </Text>
                <Text
                  style={[
                    styles.popupCategoryName,
                    { color: getCategoryDetails(selectedPin.category).color },
                  ]}
                >
                  {getCategoryDetails(selectedPin.category).name.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.popupTime}>{selectedPin.createdAt}</Text>
            </View>
            <Pressable
              onPress={handleClosePopup}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.popupDescription}>{selectedPin.description}</Text>

          <View style={styles.popupFooter}>
            <Pressable onPress={() => handleToggleLike(selectedPin.id)}>
              <Animated.View
                style={[
                  styles.upvoteBadge,
                  likedPinIds[selectedPin.id] && styles.upvoteBadgeActive,
                  { transform: [{ scale: likeBtnScaleAnim }] },
                ]}
              >
                <Text style={styles.upvoteHeart}>
                  {likedPinIds[selectedPin.id] ? '❤️' : '🤍'}
                </Text>
                <Text style={styles.upvoteText}>
                  {' '}{selectedPin.upvotes} beğeni
                </Text>
              </Animated.View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.routeBtn,
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
              onPress={() => handleOpenDirections(selectedPin)}
            >
              <Text style={styles.routeBtnText}>🚶 Yol Tarifi Al</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Add Pin Modal Sheet with Fixed Submit Button above Keyboard & Swipe-Down to Dismiss */}
      <Modal
        visible={isAddPinModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelAddPin}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <TouchableWithoutFeedback onPress={handleCancelAddPin}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, 16) },
              { transform: [{ translateY: addPinTranslateY }] },
            ]}
          >
            <View
              {...addPinPanResponder.panHandlers}
              style={{ width: '100%', paddingTop: 4, paddingBottom: 10, alignItems: 'center' }}
            >
              <View style={styles.modalSheetHandle} />
            </View>
            <View {...addPinPanResponder.panHandlers} style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>📍 Yeni Pin Bırak</Text>
              <Pressable
                onPress={handleCancelAddPin}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 280 }}
            >
              <Text style={styles.fieldLabel}>Kategori Seç</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setNewPinCat(cat.id)}
                    style={[
                      styles.catCard,
                      newPinCat === cat.id && {
                        borderColor: cat.color,
                        backgroundColor: cat.color + '22',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.catCardText,
                        newPinCat === cat.id && { color: '#ffffff', fontWeight: '800' },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Açıklama *</Text>
              <TextInput
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Bu civarda ne var? Dükkan ismi vermeden açıkla..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                value={newPinDesc}
                onChangeText={setNewPinDesc}
              />

              <View style={styles.locationNotice}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
                <Text style={styles.locationNoticeText}>
                  Konum seçildi: Parmağınla dokunduğun tam o koordinat!
                </Text>
              </View>
            </ScrollView>

            {/* Fixed Submit Button - Always visible right above the keyboard! */}
            <Pressable
              onPress={handleCreatePin}
              style={({ pressed }) => [
                styles.createPinSubmitBtn,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <Text style={styles.createPinSubmitText}>Haritaya Bırak 📍</Text>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  map: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(7, 7, 13, 0.92)',
    zIndex: 20,
    borderBottomWidth: 1,
    borderColor: Colors.borderGlass,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 18,
  },
  brandTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  nativeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: Colors.accentPurple,
  },
  nativeBadgeText: {
    color: Colors.accentPurple,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  searchClearBtn: {
    padding: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  filterChipIcon: {
    fontSize: 13,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  markerGlow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 10,
    elevation: 8,
  },
  markerIcon: {
    fontSize: 16,
  },
  tempMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
    borderWidth: 2,
    borderColor: Colors.accentPink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickGuideBanner: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 15, 26, 0.95)',
    borderWidth: 1.5,
    borderColor: Colors.accentPink,
    shadowColor: Colors.accentPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 25,
  },
  pickGuideText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  pickCenterBtn: {
    backgroundColor: Colors.accentPink,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: Colors.accentPink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  pickCenterBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  pickCancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickCancelText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  floatingAddPinBtn: {
    position: 'absolute',
    bottom: 24,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.accentPurple,
    shadowColor: Colors.accentPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 22,
  },
  floatingAddPinBtnActive: {
    backgroundColor: Colors.accentPink,
    shadowColor: Colors.accentPink,
  },
  floatingAddPinText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  popupCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: Colors.borderGlass,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
    zIndex: 25,
  },
  popupHandleZone: {
    width: '100%',
    paddingTop: 2,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 6,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  popupTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popupCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popupCategoryIcon: {
    fontSize: 12,
  },
  popupCategoryName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  popupTime: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  popupDescription: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 16,
  },
  popupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upvoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  upvoteBadgeActive: {
    borderColor: Colors.accentPink,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
  },
  upvoteHeart: {
    fontSize: 14,
  },
  upvoteText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  routeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.accentPurple,
    shadowColor: Colors.accentPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  routeBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    maxHeight: '90%',
  },
  modalSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCard: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    gap: 4,
  },
  catCardText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  locationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  locationNoticeText: {
    color: Colors.accentGreen,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  createPinSubmitBtn: {
    backgroundColor: Colors.accentPurple,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: Colors.accentPurple,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  createPinSubmitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
