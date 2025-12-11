import { generateMetadata as genMetadata } from './metadata'

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string }> }) {
  const resolvedParams = await params;
  return await genMetadata({ params: resolvedParams });
}

export default function CityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
