import { generateListingMetadata } from './metadata'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return await generateListingMetadata({ params: resolvedParams })
}

export default function ListingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
