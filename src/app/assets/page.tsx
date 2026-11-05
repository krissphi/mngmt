import { redirect } from 'next/navigation';

export default function AssetsPage() {
  redirect('/business?tab=assets');
}
