import { Download, Mail } from "lucide-react";

export default function DevisPreview({ devis }) {
  return (
    <aside className="w-[420px] flex-shrink-0 bg-neo-bg p-8 flex flex-col overflow-y-auto">
      <h2 className="text-xl font-bold text-neo-primary mb-6 text-center">
        Visualisez votre estimation avant téléchargement
      </h2>

      <div className="flex-1 flex items-center justify-center">
        {devis ? <DevisCard devis={devis} /> : <EmptyState />}
      </div>

      <div className="mt-6 flex gap-3 justify-center">
        <button
          disabled={!devis}
          className="flex items-center gap-2 px-5 py-3 rounded-full border-2 border-neo-primary text-neo-primary font-semibold hover:bg-neo-primary hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          Télécharger le devis
        </button>
        <button
          disabled={!devis}
          className="flex items-center gap-2 px-5 py-3 rounded-full border-2 border-neo-primary text-neo-primary font-semibold hover:bg-neo-primary hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Mail size={16} />
          Envoyer par mail
        </button>
      </div>

      <p className="text-xs text-neo-muted text-center mt-4">
        Devis généré automatiquement selon les informations fournies.
      </p>
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 w-full text-center text-neo-muted">
      <div className="text-5xl mb-4 opacity-30" aria-hidden>📄</div>
      <p className="text-sm">
        Votre devis apparaîtra ici dès que l'assistant aura recueilli les
        informations nécessaires.
      </p>
    </div>
  );
}

function DevisCard({ devis }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full overflow-hidden">
      <div className="bg-neo-primary text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest opacity-80">
            Neotravel
          </div>
          <div className="text-lg font-bold">Devis automatique</div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-80">Référence</div>
          <div className="font-semibold">{devis.reference}</div>
        </div>
      </div>

      <div className="p-6 space-y-3 text-sm">
        {devis.trajet && (
          <Row label="Trajet" value={devis.trajet} />
        )}
        {devis.dateDepart && (
          <Row label="Date de départ" value={devis.dateDepart} />
        )}
        {devis.nbPassagers && (
          <Row label="Passagers" value={`${devis.nbPassagers} personnes`} />
        )}

        <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
          {devis.totalHT != null && (
            <Row label="Total HT" value={`${devis.totalHT.toFixed(2)} €`} />
          )}
          {devis.tva != null && (
            <Row label="TVA (10%)" value={`${devis.tva.toFixed(2)} €`} />
          )}
        </div>

        {devis.totalTTC != null && (
          <div className="bg-neo-bg-light rounded-lg px-4 py-3 mt-2 flex justify-between items-center">
            <span className="font-semibold text-neo-primary">Total TTC</span>
            <span className="text-2xl font-bold text-neo-primary">
              {devis.totalTTC.toFixed(2)} €
            </span>
          </div>
        )}
      </div>

      <div className="bg-neo-card px-6 py-3 text-xs text-neo-muted text-center">
        Devis valable 30 jours
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-neo-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
