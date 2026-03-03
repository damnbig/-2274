import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Edit3, Trash2, Save, X, Plus, GripVertical, Eye, EyeOff, Menu, Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind, Droplets, Thermometer, BookOpen, Edit2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type Node = {
  id: string;
  name: string;
  position: [number, number];
  notes: string;
};

type QWeatherData = {
  now: {
    temp: string;
    feelsLike: string;
    text: string;
    windDir: string;
    windScale: string;
    windSpeed: string;
    humidity: string;
    precip: string;
    vis: string;
    obsTime: string;
  };
  daily: {
    fxDate: string;
    tempMax: string;
    tempMin: string;
    textDay: string;
    textNight: string;
    windScaleDay: string;
    precip: string;
    uvIndex: string;
  }[];
  warning: {
    title: string;
    text: string;
    type: string;
    level: string;
  }[];
};

type TrafficEvent = {
  id: string;
  type: string;
  desc: string;
  x: number;
  y: number;
};

const getQWeatherIcon = (text: string) => {
  if (text.includes('晴')) return { icon: Sun, color: 'text-amber-500' };
  if (text.includes('云') || text.includes('阴')) return { icon: Cloud, color: 'text-stone-500' };
  if (text.includes('雷')) return { icon: CloudLightning, color: 'text-purple-500' };
  if (text.includes('雨')) return { icon: CloudRain, color: 'text-blue-500' };
  if (text.includes('雪')) return { icon: Snowflake, color: 'text-indigo-300' };
  if (text.includes('雾') || text.includes('霾') || text.includes('沙') || text.includes('尘')) return { icon: Wind, color: 'text-stone-400' };
  return { icon: Cloud, color: 'text-stone-500' };
};

const ITINERARY_NODES: Node[] = [
  { id: 'day1-start', name: '成都双流机场', position: [30.5793, 103.9454], notes: '13:30 - 14:30 | 机场汇合，启程\n在双流机场T2接机。车厢已提前调至舒适温度，带着对这趟旅途的期待，我们避开成都市区的晚高峰，直接上高速向北进发。' },
  { id: 'day1-mid', name: '绵阳', position: [31.4675, 104.7305], notes: '16:50 - 18:30 | 绵阳中转站：大快朵颐与物资扫荡\n在绵阳上马百盛购物中心稍作停留。先吃一顿热气腾腾的晚餐彻底放松身体，随后在超市进行后备箱“大扩充”。\n🛒 必买清单：自热米饭/火锅、巧克力/牛肉干等高热量零食、充足的饮用水、第二天的早餐面包，以及路上解渴的橘子或小番茄。' },
  { id: 'day1-end', name: '九寨沟口', position: [33.2611, 103.9213], notes: '18:30 - 22:00 | 绵阳 -> 九寨沟（夜宿九寨沟口，海拔约2000米）\n物资满载，正式进山。副驾可以调低座椅，盖上外套安心补觉。\n⚠️ 驾驶员专属Tip：离开绵阳后车辆切为“燃油优先/强制保电”模式，确保到达时电池余量充足。平武之后的山区夜间气温低，过桥面和背阴弯道时需警惕暗冰，保持平稳车速，柔和控制油门与刹车。\n\nDay 2 (3月7日)：蓝冰与静谧，九寨沟的慢时光\n08:30 - 15:30 | 沉浸式视觉盛宴\n乘坐观光车加轻度步行，穿梭在五花海、长海之间。三月的光线冷峻而通透，水面的倒影和枯木的纹理非常适合捕捉充满电影质感和情绪张力的画面。' },
  { id: 'day2-end', name: '川主寺', position: [32.6333, 103.6167], notes: '15:30 | 黄金决策点：倾听身体的声音\n👉 选项 B：机动推进（驱车前往川主寺，海拔约3000米）\n如果两人精力充沛，且时间刚过下午4点，我们就在17:00前取车，开1.5小时前往川主寺住宿。这样不仅完美避开了夜间冰雪赶路，还能为明天的行程分担压力，同时让身体做一次向高海拔的阶梯式适应。\n⚠️ 高反预防Tip：如果当晚选择住川主寺，到达后尽量不洗头洗澡，多喝热水，让身体在安静中适应气压的变化。' },
  { id: 'day3-mid1', name: '尕里台', position: [32.8333, 103.1167], notes: '上午 | 拔锚，翻越尕里台\n吃一顿扎实的热乎早餐后出发。随着车辆翻越海拔3800米的尕里台垭口，视野会瞬间从峡谷切换至一望无际的平坦草原，带来极强的豁然开朗之感。' },
  { id: 'day3-mid2', name: '瓦切塔林', position: [32.85, 102.5833], notes: '中午 - 下午 | 瓦切塔林：极致的色彩碰撞\n抵达瓦切镇午餐后，我们将游览瓦切塔林。在三月略显苍茫、萧瑟的枯黄草场背景下，漫天飞舞的彩色经幡与圣洁的白塔形成了极高饱和度的色彩碰撞。这里充满了宁静的信仰力量，风吹动经幡的声音，是洗涤心灵的最佳白噪音。这里极其适合拍出富有空间层次感和人文深度的影像。' },
  { id: 'day3-mid3', name: '红原', position: [32.7833, 102.5333], notes: '下午 | 驶向阿坝：漫长的星空公路\n离开瓦切，经红原方向驶入G347/S217。这里有一段极长、笔直的公路，极具公路片质感。这段漫长的旅途，最适合在车厢里放起我们喜欢的歌单，或者天马行空地聊聊过去与未来。\n⚠️ 驾驶员专属Tip：草原下午常有强横风，双手需稳握方向盘，控制车速在80km/h以下。密切注视路面暗坑，如遇牦牛或羊群过马路，务必提前减速让行，切勿鸣笛惊扰。' },
  { id: 'day3-end', name: '阿坝县', position: [32.9000, 101.7000], notes: '傍晚 | 抵达阿坝（宿阿坝县城，海拔约3200米）\n迎着夕阳抵达阿坝县城，远远便能望见宏伟的各莫寺。办理入住后，去品尝正宗的牦牛肉补充能量，为明天深入“魔幻异星世界”莲宝叶则蓄积体力。' },
];

const PLANNED_ROUTE: [number, number][] = [
  [30.5793, 103.9454], // Chengdu Airport
  [31.4675, 104.7305], // Mianyang
  [32.4000, 104.5000], // Pingwu (approx)
  [33.2611, 103.9213], // Jiuzhaigou
  [32.6333, 103.6167], // Chuanzhusi
  [33.0800, 103.2500], // G213 to S301 Junction (forces route through grassland road)
  [32.85, 102.5833],   // Waqie Talin
  [32.7833, 102.5333], // Hongyuan
  [32.9000, 101.7000], // Aba County
];

type RouteLeg = {
  distance: number;
  duration: number;
  midpoint: [number, number];
};

type RouteData = {
  coordinates: [number, number][];
  legs: RouteLeg[];
};

const fetchRoute = async (points: [number, number][]): Promise<RouteData> => {
  if (points.length < 2) return { coordinates: points, legs: [] };
  try {
    const AMAP_KEY = 'd9eec6c08a739377afe787789b1ee402';
    
    const legPromises = [];
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const origin = `${start[1]},${start[0]}`;
      const destination = `${end[1]},${end[0]}`;
      legPromises.push(
        fetch(`https://restapi.amap.com/v3/direction/driving?origin=${origin}&destination=${destination}&key=${AMAP_KEY}&extensions=base`)
          .then(res => {
            if (!res.ok) throw new Error(`Amap API returned ${res.status}`);
            return res.json();
          })
          .then(data => ({ data, start, end, index: i }))
          .catch(err => {
            console.warn(`Amap API failed for leg ${i}:`, err);
            return { data: { status: '0' }, start, end, index: i };
          })
      );
    }
    
    const results = await Promise.all(legPromises);
    
    let allCoordinates: [number, number][] = [];
    let legs: RouteLeg[] = [];
    
    results.sort((a, b) => a.index - b.index);
    
    for (const res of results) {
      const { data, start, end, index } = res;
      if (data.status === '1' && data.route && data.route.paths && data.route.paths.length > 0) {
        const path = data.route.paths[0];
        const distance = parseInt(path.distance);
        const duration = parseInt(path.duration);
        
        let legCoordinates: [number, number][] = [];
        path.steps.forEach((step: any) => {
          const polyline = step.polyline.split(';');
          polyline.forEach((p: string) => {
            const [lng, lat] = p.split(',');
            legCoordinates.push([parseFloat(lat), parseFloat(lng)]);
          });
        });
        
        if (index === 0) {
          allCoordinates = [...legCoordinates];
        } else {
          allCoordinates = [...allCoordinates, ...legCoordinates.slice(1)];
        }
        
        legs.push({
          distance,
          duration,
          midpoint: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2] as [number, number]
        });
      } else {
        console.warn('Amap routing failed for a leg, falling back to straight line');
        
        const legCoordinates: [number, number][] = [start, end];
        
        if (index === 0) {
          allCoordinates = [...legCoordinates];
        } else {
          allCoordinates = [...allCoordinates, ...legCoordinates.slice(1)];
        }
        
        // Calculate straight line distance approximately
        const R = 6371e3; // metres
        const phi1 = start[0] * Math.PI/180;
        const phi2 = end[0] * Math.PI/180;
        const deltaPhi = (end[0]-start[0]) * Math.PI/180;
        const deltaLambda = (end[1]-start[1]) * Math.PI/180;

        const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
                  Math.cos(phi1) * Math.cos(phi2) *
                  Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = Math.round(R * c);
        
        legs.push({
          distance,
          duration: Math.round(distance / 16.6), // Assume 60km/h = 16.6m/s
          midpoint: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2] as [number, number]
        });
      }
    }
    
    return { coordinates: allCoordinates, legs };
  } catch (error) {
    console.error("Routing error:", error);
  }
  
  // Fallback to straight lines
  const fallbackLegs: RouteLeg[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    fallbackLegs.push({
      distance: 0,
      duration: 0,
      midpoint: [(points[i][0] + points[i+1][0]) / 2, (points[i][1] + points[i+1][1]) / 2] as [number, number]
    });
  }
  return { coordinates: points, legs: fallbackLegs };
};

export default function App() {
  const [nodes, setNodes] = useState<Node[]>(ITINERARY_NODES);
  const [isAddingDestination, setIsAddingDestination] = useState(false);
  const [newDestQuery, setNewDestQuery] = useState('');
  const [newDestResults, setNewDestResults] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [showPlannedRoute, setShowPlannedRoute] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [plannedRouteData, setPlannedRouteData] = useState<RouteData>({ coordinates: [], legs: [] });
  const [isRouting, setIsRouting] = useState(false);
  const [weatherData, setWeatherData] = useState<QWeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [trafficEvents, setTrafficEvents] = useState<TrafficEvent[]>([]);
  const [zoomLevel, setZoomLevel] = useState(6);
  const [isRelocating, setIsRelocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [plannedRoutePoints, setPlannedRoutePoints] = useState<[number, number][]>(PLANNED_ROUTE);

  // Fetch planned route when points change
  useEffect(() => {
    fetchRoute(plannedRoutePoints).then(setPlannedRouteData);
  }, [plannedRoutePoints]);

  // Fetch traffic events on mount
  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const AMAP_KEY = 'd9eec6c08a739377afe787789b1ee402';
        // Bounding box roughly covering Sichuan (100.0,26.0 to 108.0,34.0)
        // Note: The Amap traffic event API requires a rectangle.
        const res = await fetch(`https://restapi.amap.com/v3/traffic/status/rectangle?rectangle=100.0,26.0;108.0,34.0&key=${AMAP_KEY}&extensions=all`);
        if (!res.ok) throw new Error(`Traffic API returned ${res.status}`);
        const data = await res.json();
        if (data.status === '1' && data.trafficinfo?.evaluation?.status_desc) {
           // The free tier of Amap traffic API often just returns evaluation data, not specific events.
        }
      } catch (error) {
        console.error("Failed to fetch traffic", error);
      } finally {
        // We'll simulate a few events based on the route for demonstration if the API doesn't return specific points or fails.
        setTrafficEvents([
          { id: 't1', type: '施工', desc: 'G213川主寺段半幅施工，注意避让', x: 103.6167, y: 32.6333 },
          { id: 't2', type: '拥堵', desc: '九寨沟口车流量大，缓行', x: 103.9213, y: 33.2611 }
        ]);
      }
    };
    fetchTraffic();
  }, []);

  // Map events handler for tracking zoom
  const MapEventsHandler = () => {
    const map = useMapEvents({
      zoomend() {
        setZoomLevel(map.getZoom());
      },
    });
    return null;
  };

  const handleNodeClick = async (node: Node) => {
    setSelectedNode(node);
    setEditNotes(node.notes);
    setIsEditing(false);
    
    // Fetch weather using QWeather (HeFeng)
    setIsWeatherLoading(true);
      try {
        const QWEATHER_KEY = 'bc38746c3f444dcbae9d658bd2ae6d9a';
        const location = `${node.position[1].toFixed(2)},${node.position[0].toFixed(2)}`;
        
        // 1. Get Live Weather
        const nowRes = await fetch(`https://p42pg7ujyn.re.qweatherapi.com/v7/weather/now?location=${location}&key=${QWEATHER_KEY}`);
        if (!nowRes.ok) throw new Error(`Now API returned ${nowRes.status}`);
        const nowData = await nowRes.json();
        
        // 2. Get 3-Day Forecast
        const dailyRes = await fetch(`https://p42pg7ujyn.re.qweatherapi.com/v7/weather/3d?location=${location}&key=${QWEATHER_KEY}`);
        if (!dailyRes.ok) throw new Error(`Daily API returned ${dailyRes.status}`);
        const dailyData = await dailyRes.json();

        // 3. Get Warnings (QWeather returns 204 No Content if there are no warnings)
        const warnRes = await fetch(`https://p42pg7ujyn.re.qweatherapi.com/v7/warning/now?location=${location}&key=${QWEATHER_KEY}`);
        let warnData = { code: '204', warning: [] };
        if (warnRes.status === 200) {
          warnData = await warnRes.json();
        } else if (warnRes.status !== 204) {
          console.warn(`Warning API returned ${warnRes.status}`);
        }
        
        if (nowData.code === '200' && dailyData.code === '200') {
          setWeatherData({
            now: nowData.now,
            daily: dailyData.daily,
            warning: warnData.code === '200' ? warnData.warning : []
          });
        } else {
          setWeatherData(null);
        }
      } catch (error) {
        console.error("Failed to fetch QWeather", error);
        setWeatherData(null);
      } finally {
        setIsWeatherLoading(false);
      }
  };

  const handleSaveNotes = () => {
    if (selectedNode) {
      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, notes: editNotes } : n));
      setSelectedNode({ ...selectedNode, notes: editNotes });
      setIsEditing(false);
    }
  };

  const handleSearchNewDestination = async (query: string) => {
    setNewDestQuery(query);
    if (query.length < 2) {
      setNewDestResults([]);
      return;
    }
    try {
      const AMAP_KEY = 'd9eec6c08a739377afe787789b1ee402';
      const res = await fetch(`https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(query)}&key=${AMAP_KEY}&extensions=all`);
      const data = await res.json();
      if (data.status === '1' && data.pois) {
        setNewDestResults(data.pois);
      }
    } catch (error) {
      console.error("Search failed", error);
    }
  };

  const handleAddNewDestination = (poi: any) => {
    const [lng, lat] = poi.location.split(',');
    const newPosition: [number, number] = [parseFloat(lat), parseFloat(lng)];
    
    const newNode: Node = {
      id: `dest-${Date.now()}`,
      name: poi.name,
      position: newPosition,
      notes: '点击编辑专属攻略...'
    };
    
    setNodes(prev => [...prev, newNode]);
    setPlannedRoutePoints(prev => [...prev, newPosition]);
    
    setIsAddingDestination(false);
    setNewDestQuery('');
    setNewDestResults([]);
    
    // Automatically select the new node
    setSelectedNode(newNode);
  };

  const handleDeleteNode = () => {
    if (selectedNode) {
      if (window.confirm(`确定要删除 ${selectedNode.name} 吗？`)) {
        setNodes(prev => prev.filter(n => n.id !== selectedNode.id));
        setPlannedRoutePoints(prev => prev.filter(p => p[0] !== selectedNode.position[0] || p[1] !== selectedNode.position[1]));
        setSelectedNode(null);
      }
    }
  };

  const handleSearchLocation = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const AMAP_KEY = 'd9eec6c08a739377afe787789b1ee402';
      const city = selectedNode?.name || '';
      const res = await fetch(`https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&key=${AMAP_KEY}&extensions=all`);
      const data = await res.json();
      if (data.status === '1' && data.pois) {
        setSearchResults(data.pois);
      }
    } catch (error) {
      console.error("Search failed", error);
    }
  };

  const handleSelectLocation = (poi: any) => {
    if (!selectedNode) return;
    const [lng, lat] = poi.location.split(',');
    const newPosition: [number, number] = [parseFloat(lat), parseFloat(lng)];
    
    const updatedNode = { ...selectedNode, position: newPosition, name: poi.name };
    
    setNodes(prev => prev.map(n => n.id === selectedNode.id ? updatedNode : n));
    setSelectedNode(updatedNode);
    setIsRelocating(false);
    setSearchQuery('');
    setSearchResults([]);
    
    // Update plannedRoutePoints if this node is part of the planned route
    const oldPosition = selectedNode.position;
    const pointIndex = plannedRoutePoints.findIndex(p => 
      Math.abs(p[0] - oldPosition[0]) < 0.05 && Math.abs(p[1] - oldPosition[1]) < 0.05
    );
    
    if (pointIndex !== -1) {
      const newRoutePoints = [...plannedRoutePoints];
      newRoutePoints[pointIndex] = newPosition;
      setPlannedRoutePoints(newRoutePoints);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-stone-100 overflow-hidden font-sans text-stone-900 relative">
      
      {/* Map Area - Full Screen */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={[32.0, 103.5]} 
          zoom={6} 
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://ditu.amap.com/">高德地图</a>'
            url="http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
            subdomains={['1', '2', '3', '4']}
          />
          
          <MapEventsHandler />

          {nodes.map(node => (
            <Marker 
              key={node.id} 
              position={node.position}
              icon={L.divIcon({
                className: 'bg-transparent border-none',
                html: `<div class="relative flex items-center justify-center">
                  <div class="absolute w-8 h-8 bg-white/30 rounded-full animate-ping"></div>
                  <div class="relative w-6 h-6 bg-white rounded-full shadow-lg border-2 ${selectedNode?.id === node.id ? 'border-indigo-500' : 'border-stone-800'} flex items-center justify-center z-10 transition-colors">
                    <div class="w-2 h-2 ${selectedNode?.id === node.id ? 'bg-indigo-500' : 'bg-stone-800'} rounded-full"></div>
                  </div>
                  ${zoomLevel >= 6 ? `<div class="absolute top-8 whitespace-nowrap bg-white/90 backdrop-blur-md px-2 py-1 rounded-md shadow-sm border border-stone-200 text-[11px] font-semibold text-stone-800 z-20 transition-opacity">
                    ${node.name}
                  </div>` : ''}
                </div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
              eventHandlers={{
                click: () => handleNodeClick(node),
              }}
            />
          ))}

          {/* Traffic Events */}
          {trafficEvents.map(event => (
            <Marker 
              key={event.id} 
              position={[event.y, event.x]}
              icon={L.divIcon({
                className: 'bg-red-500 w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold',
                html: '⚠️',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            >
              <Popup>
                <div className="font-medium text-red-700">{event.type}</div>
                <div className="text-xs text-stone-600 mt-1">{event.desc}</div>
              </Popup>
            </Marker>
          ))}

          {/* Planned Route Highlight */}
          {showPlannedRoute && plannedRouteData.coordinates.length > 0 && (
            <>
              <Polyline 
                positions={plannedRouteData.coordinates} 
                color="#4f46e5" // Indigo-600
                weight={5} 
                opacity={0.8}
                lineCap="round"
                lineJoin="round"
              />
              {zoomLevel >= 7 && plannedRouteData.legs.map((leg, idx) => {
                const hours = Math.floor(leg.duration / 3600);
                const minutes = Math.floor((leg.duration % 3600) / 60);
                const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                const distanceKm = (leg.distance / 1000).toFixed(1);
                
                return (
                  <Marker 
                    key={`planned-leg-${idx}`} 
                    position={leg.midpoint}
                    icon={L.divIcon({
                      className: 'bg-transparent border-none',
                      html: `<div class="bg-white/90 backdrop-blur-xl px-2.5 py-1 rounded-full shadow-sm border border-stone-200/50 text-[10px] font-semibold text-stone-700 whitespace-nowrap flex items-center gap-1.5 transition-transform hover:scale-105">
                        <span class="text-indigo-500 font-bold">${distanceKm}km</span>
                        ${zoomLevel >= 8 ? `<span class="w-1 h-1 bg-stone-300 rounded-full"></span><span class="text-stone-500">${timeString}</span>` : ''}
                      </div>`,
                      iconSize: [100, 24],
                      iconAnchor: [50, 12]
                    })}
                  />
                );
              })}
            </>
          )}

          {/* Removed drawnRouteData and draw mode points */}
        </MapContainer>
      </div>

      {/* Floating Header - Steve Jobs Style (Minimal, Glassmorphic) */}
      <div className="absolute top-safe-top left-0 right-0 z-[2000] p-4 pointer-events-none flex justify-center items-start">
        <div className="bg-white/80 backdrop-blur-xl pl-5 pr-2 py-2 rounded-full shadow-lg border border-white/20 pointer-events-auto flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-stone-900">四川行</h1>
            <p className="text-[10px] font-medium text-stone-500">Sichuan Journey</p>
          </div>
          <div className="w-px h-8 bg-stone-200/50 mx-1"></div>
          <button
            onClick={() => setShowPlannedRoute(!showPlannedRoute)}
            className={`p-2.5 rounded-full transition-all ${
              showPlannedRoute 
                ? 'bg-indigo-500 text-white shadow-md' 
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {showPlannedRoute ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-[2000] bg-white/80 backdrop-blur-xl border-t border-stone-200/50 p-4 pb-safe-bottom pointer-events-auto">
        <button
          onClick={() => setIsAddingDestination(true)}
          className="w-full bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center justify-center font-semibold text-base hover:bg-stone-800 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          添加目的地
        </button>
      </div>

      {/* Routing Loading Indicator */}
      <AnimatePresence>
        {isRouting && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-[2000] bg-stone-900/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg text-xs font-medium text-white flex items-center"
          >
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            路线计算中...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Bottom Sheet / Side Panel */}
      <AnimatePresence>
        {selectedNode && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedNode(null);
                setIsRelocating(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="fixed inset-0 bg-stone-900/30 z-[2500] backdrop-blur-sm"
            />
            
            {/* Sheet/Panel */}
            <motion.div
              initial={{ y: '100%', x: 0 }}
              animate={{ y: 0, x: 0 }}
              exit={{ y: '100%', x: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 md:top-4 md:bottom-4 md:right-4 md:left-auto md:w-[420px] md:rounded-3xl h-[85dvh] md:h-auto bg-white/95 backdrop-blur-2xl shadow-2xl z-[2600] flex flex-col rounded-t-3xl overflow-hidden border border-white/40"
            >
              {/* Drag Handle (Mobile) */}
              <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
              </div>

              <div className="px-6 py-4 flex justify-between items-start">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold tracking-tight text-stone-900">{selectedNode.name}</h2>
                  <button 
                    onClick={() => setIsRelocating(!isRelocating)}
                    className="text-xs text-indigo-500 font-medium flex items-center mt-1 hover:text-indigo-600 transition-colors w-fit"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    调整位置
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDeleteNode}
                    className="p-2 bg-red-50 text-red-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                    title="删除此节点"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedNode(null);
                      setIsRelocating(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="p-2 bg-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6 scrollbar-hide">
                {isRelocating && (
                  <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchLocation(e.target.value)}
                        placeholder="搜索更具体的地点 (如: 绵阳市上马百盛)"
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto bg-white rounded-xl border border-indigo-100 shadow-sm divide-y divide-stone-100">
                        {searchResults.map((poi) => (
                          <button
                            key={poi.id}
                            onClick={() => handleSelectLocation(poi)}
                            className="w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors flex flex-col"
                          >
                            <span className="text-sm font-medium text-stone-800">{poi.name}</span>
                            <span className="text-xs text-stone-500 mt-0.5">{poi.address || poi.district}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Weather System */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center">
                    <Thermometer className="w-4 h-4 mr-1.5" />
                    路况与天气预报
                  </h3>
                  {isWeatherLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                      <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin mb-3" />
                      <span className="text-sm font-medium">获取气象数据...</span>
                    </div>
                  ) : weatherData ? (
                    <div>
                      {/* Current Weather */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          {React.createElement(getQWeatherIcon(weatherData.now.text).icon, { className: `w-12 h-12 ${getQWeatherIcon(weatherData.now.text).color} mr-4` })}
                          <div>
                            <div className="text-4xl font-light tracking-tighter text-stone-900">{weatherData.now.temp}°</div>
                            <div className="text-sm font-medium text-stone-500 mt-1">
                              {weatherData.now.text} · 体感 {weatherData.now.feelsLike}°
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Warnings */}
                      {weatherData.warning && weatherData.warning.length > 0 && (
                        <div className="mb-5 space-y-2">
                          {weatherData.warning.map((w, i) => (
                            <div key={i} className="bg-red-50/80 border border-red-100 rounded-xl p-3 text-sm text-red-800 flex items-start">
                              <span className="mr-2 mt-0.5">⚠️</span>
                              <div>
                                <span className="font-bold block mb-0.5">{w.title}</span>
                                <span className="text-red-600/90 leading-snug">{w.text}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Driving Risks */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className={`p-3 rounded-xl border ${parseInt(weatherData.now.windScale) >= 4 ? 'bg-amber-50/50 border-amber-200' : 'bg-stone-50 border-stone-100'}`}>
                          <div className="flex items-center text-xs font-semibold text-stone-400 mb-1.5"><Wind className="w-3.5 h-3.5 mr-1" /> 风力</div>
                          <div className={`font-bold text-sm ${parseInt(weatherData.now.windScale) >= 4 ? 'text-amber-700' : 'text-stone-800'}`}>
                            {weatherData.now.windDir} {weatherData.now.windScale}级
                            {parseInt(weatherData.now.windScale) >= 4 && <span className="block text-xs font-medium text-amber-600 mt-1">⚠️ 注意横风</span>}
                          </div>
                        </div>
                        <div className={`p-3 rounded-xl border ${parseFloat(weatherData.now.precip) > 0 || parseFloat(weatherData.now.vis) < 5 ? 'bg-blue-50/50 border-blue-200' : 'bg-stone-50 border-stone-100'}`}>
                          <div className="flex items-center text-xs font-semibold text-stone-400 mb-1.5"><Droplets className="w-3.5 h-3.5 mr-1" /> 降水/能见度</div>
                          <div className={`font-bold text-sm ${parseFloat(weatherData.now.precip) > 0 || parseFloat(weatherData.now.vis) < 5 ? 'text-blue-700' : 'text-stone-800'}`}>
                            {parseFloat(weatherData.now.precip) > 0 ? `${weatherData.now.precip}mm` : '无降水'} · {weatherData.now.vis}km
                            {(parseFloat(weatherData.now.precip) > 0 || parseFloat(weatherData.now.vis) < 5) && <span className="block text-xs font-medium text-blue-600 mt-1">⚠️ 减速慢行</span>}
                          </div>
                        </div>
                      </div>

                      {/* Forecast */}
                      <div className="space-y-3 border-t border-stone-100 pt-5">
                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">未来预报</div>
                        {weatherData.daily.map((day, i) => (
                          <div key={day.fxDate} className="flex items-center justify-between text-sm font-medium">
                            <span className="text-stone-500 w-12">{i === 0 ? '今天' : i === 1 ? '明天' : '后天'}</span>
                            <div className="flex items-center flex-1 justify-center">
                              {React.createElement(getQWeatherIcon(day.textDay).icon, { className: `w-5 h-5 ${getQWeatherIcon(day.textDay).color} mr-2` })}
                              <span className="text-stone-700">{day.textDay}</span>
                            </div>
                            <span className="text-stone-900 w-20 text-right">
                              {day.tempMin}° <span className="text-stone-300 mx-1">/</span> {day.tempMax}°
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-stone-500 text-center py-4">暂无气象数据</div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center">
                      <BookOpen className="w-4 h-4 mr-1.5" />
                      专属攻略
                    </h3>
                    {!isEditing && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> 编辑
                      </button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full h-48 p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm text-stone-700 leading-relaxed bg-stone-50"
                        placeholder="记录您的旅行灵感..."
                      />
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                        >
                          取消
                        </button>
                        <button 
                          onClick={handleSaveNotes}
                          className="px-4 py-2 text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded-xl shadow-md transition-colors flex items-center"
                        >
                          <Save className="w-4 h-4 mr-1.5" /> 保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {selectedNode.notes || <span className="text-stone-400 italic">暂无攻略，点击编辑添加。</span>}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Destination Modal */}
      <AnimatePresence>
        {isAddingDestination && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddingDestination(false);
                setNewDestQuery('');
                setNewDestResults([]);
              }}
              className="fixed inset-0 bg-stone-900/40 z-[3000] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[3001] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h2 className="text-lg font-bold text-stone-900">添加目的地</h2>
                <button 
                  onClick={() => {
                    setIsAddingDestination(false);
                    setNewDestQuery('');
                    setNewDestResults([]);
                  }}
                  className="p-2 bg-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    value={newDestQuery}
                    onChange={(e) => handleSearchNewDestination(e.target.value)}
                    placeholder="输入你想去的地方 (如: 色达)"
                    className="w-full pl-12 pr-4 py-3.5 bg-stone-100 border-none rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                    autoFocus
                  />
                </div>
                
                {newDestResults.length > 0 ? (
                  <div className="space-y-2">
                    {newDestResults.map((poi) => (
                      <button
                        key={poi.id}
                        onClick={() => handleAddNewDestination(poi)}
                        className="w-full text-left p-4 hover:bg-stone-50 rounded-2xl transition-colors flex flex-col border border-transparent hover:border-stone-100"
                      >
                        <span className="text-base font-bold text-stone-800">{poi.name}</span>
                        <span className="text-sm text-stone-500 mt-1">{poi.address || poi.district}</span>
                      </button>
                    ))}
                  </div>
                ) : newDestQuery.length >= 2 ? (
                  <div className="text-center py-10 text-stone-500 text-sm">
                    未找到相关地点，请尝试其他关键词
                  </div>
                ) : (
                  <div className="text-center py-10 text-stone-400 text-sm">
                    输入地点名称开始搜索
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
