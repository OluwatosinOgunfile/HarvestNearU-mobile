import { MapPin, Store, Truck } from 'lucide-react-native';
import { useEffect, useState } from 'react';

import { InfoPage } from '@/components/info-page';
import { api } from '@/lib/api';

type PickupCentre = {
  id: string;
  name: string;
  address_text: string;
  city: string;
  state: string;
  opening_hours: { summary?: string } | null;
};

export default function DeliveryAreas() {
  const [centres, setCentres] = useState<PickupCentre[]>([]);

  useEffect(() => {
    let active = true;
    api<{ centres: PickupCentre[] }>('/api/collection-hubs')
      .then((result) => { if (active) setCentres(result.centres || []); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const pickupSections = centres.length ? centres.map((centre) => ({
    icon: Store,
    title: centre.name,
    copy: `${centre.address_text}, ${centre.city}, ${centre.state}`,
    lines: [
      { label: 'Opening hours', value: centre.opening_hours?.summary || 'Confirm before collection' },
      { label: 'Collection', value: 'Confirm per item' },
    ],
  })) : [{
    icon: Store,
    title: 'Farm pickup',
    copy: 'Pickup is free when a farm offers it. The order page shows when each product is ready and lets you acknowledge collection.',
  }];

  return <InfoPage eyebrow="FULFILMENT" title="Delivery areas" intro="Doorstep delivery is charged at ₦250 per kilometre to the farthest supplying farm, with ₦250 as the minimum. It only appears in your basket when every farm in it offers delivery and your saved location falls inside its radius." sections={[
    { icon: Truck, title: 'Central Abuja', copy: 'Doorstep delivery is available across our primary service area at ₦250 per kilometre.', lines: [{ label: 'Gudu, Wuse, Jabi', value: 'Same or next day' }, { label: 'Maitama, Asokoro', value: 'Next day' }, { label: 'Lugbe, Gwarinpa', value: 'Next day' }] },
    { icon: MapPin, title: 'Greater Abuja', copy: 'Scheduled routes connect farms and customers outside the central delivery area.', lines: [{ label: 'Kuje, Bwari', value: 'Tue, Thu, Sat' }, { label: 'Gwagwalada, Kwali', value: 'Wed & Sat' }, { label: 'Karu, Mararaba', value: 'Tue-Sat' }] },
    ...pickupSections,
  ]}/>;
}
