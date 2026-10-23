import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Utensils } from "lucide-react";
import AdminDashboard from "@/components/Dashboard/AdminDashboard";
import Toast from "@/components/Toast";
import { AuthProvider, useAuth } from "@/lib/auth-context.jsx";
import { apiService } from "@/services/apiService";
import { fireConfetti } from "@/utils/confetti";

type Product = NonNullable<Awaited<ReturnType<typeof apiService.getProducts>>[number]>;

type Order = {
  id?: string | number;
  orderId?: string | number;
  status: string;
  [key: string]: unknown;
};

type ProductDraft = {
  title: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  badge?: string;
  isSpicy?: boolean;
  isVeg?: boolean;
  prepTime?: string;
  calories?: string;
  rating?: number;
};

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: () => (
    <AuthProvider>
      <AdminDashboardPage />
    </AuthProvider>
  ),
});

function AdminDashboardPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [toast, setToast] = useState<{ message: string; type?: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const showToast = (message: string, type: string = "success") => {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  const loadProducts = async () => {
    const data = await apiService.getProducts();
    setProducts(data.filter((product) => product !== null));
  };

  const loadOrders = async () => {
    const data = await apiService.getOrders();
    setOrders(data || []);
  };

  useEffect(() => {
    if (!auth.loading && (!auth.user || !auth.isAdmin)) {
      navigate({ to: "/admin-login", replace: true });
      return;
    }

    if (auth.user && auth.isAdmin) {
      loadProducts();
      loadOrders();
    }
  }, [auth.loading, auth.user, auth.isAdmin, navigate]);

  const handleAddProduct = async (productData: ProductDraft) => {
    const created = await apiService.addProduct(productData);
    if (created) {
      setProducts((prev) => [created, ...prev]);
      showToast(`Added "${created.title}" to the menu! `);
    }
  };

  const handleUpdateProduct = async (id: Product["id"], updates: Partial<Product>) => {
    const updated = await apiService.updateProduct(id, updates);
    if (updated) {
      setProducts((prev) =>
        prev.map((p) => (String(p.id) === String(id) ? { ...p, ...updated } : p)),
      );
      showToast("Dish details updated!");
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    await apiService.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
    showToast("Dish removed from menu");
  };

  const handleUpdateOrderStatus = async (orderId: string | number, newStatus: string) => {
    await apiService.updateOrderStatus(orderId, newStatus);
    setOrders((prev) =>
      prev.map((order) =>
        order.orderId === orderId || order.id === orderId ? { ...order, status: newStatus } : order,
      ),
    );
    showToast(`Order status changed to "${newStatus}"`);
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate({ to: "/admin-login", replace: true });
  };

  const handleConfirmOrder = async (orderData: Record<string, unknown>) => {
    const placed = await apiService.placeOrder(orderData);
    fireConfetti();
    setOrders((prev) => [placed, ...prev]);
    showToast(`Order ${placed.orderId} placed successfully! `);
  };

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#2A211B]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#D4A017] text-3xl text-white shadow-xl shadow-[#D4A017]/25">
            <Utensils className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#C19A6B]">
            Checking admin access...
          </p>
        </div>
      </div>
    );
  }

  if (!auth.user || !auth.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#2A211B]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <AdminDashboard
        orders={orders}
        products={products}
        onReturnToStore={() => navigate({ to: "/" })}
        onLogout={handleLogout}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onShowToast={showToast}
        onRefreshData={() => {
          loadProducts();
          loadOrders();
        }}
      />
    </div>
  );
}
