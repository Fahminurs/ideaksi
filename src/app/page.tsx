import { redirect } from 'next/navigation';

export default function Home() {
  // Langsung redirect ke halaman masuk (login)
  redirect('/masuk');
}
