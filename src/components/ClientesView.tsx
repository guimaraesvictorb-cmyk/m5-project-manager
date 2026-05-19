import { ClientesSection } from "./ClientesSection";
import { Footer } from "./Footer";

export function ClientesView() {
  return (
    <div className="flex flex-col min-h-0">
      <div className="max-w-screen-xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5" style={{ color: "#1FCE4A" }}>
            Operação
          </p>
          <h2 className="text-white font-bold text-lg leading-tight">Carteira de clientes</h2>
        </div>
        <ClientesSection compact={false} />
      </div>
      <Footer />
    </div>
  );
}
