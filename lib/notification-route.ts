export function notificationRoute(value:unknown){
  const path=typeof value==='string'?value:'';
  if(path.startsWith('/orders'))return '/orders';
  if(path.startsWith('/farmer')||path.startsWith('/admin'))return '/workspace';
  if(path.startsWith('/profile'))return '/profile';
  if(path.startsWith('/help')||path.startsWith('/support'))return '/support';
  return '/notifications';
}
