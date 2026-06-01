import { requireUser } from "@/lib/auth";
import { getCategories, type Category } from "@/lib/queries";
import { deleteCategoryAction } from "@/lib/actions";
import { CategoryForm } from "@/components/category-form";

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await getCategories(user.id);

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted">
          Organize your transactions. Deleting a category keeps existing
          transactions (they just lose the color tag).
        </p>
      </header>

      <CategoryForm />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <CategoryGroup title="Income" items={income} />
        <CategoryGroup title="Expense" items={expense} />
      </div>
    </div>
  );
}

function CategoryGroup({ title, items }: { title: string; items: Category[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">No categories yet.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}
              </span>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  className="text-xs font-medium text-muted hover:text-expense"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
