import { generateListingMetadata } from './metadata'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return await generateListingMetadata({ params })
}

export default function ListingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
