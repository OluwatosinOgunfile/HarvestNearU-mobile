import { CreditCard, PackageCheck, RotateCcw } from 'lucide-react-native';
import { InfoPage } from '@/components/info-page';

export default function ReturnsRefunds(){return <InfoPage eyebrow="BUYER PROTECTION" title="Returns and refunds" intro="Report a problem from Help and feedback. Include the order number, affected produce, and a clear description so the support team can act quickly." sections={[
  {icon:PackageCheck,title:'Before accepting produce',copy:'Inspect the item at handover. Do not acknowledge receipt if it is missing, materially damaged, or different from the listing.'},
  {icon:RotateCcw,title:'Cancelled payments',copy:'A manual payment awaiting administrator review can be cancelled from its expanded order. Choose full account credit or a bank refund less the ₦500 processing fee.'},
  {icon:CreditCard,title:'Refund processing',copy:'Approved account credit appears in your profile. Bank refunds follow the destination supplied with the request and remain visible in order history.'},
]}/>}
