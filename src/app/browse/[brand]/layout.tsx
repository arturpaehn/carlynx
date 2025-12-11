import { generateMetadata as genMetadata } from './metadata'

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }) {
  const resolvedParams = await params;
  return await genMetadata({ params: resolvedParams });
}

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
