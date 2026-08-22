import Head from 'next/head'
import { useRouter } from 'next/router'
import PrivateChatRoom from '../../components/PrivateChatRoom'

export default function CustomerChatPage() {
  const router = useRouter()
  const id = typeof router.query.id === 'string' ? router.query.id : ''
  const token = typeof router.query.token === 'string' ? router.query.token : ''
  const ownerPreviewUrl = typeof router.query.owner_preview === 'string' ? router.query.owner_preview : ''

  return <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18]">
    <Head><title>Consultation privée avec Nanou</title></Head>
    <PrivateChatRoom id={id} token={token} role="customer" ownerPreviewUrl={ownerPreviewUrl} />
  </div>
}
