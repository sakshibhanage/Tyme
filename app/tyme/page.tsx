import { redirect } from 'next/navigation'

/** Canonical marketing URL is `/`; keep `/tyme` as a permanent alias. */
export default function TymeAliasPage() {
  redirect('/')
}
