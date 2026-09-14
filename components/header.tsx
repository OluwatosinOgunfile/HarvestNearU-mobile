import { Image } from 'expo-image';
import { Bell, Moon, Search, ShoppingBag, Sun } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from './typography';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useApp } from '@/context/app-context';
import { Tap } from '@/components/tap';

/**
 * A button that belongs in the top bar. Screens use this rather than styling their own, so an
 * injected action is the same size and shape as the notification, search and basket buttons.
 */
export function HeaderAction({ label, onPress, filled = false, children }: { label: string; onPress: () => void; filled?: boolean; children: React.ReactNode }) {
  const { theme } = useApp();
  return <Tap accessibilityLabel={label} onPress={onPress}
    style={[styles.icon, filled ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.primary, backgroundColor: theme.surface }]}>
    {children}
  </Tap>;
}

export function Header({ title, home = false, onSearch, showBasket = true, actions }: { title?: string; home?: boolean; onSearch?: () => void; showBasket?: boolean; actions?: React.ReactNode }) {
  const { theme, cartCount, notificationCount, refreshNotifications, user, dark, setDark } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const basketVisible = showBasket && !['/orders', '/workspace', '/account'].includes(pathname);
  useFocusEffect(useCallback(() => { if (home) void refreshNotifications(); }, [home, refreshNotifications]));
  return <View style={styles.row}>
    <Image source={require('@/assets/images/harvestnearu-logo.png')} style={styles.logo} contentFit="contain"  transition={220}/>
    <View style={styles.actions}>
      {actions}
      {user && home ? <Tap accessibilityLabel={`Notifications${notificationCount ? `, ${notificationCount} unread` : ''}`} onPress={() => router.push('/notifications')} style={[styles.icon, { borderColor: theme.border, backgroundColor: theme.surface }]}><Bell size={21} color={theme.primary} />{notificationCount > 0 && <Text style={styles.badge}>{notificationCount > 99 ? '99+' : notificationCount}</Text>}</Tap> : !user ? <Tap accessibilityLabel={dark ? 'Use light mode' : 'Use dark mode'} onPress={() => setDark(!dark)} style={[styles.icon, { borderColor: theme.border, backgroundColor: theme.surface }]}>{dark ? <Sun size={21} color={theme.primary} /> : <Moon size={21} color={theme.primary} />}</Tap> : null}
      {onSearch ? <Tap accessibilityLabel="Search the market" onPress={onSearch} style={[styles.icon, { borderColor: theme.border, backgroundColor: theme.surface }]}><Search size={21} color={theme.primary} /></Tap> : null}
      {!home && basketVisible ? <Tap accessibilityLabel="Open basket" onPress={() => router.push('/basket')} style={[styles.icon, { backgroundColor: theme.primary }]}><ShoppingBag size={21} color={theme.primaryText} />{cartCount > 0 && <Text style={styles.badge}>{cartCount}</Text>}</Tap> : null}
    </View>
    {title && <Text style={[styles.title, { color: theme.text }]}>{title}</Text>}
  </View>;
}

const styles = StyleSheet.create({row:{height:64,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',position:'relative'},logo:{width:156,height:40},actions:{flexDirection:'row',gap:7},icon:{width:42,height:42,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center'},badge:{position:'absolute',right:-5,top:-5,minWidth:19,height:19,paddingHorizontal:4,borderRadius:10,textAlign:'center',lineHeight:19,color:'#fff',backgroundColor:'#b64337',fontSize:10,fontWeight:'800'},title:{position:'absolute',left:18,bottom:-16,fontSize:12,fontWeight:'800'}});
