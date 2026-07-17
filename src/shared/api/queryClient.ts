import { QueryClient } from "@tanstack/react-query";

// Cliente único de React Query para toda la app. Se usa para traer
// datos del fake API (json-server) ahora, y del backend real más
// adelante (Sprint 2) sin cambiar la forma en que las pantallas piden datos.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
