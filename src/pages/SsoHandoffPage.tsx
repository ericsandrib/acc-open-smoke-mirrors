import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShieldCheck, ArrowLeft, ExternalLink } from 'lucide-react'

/**
 * SSO interstitial — reached from the SEI "Investment Selection" deeplink.
 *
 * Deliberately models TWO single-sign-on handoffs so we can drive the SSO
 * configuration discussion:
 *   1. Signing in to Avantos (identity provider -> Avantos)
 *   2. Avantos -> SEI (Avantos hands the advisor off to the SEI ecosystem)
 *
 * We do NOT mock the SEI experience — "Continue to SEI" just represents the
 * advisor arriving in the SEI ecosystem to complete investment selection,
 * funding, personalization, and rebalancing.
 */
export function SsoHandoffPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = params.get('return') || ''
  const [entered, setEntered] = useState(false)

  const goBack = () => {
    if (returnTo) navigate(returnTo)
    else navigate(-1)
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-border">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wider">Single Sign-On</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {entered ? 'You are now in the SEI ecosystem' : 'Continue to SEI'}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {entered
              ? 'Investment selection, funding, personalization, and account rebalancing are completed here in SEI, then the results return to Avantos. (SEI is not mocked in this demo.)'
              : 'Investment Selection is completed in the SEI ecosystem. You will be signed in automatically via single sign-on — no separate login.'}
          </p>
        </div>

        {!entered ? (
          <div className="px-8 py-7 space-y-6">
            {/* Identity flow */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Advisor</p>
                <p className="mt-1 text-sm font-medium">Greta Fure</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 rounded-xl border-2 border-primary/40 bg-card px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Avantos</p>
                <p className="mt-1 text-sm font-medium">Agent Portal</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">SEI</p>
                <p className="mt-1 text-sm font-medium">Investment Selection</p>
              </div>
            </div>

            {/* The two SSO handoffs to configure — drives the config discussion */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">1 · Sign in to Avantos</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                    To configure
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  How the advisor authenticates into Avantos (identity provider → Avantos).
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Protocol, IdP, and provisioning — open decision.
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">2 · Avantos → SEI</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                    To configure
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  How Avantos hands the advisor off to SEI without a second login.
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Federation, session, and deeplink target — open decision.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Avantos
              </Button>
              <Button onClick={() => setEntered(true)}>
                Continue to SEI
                <ExternalLink className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-8 py-7 space-y-6">
            <div className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-8 text-center">
              <p className="text-sm font-medium">SEI ecosystem</p>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto">
                Investment selection, funding instructions, personalization (SRI &amp; asset restrictions), and
                account rebalancing happen here. Not mocked in this demo.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Return to Avantos
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
