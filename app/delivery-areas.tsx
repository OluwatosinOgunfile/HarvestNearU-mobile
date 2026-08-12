import { MapPin, Store, Truck } from 'lucide-react-native';
import { InfoPage } from '@/components/info-page';

export default function DeliveryAreas(){return <InfoPage eyebrow="FULFILMENT" title="Delivery areas" intro="Availability depends on the customer location, the supplying farm, and the fulfilment methods enabled for each listing. Exact options are confirmed in your basket." sections={[
  {icon:Truck,title:'Central Abuja',copy:'Doorstep delivery is available across our primary service area.',lines:[{label:'Gudu, Wuse, Jabi','value':'Same or next day'},{label:'Maitama, Asokoro',value:'Next day'},{label:'Lugbe, Gwarinpa',value:'Next day'}]},
  {icon:MapPin,title:'Greater Abuja',copy:'Scheduled routes connect farms and customers outside the central delivery area.',lines:[{label:'Kuje, Bwari',value:'Tue, Thu, Sat'},{label:'Gwagwalada, Kwali',value:'Wed & Sat'},{label:'Karu, Mararaba',value:'Tue-Sat'}]},
  {icon:Store,title:'Farm pickup',copy:'Pickup is free when a farm offers it. The order page shows when each product is ready and lets you acknowledge collection.'},
]}/>}
