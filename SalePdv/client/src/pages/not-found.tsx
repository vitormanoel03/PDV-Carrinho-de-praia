import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-200">
      <Card className="w-full max-w-md mx-4 shadow-xl border-none bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center mb-4 gap-3">
            <div className="bg-orange-500 p-2 rounded-full">
              <AlertTriangle className="h-8 w-8 text-yellow-200" />
            </div>
            <h1 className="text-3xl font-extrabold text-orange-700">Página não encontrada</h1>
          </div>

          <p className="mt-2 text-sm text-orange-800">
            Opa! Parece que essa página não existe ou foi removida.
          </p>

          <p className="mt-2 text-xs text-orange-700">
            Verifique o endereço ou retorne à página principal.
          </p>

          <div className="mt-6 flex justify-end">
            <a
              href="/"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-md transition"
            >
              Voltar para o início
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
