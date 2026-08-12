import { useRouter } from 'expo-router';
import { ChevronLeft, LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from './screen';
import { Text } from './typography';
import { useApp } from '@/context/app-context';

export type InfoSection={icon:LucideIcon;title:string;copy:string;lines?:{label:string;value:string}[]};

export function InfoPage({eyebrow,title,intro,sections}:{eyebrow:string;title:string;intro:string;sections:InfoSection[]}){
  const router=useRouter();const {theme}=useApp();
  return <Screen><View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={()=>router.canGoBack()?router.back():router.replace('/account')} style={[styles.back,{backgroundColor:theme.surface,borderColor:theme.border}]}><ChevronLeft size={22} color={theme.text}/></Pressable><View style={{flex:1}}><Text style={[styles.eyebrow,{color:theme.primary}]}>{eyebrow}</Text><Text style={[styles.title,{color:theme.text}]}>{title}</Text></View></View><View style={styles.content}><Text style={[styles.intro,{color:theme.muted}]}>{intro}</Text>{sections.map(({icon:Icon,title:sectionTitle,copy,lines})=><View key={sectionTitle} style={[styles.card,{backgroundColor:theme.surface,borderColor:theme.border}]}><View style={[styles.icon,{backgroundColor:theme.surfaceAlt}]}><Icon size={24} color={theme.primary}/></View><Text style={[styles.cardTitle,{color:theme.text}]}>{sectionTitle}</Text><Text style={[styles.copy,{color:theme.muted}]}>{copy}</Text>{lines?.length?<View style={[styles.lines,{borderTopColor:theme.border}]}>{lines.map(line=><View key={line.label} style={styles.line}><Text style={[styles.lineLabel,{color:theme.muted}]}>{line.label}</Text><Text style={[styles.lineValue,{color:theme.text}]}>{line.value}</Text></View>)}</View>:null}</View>)}</View></Screen>
}

const styles=StyleSheet.create({header:{padding:18,paddingBottom:8,flexDirection:'row',alignItems:'center',gap:13},back:{width:44,height:44,borderWidth:1,borderRadius:13,alignItems:'center',justifyContent:'center'},eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.1},title:{fontFamily:'Georgia_Bold',fontSize:27,marginTop:3},content:{padding:18,gap:13},intro:{fontSize:15,lineHeight:23,marginBottom:5},card:{padding:18,borderWidth:1,borderRadius:17},icon:{width:50,height:50,borderRadius:14,alignItems:'center',justifyContent:'center'},cardTitle:{fontFamily:'Georgia_Bold',fontSize:22,marginTop:16},copy:{fontSize:14,lineHeight:22,marginTop:7},lines:{borderTopWidth:1,marginTop:16,paddingTop:8},line:{minHeight:42,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:16},lineLabel:{fontSize:13},lineValue:{fontSize:13,fontWeight:'800',textAlign:'right',flex:1}});
